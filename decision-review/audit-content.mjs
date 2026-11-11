import assert from 'node:assert/strict';
import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createDecisionTree,createState,nextDecision,answerDecision,decisionStates,derivedResults,saveComparison,completion,validateState} from './runtime/model.mjs';
import {prepareCopy} from './runtime/build.mjs';
import {plainText,sourceField} from './runtime/source.mjs';
import {renderDecision} from './runtime/app.js';
import {applyHr5408Amendment,verifyHr5408LegacyInputs} from './convert-hr5408.mjs';
import {amendJson} from '../corpus_amendment_20261110/write-amendment.mjs';

const root=new URL('./',import.meta.url),at='2026-11-09T00:00:00.000Z';
const read=path=>readFile(new URL(path,root),'utf8'),json=async path=>JSON.parse(await read(path));
const sha=value=>createHash('sha256').update(value).digest('hex');
const normalized=value=>plainText(value).replace(/\s+/g,' ').trim();
async function optional(path,fallback={}){try{return await json(path);}catch(error){if(error.code==='ENOENT')return fallback;throw error;}}

// Independent route evaluation uses only the authored native graph and saved answers.
export function routeOracle(decisions,answers){
 const nodes=new Map(decisions.nodes.map(node=>[node.id,node])),states=new Map(),visiting=new Set();
 function visit(id){
  if(states.has(id))return states.get(id);assert(!visiting.has(id),'Independent oracle found a cycle: '+id);visiting.add(id);
  const node=nodes.get(id),available=[],blocked=[],pending=[];
  for(const route of node.routes){const parents=route.requires.map(visit);if(parents.some(parent=>parent.effective_answer==='No'||parent.status==='pruned'))blocked.push(route.id);else if(parents.every(parent=>parent.effective_answer==='Yes'))available.push(route.id);else pending.push(route.id);}
  const ready=available.length>0&&pending.length===0,answer=answers[id]?.answer??null;
  const status=answer&&ready?'answered':ready?'eligible':available.length||pending.length?'waiting':'pruned';
  const result={status,ready,effective_answer:status==='answered'?answer:null,available_routes:available};states.set(id,result);visiting.delete(id);return result;
 }
 for(const id of nodes.keys())visit(id);return states;
}

function assertOracle(model,state){
 const expected=routeOracle(model.decisions,state.answers),actual=decisionStates(model,state);
 for(const [id,want] of expected){const got=actual.get(id);assert.equal(got.status,want.status,'Status differs from independent AND/OR oracle: '+id);assert.equal(got.ready,want.ready,'Readiness differs from independent AND/OR oracle: '+id);assert.equal(got.effective_answer,want.effective_answer,'Effective answer differs from independent AND/OR oracle: '+id);assert.deepEqual(got.available_routes,want.available_routes,'Available routes differ from independent AND/OR oracle: '+id);if(want.status==='pruned')assert(!state.answers[id],'A pruned node received a synthetic answer: '+id);}
 return actual;
}

