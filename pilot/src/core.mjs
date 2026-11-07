// Pure coding semantics. No authentication, storage or UI state is inferred here.
import {releaseMetadata,recordedRelease,semanticRevision} from './release.mjs';
export const YES='yes', NO='no';
export function invariant(test,message){if(!test)throw new Error(message);}
export function nodes(content){return [...content.claims,...content.arguments];}
export function billFor(content,node){
  if(!content.bills)return content.bill;
  const target=typeof node==='string'?(node.startsWith('bill:')?{bill_id:node.slice(5)}:nodes(content).find(n=>n.id===node)??content.values.find(v=>v.id===node.replace(/^summary:/,''))):node;
  const id=target?.bill_id;
  const bill=content.bills.find(b=>b.id===id);
  invariant(bill,`Missing bill context for ${typeof node==='string'?node:node?.id}.`);
  return bill;
}
export function backgroundFact(content,id){return content.procedure?.background.find(f=>f.id===id);}
export function judgedClaims(content){return content.claims.filter(c=>!backgroundFact(content,c.id));}
// Preserve the historical randomization, including its RNG draws. Only the
// visible sequence skips statements now supplied as sourced context.
export function codingOrder(content,state){return state.order.filter(id=>!backgroundFact(content,id));}
export function nextCursor(content,state,direction){
  invariant([1,-1].includes(direction),'Invalid navigation direction.');
  for(let i=state.cursor+direction;i>=0&&i<state.order.length;i+=direction)if(!backgroundFact(content,state.order[i]))return i;
  return -1;
}
export function paths(node){return node.paths??node.prerequisite_paths??[{id:`${node.id}-local`,requires:[]}];}
export function validateContent(content){
  invariant(content.schema_version===1,'Unsupported content schema.');
  const all=nodes(content), ids=all.map(n=>n.id);
  invariant(new Set(ids).size===ids.length,'Duplicate claim or argument ID.');
  const claims=new Set(content.claims.map(c=>c.id)), visiting=new Set(), done=new Set();
  if(content.bills){
    const billIds=new Set(content.bills.map(b=>b.id)),valueIds=new Set(content.values.map(v=>v.id));
    invariant(billIds.size===content.bills.length&&billIds.size>0,'Duplicate or missing bill.');
    invariant(valueIds.size===content.values.length,'Duplicate value context.');
    if(content.workflow){
      const sources=content.workflow.resume_sources,covered=sources.flatMap(s=>s.bill_ids);
      invariant(new Set(sources.map(s=>s.version)).size===sources.length&&covered.length===billIds.size&&new Set(covered).size===billIds.size&&covered.every(id=>billIds.has(id)),'Earlier releases do not cover each combined bill exactly once.');
      invariant(sources.every(s=>/^\.\/[a-z0-9-]+\/(?:original-)?content\.json$/.test(s.url)&&/^[a-f0-9]{64}$/.test(s.sha256)&&(!s.single_bill||s.bill_ids.length===1)),'Invalid frozen source for response import.');
    }
    invariant([...all,...content.values,...content.catalog].every(n=>billIds.has(n.bill_id)),'Unknown bill assignment.');
    for(const n of all){
      if(n.value_id)invariant(content.values.some(v=>v.id===n.value_id&&v.bill_id===n.bill_id),'Argument has a mismatched value context.');
      for(const p of paths(n))for(const id of p.requires)invariant(content.claims.some(c=>c.id===id&&c.bill_id===n.bill_id),'A dependency crosses bills or is missing.');
    }
  }
  if(content.procedure){
    const p=content.procedure,background=p.background.map(f=>f.id);
    invariant(p.base_content_version===content.version,'Procedure amendment has a different frozen content version.');
    invariant(typeof p.revision==='string'&&p.revision.length>0,'Procedure revision is missing.');
    invariant(new Set(background).size===background.length,'Duplicate background provision.');
    invariant(background.every(id=>claims.has(id)),'Unknown background provision.');
    for(const fact of p.background){
      invariant(fact.statement&&fact.source_refs?.length,'A background item needs wording and source references.');
      if(fact.classification==='uncontested_sourced_context')invariant(fact.reason&&fact.scope_html&&fact.basis_revision,'Shared context needs a classification rationale and its qualifications.');
      else invariant(fact.section&&fact.source_quote,'A verified provision needs its section and source verification.');
      invariant(paths(content.claims.find(c=>c.id===fact.id)).every(p=>p.requires.every(id=>background.includes(id))),'Sourced background cannot hide a prerequisite that still needs judgment.');
    }
    const reviewed=[...background,...p.retained_questions.map(q=>q.id)];
    invariant(reviewed.length===claims.size&&new Set(reviewed).size===claims.size&&reviewed.every(id=>claims.has(id)),'Procedure audit must classify every shared claim exactly once.');
  }
  for(const n of all){
    invariant(paths(n).length>0,`${n.id}: missing supporting path.`);
    for(const p of paths(n)){
      invariant(Array.isArray(p.requires),`${n.id}: invalid path.`);
      invariant(new Set(p.requires).size===p.requires.length,`${n.id}: duplicate dependency.`);
      for(const d of p.requires)invariant(claims.has(d),`${n.id}: missing shared claim ${d}.`);
    }
  }
  function visit(id){
    invariant(!visiting.has(id),`Circular dependency at ${id}.`);
    if(done.has(id))return;visiting.add(id);
    const n=content.claims.find(c=>c.id===id);
    for(const p of paths(n))for(const dep of p.requires)visit(dep);
    visiting.delete(id);done.add(id);
  }
  content.claims.forEach(c=>visit(c.id));
  for(const c of content.claims){
    const users=claimUsers(content,c.id);
    invariant(users.length>=2,`${c.id}: a separate question needs genuine reuse.`);
  }
  if(content.catalog){
    const expected=content.expected_counts??{active:79,historical:85};
    invariant(content.arguments.length===expected.active,'Active argument coverage differs from the frozen release.');
    invariant(content.catalog.length===expected.historical,'Historical ID coverage differs from the frozen release.');
    invariant(new Set(content.catalog.map(p=>p.id)).size===expected.historical,'Duplicate historical ID.');
    const active=new Set(content.arguments.map(a=>a.id));
    invariant(content.catalog.every(p=>p.retired?!active.has(p.id):active.has(p.id)),'Retirement mismatch.');
  }
  return true;
}
export function stable(value){
  if(Array.isArray(value))return `[${value.map(stable).join(',')}]`;
  if(value&&typeof value==='object')return `{${Object.keys(value).sort().map(k=>`${JSON.stringify(k)}:${stable(value[k])}`).join(',')}}`;
  return JSON.stringify(value);
}
export function claimAncestors(content,nodeId){
  const byId=new Map(nodes(content).map(n=>[n.id,n])), result=new Set();
  function add(id){for(const p of paths(byId.get(id)))for(const dep of p.requires)if(!result.has(dep)){result.add(dep);add(dep);}}
  add(nodeId);return [...result].sort();
}
export function claimUsers(content,claimId){return content.arguments.filter(a=>claimAncestors(content,a.id).includes(claimId));}
export function basis(content,state,nodeId){
  // New frozen runs need only changing judgment dependencies in each answer.
  // Preserve the original S.1582 signature exactly for existing saved records.
  const signature=claimAncestors(content,nodeId).filter(id=>!content.bills||!backgroundFact(content,id)).map(id=>{const fact=backgroundFact(content,id);return fact?[id,fact.classification==='uncontested_sourced_context'?'sourced_context':'verified_background',fact.basis_revision??content.procedure.revision]:[id,state.judgments[id]?.answer??null,state.judgments[id]?.revision??0,state.flags[id]?.dependency??false];});
  for(const id of [nodeId,...claimAncestors(content,nodeId)])if(semanticRevision(content,id))signature.push([id,'judgment_revision',semanticRevision(content,id)]);
  return stable(signature);
}
export function effective(content,state,nodeId,seen=new Set()){
  invariant(!seen.has(nodeId),`Circular dependency at ${nodeId}.`);
  const node=nodes(content).find(n=>n.id===nodeId);invariant(node,`Unknown node ${nodeId}.`);
  // Sourced context is neither a reviewer Yes nor a rejected premise.
  // Old responses remain stored, but have no inferential role in this procedure.
  if(backgroundFact(content,nodeId))return {answer:null,origin:'background',stale:false,blocked:false,direct:state.judgments[nodeId]?.answer??null};
  const concern=state.mappingDispositions?.[nodeId];
  const inheritedConcern=claimAncestors(content,nodeId).some(id=>{const d=state.mappingDispositions?.[id];return d&&(d.status==='Unresolved'||d.continued);});
  if(inheritedConcern||concern&&(concern.status==='Unresolved'||concern.continued))return {answer:null,origin:'unresolved',stale:false,blocked:false,direct:state.judgments[nodeId]?.answer??null};
  const next=new Set(seen).add(nodeId);
  // A flagged dependency requires manual review; do not silently apply the disputed edge.
  const disputed=!!state.flags[nodeId]?.dependency;
  const blocked=!disputed&&paths(node).every(p=>p.requires.some(id=>effective(content,state,id,next).answer===NO));
  const direct=state.judgments[nodeId];
  const stale=!!direct&&direct.basis!==basis(content,state,nodeId);
  if(blocked)return {answer:NO,origin:'derived',stale,blocked:true,direct:direct?.answer??null};
  if(direct&&!stale)return {answer:direct.answer,origin:'direct',stale:false,blocked:false,direct:direct.answer};
  return {answer:null,origin:stale?'reassess':'unanswered',stale,blocked:false,direct:direct?.answer??null};
}
export function valueResult(content,state,value){
  const result={};
  for(const direction of ['support','oppose']){
    const list=content.arguments.filter(a=>a.value_id===value&&a.direction===direction);
    const answers=list.map(a=>effective(content,state,a.id).answer);
    result[direction]=answers.includes(YES)?YES:answers.every(a=>a===NO)?NO:null;
  }
  result.outcome=result.support===null||result.oppose===null?'Pending':result.support===YES?(result.oppose===YES?'Both':'Support'):(result.oppose===YES?'Oppose':'Neither');
  return result;
}
export function comparisonBasis(content,state,value){
  if(content.bills)return stable(content.arguments.filter(a=>a.value_id===value).map(a=>[a.id,effective(content,state,a.id).answer,state.judgments[a.id]?.revision??0,basis(content,state,a.id)]));
  return stable(content.arguments.filter(a=>a.value_id===value).map(a=>[a.id,effective(content,state,a.id).answer,state.judgments[a.id]??null,basis(content,state,a.id)]));
}
export function strengthResult(content,state,value){
  const saved=state.comparisons[value];
  return valueResult(content,state,value).outcome==='Both'&&saved?.basis===comparisonBasis(content,state,value)?saved.answer:'Pending';
}
export function rng(seed){let n=seed>>>0;return ()=>{n+=0x6D2B79F5;let x=n;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return ((x^(x>>>14))>>>0)/4294967296;};}
export function shuffled(list,random){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function makeOrder(content,seed,sourceSeeds={},orderPaths=null){
  const random=rng(seed),sequence=[];
  for(const bill of content.bills?shuffled(content.bills,random):[null]){
   if(bill)sequence.push(`bill:${bill.id}`);
   const localClaims=bill?content.claims.filter(c=>c.bill_id===bill.id):content.claims;
   const localArguments=bill?content.arguments.filter(a=>a.bill_id===bill.id):content.arguments;
   const remaining=new Set(localClaims.map(c=>c.id)),claimOrder=[];
   while(remaining.size){
    // All prerequisites first, including prerequisites on alternative paths.
    const ready=[...remaining].filter(id=>(orderPaths?.[id]??paths(content.claims.find(c=>c.id===id))).every(p=>p.requires.every(d=>!remaining.has(d))));
    invariant(ready.length,'Circular shared-claim dependency.');
    for(const id of shuffled(ready,random)){claimOrder.push(id);remaining.delete(id);}
   }
  sequence.push(...claimOrder);
  const values=shuffled(bill?content.values.filter(v=>v.bill_id===bill.id).map(v=>v.id):[...new Set(localArguments.map(a=>a.value_id))],random);
  for(const value of values){
    for(const direction of shuffled(['support','oppose'],random))sequence.push(...shuffled(localArguments.filter(a=>a.value_id===value&&a.direction===direction).map(a=>a.id),random));
    sequence.push(`summary:${value}`);
  }
  }
  if(content.workflow&&Object.keys(sourceSeeds).length){
   const imported=new Map();
   for(const [version,sourceSeed] of Object.entries(sourceSeeds)){
    const spec=content.workflow.resume_sources.find(s=>s.version===version);
    invariant(spec&&Number.isInteger(sourceSeed),'The saved order refers to an invalid earlier release or seed.');
    const subset={...content,workflow:undefined,bills:content.bills.filter(b=>spec.bill_ids.includes(b.id)),claims:content.claims.filter(n=>spec.bill_ids.includes(n.bill_id)),arguments:content.arguments.filter(n=>spec.bill_ids.includes(n.bill_id)),values:content.values.filter(n=>spec.bill_ids.includes(n.bill_id))};
    if(spec.single_bill)delete subset.bills;
    const prior=makeOrder(subset,sourceSeed,{},orderPaths);
    for(const id of spec.bill_ids)imported.set(id,[`bill:${id}`,...prior.filter(key=>!key.startsWith('bill:')&&billFor(content,key).id===id)]);
   }
   return sequence.filter(id=>id.startsWith('bill:')).flatMap(id=>imported.get(id.slice(5))??sequence.filter(key=>billFor(content,key).id===id.slice(5)));
  }
  return sequence;
}
export function newState(content,seed){const order=makeOrder(content,seed);return {version:content.version,release:releaseMetadata(content),...(content.procedure?{procedureRevision:content.procedure.revision}:{}),seed,order,cursor:order.findIndex(id=>!backgroundFact(content,id)),judgments:{},nodeNotes:{},completed:{},flags:{},comparisons:{},comparisonNotes:{},omissions:{},summaryCompleted:{},eventRevision:0,history:[]};}
export function validateState(content,s){
  invariant(s&&s.version===content.version,'This response belongs to a different frozen content version. No migration was applied.');
  invariant(!s.procedureRevision||s.procedureRevision===content.procedure?.revision||content.procedure?.previous_revisions?.includes(s.procedureRevision),'This response uses a different coding procedure. No migration was applied.');
  if(s.sourceOrderPaths){
   invariant(typeof s.sourceOrderPaths==='object'&&!Array.isArray(s.sourceOrderPaths),'The imported order policy is invalid.');
   for(const [id,policy] of Object.entries(s.sourceOrderPaths)){
    const claim=content.claims.find(c=>c.id===id),allowed=claim?[paths(claim),...(content.release?.order_history??[]).map(h=>h.claim_paths[id]).filter(Boolean)]:[];
    invariant(allowed.some(p=>stable(p)===stable(policy)),'The imported order policy is not in release history.');
   }
  }
  const matchesOrder=history=>stable(s.order)===stable(makeOrder(content,s.seed,s.sourceSeeds??{},history||s.sourceOrderPaths?{...history,...s.sourceOrderPaths}:null));
  invariant(Number.isInteger(s.seed)&&(matchesOrder(null)||(content.release?.order_history??[]).some(h=>matchesOrder(h.claim_paths))),'The saved randomized order does not match its recorded seed.');
  invariant(Number.isInteger(s.cursor)&&s.cursor>=0&&s.cursor<s.order.length,'The saved progress is invalid.');
  const ids=new Set(nodes(content).map(n=>n.id)),values=new Set(content.values?.map(v=>v.id)??content.arguments.map(a=>a.value_id));
  for(const key of ['judgments','nodeNotes','completed','flags','comparisons','comparisonNotes','omissions','summaryCompleted'])invariant(s[key]&&typeof s[key]==='object'&&!Array.isArray(s[key]),`The saved response is missing ${key}.`);
  for(const [id,j] of Object.entries(s.judgments))invariant(ids.has(id)&&[YES,NO].includes(j.answer)&&Number.isInteger(j.revision),'The saved judgments contain an invalid answer.');
  for(const [id,n] of Object.entries(s.nodeNotes))invariant(ids.has(id)&&typeof n==='string'&&n.length<=2000,'The saved notes are invalid.');
  for(const id of [...Object.keys(s.completed),...Object.keys(s.flags)])invariant(ids.has(id),'The saved response references an unknown claim or argument.');
  for(const [id,c] of Object.entries(s.comparisons))invariant(values.has(id)&&['support','oppose','Pending'].includes(c.answer),'The saved comparison is invalid.');
  for(const [id,d] of Object.entries(s.mappingDispositions??{}))invariant(ids.has(id)&&['No mapping change','Mapping revised','Unresolved'].includes(d.status)&&typeof d.note==='string'&&typeof d.continued==='boolean','The saved mapping disposition is invalid.');
  invariant(Number.isInteger(s.eventRevision)&&s.eventRevision>=0&&Array.isArray(s.history),'The saved revision history is invalid.');
  return s;
}
export function editState(content,state,action,now=new Date().toISOString()){
  const next=structuredClone(state);
  next.release=releaseMetadata(content);
  if(content.procedure)next.procedureRevision=content.procedure.revision;
  next.eventRevision=(state.eventRevision??0)+1;
  if(action.type==='judgment'){
    invariant([YES,NO].includes(action.answer),'Choose Yes or No.');
    invariant(nodes(content).some(n=>n.id===action.id),'Unknown judgment ID.');
    invariant(!backgroundFact(content,action.id),'This item is sourced background, not a judgment question.');
    invariant(typeof (action.notes??'')==='string'&&(action.notes??'').length<=2000,'Notes must be at most 2,000 characters.');
    next.judgments[action.id]={answer:action.answer,notes:action.notes??'',basis:basis(content,next,action.id),at:now,revision:next.eventRevision,release:releaseMetadata(content)};
  }else if(action.type==='notes'){
    invariant(nodes(content).some(n=>n.id===action.id),'Unknown note ID.');
    invariant(typeof action.notes==='string'&&action.notes.length<=2000,'Notes must be at most 2,000 characters.');
    next.nodeNotes[action.id]=action.notes;
  }else if(action.type==='complete'){
    const e=effective(content,next,action.id);invariant(e.answer!==null,'An answer or derived No is required.');
    next.completed[action.id]={at:now,basis:basis(content,next,action.id),answer:e.answer,origin:e.origin};
  }else if(action.type==='flag'){
    invariant(nodes(content).some(n=>n.id===action.id),'Unknown flag ID.');
    invariant(typeof (action.notes??'')==='string'&&(action.notes??'').length<=2000,'Dependency notes must be at most 2,000 characters.');
    next.flags[action.id]={dependency:!!action.dependency,notes:action.notes??'',at:now};
  }else if(action.type==='comparisonNotes'){
    invariant(content.values?.some(v=>v.id===action.value)||content.arguments.some(a=>a.value_id===action.value),'Unknown value.');
    invariant(typeof action.notes==='string'&&action.notes.length<=2000,'Comparison notes must be at most 2,000 characters.');
    next.comparisonNotes[action.value]=action.notes;
  }else if(action.type==='comparison'){
    invariant(valueResult(content,next,action.value).outcome==='Both','Strength comparison is only available for Both.');
    invariant(['support','oppose','Pending'].includes(action.answer),'Invalid comparison.');
    invariant(typeof (action.notes??'')==='string'&&(action.notes??'').length<=2000,'Comparison notes must be at most 2,000 characters.');
    next.comparisons[action.value]={answer:action.answer,notes:action.notes??'',basis:comparisonBasis(content,next,action.value),at:now};
  }else if(action.type==='omission'){
    invariant(['support','oppose'].includes(action.direction),'Invalid omitted-reason direction.');
    invariant(content.values?.some(v=>v.id===action.value)||content.arguments.some(a=>a.value_id===action.value),'Unknown value.');
    invariant(typeof (action.text??'')==='string'&&(action.text??'').length<=4000,'Omitted reasons must be at most 4,000 characters.');
    next.omissions[`${action.value}:${action.direction}`]={text:action.text??'',at:now};
  }else if(action.type==='summary'){
    const args=content.arguments.filter(a=>a.value_id===action.value);
    invariant(content.values?.some(v=>v.id===action.value)||args.length>0,'Unknown value.');
    invariant(args.every(a=>pageComplete(content,next,a.id)),'Review every argument before completing the value.');
    invariant(valueResult(content,next,action.value).outcome!=='Pending','Unresolved judgments remain.');
    if(valueResult(content,next,action.value).outcome==='Both')invariant(next.comparisons[action.value]?.basis===comparisonBasis(content,next,action.value),'Choose a comparison, including Pending if needed.');
    next.summaryCompleted[action.value]=comparisonBasis(content,next,action.value);
  }else if(action.type==='cursor'){
    invariant(Number.isInteger(action.cursor)&&action.cursor>=0&&action.cursor<state.order.length,'Invalid page.');next.cursor=action.cursor;
  }else throw new Error('Unknown action.');
  next.history.push({action:structuredClone(action),at:now,release:releaseMetadata(content)});return next;
}
export function pageComplete(content,state,id){const saved=state.completed[id],e=effective(content,state,id);return !!saved&&saved.basis===basis(content,state,id)&&saved.answer===e.answer&&e.answer!==null;}
export function progress(content,state){return {claims:judgedClaims(content).filter(c=>pageComplete(content,state,c.id)).length,arguments:content.arguments.filter(a=>pageComplete(content,state,a.id)).length,totalClaims:judgedClaims(content).length,totalArguments:content.arguments.length,derived:content.arguments.filter(a=>effective(content,state,a.id).origin==='derived').length};}
export function csvExport(content,state){
  const q=x=>'"'+String(x??'').replaceAll('"','""')+'"';
  const rows=[['id','type','value','direction','direct_answer','effective_answer','origin','needs_reassessment','page_complete','notes','dependency_flag','content_version','procedure_revision','recorded_procedure_revision']];
  for(const n of nodes(content)){const e=effective(content,state,n.id);rows.push([n.id,backgroundFact(content,n.id)?'background':n.kind??(n.value_id?'argument':'claim'),n.value_id,n.direction,state.judgments[n.id]?.answer,e.answer,e.origin,e.stale,pageComplete(content,state,n.id),state.nodeNotes[n.id]??state.judgments[n.id]?.notes,state.flags[n.id]?.dependency,content.version]);}
  for(const value of content.values??[]){
    const result=valueResult(content,state,value.id),comparison=state.comparisons[value.id];
    rows.push([`summary:${value.id}`,'summary',value.id,'',comparison?.answer,result.outcome,'derived',comparison?comparison.basis!==comparisonBasis(content,state,value.id):false,state.summaryCompleted[value.id]===comparisonBasis(content,state,value.id),state.comparisonNotes[value.id]??comparison?.notes,'',content.version]);
    rows.push([`strength:${value.id}`,'strength',value.id,'',comparison?.answer,strengthResult(content,state,value.id),'direct','','',state.comparisonNotes[value.id]??comparison?.notes,'',content.version]);
    for(const direction of ['support','oppose'])if(state.omissions[`${value.id}:${direction}`])rows.push([`omission:${value.id}:${direction}`,'omitted_reason',value.id,direction,'','','','', '',state.omissions[`${value.id}:${direction}`].text,'',content.version]);
  }
  const loaded=releaseMetadata(content),recorded=recordedRelease(state),keys=['content_id','procedure_id','mapping_id','rendered_id'];
  return rows.map((r,i)=>(i?[...r,content.procedure?.revision??'original',state.procedureRevision??'original',...keys.map(k=>loaded[k]),...keys.map(k=>recorded[k]),state.judgments[r[0]]?.release?.rendered_id??'unknown_legacy']:[...r,...keys.map(k=>`loaded_${k}`),...keys.map(k=>`recorded_${k}`),'judgment_rendered_id']).map(q).join(',')).join('\r\n');
}

// Coordinator dispositions annotate a private export; they never overwrite a vote.
export function recordMappingDisposition(content,state,{id,status,note,continued=false,coordinator},now=new Date().toISOString()){
 invariant(typeof coordinator==='string'&&coordinator.trim(),'A named human coordinator is required.');
 invariant(nodes(content).some(n=>n.id===id),'Unknown mapping concern.');
 invariant(['No mapping change','Mapping revised','Unresolved'].includes(status),'Invalid mapping disposition.');
 invariant(typeof note==='string'&&note.trim()&&note.length<=4000,'Record the reason for the disposition.');
 const next=structuredClone(state),record={status,note,continued:!!continued,coordinator,at:now,mapping_id:releaseMetadata(content).mapping_id,reviewed_note:state.nodeNotes[id]??''};
 next.mappingDispositions={...next.mappingDispositions,[id]:record};next.eventRevision++;
 next.history.push({action:{type:'mappingDisposition',id,...record},at:now,release:releaseMetadata(content)});
 return validateState(content,next);
}
