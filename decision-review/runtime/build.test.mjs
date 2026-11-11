import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,mkdir,rm} from 'node:fs/promises';
import {join} from 'node:path';
import {tmpdir} from 'node:os';
import {fileURLToPath} from 'node:url';
import {createHash} from 'node:crypto';
import {createDecisionTree,createState,nextDecision,answerDecision,completion,derivedResults,validateState,exportBackup,importBackup,carrySession,carriedFrom,decisionStates} from './model.mjs';
import {createSessionStore,storagePrefix,sessionKey} from './storage.mjs';
import {buildBill,loadBill,prepareCopy,renderCatalog,verifyParity} from './build.mjs';
import {measurePaths,visibleText,words} from './measure.mjs';
import {markGlossaryTerms} from './app.js';

const baseCopy=JSON.parse(await readFile(new URL('./copy.json',import.meta.url),'utf8'));
const sha=value=>createHash('sha256').update(value).digest('hex');
const at='2026-11-09T00:00:00.000Z';
function fixture(suffix='one'){
 const billId='117_H_R_'+(suffix==='one'?'42':'43'),valueId='MATERIAL_VALUE_'+suffix;
 const statement='A bounded effect follows.',response='The effect may be smaller.',limit='The effect is limited to one group.';
 const citation='<a href="https://source.example/evidence" title="Frozen evidence">[3]</a>';
 const source={schema_version:1,bill:{id:billId,bill:'H.R.'+(suffix==='one'?'42':'43'),title:'the Fixture Act',description:'A small test bill.'},values:[{id:valueId,bill_id:billId,name:'A test value',statements:['First goal.','Second goal.','Third goal.'],reference:''}],claims:[],arguments:['support','oppose'].map(direction=>({id:'reason_'+direction+'_'+suffix,bill_id:billId,value_id:valueId,direction,title:direction,pro_html:'<p>'+statement+' '+citation+'</p>',gaps:[{explanation:limit}]})),readings:{},ui_copy:{originalViewNotice:baseCopy.earlier_notice},requirements:{arguments:[],responses:[],qualifications:[]}};
 for(const argument of source.arguments){source.readings[argument.id]={support:argument.pro_html,response:'<p>'+response+'</p>',strength:[]};source.requirements.arguments.push(argument.id);}
 const sourceRef={id:source.arguments[0].id,field:'pro_html',quote:statement};
 source.requirements.responses=[{id:'response_'+suffix,argument_ids:[source.arguments[0].id],source_refs:[{id:source.arguments[0].id,field:'response_reading',quote:response}]}];
 source.requirements.qualifications=[{id:'limit_'+suffix,argument_ids:[],source_refs:[{id:source.arguments[1].id,field:'gaps[0].explanation',quote:limit}]}];
 const sourceBytes=JSON.stringify(source,null,2)+'\n',sourceSha=sha(sourceBytes),blockId='evidence_'+suffix,rootId='root_'+suffix;
 const nodes=[{id:rootId,kind:'causal',title:'Bounded cause',claim_html:'<p>'+statement+'</p>',routes:[{id:'root_route_'+suffix,requires:[]}],context_ids:[],block_ids:[blockId],argument_ids:[],value_id:null,direction:null},...source.arguments.map(argument=>({id:'link_'+argument.direction+'_'+suffix,kind:'value',title:argument.title,claim_html:'<p>A link to the test value.</p>',routes:[{id:'route_'+argument.direction+'_'+suffix,requires:[rootId]}],context_ids:[],block_ids:[blockId],argument_ids:[argument.id],value_id:valueId,direction:argument.direction}))];
 const decisions={schema_version:1,bill_id:billId,source_sha256:sourceSha,contexts:[],blocks:[{id:blockId,role:'evidence',html:'<p>'+statement+' '+citation+'</p>',source_refs:[sourceRef]}],nodes,glossary:[],value_subjects:Object.fromEntries(nodes.filter(node=>node.kind==='value').map(node=>[node.id,'the bounded effect']))};
 const coverage={schema_version:1,arguments:source.arguments.map(argument=>({id:argument.id,decision_ids:[nodes.find(node=>node.argument_ids.includes(argument.id)).id],block_ids:[blockId],rationale:'Test mapping.'})),responses:source.requirements.responses.map(item=>({...item,decision_ids:[rootId],block_ids:[blockId],disposition:'retained',rationale:'The response is adjacent to the tested claim.'})),qualifications:source.requirements.qualifications.map(item=>({...item,decision_ids:[rootId],block_ids:[blockId],rationale:'The qualification is adjacent to the tested claim.'}))};
 const copy=prepareCopy(source,{...structuredClone(baseCopy),value_goals:{[valueId]:source.values[0].statements}}),hashes={source_sha256:sourceSha};
 const release={review_id:'policy-stake-briefs-decision-review',bill_id:billId,source_sha256:sourceSha,content_id:'content-'+'1'.repeat(64),mapping_id:'mapping-'+'2'.repeat(64),procedure_id:'procedure-'+'3'.repeat(64),rendered_id:'rendered-'+'4'.repeat(64)};
 return {source,sourceBytes,decisions,coverage,copy,hashes,release,rootId};
}
const modelFor=f=>createDecisionTree(f.source,f.decisions,f.coverage,f.copy,f.hashes);

