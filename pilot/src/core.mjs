// Pure coding semantics. No authentication, storage or UI state is inferred here.
export const YES='yes', NO='no';
export function invariant(test,message){if(!test)throw new Error(message);}
export function nodes(content){return [...content.claims,...content.arguments];}
export function paths(node){return node.paths??node.prerequisite_paths??[{id:`${node.id}-local`,requires:[]}];}
export function validateContent(content){
  invariant(content.schema_version===1,'Unsupported content schema.');
  const all=nodes(content), ids=all.map(n=>n.id);
  invariant(new Set(ids).size===ids.length,'Duplicate claim or argument ID.');
  const claims=new Set(content.claims.map(c=>c.id)), visiting=new Set(), done=new Set();
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
    invariant(content.arguments.length===79,'S.1582 must contain all 79 active arguments.');
    invariant(content.catalog.length===85,'Historical catalog must preserve 85 IDs.');
    invariant(new Set(content.catalog.map(p=>p.id)).size===85,'Duplicate historical ID.');
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
  return stable(claimAncestors(content,nodeId).map(id=>[id,state.judgments[id]?.answer??null,state.judgments[id]?.revision??0, state.flags[id]?.dependency??false]));
}
export function effective(content,state,nodeId,seen=new Set()){
  invariant(!seen.has(nodeId),`Circular dependency at ${nodeId}.`);
  const node=nodes(content).find(n=>n.id===nodeId);invariant(node,`Unknown node ${nodeId}.`);
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
  return stable(content.arguments.filter(a=>a.value_id===value).map(a=>[a.id,effective(content,state,a.id).answer,state.judgments[a.id]??null,basis(content,state,a.id)]));
}
export function strengthResult(content,state,value){
  const saved=state.comparisons[value];
  return valueResult(content,state,value).outcome==='Both'&&saved?.basis===comparisonBasis(content,state,value)?saved.answer:'Pending';
}
export function rng(seed){let n=seed>>>0;return ()=>{n+=0x6D2B79F5;let x=n;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return ((x^(x>>>14))>>>0)/4294967296;};}
export function shuffled(list,random){const a=[...list];for(let i=a.length-1;i>0;i--){const j=Math.floor(random()*(i+1));[a[i],a[j]]=[a[j],a[i]];}return a;}
export function makeOrder(content,seed){
  const random=rng(seed), remaining=new Set(content.claims.map(c=>c.id)), claimOrder=[];
  while(remaining.size){
    // All prerequisites first, including prerequisites on alternative paths.
    const ready=[...remaining].filter(id=>paths(content.claims.find(c=>c.id===id)).every(p=>p.requires.every(d=>!remaining.has(d))));
    invariant(ready.length,'Circular shared-claim dependency.');
    for(const id of shuffled(ready,random)){claimOrder.push(id);remaining.delete(id);}
  }
  const sequence=[...claimOrder];
  const values=shuffled([...new Set(content.arguments.map(a=>a.value_id))],random);
  for(const value of values){
    for(const direction of shuffled(['support','oppose'],random))sequence.push(...shuffled(content.arguments.filter(a=>a.value_id===value&&a.direction===direction).map(a=>a.id),random));
    sequence.push(`summary:${value}`);
  }
  return sequence;
}
export function newState(content,seed){return {version:content.version,seed,order:makeOrder(content,seed),cursor:0,judgments:{},nodeNotes:{},completed:{},flags:{},comparisons:{},comparisonNotes:{},omissions:{},summaryCompleted:{},eventRevision:0,history:[]};}
export function validateState(content,s){
  invariant(s&&s.version===content.version,'This response belongs to a different frozen content version. No migration was applied.');
  invariant(Number.isInteger(s.seed)&&stable(s.order)===stable(makeOrder(content,s.seed)),'The saved randomized order does not match its recorded seed.');
  invariant(Number.isInteger(s.cursor)&&s.cursor>=0&&s.cursor<s.order.length,'The saved progress is invalid.');
  const ids=new Set(nodes(content).map(n=>n.id)),values=new Set(content.arguments.map(a=>a.value_id));
  for(const key of ['judgments','nodeNotes','completed','flags','comparisons','comparisonNotes','omissions','summaryCompleted'])invariant(s[key]&&typeof s[key]==='object'&&!Array.isArray(s[key]),`The saved response is missing ${key}.`);
  for(const [id,j] of Object.entries(s.judgments))invariant(ids.has(id)&&[YES,NO].includes(j.answer)&&Number.isInteger(j.revision),'The saved judgments contain an invalid answer.');
  for(const [id,n] of Object.entries(s.nodeNotes))invariant(ids.has(id)&&typeof n==='string'&&n.length<=2000,'The saved notes are invalid.');
  for(const id of [...Object.keys(s.completed),...Object.keys(s.flags)])invariant(ids.has(id),'The saved response references an unknown claim or argument.');
  for(const [id,c] of Object.entries(s.comparisons))invariant(values.has(id)&&['support','oppose','Pending'].includes(c.answer),'The saved comparison is invalid.');
  invariant(Number.isInteger(s.eventRevision)&&s.eventRevision>=0&&Array.isArray(s.history),'The saved revision history is invalid.');
  return s;
}
export function editState(content,state,action,now=new Date().toISOString()){
  const next=structuredClone(state);
  next.eventRevision=(state.eventRevision??0)+1;
  if(action.type==='judgment'){
    invariant([YES,NO].includes(action.answer),'Choose Yes or No.');
    invariant(nodes(content).some(n=>n.id===action.id),'Unknown judgment ID.');
    invariant(typeof (action.notes??'')==='string'&&(action.notes??'').length<=2000,'Notes must be at most 2,000 characters.');
    next.judgments[action.id]={answer:action.answer,notes:action.notes??'',basis:basis(content,next,action.id),at:now,revision:next.eventRevision};
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
    invariant(content.arguments.some(a=>a.value_id===action.value),'Unknown value.');
    invariant(typeof action.notes==='string'&&action.notes.length<=2000,'Comparison notes must be at most 2,000 characters.');
    next.comparisonNotes[action.value]=action.notes;
  }else if(action.type==='comparison'){
    invariant(valueResult(content,next,action.value).outcome==='Both','Strength comparison is only available for Both.');
    invariant(['support','oppose','Pending'].includes(action.answer),'Invalid comparison.');
    invariant(typeof (action.notes??'')==='string'&&(action.notes??'').length<=2000,'Comparison notes must be at most 2,000 characters.');
    next.comparisons[action.value]={answer:action.answer,notes:action.notes??'',basis:comparisonBasis(content,next,action.value),at:now};
  }else if(action.type==='omission'){
    invariant(['support','oppose'].includes(action.direction),'Invalid omitted-reason direction.');
    invariant(content.arguments.some(a=>a.value_id===action.value),'Unknown value.');
    invariant(typeof (action.text??'')==='string'&&(action.text??'').length<=4000,'Omitted reasons must be at most 4,000 characters.');
    next.omissions[`${action.value}:${action.direction}`]={text:action.text??'',at:now};
  }else if(action.type==='summary'){
    const args=content.arguments.filter(a=>a.value_id===action.value);
    invariant(args.length>0,'Unknown value.');
    invariant(args.every(a=>pageComplete(content,next,a.id)),'Review every argument before completing the value.');
    invariant(valueResult(content,next,action.value).outcome!=='Pending','Unresolved judgments remain.');
    if(valueResult(content,next,action.value).outcome==='Both')invariant(next.comparisons[action.value]?.basis===comparisonBasis(content,next,action.value),'Choose a comparison, including Pending if needed.');
    next.summaryCompleted[action.value]=comparisonBasis(content,next,action.value);
  }else if(action.type==='cursor'){
    invariant(Number.isInteger(action.cursor)&&action.cursor>=0&&action.cursor<state.order.length,'Invalid page.');next.cursor=action.cursor;
  }else throw new Error('Unknown action.');
  next.history.push({action:structuredClone(action),at:now});return next;
}
export function pageComplete(content,state,id){const saved=state.completed[id],e=effective(content,state,id);return !!saved&&saved.basis===basis(content,state,id)&&saved.answer===e.answer&&e.answer!==null;}
export function progress(content,state){return {claims:content.claims.filter(c=>pageComplete(content,state,c.id)).length,arguments:content.arguments.filter(a=>pageComplete(content,state,a.id)).length,totalClaims:content.claims.length,totalArguments:content.arguments.length,derived:content.arguments.filter(a=>effective(content,state,a.id).origin==='derived').length};}
export function csvExport(content,state){
  const q=x=>'"'+String(x??'').replaceAll('"','""')+'"';
  const rows=[['id','type','value','direction','direct_answer','effective_answer','origin','needs_reassessment','page_complete','notes','dependency_flag','content_version']];
  for(const n of nodes(content)){const e=effective(content,state,n.id);rows.push([n.id,n.kind??(n.value_id?'argument':'claim'),n.value_id,n.direction,state.judgments[n.id]?.answer,e.answer,e.origin,e.stale,pageComplete(content,state,n.id),state.nodeNotes[n.id]??state.judgments[n.id]?.notes,state.flags[n.id]?.dependency,content.version]);}
  for(const value of content.values??[]){
    const result=valueResult(content,state,value.id),comparison=state.comparisons[value.id];
    rows.push([`summary:${value.id}`,'summary',value.id,'',comparison?.answer,result.outcome,'derived',comparison?comparison.basis!==comparisonBasis(content,state,value.id):false,state.summaryCompleted[value.id]===comparisonBasis(content,state,value.id),state.comparisonNotes[value.id]??comparison?.notes,'',content.version]);
    rows.push([`strength:${value.id}`,'strength',value.id,'',comparison?.answer,strengthResult(content,state,value.id),'direct','','',state.comparisonNotes[value.id]??comparison?.notes,'',content.version]);
    for(const direction of ['support','oppose'])if(state.omissions[`${value.id}:${direction}`])rows.push([`omission:${value.id}:${direction}`,'omitted_reason',value.id,direction,'','','','', '',state.omissions[`${value.id}:${direction}`].text,'',content.version]);
  }
  return rows.map(r=>r.map(q).join(',')).join('\r\n');
}