export function auditPath(model,release,target,index){
 let state=createState(model,release,'audit_path_'+index,at),count=0;const visited=[],requested=Array.isArray(target)?target:target&&target!=='all_no'?[target]:[],reject=new Set(requested);
 while(nextDecision(model,state)){
  const states=assertOracle(model,state),node=nextDecision(model,state);assert(states.get(node.id).ready,'A required local decision was scheduled without a complete basis.');assert(!visited.includes(node.id),'A decision repeated on an unchanged synthetic path.');
  const html=renderDecision(model,state,node.id,'review',true);assert.equal((html.match(/class="decision-form"/g)??[]).length,1);assert(html.includes('data-decision-id="'+node.id+'"'));assert(!html.includes('value="pending"'),'Pending appeared as a local answer.');
  visited.push(node.id);state=answerDecision(model,state,node.id,target==='all_no'||reject.has(node.id)?'No':'Yes',at);assert(++count<=model.nodes.size,'Synthetic traversal failed to terminate.');
 }
 if(requested.length===1)assert.equal(state.answers[requested[0]]?.answer,'No','The requested individual causal-No judgment was not reached: '+requested[0]);
 const statuses=assertOracle(model,state),results=derivedResults(model,state),both=[];
 const reached=requested.filter(id=>state.answers[id]?.answer==='No'),ancestorBlocked=requested.filter(id=>!reached.includes(id)).map(id=>{assert.equal(statuses.get(id).status,'pruned','An unreached combined-No target was not blocked by an ancestor: '+id);return {id,status:'pruned',blocked_routes:model.nodes.get(id).routes.map(route=>({id:route.id,blocking_prerequisites:route.requires.filter(parent=>statuses.get(parent).effective_answer==='No'||statuses.get(parent).status==='pruned')}))};});
 for(const value of model.sourceIndex.source.values){
  const accepted=model.decisions.nodes.filter(node=>node.kind==='value'&&node.value_id===value.id&&state.answers[node.id]?.answer==='Yes'&&statuses.get(node.id).status==='answered'),support=accepted.some(node=>node.direction==='support'),oppose=accepted.some(node=>node.direction==='oppose'),presence=support?(oppose?'Both':'Support'):oppose?'Oppose':'Neither',actual=results.get(value.id);
  assert.equal(actual.presence,presence,'Derived direction differs from explicit current local answers: '+value.id);assert.equal(actual.unfinished.length,0);if(presence==='Both'){assert.equal(actual.status,'comparison_required');both.push(value.id);}else assert.equal(actual.status,'current');
 }
 for(const valueId of both)state=saveComparison(model,state,valueId,'pending',at);
 assert(completion(model,state).complete,'Completed path still needs a judgment.');validateState(state,model,release);
 return {target:target??'all_yes',requested_no_targets:requested,reached_no_targets:reached,ancestor_blocked_targets:ancestorBlocked,visited_count:visited.length,pruned_count:[...statuses.values()].filter(item=>item.status==='pruned').length,...(Array.isArray(target)?{pruned_node_ids:[...statuses].filter(([,item])=>item.status==='pruned').map(([id])=>id)}:{}),value_comparisons:both.length,judgments:visited.length+both.length,visited_sha256:sha(JSON.stringify(visited)),value_results:Object.fromEntries([...results].map(([id,item])=>[id,item.presence]))};
}

// Cover every distinct pair of direct prerequisites drawn from different OR routes.
// Reuse one traversal when multiple downstream nodes share the same alternative pair.
export function alternativeNoPairs(decisions){
 const pairs=new Map();
 for(const node of decisions.nodes)for(let first=0;first<node.routes.length;first++)for(let second=first+1;second<node.routes.length;second++)for(const a of node.routes[first].requires)for(const b of node.routes[second].requires){
  if(a===b)continue;const targets=[a,b].sort(),key=targets.join('|');if(!pairs.has(key))pairs.set(key,{targets,alternative_node_ids:[]});const pair=pairs.get(key);if(!pair.alternative_node_ids.includes(node.id))pair.alternative_node_ids.push(node.id);
 }
 return [...pairs.values()].sort((a,b)=>a.targets.join('|').localeCompare(b.targets.join('|')));
}

function quoteCandidates(source,decisions){
 const sourceText=[];function collect(value){if(typeof value==='string')sourceText.push(normalized(value));else if(Array.isArray(value))value.forEach(collect);else if(value&&typeof value==='object')Object.values(value).forEach(collect);}collect(source);
 const candidates=[];for(const item of [...decisions.contexts,...decisions.blocks,...decisions.nodes.map(node=>({id:node.id,html:node.claim_html}))])for(const match of normalized(item.html).matchAll(/“([^”]{6,})”/g)){const quote=match[1].trim();if(!sourceText.some(text=>text.includes(quote)))candidates.push({owner_id:item.id,quote});}return candidates;
}