test('sessions saved under each recorded earlier release carry forward; changed decisions need another look',async()=>{
 const manifest=JSON.parse(await readFile(new URL('../input-manifest.json',import.meta.url),'utf8'));
 for(const bill of manifest.bills){
  const billDir=fileURLToPath(new URL('../bills/'+bill.slug+'/',import.meta.url)),{model,release}=await loadBill({billDir});
  assert(model.carry.prior.size>=4,'Every published release of '+bill.slug+' must be recorded.');
  for(const prior of model.carry.prior.values()){
   let current=createState(model,release,'earlier_session_001',at);for(let step=0;step<6;step++){const next=nextDecision(model,current);if(!next)break;current=answerDecision(model,current,next.id,'Yes',at,'note '+step);}
   const earlier={...structuredClone(current),release:structuredClone(prior.release)},carried=carrySession(model,release,earlier,'carried_session_001','2026-11-10T00:00:00.000Z');
   assert.equal(validateState(carried,model,release),carried);assert.deepEqual(carriedFrom(carried),{session_id:'earlier_session_001',rendered_id:prior.release.rendered_id});
   const states=decisionStates(model,carried);for(const id of Object.keys(current.answers)){if(prior.fingerprints[id]!==model.carry.fingerprints[id])assert.notEqual(states.get(id).status,'answered','Changed decision still counts: '+id);assert.equal(carried.answers[id].notes,current.answers[id].notes);}
   if(Object.keys(current.answers).every(id=>prior.fingerprints[id]===model.carry.fingerprints[id]))for(const id of Object.keys(current.answers))assert.equal(states.get(id).status,'answered','Unchanged decision lost its answer: '+id);
   const imported=importBackup(exportBackup(earlier),model,release,'imported_session_001','2026-11-10T00:00:00.000Z');assert.equal(imported.history[1].type,'carry');assert.equal(imported.session_id,'imported_session_001');
  }
  const unknown={...structuredClone(createState(model,release,'unknown_session_001',at)),release:{...release,rendered_id:'rendered-'+'9'.repeat(64)}};
  assert.throws(()=>importBackup(exportBackup(unknown),model,release,'unknown_import_001',at),/different release/);
  assert.throws(()=>carrySession(model,release,unknown,'unknown_carry_001',at),/not recorded here/);
 }
});
test('display descriptions can omit inline definitions without changing frozen source descriptions',()=>{
 const f=fixture(),original=f.source.bill.description;
 assert.equal(prepareCopy(f.source,baseCopy).bill_description,original);
 const copy=prepareCopy(f.source,baseCopy,{bill_description:'A shorter description without inline glosses.'});
 assert.equal(copy.bill_description,'A shorter description without inline glosses.');assert.equal(f.source.bill.description,original);
});

