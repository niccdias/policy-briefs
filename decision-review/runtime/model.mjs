import {sourceValidators,validateCopy} from './validators.mjs';

const check=(condition,message)=>{if(!condition)throw new Error(message);};
const record=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;
const nonempty=value=>typeof value==='string'&&value.trim().length>0;
const clone=value=>JSON.parse(JSON.stringify(value));
const canonical=value=>JSON.stringify(value,(_,item)=>record(item)?Object.fromEntries(Object.keys(item).sort().map(key=>[key,item[key]])):item);
const same=(a,b)=>canonical(a)===canonical(b);
const idPattern=/^[A-Za-z][A-Za-z0-9_:-]*$/;
const billIdPattern=/^[A-Za-z0-9][A-Za-z0-9_:-]*$/;
const hashPattern=/^[a-f0-9]{64}$/;
function exact(value,keys,owner){check(record(value)&&same(Object.keys(value).sort(),[...keys].sort()),`Unexpected or missing fields in ${owner}.`);}
function ids(value,owner,empty=true){check(Array.isArray(value)&&(empty||value.length>0)&&new Set(value).size===value.length&&value.every(id=>typeof id==='string'&&idPattern.test(id)&&!['constructor','prototype','__proto__'].includes(id)),`Invalid or duplicate IDs in ${owner}.`);}
function date(value){check(typeof value==='string'&&!Number.isNaN(Date.parse(value))&&new Date(value).toISOString()===value,'Invalid timestamp.');}
function sameIds(actual,expected,owner){ids(actual,owner);check(actual.length===expected.length&&actual.every(id=>expected.includes(id)),`Coverage mismatch: ${owner}.`);}
export const TREE_COPY_KEYS=['causal_question','tree_title','tree_intro','tree_mode','public_tree_intro','active_decision','causal_decision','value_decision','value_link_question','value_link_guide','direction_support','direction_oppose','decision_notes_label','save_answer','reopen_decision','continue_review','reviewed_evidence','evidence_label','context_title','required_premises','alternative_routes','trail_title','trail_intro','decision_yes','decision_no','decision_waiting','decision_pruned','decision_stale','decision_unanswered','pruned_reason','unresolved_reason','reassessment_reason','tree_progress','no_more_decisions','tree_complete','derived_results_intro','derived_results_partial','comparison_required','comparison_save','comparison_current','comparison_stale','event_answer','event_reopen','event_comparison','decision_outline','csv_record_type','csv_decision','csv_answer','csv_direction','csv_routes','csv_type_decision','csv_type_value','decision_basis_label','comparison_basis_label','public_select_decision','view_results','remaining_questions','no_answers','saved_answer','revisit_evidence','pending_comparison','csv_kind','csv_account','csv_carried_from','csv_provisional','event_carry','carry_notice','earlier_version','coordinator_export','coordinator_error','csv_latest'];

function validateCarry(carry,nodes,billId){
 if(carry===undefined||carry===null)return null;
 exact(carry,['fingerprints','prior'],'session history');const fingerprint=value=>typeof value==='string'&&/^[a-f0-9]{64}$/.test(value);
 exact(carry.fingerprints,[...nodes.keys()],'current decision fingerprints');check(Object.values(carry.fingerprints).every(fingerprint),'Invalid decision fingerprint.');
 check(Array.isArray(carry.prior),'Earlier versions must be a list.');const prior=new Map();
 for(const entry of carry.prior){exact(entry,['release','fingerprints'],'earlier version');validateRelease(entry.release);check(entry.release.bill_id===billId&&!prior.has(entry.release.rendered_id),'Earlier version belongs to another bill or is listed twice.');check(record(entry.fingerprints)&&Object.entries(entry.fingerprints).every(([id,value])=>idPattern.test(id)&&fingerprint(value)),'Invalid earlier decision fingerprints.');prior.set(entry.release.rendered_id,entry);}
 return {fingerprints:carry.fingerprints,prior};
}