function sourceLocationScreen(source,decisions,coverage){
 const content=new Map([...decisions.blocks,...decisions.contexts].map(item=>[item.id,item.html])),nodes=new Map(decisions.nodes.map(item=>[item.id,item]));
 const text=value=>normalized(value).replace(/\[\d+\]/g,'').replace(/^(?:Evidence note\s*:|Response|Because|So|Note|Point\s+\d+)\s*/i,'').replace(/\s+/g,' ').trim();
 let segments=0,verbatim=0;const exceptions=[];
 for(const kind of ['responses','qualifications'])for(const item of coverage[kind]){
  const placed=[...item.block_ids.map(id=>content.get(id)),...item.decision_ids.flatMap(id=>{const node=nodes.get(id);return [node.claim_html,...node.block_ids.map(id=>content.get(id)),...node.context_ids.map(id=>content.get(id))];})].map(text).join(' ');
  for(const ref of item.source_refs){const field=sourceField(source,ref.id,ref.field),parts=[...field.matchAll(/<(p|li)\b[^>]*>[\s\S]*?<\/\1>/g)].map(match=>match[0]);
   for(const part of parts.length?parts:[field]){const original=text(part);if(original.length<10)continue;segments++;if(placed.includes(original))verbatim++;else exceptions.push({kind,id:item.id,source_id:ref.id,field:ref.field,segment_sha256:sha(original),text:original});}
  }
 }
 return {method:'Exact normalized p/li/plain-field comparison against the assigned decision, context and block locations; changed or summarized passages require manual reading.',segments,verbatim,exceptions};
}

function argumentLocationScreen(source,decisions,coverage){
 const content=new Map([...decisions.blocks,...decisions.contexts].map(item=>[item.id,item.html])),nodes=new Map(decisions.nodes.map(item=>[item.id,item]));
 const text=value=>normalized(value).replace(/\[(?:[A-Z]+\s+)?\d+\]/g,'').replace(/^(?:Because|So|Note|Point\s+\d+)\s*/i,'').replace(/\s+/g,' ').trim();
 let segments=0,verbatim=0;const exceptions=[];
 for(const item of coverage.arguments){
  const argument=source.arguments.find(row=>row.id===item.id),placed=[...item.block_ids.map(id=>content.get(id)),...item.decision_ids.flatMap(id=>{const node=nodes.get(id);return [node.claim_html,...node.block_ids.map(id=>content.get(id)),...node.context_ids.map(id=>content.get(id))];})].map(text).join(' ');
  for(const match of argument.pro_html.matchAll(/<li\b([^>]*)>([\s\S]*?)<\/li>/g)){const original=text(match[2]);if(!original)continue;segments++;if(placed.includes(original))verbatim++;else exceptions.push({argument_id:item.id,kind:/\bso\b/.test(match[1])?'conclusion':'evidence',segment_sha256:sha(original),text:original});}
 }
 return {method:'Original support-reading list segments compared with each argument’s assigned decision, context and block locations. Paraphrases and relocated shared evidence require manual review.',segments,verbatim,exceptions};
}