test('native generic package needs no parent readings, legacy graph, standard value IDs or bill-specific counts',()=>{
 for(const suffix of ['one','two']){const f=fixture(suffix),model=modelFor(f);assert.equal(model.nodes.size,3);assert.equal(model.sourceIndex.values.size,1);assert(!('parent'in model));assert(!('map'in model.sourceIndex));let state=createState(model,f.release,'generic_session_'+suffix,at);state=answerDecision(model,state,nextDecision(model,state).id,'No',at);assert.equal(completion(model,state).pruned,2);assert.equal([...derivedResults(model,state).values()][0].presence,'Neither');assert(completion(model,state).complete);validateState(state,model,f.release);assert.equal(verifyParity(model,f.release).scenarios.all_yes.visited_count,3);}
});

test('source-owned response/qualification obligations reject omitted, altered, dangling and unbound coverage',()=>{
 for(const change of [f=>f.coverage.responses.pop(),f=>f.coverage.qualifications.pop(),f=>f.coverage.responses[0].source_refs=[{...f.coverage.responses[0].source_refs[0],field:'support_reading'}],f=>f.coverage.qualifications[0].argument_ids=[f.source.arguments[0].id],f=>f.coverage.responses[0].block_ids=['missing'],f=>f.decisions.nodes[1].argument_ids=[],f=>f.coverage.arguments[0].decision_ids=[f.rootId]]){const f=fixture();change(f);assert.throws(()=>modelFor(f));}
 const f=fixture();f.coverage.responses[0].disposition='retired';f.coverage.responses[0].block_ids=[];f.coverage.responses[0].decision_ids=[];assert.doesNotThrow(()=>modelFor(f));f.coverage.responses[0].rationale='Short.';assert.throws(()=>modelFor(f),/Unexplained/);
});

test('strict frozen citation and source-quote validators reject changed URLs, titles, attributes and quotation selectors',()=>{
 for(const change of [f=>f.decisions.blocks[0].html=f.decisions.blocks[0].html.replace('source.example','other.example'),f=>f.decisions.blocks[0].html=f.decisions.blocks[0].html.replace('title="Frozen evidence"','title="Different title"'),f=>f.decisions.blocks[0].html='<p style="display:none">Hidden</p>',f=>f.decisions.blocks[0].html='<script>alert(1)</script>',f=>f.decisions.blocks[0].source_refs[0].quote='A fabricated quotation.',f=>f.decisions.blocks[0].source_refs[0].field='__proto__.toString']){const f=fixture();change(f);assert.throws(()=>modelFor(f));}
});

function memory(){const data=new Map();return {getItem:key=>data.get(key)??null,setItem:(key,value)=>data.set(key,String(value)),key:index=>[...data.keys()][index]??null,get length(){return data.size;},data};}
function locks(){const held=new Set();return {async request(name,options,callback){if(held.has(name))return callback(null);held.add(name);try{return await callback({name});}finally{held.delete(name);}}};}
test('two bills with the same rendered token and session ID save independently, with no cross-bill imports',async()=>{
 const storage=memory(),manager=locks(),states=[];
 for(const suffix of ['one','two']){const f=fixture(suffix),model=modelFor(f),state=answerDecision(model,createState(model,f.release,'shared_session_001',at),f.rootId,suffix==='one'?'Yes':'No',at),store=createSessionStore({storage,locks:manager,model,release:f.release});assert(await store.acquire(state));assert(store.save(state).ok);states.push({f,model,state,store});}
 assert.notEqual(storagePrefix(states[0].f.release),storagePrefix(states[1].f.release));assert.equal(storage.data.size,4);
 for(const item of states){assert.deepEqual(item.store.active(),item.state);assert.equal(item.store.sessions().length,1);await item.store.close();assert(storage.getItem(sessionKey(item.f.release,item.state.session_id)));}
 assert.throws(()=>importBackup(exportBackup(states[0].state),states[1].model,states[1].f.release,'import_other_bill',at),/different release/);
});