export function createDecisionTree(source,decisions,coverage,copy,hashes,carry){
 exact(hashes,['source_sha256'],'package hashes');check(hashPattern.test(hashes.source_sha256),'Invalid package hash.');
 check(record(source)&&source.schema_version===1&&record(source.bill)&&nonempty(source.bill.bill)&&nonempty(source.bill.title)&&nonempty(source.bill.description)&&nonempty(source.bill.id)&&billIdPattern.test(source.bill.id),'Invalid frozen source metadata.');
 const collections={};for(const key of ['values','claims','arguments']){check(Array.isArray(source[key]),`Missing source collection: ${key}`);ids(source[key].map(item=>item.id),'source '+key,key==='claims');collections[key]=new Map(source[key].map(item=>[item.id,item]));}
 ids([...source.values.map(item=>item.id),...source.claims.map(item=>item.id),...source.arguments.map(item=>item.id)],'source records');check(!collections.values.has(source.bill.id)&&!collections.claims.has(source.bill.id)&&!collections.arguments.has(source.bill.id),'Duplicate bill/source record ID.');
 const sourceIndex={source,...collections};
 for(const value of source.values)check(value.bill_id===source.bill.id&&nonempty(value.name)&&(value.value_code===undefined||nonempty(value.value_code))&&Array.isArray(value.statements)&&value.statements.length===3&&value.statements.every(nonempty)&&typeof value.reference==='string',`Invalid exact value definition: ${value.id}`);
 for(const argument of source.arguments)check(argument.bill_id===source.bill.id&&sourceIndex.values.has(argument.value_id)&&['support','oppose'].includes(argument.direction),`Invalid original argument: ${argument.id}`);
 check(record(source.readings),'Missing frozen source readings.');for(const item of [...source.claims,...source.arguments]){const reading=source.readings[item.id];check(record(reading)&&typeof reading.support==='string'&&typeof reading.response==='string'&&Array.isArray(reading.strength),`Missing original reading: ${item.id}`);}
 exact(decisions,['schema_version','bill_id','source_sha256','contexts','blocks','nodes','glossary','value_subjects'],'decision package');
 check(decisions.schema_version===1&&decisions.bill_id===source.bill.id,'Unsupported decision schema or wrong bill.');
 check(decisions.source_sha256===hashes.source_sha256,'Decision package does not match the frozen source.');
 check(record(copy),'Interface copy must be an object.');
 const {value_goals,value_questions,...flatCopy}=copy;
 validateCopy(flatCopy,source);for(const key of [...TREE_COPY_KEYS,'claim_label','consequence_label','reading_group_context','reading_group_explanation','reading_group_evidence','reading_group_challenge','reading_group_qualification'])check(nonempty(copy[key]),`Missing tree copy: ${key}`);
 exact(value_questions,['support','oppose'],'value questions');for(const question of Object.values(value_questions))check(nonempty(question)&&!/[{}]/.test(question),'Value questions must be complete text; display the consequence separately.');
 const goalKeys=[...sourceIndex.values.keys()],codeKeys=source.values.map(value=>value.value_code??value.id);check(record(value_goals),'Missing value goals.');
 check(same(Object.keys(value_goals).sort(),goalKeys.sort())||same(Object.keys(value_goals).sort(),codeKeys.sort()),'Value goals must cover every source value or value code.');
 const resolvedGoals=Object.fromEntries(source.values.map(value=>[value.id,value_goals[value.id]??value_goals[value.value_code??value.id]]));for(const goals of Object.values(resolvedGoals))check(Array.isArray(goals)&&goals.length===3&&goals.every(nonempty),'Each value needs three goals.');
 for(const field of ['answered','pruned','remaining'])check(copy.tree_progress.includes('{'+field+'}'),`Missing tree_progress placeholder: ${field}`);
 check(copy.causal_question==='Does the evidence support this claim?','Causal question must remain exact.');
 const glossary=decisions.glossary,validator=sourceValidators(source,glossary),blocks=new Map(),contexts=new Map(),nodes=new Map(),routes=new Map();
 check(Array.isArray(decisions.blocks)&&Array.isArray(decisions.contexts)&&Array.isArray(decisions.nodes)&&decisions.nodes.length>0,'Decision collections must be arrays with at least one node.');
 for(const context of decisions.contexts){exact(context,['id','title','html','source_refs'],'context');ids([context.id],'context');check(nonempty(context.title)&&!contexts.has(context.id),'Missing or duplicate context title/ID.');validator.html(context.html,context.id);validator.references(context.source_refs,context.id);contexts.set(context.id,context);}
 for(const block of decisions.blocks){exact(block,['id','role','html','source_refs'],'evidence block');ids([block.id],'block');check(!blocks.has(block.id)&&['explanation','evidence','challenge','qualification'].includes(block.role),'Duplicate block ID or invalid role.');validator.html(block.html,block.id);validator.references(block.source_refs,block.id);blocks.set(block.id,block);}
 for(const [index,node] of decisions.nodes.entries()){
  exact(node,['id','kind','title','claim_html','routes','context_ids','block_ids','argument_ids','value_id','direction'],'decision node');ids([node.id],'decision');check(!nodes.has(node.id)&&nonempty(node.title)&&['causal','value'].includes(node.kind),`Invalid or duplicate decision: ${node.id}`);validator.html(node.claim_html,node.id);
  for(const key of ['context_ids','block_ids','argument_ids'])ids(node[key],node.id+'.'+key,key!=='block_ids');
  for(const id of node.context_ids)check(contexts.has(id),`Unknown context ${id} in ${node.id}.`);
  for(const id of node.block_ids)check(blocks.has(id),`Unknown block ${id} in ${node.id}.`);
  for(const id of node.argument_ids)check(sourceIndex.arguments.has(id),`Unknown original argument ${id}.`);
  if(node.kind==='value'){
   check(sourceIndex.values.has(node.value_id)&&['support','oppose'].includes(node.direction),`Invalid value/direction in ${node.id}.`);
   check(node.argument_ids.length>0,`Value decision has no original argument: ${node.id}`);
   for(const id of node.argument_ids){const argument=sourceIndex.arguments.get(id);check(argument.value_id===node.value_id&&argument.direction===node.direction,`Mixed value/direction arguments in ${node.id}.`);}
  }else check(node.value_id===null&&node.direction===null,`Causal decision has a value verdict: ${node.id}`);
  check(Array.isArray(node.routes)&&node.routes.length>0,`Missing routes in ${node.id}.`);
  for(const route of node.routes){exact(route,['id','requires'],'decision route');ids([route.id],'route');ids(route.requires,route.id);check(!routes.has(route.id),`Duplicate route ${route.id}.`);routes.set(route.id,{...route,node_id:node.id});}
  nodes.set(node.id,{...node,index});
 }
 ids([...nodes.keys(),...routes.keys(),...blocks.keys(),...contexts.keys()],'decision package namespace');
 exact(decisions.value_subjects,[...nodes.values()].filter(node=>node.kind==='value').map(node=>node.id),'value consequence phrases');for(const subject of Object.values(decisions.value_subjects))check(nonempty(subject),'Missing value consequence phrase.');
 for(const node of nodes.values())for(const route of node.routes)for(const id of route.requires)check(nodes.has(id)&&nodes.get(id).kind==='causal'&&id!==node.id,`Route ${route.id} requires an unknown, self, or value decision: ${id}`);
 const order=[],visiting=new Set(),visited=new Set();
 function visit(id){check(!visiting.has(id),`Decision dependency cycle at ${id}.`);if(visited.has(id))return;visiting.add(id);for(const route of nodes.get(id).routes)route.requires.forEach(visit);visiting.delete(id);visited.add(id);order.push(id);}
 for(const id of nodes.keys())visit(id);
 const blockOwners=new Map(),contextOwners=new Map();
 for(const node of nodes.values()){for(const id of node.block_ids){if(!blockOwners.has(id))blockOwners.set(id,[]);blockOwners.get(id).push(node.id);}for(const id of node.context_ids){if(!contextOwners.has(id))contextOwners.set(id,[]);contextOwners.get(id).push(node.id);}}
 for(const id of blocks.keys())check(blockOwners.has(id),`Unreferenced block: ${id}`);
 for(const id of contexts.keys())check(contextOwners.has(id),`Unreferenced context: ${id}`);
 exact(source.requirements,['arguments','responses','qualifications'],'frozen source requirements');sameIds(source.requirements.arguments,[...sourceIndex.arguments.keys()],'source argument requirements');
 exact(coverage,['schema_version','arguments','responses','qualifications'],'decision coverage');check(coverage.schema_version===1,'Unsupported coverage schema.');
 for(const key of ['arguments','responses','qualifications'])check(Array.isArray(coverage[key]),`Missing coverage array: ${key}`);
 function locations(item,owner){ids(item.decision_ids,owner+'.decisions',false);ids(item.block_ids,owner+'.blocks');check(nonempty(item.rationale),`Missing coverage rationale: ${owner}`);for(const id of item.decision_ids)check(nodes.has(id),`Dangling coverage decision ${id}.`);for(const id of item.block_ids)check(blockOwners.has(id)&&item.decision_ids.some(node=>nodes.get(node).block_ids.includes(id)),`Unbound coverage block ${id}.`);}
 sameIds(coverage.arguments.map(item=>item.id),[...sourceIndex.arguments.keys()],'original arguments');
 for(const item of coverage.arguments){exact(item,['id','decision_ids','block_ids','rationale'],'argument coverage');locations(item,item.id);for(const id of item.decision_ids)check(nodes.get(id).argument_ids.includes(item.id),`Argument ${item.id} is absent from mapped decision ${id}.`);check(item.decision_ids.some(id=>nodes.get(id).kind==='value'),`Original argument has no value link: ${item.id}`);}
 for(const node of nodes.values())for(const id of node.argument_ids)check(coverage.arguments.find(item=>item.id===id).decision_ids.includes(node.id),`Unaccounted argument use ${id}/${node.id}.`);
 for(const key of ['responses','qualifications']){
  const required=source.requirements[key];check(Array.isArray(required),`Missing source requirements: ${key}`);ids(required.map(item=>item.id),'source '+key);sameIds(coverage[key].map(item=>item.id),required.map(item=>item.id),key);
  for(const original of required){exact(original,['id','argument_ids','source_refs'],'source '+key);ids(original.argument_ids,original.id+'.arguments');for(const id of original.argument_ids)check(sourceIndex.arguments.has(id),`Unknown source requirement argument ${id}.`);validator.references(original.source_refs,original.id);}
  for(const item of coverage[key]){
   exact(item,['id','argument_ids','source_refs','decision_ids','block_ids','rationale',...(key==='responses'?['disposition']:[])],key+' coverage');
   const original=required.find(prior=>prior.id===item.id);sameIds(item.argument_ids,original.argument_ids,item.id+' arguments');check(same(item.source_refs,original.source_refs),`Coverage source references differ from frozen requirement ${item.id}.`);validator.references(item.source_refs,item.id);
   if(key==='qualifications'||item.disposition==='retained')locations(item,item.id);
   else{check(['resolved','retired'].includes(item.disposition),'Invalid response disposition.');ids(item.decision_ids,item.id+'.decisions');ids(item.block_ids,item.id+'.blocks');check(nonempty(item.rationale)&&item.rationale.trim().length>=20,`Unexplained response retirement/resolution: ${item.id}`);for(const id of item.decision_ids)check(nodes.has(id),`Dangling response decision ${id}.`);for(const id of item.block_ids)check(blockOwners.has(id)&&item.decision_ids.some(node=>nodes.get(node).block_ids.includes(id)),`Unbound response block ${id}.`);}
   if(key==='responses'&&item.disposition==='retained')check(item.block_ids.length>0,`Retained response has no evidence location: ${item.id}`);
  }
 }
 return {sourceIndex,decisions,coverage,copy:{...copy,value_goals:resolvedGoals,value_subjects:decisions.value_subjects},glossary,hashes,nodes,routes,blocks,contexts,order,blockOwners,contextOwners,carry:validateCarry(carry,nodes,source.bill.id)};
}