async function hrConversion(decisions,coverage,source,billCopy){
 const conversion=await json('bills/hr5408/conversion.json'),amendment=conversion.editorial_amendment;
 if(amendment){await verifyHr5408LegacyInputs(amendment,new URL('../bill_reasoning_pilot_20261108/hr5408/',root));const restored=applyHr5408Amendment(decisions,billCopy,amendment,true);decisions=restored.decisions;assert.deepEqual(restored.copy,{});}
 const pilot='../bill_reasoning_pilot_20261108/hr5408/',old=await json(pilot+'decision-tree/decisions.json'),reading=await json(pilot+'bill-wide/reading.json'),copy=await json(pilot+'decision-tree/copy.json'),oldCoverage=await json(pilot+'decision-tree/coverage.json'),oldSource=await json(pilot+'input/source.json');
 const {requirements,...withoutRequirements}=source;assert.deepEqual(withoutRequirements,amendJson(oldSource,oldSource.bill.id),'Native migration changed frozen H.R.5408 source content beyond the recorded corpus amendment.');
 assert.deepEqual(decisions.nodes,old.nodes.map(({source_node_ids,implication_ids,...node})=>node));assert.deepEqual(decisions.contexts,old.contexts);assert.deepEqual(decisions.glossary,[...reading.glossary,...copy.glossary_additions]);assert.deepEqual(decisions.value_subjects,copy.value_subjects);
 const oldBlocks=new Map([...reading.units.flatMap(unit=>unit.blocks),...old.blocks].map(item=>[item.id,item]));for(const block of decisions.blocks){const {id,role,html,source_refs}=oldBlocks.get(block.id);assert.deepEqual(block,{id,role,html,source_refs});}assert.deepEqual(decisions.blocks.map(item=>item.id),[...new Set(old.nodes.flatMap(node=>node.block_ids))]);
 assert.deepEqual(coverage.arguments,oldCoverage.arguments);assert.deepEqual(coverage.qualifications,oldCoverage.qualifications);assert.deepEqual(coverage.responses.map(({argument_ids,source_refs,...item})=>item),oldCoverage.challenges);
 return {comparison_scope:amendment?'Initial package reconstructed by reversing the exact approved definition amendments. Current text and glossary differ only by those release-bound amendments.':'Current native package compared directly with the approved pilot.',editorial_amendment:amendment?{status:'verified',changes:amendment.changes.length,initial_package_sha256:amendment.initial_package_sha256,amended_package_sha256:amendment.amended_package_sha256}:null,source_content_identical:true,nodes_identical_except_removed_legacy_fields:true,contexts_identical:true,all_used_block_html_and_refs_identical:true,glossary_and_value_subjects_identical:true,argument_response_qualification_locations_identical:true,causal_edges:decisions.nodes.reduce((sum,node)=>sum+node.routes.reduce((count,route)=>count+route.requires.length,0),0)};
}