test('path measurement follows actual pruning and includes sequential SUPPORT/OPPOSE comparisons without counting closed disclosures',()=>{
 const f=fixture(),model=modelFor(f),report=measurePaths(model,f.release);assert.equal(report.scenarios.all_yes.decisions,3);assert.equal(report.scenarios.all_yes.overall_comparisons,1);assert.equal(report.scenarios.all_yes.total_judgments,4);assert.equal(report.scenarios.all_no.total_judgments,1);assert.equal(report.scenarios[f.rootId+'_no'].decisions_skipped,2);assert(report.scenarios.all_yes.required_panel_words>report.scenarios.all_no.required_panel_words);assert.equal(visibleText('<p>Visible words.</p><details><summary>Source</summary><p>Hidden words.</p></details>'),'Visible words. Source');assert.equal(words('<p>one two</p>'),2);assert.equal(report.human_workload_tested,false);
});

test('standalone builds have deterministic identities and byte parity, isolate copy overrides and render every original',async()=>{
 const f=fixture(),folder=await mkdtemp(join(tmpdir(),'native-decision-test-'));
 try{
  const billDir=join(folder,'bill'),outputDir=join(folder,'output'),procedurePath=join(folder,'PROCEDURE.md');await mkdir(join(billDir,'input'),{recursive:true});
  await writeFile(join(billDir,'input/source.json'),f.sourceBytes);await writeFile(join(billDir,'decisions.json'),JSON.stringify(f.decisions));await writeFile(join(billDir,'coverage.json'),JSON.stringify(f.coverage));await writeFile(procedurePath,'Native fixture procedure.\n');
  // Fixture value IDs are arbitrary; a test-specific base is represented by source value metadata.
  f.source.values[0].value_code='UNN';f.sourceBytes=JSON.stringify(f.source,null,2)+'\n';f.decisions.source_sha256=sha(f.sourceBytes);await writeFile(join(billDir,'input/source.json'),f.sourceBytes);await writeFile(join(billDir,'decisions.json'),JSON.stringify(f.decisions));
  const options={billDir,outputDir,procedurePath,commonCopyOverrides:{pilot_notice:'Approved common test copy.'}};
  const first=await buildBill(options),firstBytes=await readFile(join(outputDir,'index.html'),'utf8'),second=await buildBill(options);assert.deepEqual(first.release,second.release);assert.equal(await readFile(join(outputDir,'review.html'),'utf8'),firstBytes);assert.equal(await readFile(join(outputDir,'index.html'),'utf8'),firstBytes);assert.equal(sha(firstBytes),first.descriptor.html_sha256['index.html']);assert(firstBytes.includes('Approved common test copy.'));assert(!firstBytes.includes('dependency_map'));assert(!firstBytes.includes('parent_reading'));
  const loaded=await loadBill(options);assert.equal(loaded.model.nodes.size,3);assert.equal(loaded.copy.pilot_notice,'Approved common test copy.');
  const changed=await buildBill({...options,commonCopyOverrides:{pilot_notice:'Revised common test copy.'}});assert.notEqual(changed.release.content_id,first.release.content_id);assert.notEqual(changed.release.rendered_id,first.release.rendered_id);assert.equal(changed.release.mapping_id,first.release.mapping_id);
  await writeFile(join(billDir,'copy.json'),JSON.stringify({pilot_notice:'Per-bill approved test copy.'}));assert.equal((await loadBill(options)).copy.pilot_notice,'Per-bill approved test copy.');
 }finally{await rm(folder,{recursive:true,force:true});}
});

test('catalog consumes approved copy and supplied links, with the approved shared stylesheet',()=>{
 const html=renderCatalog({bills:[{slug:'fixture',bill:'H.R.42',title:'the Fixture Act',href:'arguments/fixture/'}],copy:{title:'Catalog title',intro:'Catalog introduction.',open_review:'Open'}});assert(html.includes('href="arguments/fixture/"'));assert(html.includes('Catalog introduction.'));assert(html.includes('.value-goals{padding-left:2.4rem'));assert.throws(()=>renderCatalog({bills:[{slug:'fixture',bill:'H.R.42',title:'the Fixture Act',href:'javascript:alert(1)'}],copy:{title:'Title',intro:'Intro',open_review:'Open'}}));
});

test('an empty native glossary leaves panel text untouched',()=>{markGlossaryTerms({querySelectorAll(){throw new Error('Panel traversal must be unnecessary without any terms.');}},[]);});