export const RELEASE_KEYS=['review_id','bill_id','source_sha256','content_id','mapping_id','procedure_id','rendered_id'];
export function validateRelease(release){exact(release,RELEASE_KEYS,'release');check(release.review_id==='policy-stake-briefs-decision-review'&&nonempty(release.bill_id)&&billIdPattern.test(release.bill_id),'Wrong decision-review or bill identity.');check(hashPattern.test(release.source_sha256),'Invalid release hash: source_sha256');for(const key of ['content_id','mapping_id','procedure_id','rendered_id'])check(new RegExp('^'+key.replace('_id','')+'-[a-f0-9]{64}$').test(release[key]),`Invalid release ID: ${key}`);}
function sessionId(value){check(typeof value==='string'&&/^[A-Za-z0-9_-]{8,100}$/.test(value),'Invalid local session ID.');}
export function createState(model,release,id,at){validateRelease(release);check(release.source_sha256===model.hashes.source_sha256&&release.bill_id===model.sourceIndex.source.bill.id,'Release source or bill differs from package.');sessionId(id);date(at);return {schema_version:1,release:clone(release),session_id:id,created_at:at,updated_at:at,revision:0,answers:{},comparisons:{},stale:{decisions:{},comparisons:{}},navigation:{page:'review',decision_id:null,anchor:''},history:[{seq:0,at,type:'created',payload:{session_id:id}}]};}