export async function auditBill(slug){
 assert(/^[a-z0-9]+$/.test(slug),'Invalid bill slug.');const prefix='bills/'+slug+'/',names=['input/source.json','decisions.json','coverage.json','copy.json'],bytes=Object.fromEntries(await Promise.all(names.map(async name=>[name,await read(prefix+name)])));
 const source=JSON.parse(bytes['input/source.json']),decisions=JSON.parse(bytes['decisions.json']),coverage=JSON.parse(bytes['coverage.json']),siteCopy=await optional('site-copy.json'),base=await json('runtime/copy.json'),copy=prepareCopy(source,prepareCopy(source,base,siteCopy.review_copy??{}),JSON.parse(bytes['copy.json'])),hashes={source_sha256:sha(bytes['input/source.json'])},model=createDecisionTree(source,decisions,coverage,copy,hashes);
 const release={review_id:'policy-stake-briefs-decision-review',bill_id:source.bill.id,source_sha256:hashes.source_sha256,content_id:'content-'+'1'.repeat(64),mapping_id:'mapping-'+'2'.repeat(64),procedure_id:'procedure-'+'3'.repeat(64),rendered_id:'rendered-'+'4'.repeat(64)};
 const paths=[];for(const [index,target] of [null,'all_no',...decisions.nodes.filter(node=>node.kind==='causal').map(node=>node.id)].entries()){paths.push(auditPath(model,release,target,index));if(index%20===0)console.log(JSON.stringify({bill:slug,causal_no_paths_completed:Math.max(0,index-1)}));}
 const pairs=alternativeNoPairs(decisions),combinedPaths=pairs.map((pair,index)=>({...auditPath(model,release,pair.targets,'combined_'+index),alternative_node_ids:pair.alternative_node_ids}));
 if(slug==='hr5408'){const regression=combinedPaths.find(path=>path.target.includes('HR5408_DT_K_C07')&&path.target.includes('HR5408_DT_K_E01'));assert(regression,'Missing H.R.5408 pay/terms combined-No regression.');assert.equal(regression.reached_no_targets.length,2);assert(regression.pruned_node_ids.includes('HR5408_DT_K_CONSERVATION'),'Conservation survived the rejection of both pay and terms routes.');}
 const obligations=[];for(const kind of ['responses','qualifications'])for(const item of source.requirements[kind])for(const ref of item.source_refs){const full=sourceField(source,ref.id,ref.field);assert(normalized(full).includes(normalized(ref.quote)));obligations.push({kind,requirement_id:item.id,source_id:ref.id,field:ref.field,full_field_sha256:sha(full),full_field_words:normalized(full).split(/\s+/).filter(Boolean).length});}
 const conversion=slug==='hr5408'?await hrConversion(decisions,coverage,source,JSON.parse(bytes['copy.json'])):null;
 const result={bill_id:source.bill.id,input_sha256:Object.fromEntries(Object.entries(bytes).map(([name,value])=>[name,sha(value)])),native_validation:'passed',independent_and_or_oracle:'passed',all_yes_and_every_individual_causal_no:'passed',combined_no_alternatives:{status:'passed',selection:'Every distinct pair of direct causal prerequisites from different OR routes, deduplicated across nodes.',alternative_nodes:decisions.nodes.filter(node=>node.routes.length>1).length,paths:combinedPaths.length,both_targets_reached:combinedPaths.filter(path=>path.reached_no_targets.length===2).length,ancestor_blocked_targets:combinedPaths.reduce((sum,path)=>sum+path.ancestor_blocked_targets.length,0)},counts:{arguments:source.arguments.length,responses:coverage.responses.length,qualifications:coverage.qualifications.length,causal:decisions.nodes.filter(node=>node.kind==='causal').length,value:decisions.nodes.filter(node=>node.kind==='value').length,contexts:decisions.contexts.length,blocks:decisions.blocks.length,source_path_count:source.arguments.reduce((sum,item)=>sum+item.paths.length,0),merged_value_nodes:decisions.nodes.filter(node=>node.kind==='value'&&node.argument_ids.length>1).length,split_original_arguments:coverage.arguments.filter(item=>item.decision_ids.filter(id=>model.nodes.get(id).kind==='value').length>1).length},hr5408_conversion:conversion,unmatched_curly_quotation_candidates:quoteCandidates(source,decisions),full_source_field_obligations:obligations,source_location_screen:sourceLocationScreen(source,decisions,coverage),argument_location_screen:argumentLocationScreen(source,decisions,coverage),paths,combined_no_paths:combinedPaths,semantic_review:{status:'pending',coverage:'Each complete source field must be read; locator quotations alone do not establish substantive coverage.'}};
 for(const [name,original] of Object.entries(bytes))assert.equal(sha(await read(prefix+name)),sha(original),'Package changed during audit; rerun the coherent frozen version: '+slug+'/'+name);return result;
}

async function main(slugs){
 assert(slugs.length>0,'Pass only bill slugs whose authors have announced readiness.');const report=await optional('content-audit-findings.json',{schema_version:1,bills:{},findings:[]});assert(report.schema_version===1&&report.bills&&Array.isArray(report.findings),'Invalid retained audit report.');
 for(const slug of slugs){const prior=report.bills[slug],result=await auditBill(slug);if(prior?.semantic_review&&JSON.stringify(prior.input_sha256)===JSON.stringify(result.input_sha256))result.semantic_review=prior.semantic_review;report.bills[slug]=result;await writeFile(new URL('content-audit-findings.json',root),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({bill:slug,native_validation:result.native_validation,simulation_paths:result.paths.length,quotation_candidates:result.unmatched_curly_quotation_candidates.length,semantic_review:result.semantic_review.status}));}
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)await main(process.argv.slice(2));