export function decisionStates(model,state){
 const result=new Map();
 for(const id of model.order){
  const node=model.nodes.get(id),available=[],blockedBy=new Set(),waitingFor=new Set();let waiting=false;
  for(const route of node.routes){let blocked=false,pending=false;for(const parentId of route.requires){const parent=result.get(parentId);if(parent.effective_answer==='No'||parent.status==='pruned'){blocked=true;if(parent.effective_answer==='No')blockedBy.add(parentId);for(const source of parent.blocked_by)blockedBy.add(source);}else if(parent.effective_answer!=='Yes'){pending=true;waitingFor.add(parentId);}}
   if(!blocked&&!pending)available.push(route.id);else if(!blocked)waiting=true;
  }
  const answer=state.answers[id],stale=Boolean(state.stale.decisions[id]);
  const ready=available.length>0&&!waiting,validBasis=answer&&available.some(route=>answer.basis.route_ids.includes(route))&&(answer.answer==='Yes'||ready&&available.every(route=>answer.basis.route_ids.includes(route)));
  const current=Boolean(answer&&!stale&&validBasis),status=current?'answered':ready?(answer?'stale':'eligible'):available.length||waiting?'waiting':'pruned';
  result.set(id,{status,answer:answer?.answer??null,effective_answer:current?answer.answer:null,stale:Boolean(answer&&!current),ready,available_routes:available,blocked_by:[...blockedBy],waiting_for:[...waitingFor]});
 }return result;
}
function reasonBasis(model,state,id,states){
 const tokens=new Set(),seen=new Set();function collect(current){if(seen.has(current))return;seen.add(current);const status=states.get(current),answer=state.answers[current];if(status.effective_answer!=='Yes')return;tokens.add(current);for(const route of model.nodes.get(current).routes)if(status.available_routes.includes(route.id)&&answer.basis.route_ids.includes(route.id)){tokens.add(route.id);route.requires.forEach(collect);}}collect(id);return [...tokens].sort();
}
function acceptedReasons(model,state,valueId,states=decisionStates(model,state)){
 const support=[],oppose=[],basis={};for(const node of model.nodes.values())if(node.kind==='value'&&node.value_id===valueId&&states.get(node.id).effective_answer==='Yes'){(node.direction==='support'?support:oppose).push(node.id);basis[node.id]=reasonBasis(model,state,node.id,states);}return {support_ids:support,oppose_ids:oppose,reason_basis:basis};
}
function reconcile(model,state,changedId){
 const states=decisionStates(model,state);
 for(const id of model.order){const answer=state.answers[id];if(answer&&!state.stale.decisions[id]&&states.get(id).effective_answer===null)state.stale.decisions[id]=[{decision_id:changedId,revision:state.revision}];}
 for(const [id,comparison] of Object.entries(state.comparisons))if(!state.stale.comparisons[id]){const reasons=acceptedReasons(model,state,id);if(!same(reasons,{support_ids:comparison.basis.support_ids,oppose_ids:comparison.basis.oppose_ids,reason_basis:comparison.basis.reason_basis}))state.stale.comparisons[id]=[{decision_id:changedId,revision:state.revision}];}
}
function append(state,type,payload,at){date(at);check(Date.parse(at)>=Date.parse(state.updated_at),'History timestamp moved backwards.');state.revision++;state.updated_at=at;state.history.push({seq:state.revision,at,type,payload:clone(payload)});}
export function answerDecision(model,state,id,answer,at,notes=''){
 check(model.nodes.has(id)&&[null,'Yes','No'].includes(answer),'Invalid decision or answer.');check(typeof notes==='string'&&notes.length<=20000,'Decision notes exceed the allowed length.');
 if(answer===null){if(!state.answers[id])return state;const next=clone(state);append(next,'reopen',{id},at);delete next.answers[id];delete next.stale.decisions[id];reconcile(model,next,id);return next;}
 const status=decisionStates(model,state).get(id);check(status.ready,'Resolve the required causal premises and alternative routes before answering this decision.');
 const old=state.answers[id];if(old&&!state.stale.decisions[id]&&old.answer===answer&&old.notes===notes&&same(old.basis.route_ids,status.available_routes))return state;
 const next=clone(state);append(next,'answer',{id,answer,notes},at);next.answers[id]={answer,notes,basis:{route_ids:[...status.available_routes],revision:next.revision,at}};delete next.stale.decisions[id];reconcile(model,next,id);return next;
}
export function decisionPriority(model,state){
 const before=decisionStates(model,state),required=[...before].filter(([,item])=>!['answered','pruned'].includes(item.status)).map(([id])=>id);
 let local=null;for(const event of [...state.history].reverse())if(['answer','reopen'].includes(event.type)&&model.nodes.get(event.payload.id)?.kind==='causal'){local=event.type==='answer'&&event.payload.answer==='Yes'?event.payload.id:null;break;}
 const rank=id=>model.nodes.get(id).kind==='causal'?1:local&&model.nodes.get(id).routes.some(route=>before.get(id).available_routes.includes(route.id)&&route.requires.includes(local))?0:2;
 return required.filter(id=>before.get(id).ready).map(id=>{const after=decisionStates(model,answerDecision(model,state,id,'No',state.updated_at));return {id,eliminates:required.filter(other=>other!==id&&after.get(other).status==='pruned').length};}).sort((a,b)=>rank(a.id)-rank(b.id)||(rank(a.id)===0?0:b.eliminates-a.eliminates)||model.nodes.get(a.id).index-model.nodes.get(b.id).index);
}
export function nextDecision(model,state){const first=decisionPriority(model,state)[0];return first?model.nodes.get(first.id):null;}
export function derivedResults(model,state){
 const states=decisionStates(model,state),results=new Map();
 for(const value of model.sourceIndex.values.values()){
  const reasons=acceptedReasons(model,state,value.id,states),unfinished=[...model.nodes.values()].filter(node=>node.kind==='value'&&node.value_id===value.id&&!['answered','pruned'].includes(states.get(node.id).status)).map(node=>node.id);
  const presence=reasons.support_ids.length?(reasons.oppose_ids.length?'Both':'Support'):reasons.oppose_ids.length?'Oppose':unfinished.length?null:'Neither';
  const comparison=state.comparisons[value.id],comparisonStale=Boolean(state.stale.comparisons[value.id]),status=unfinished.length?'incomplete':presence==='Both'?(!comparison?'comparison_required':comparisonStale?'stale':'current'):'current';
  results.set(value.id,{presence,strength:presence==='Both'&&comparison&&!comparisonStale&&!unfinished.length?comparison.strength:null,status,unfinished,...reasons});
 }return results;
}
export function saveComparison(model,state,valueId,strength,at,notes=''){
 check(model.sourceIndex.values.has(valueId)&&['support','oppose','pending'].includes(strength),'Invalid value comparison.');check(typeof notes==='string'&&notes.length<=20000,'Comparison notes exceed the allowed length.');const result=derivedResults(model,state).get(valueId);check(result.presence==='Both'&&result.unfinished.length===0,'Resolve the value-link decisions before comparing both sides.');
 const reasons=acceptedReasons(model,state,valueId),old=state.comparisons[valueId];if(old&&!state.stale.comparisons[valueId]&&old.strength===strength&&old.notes===notes&&same(reasons,{support_ids:old.basis.support_ids,oppose_ids:old.basis.oppose_ids,reason_basis:old.basis.reason_basis}))return state;
 const next=clone(state);append(next,'comparison',{value_id:valueId,strength,notes},at);next.comparisons[valueId]={strength,notes,basis:{...reasons,revision:next.revision,at}};delete next.stale.comparisons[valueId];return next;
}
export function completion(model,state){const statuses=[...decisionStates(model,state).values()],answered=statuses.filter(item=>item.status==='answered').length,pruned=statuses.filter(item=>item.status==='pruned').length,remaining=statuses.length-answered-pruned,comparisons=[...derivedResults(model,state).values()].filter(item=>item.status!=='current').length;return {answered,pruned,remaining,total:statuses.length,comparisons,complete:remaining===0&&comparisons===0};}
export function navigate(model,state,position,at){validateNavigation(position,model);if(same(position,state.navigation))return state;const next=clone(state);append(next,'navigation',position,at);next.navigation=clone(position);return next;}
function validateNavigation(position,model){exact(position,['page','decision_id','anchor'],'navigation');check(['review','results','originals'].includes(position.page)&&(position.decision_id===null||model.nodes.has(position.decision_id))&&typeof position.anchor==='string'&&position.anchor.length<=200&&(!position.anchor||idPattern.test(position.anchor)),'Invalid navigation position.');if(position.page!=='review')check(position.decision_id===null,'Only review navigation can select a decision.');if(position.anchor){const anchor=position.anchor;check(['reading','results','originals'].includes(anchor)||anchor.startsWith('result-')&&model.sourceIndex.values.has(anchor.slice(7))||anchor.startsWith('decision-')&&model.nodes.has(anchor.slice(9))||anchor.startsWith('block-')&&model.blockOwners.has(anchor.slice(6))||anchor.startsWith('context-')&&model.contexts.has(anchor.slice(8))||anchor.startsWith('original-')&&[...model.sourceIndex.source.arguments,...model.sourceIndex.source.claims].some(item=>item.id===anchor.slice(9)),`Unknown navigation anchor: ${anchor}`);}}
// Carry a session saved under an earlier release of the same bill into this release as a new session.
// Answers stay current only where the decision's recorded content is unchanged; changed decisions, and
// answers or comparisons whose basis no longer holds, are marked for another look. Nothing is deleted.
const CARRY_KEYS=['from_session_id','from_release','from_revision','answers','comparisons'];
export function earlierRelease(model,release){return model.carry?.prior.get(release?.rendered_id)??null;}
function applyCarry(model,state,payload,at){
 exact(payload,CARRY_KEYS,'carry payload');sessionId(payload.from_session_id);validateRelease(payload.from_release);check(Number.isInteger(payload.from_revision)&&payload.from_revision>=0,'Invalid earlier revision.');
 const prior=earlierRelease(model,payload.from_release);check(prior&&same(prior.release,payload.from_release)&&payload.from_release.bill_id===state.release.bill_id&&payload.from_release.rendered_id!==state.release.rendered_id,'This session comes from a version of the review that is not recorded here.');
 check(record(payload.answers)&&record(payload.comparisons),'Invalid carried answers.');
 for(const [id,answer] of Object.entries(payload.answers)){ids([id],'carried decision');exact(answer,['answer','notes','stale'],'carried answer');check(['Yes','No'].includes(answer.answer)&&typeof answer.notes==='string'&&answer.notes.length<=20000&&typeof answer.stale==='boolean','Invalid carried answer.');}
 for(const [id,comparison] of Object.entries(payload.comparisons)){ids([id],'carried comparison');exact(comparison,['strength','notes','support_ids','oppose_ids','reason_basis','stale'],'carried comparison');check(['support','oppose','pending'].includes(comparison.strength)&&typeof comparison.notes==='string'&&comparison.notes.length<=20000&&typeof comparison.stale==='boolean'&&record(comparison.reason_basis),'Invalid carried comparison.');ids(comparison.support_ids,'carried support');ids(comparison.oppose_ids,'carried oppose');}
 const next=clone(state);append(next,'carry',payload,at);
 for(const id of model.order){const carried=payload.answers[id];if(carried)next.answers[id]={answer:carried.answer,notes:carried.notes,basis:{route_ids:[...decisionStates(model,next).get(id).available_routes],revision:next.revision,at}};}
 for(const id of Object.keys(next.answers))if(payload.answers[id].stale||prior.fingerprints[id]!==model.carry.fingerprints[id])next.stale.decisions[id]=[{decision_id:id,revision:next.revision}];
 for(const [id,carried] of Object.entries(payload.comparisons))if(model.sourceIndex.values.has(id)){next.comparisons[id]={strength:carried.strength,notes:carried.notes,basis:{support_ids:[...carried.support_ids],oppose_ids:[...carried.oppose_ids],reason_basis:clone(carried.reason_basis),revision:next.revision,at}};if(carried.stale)next.stale.comparisons[id]=[{decision_id:null,revision:next.revision}];}
 reconcile(model,next,null);return next;
}
// verified: the earlier state is the server's saved original. Without that, its stale flags and bases cannot be
// checked (its release's model is not here), so every carried answer and comparison needs another look.
export function carrySession(model,release,earlier,newId,at,{verified=false}={}){
 check(record(earlier)&&earlier.schema_version===1&&record(earlier.answers)&&record(earlier.comparisons)&&record(earlier.stale)&&record(earlier.stale.decisions)&&record(earlier.stale.comparisons)&&Number.isInteger(earlier.revision),'Invalid earlier session.');
 // The earlier release's model is not available here, so its history cannot be fully replayed. Its answers and
 // comparisons must still be exactly what its own recorded events produce. A carry event supplies answers that
 // its release may have dropped for removed decisions.
 check(Array.isArray(earlier.history)&&earlier.history.length>0&&earlier.revision===earlier.history.length-1&&earlier.history.every((event,index)=>record(event)&&event.seq===index&&record(event.payload)),'Invalid earlier session history.');
 const replayedAnswers={},replayedComparisons={},fromCarry=new Set();
 for(const event of earlier.history){const payload=event.payload;
  if(event.type==='answer'){replayedAnswers[payload.id]={answer:payload.answer,notes:payload.notes};fromCarry.delete(payload.id);}
  else if(event.type==='reopen'){delete replayedAnswers[payload.id];fromCarry.delete(payload.id);}
  else if(event.type==='comparison')replayedComparisons[payload.value_id]={strength:payload.strength,notes:payload.notes};
  else if(event.type==='carry'&&record(payload.answers)&&record(payload.comparisons)){for(const [id,answer] of Object.entries(payload.answers)){replayedAnswers[id]={answer:answer?.answer,notes:answer?.notes};fromCarry.add(id);}for(const [id,comparison] of Object.entries(payload.comparisons))replayedComparisons[id]={strength:comparison?.strength,notes:comparison?.notes};}}
 const earlierIds=earlierRelease(model,earlier.release)?.fingerprints??{};for(const id of fromCarry)if(!Object.hasOwn(earlier.answers,id)&&!Object.hasOwn(earlierIds,id))delete replayedAnswers[id];
 check(same(replayedAnswers,Object.fromEntries(Object.entries(earlier.answers).map(([id,answer])=>[id,{answer:answer?.answer,notes:answer?.notes}])))&&same(replayedComparisons,Object.fromEntries(Object.entries(earlier.comparisons).map(([id,comparison])=>[id,{strength:comparison?.strength,notes:comparison?.notes}]))),'The earlier session’s answers do not match its own history.');
 const answers=Object.fromEntries(Object.entries(earlier.answers).map(([id,answer])=>[id,{answer:answer?.answer,notes:answer?.notes,stale:!verified||Boolean(earlier.stale.decisions[id])}]));
 const comparisons=Object.fromEntries(Object.entries(earlier.comparisons).map(([id,comparison])=>[id,{strength:comparison?.strength,notes:comparison?.notes,support_ids:comparison?.basis?.support_ids,oppose_ids:comparison?.basis?.oppose_ids,reason_basis:comparison?.basis?.reason_basis,stale:!verified||Boolean(earlier.stale.comparisons[id])}]));
 return applyCarry(model,createState(model,release,newId,at),{from_session_id:earlier.session_id,from_release:clone(earlier.release),from_revision:earlier.revision,answers,comparisons},at);
}
export function carriedFrom(state){const event=Array.isArray(state?.history)&&state.history.find(item=>item.type==='carry');return event?{session_id:event.payload.from_session_id,rendered_id:event.payload.from_release.rendered_id}:null;}
function appendImport(state,newId,at){sessionId(newId);check(newId!==state.session_id,'Import must open a new local session.');const next=clone(state),oldId=next.session_id;append(next,'import',{from_session_id:oldId,session_id:newId},at);next.session_id=newId;return next;}
export function validateState(state,model,release){
 exact(state,['schema_version','release','session_id','created_at','updated_at','revision','answers','comparisons','stale','navigation','history'],'review state');validateRelease(state.release);validateRelease(release);check(same(state.release,release),'State belongs to a different release.');check(state.schema_version===1,'Unsupported review-state schema.');sessionId(state.session_id);date(state.created_at);date(state.updated_at);check(Number.isInteger(state.revision)&&state.revision>=0,'Invalid state revision.');check(record(state.answers)&&record(state.comparisons)&&record(state.stale),'Invalid saved answers.');exact(state.stale,['decisions','comparisons'],'stale state');check(record(state.stale.decisions)&&record(state.stale.comparisons),'Invalid stale records.');validateNavigation(state.navigation,model);
 check(Array.isArray(state.history)&&state.history.length>0&&state.history.length<=20000&&state.revision===state.history.length-1,'Invalid or truncated event history.');
 const first=state.history[0];exact(first,['seq','at','type','payload'],'created event');exact(first.payload,['session_id'],'created payload');check(first.seq===0&&first.type==='created'&&first.at===state.created_at,'Invalid initial history event.');let replay=createState(model,release,first.payload.session_id,first.at);
 for(let index=1;index<state.history.length;index++){
  const event=state.history[index];exact(event,['seq','at','type','payload'],'history event');check(event.seq===index,'Invalid history sequence.');date(event.at);
  if(event.type==='answer'){exact(event.payload,['id','answer','notes'],'answer payload');check(['Yes','No'].includes(event.payload.answer),'Invalid history answer.');replay=answerDecision(model,replay,event.payload.id,event.payload.answer,event.at,event.payload.notes);}
  else if(event.type==='reopen'){exact(event.payload,['id'],'reopen payload');replay=answerDecision(model,replay,event.payload.id,null,event.at);}
  else if(event.type==='comparison'){exact(event.payload,['value_id','strength','notes'],'comparison payload');replay=saveComparison(model,replay,event.payload.value_id,event.payload.strength,event.at,event.payload.notes);}
  else if(event.type==='navigation')replay=navigate(model,replay,event.payload,event.at);
  else if(event.type==='carry'){check(index===1,'A carried session must start from its earlier version.');replay=applyCarry(model,replay,event.payload,event.at);}
  else if(event.type==='import'){exact(event.payload,['from_session_id','session_id'],'import payload');check(event.payload.from_session_id===replay.session_id,'Invalid import lineage.');replay=appendImport(replay,event.payload.session_id,event.at);}
  else throw new Error('Unknown history event type.');
  check(replay.revision===index,'History contains a no-op or skipped event.');
 }
 check(same(replay,state),'Saved state does not match its complete event history.');return state;
}
export function exportBackup(state){return JSON.stringify({backup_schema_version:1,state},null,2)+'\n';}
export function importBackup(text,model,release,newId,at,{verifiedEarlier=false}={}){check(typeof text==='string'&&text.length<=30000000,'Backup exceeds 30 MB.');const backup=JSON.parse(text);exact(backup,['backup_schema_version','state'],'backup');check(backup.backup_schema_version===1,'Unsupported backup schema.');date(at);if(record(backup.state)&&record(backup.state.release)&&earlierRelease(model,backup.state.release))return carrySession(model,release,backup.state,newId,new Date(Math.max(Date.parse(at),Date.parse(backup.state.updated_at)||0)).toISOString(),{verified:verifiedEarlier});const state=validateState(backup.state,model,release);return appendImport(state,newId,new Date(Math.max(Date.parse(at),Date.parse(state.updated_at))).toISOString());}
// Answer, presence and strength cells hold only what the runtime counts. A saved value that does not
// count (stale, set aside or provisional) is named in the status cell instead.
export function csvHeader(copy){return [copy.csv_record_type,copy.csv_decision,copy.csv_value,copy.csv_direction,copy.csv_answer,copy.csv_presence,copy.csv_strength,copy.csv_status,copy.csv_notes,copy.csv_basis,copy.csv_session,copy.csv_release,copy.content_id_label,copy.mapping_id_label,copy.procedure_id_label,copy.source_id_label,copy.csv_kind,copy.csv_account,copy.csv_carried_from];}
export function csvRows(model,state,copy=model.copy,{kind='',account=''}={}){
 const states=decisionStates(model,state),results=derivedResults(model,state),rows=[],carried=carriedFrom(state);
 const identity=[state.session_id,state.release.rendered_id,state.release.content_id,state.release.mapping_id,state.release.procedure_id,state.release.source_sha256,kind,account,carried?carried.session_id+' · '+carried.rendered_id:''];
 for(const node of model.nodes.values()){const answer=state.answers[node.id],status=states.get(node.id),label=copy['decision_'+(status.status==='answered'?(answer.answer==='Yes'?'yes':'no'):status.status==='eligible'?'unanswered':status.status)],uncounted=answer&&status.effective_answer===null?' · '+copy.saved_answer+': '+answer.answer:'';rows.push([copy.csv_type_decision,node.id,node.value_id??'',node.direction??'',status.effective_answer??copy.unanswered,'','',(status.stale?copy.decision_stale+' · '+label:label)+uncounted,answer?.notes??'',answer?JSON.stringify(answer.basis):'',...identity]);}
 for(const [id,result] of results){const comparison=state.comparisons[id],label=copy[result.status]??copy.comparison_required,provisional=result.status==='incomplete'&&result.presence?' · '+copy.csv_provisional+': '+copy.presence_labels[result.presence]:'',uncountedComparison=comparison&&result.strength===null?' · '+copy.saved_answer+': '+copy.strength_labels[comparison.strength]:'';rows.push([copy.csv_type_value,'',id,'','',result.status==='incomplete'?'':result.presence??copy.unanswered,result.strength?copy.strength_labels[result.strength]:result.presence==='Both'&&result.status!=='incomplete'?copy.pending_comparison:'',(state.stale.comparisons[id]?copy.comparison_stale+' · '+label:label)+provisional+uncountedComparison,comparison?.notes??'',comparison?JSON.stringify(comparison.basis):'',...identity]);}
 return rows;
}
export function csvText(rows){const cell=value=>'"'+String(value??'').replaceAll('"','""')+'"';return rows.map(row=>row.map(cell).join(',')).join('\r\n')+'\r\n';}
export function csvExport(model,state,copy=model.copy,meta={}){return csvText([csvHeader(copy),...csvRows(model,state,copy,meta)]);}
