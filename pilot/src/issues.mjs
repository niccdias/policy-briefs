// Issue decisions reuse the original claim graph; they never create argument votes.
import * as legacy from './core.mjs';
import {releaseMetadata} from './release.mjs';

export const presences=['Support','Oppose','Both','Neither','Pending'];
export const strengths=['support','oppose','Pending'];
export const isIssueMode=content=>content.issue_review?.schema_version===1;
export const issueFor=(content,id)=>content.issue_review.issues.find(issue=>issue.id===id);
export const members=(content,issue)=>issue.argument_ids.map(id=>content.arguments.find(a=>a.id===id));
const sides=presence=>presence==='Both'?['support','oppose']:presence==='Support'?['support']:presence==='Oppose'?['oppose']:[];
const object=value=>value&&typeof value==='object'&&!Array.isArray(value);
const note=value=>typeof value==='string'&&value.length<=2000;
export function validateContent(content){
 legacy.validateContent(content);
 legacy.invariant(isIssueMode(content)&&!content.workflow,'Issue review must be a separate run without response import.');
 const issues=content.issue_review.issues,ids=issues.flatMap(i=>i.argument_ids);
 legacy.invariant(new Set(issues.map(i=>i.id)).size===issues.length&&ids.length===content.arguments.length&&new Set(ids).size===ids.length&&content.arguments.every(a=>ids.includes(a.id)),'The issue map must include every active argument exactly once.');
 for(const issue of issues)legacy.invariant(issue.argument_ids.length&&issue.argument_ids.every(id=>content.arguments.some(a=>a.id===id&&a.value_id===issue.value_id))&&typeof content.issue_review.basis_ids[issue.id]==='string','An issue has an invalid value, member or semantic basis.');
 return true;
}
const sourceIdentity=content=>Object.fromEntries(['source_content_id','source_sha256','map_sha256','copy_sha256'].map(key=>[key,content.issue_review[key]]));
export function commonIssueEvidence(content,issue){
 const ids=[...issue.argument_ids,...new Set(members(content,issue).flatMap(a=>legacy.claimAncestors(content,a.id)))],groups=new Map(),suppressed=new Map();
 for(const id of ids)for(const side of ['support','response'])for(const item of content.evidence_placement.nodes[id][side]){
  const sources=item.html.match(/\s*<span class="note-sources">[\s\S]*<\/span>(?=<\/p>$)/)?.[0]??'',body=sources?item.html.replace(sources,''):item.html,key=`${item.id}:${body}`;
  if(!groups.has(key))groups.set(key,{id:item.id,html:body,uses:[]});
  groups.get(key).uses.push({id,side,sources_html:sources});
 }
 const common=[...groups.values()].filter(item=>item.uses.length>1);
 for(const item of common)for(const use of item.uses){const key=`${use.id}:${use.side}`;if(!suppressed.has(key))suppressed.set(key,new Set());suppressed.get(key).add(item.id);}
 return {common,suppressed};
}

export function argumentRoutes(content,state,argument){
 const unresolvedMapping=id=>{const concern=state.mappingDispositions?.[id];return concern&&(concern.status==='Unresolved'||concern.continued);};
 return legacy.paths(argument).map(path=>{
  const claims=path.requires.map(id=>({id,...legacy.effective(content,state,id)}));
  const unresolved=unresolvedMapping(argument.id)||path.requires.some(id=>[id,...legacy.claimAncestors(content,id)].some(unresolvedMapping));
  return {...path,status:unresolved?'unresolved':claims.some(c=>c.answer==='no')?'blocked':claims.some(c=>c.origin==='unresolved')?'unresolved':claims.some(c=>c.answer===null&&c.origin!=='background')?'unknown':'open',claims};
 });
}
export function availableSides(content,state,issue){
 return Object.fromEntries(['support','oppose'].map(direction=>{
  const argumentsForSide=members(content,issue).filter(a=>a.direction===direction);
  const viable=argumentsForSide.filter(a=>argumentRoutes(content,state,a).some(p=>!['blocked','unresolved'].includes(p.status)));
  return [direction,{exists:argumentsForSide.length>0,available:viable.length>0,argument_ids:argumentsForSide.map(a=>a.id),viable_argument_ids:viable.map(a=>a.id)}];
 }));
}
export function issueBasis(content,state,id){
 const issue=issueFor(content,id);legacy.invariant(issue,'Unknown issue.');
 const argumentsForIssue=members(content,issue),ancestors=[...new Set(argumentsForIssue.flatMap(a=>legacy.claimAncestors(content,a.id)))].sort();
 const routeIds=node=>legacy.paths(node).map(p=>[p.id,p.requires]);
 return legacy.stable([content.issue_review.basis_ids[id],issue.argument_ids,argumentsForIssue.map(a=>[a.id,routeIds(a),legacy.basis(content,state,a.id),state.mappingDispositions?.[a.id]??null]),ancestors.map(id=>[id,routeIds(content.claims.find(c=>c.id===id)),state.mappingDispositions?.[id]??null])]);
}
export function issueResult(content,state,id){
 const issue=issueFor(content,id);legacy.invariant(issue,'Unknown issue.');
 const saved=state.issueJudgments[id],availability=availableSides(content,state,issue),currentBasis=issueBasis(content,state,id);
 const stale=!!saved&&saved.basis!==currentBasis;
 const blocked=!!saved&&sides(saved.presence).some(side=>!availability[side].available);
 const current=!!saved&&!stale&&!blocked;
 return {presence:current?saved.presence:'Pending',strength:current&&saved.presence==='Both'?(saved.strength??null):null,origin:stale?'reassess':blocked?'unresolved':saved?'direct':'unanswered',stale:stale||blocked,earlierPresence:current?undefined:saved?.presence,availability};
}
export function makeOrder(content,seed){
 const random=legacy.rng(seed),remaining=new Set(legacy.judgedClaims(content).map(c=>c.id)),order=[`bill:${content.issue_review.bill_id}`];
 while(remaining.size){
  const ready=[...remaining].filter(id=>legacy.claimAncestors(content,id).every(dep=>!remaining.has(dep)));
  legacy.invariant(ready.length,'Circular shared-claim dependency.');
  for(const id of legacy.shuffled(ready,random)){order.push(id);remaining.delete(id);}
 }
 for(const value of legacy.shuffled(content.values,random)){
  order.push(...legacy.shuffled(content.issue_review.issues.filter(i=>i.value_id===value.id).map(i=>i.id),random),`summary:${value.id}`);
 }
 return order;
}
export function newState(content,seed){
 const state=legacy.newState(content,seed);
 return {...state,schema_version:2,mode:'issue-review',issueSource:sourceIdentity(content),order:makeOrder(content,seed),cursor:0,issueJudgments:{},issueNotes:{},issueCompleted:{}};
}
export function validateState(content,state){
 legacy.invariant(state?.schema_version===2&&state.mode==='issue-review','This is not an issue-review response. No earlier votes were imported.');
 legacy.invariant(state.version===content.version,'This response belongs to a different frozen content version. No migration was applied.');
 legacy.invariant(object(state.issueSource)&&typeof state.issueSource.source_content_id==='string'&&['source_sha256','map_sha256','copy_sha256'].every(key=>/^[a-f0-9]{64}$/.test(state.issueSource[key])),'The saved issue source identity is invalid.');
 legacy.invariant(Number.isInteger(state.seed)&&legacy.stable(state.order)===legacy.stable(makeOrder(content,state.seed)),'The saved randomized issue order does not match its recorded seed.');
 legacy.invariant(Number.isInteger(state.cursor)&&state.cursor>=0&&state.cursor<state.order.length,'The saved progress is invalid.');
 // Validate the shared storage fields with the existing validator, without changing the saved issue order.
 legacy.validateState(content,{...state,order:legacy.makeOrder(content,state.seed),cursor:0});
 const claimIds=new Set(legacy.judgedClaims(content).map(c=>c.id));
 for(const key of ['judgments','nodeNotes','completed','flags'])legacy.invariant(Object.keys(state[key]).every(id=>claimIds.has(id)),'Issue review cannot contain per-argument votes or completion records.');
 legacy.invariant(Object.keys(state.flags).length===0,'Issue review has no dependency flags.');
 for(const key of ['issueJudgments','issueNotes','issueCompleted'])legacy.invariant(object(state[key]),`The saved response is missing ${key}.`);
 for(const [id,j] of Object.entries(state.issueJudgments))legacy.invariant(issueFor(content,id)&&object(j)&&presences.includes(j.presence)&&typeof j.basis==='string'&&Number.isInteger(j.revision)&&j.revision>0&&note(j.notes??'')&&(j.presence==='Both'?(j.strength===null||strengths.includes(j.strength)):j.strength===undefined),'The saved issue judgment is invalid.');
 for(const [id,text] of Object.entries(state.issueNotes))legacy.invariant(issueFor(content,id)&&note(text),'The saved issue notes are invalid.');
 for(const [id,c] of Object.entries(state.issueCompleted))legacy.invariant(issueFor(content,id)&&object(c)&&typeof c.basis==='string'&&presences.includes(c.presence)&&(c.presence==='Both'?strengths.includes(c.strength):c.strength===null),'The saved issue completion is invalid.');
 return state;
}
export function pageComplete(content,state,id){
 if(!issueFor(content,id))return legacy.pageComplete(content,state,id);
 const saved=state.issueCompleted[id],result=issueResult(content,state,id);
 return !!saved&&!result.stale&&result.origin==='direct'&&saved.basis===issueBasis(content,state,id)&&saved.presence===result.presence&&(result.presence!=='Both'||strengths.includes(result.strength)&&saved.strength===result.strength);
}
export function valueResult(content,state,value){
 const issues=content.issue_review.issues.filter(i=>i.value_id===value),results=issues.map(i=>({id:i.id,...issueResult(content,state,i.id)})),unresolved=results.filter(r=>r.presence==='Pending').map(r=>r.id),result={unresolved};
 for(const direction of ['support','oppose'])result[direction]=results.some(r=>sides(r.presence).includes(direction))?'yes':unresolved.length?null:'no';
 result.outcome=result.support==='yes'&&result.oppose==='yes'?'Both':result.support===null||result.oppose===null?'Pending':result.support==='yes'?'Support':result.oppose==='yes'?'Oppose':'Neither';
 return result;
}
export function comparisonBasis(content,state,value){
 return legacy.stable(content.issue_review.issues.filter(i=>i.value_id===value).map(i=>[i.id,issueBasis(content,state,i.id),issueResult(content,state,i.id).presence,state.issueJudgments[i.id]?.revision??0]));
}
export function strengthResult(content,state,value){
 const comparison=state.comparisons[value];
 return valueResult(content,state,value).outcome==='Both'&&comparison?.basis===comparisonBasis(content,state,value)?comparison.answer:'Pending';
}
export function editState(content,state,action,now=new Date().toISOString()){
 const issue=action.id&&issueFor(content,action.id),value=content.values.find(v=>v.id===action.value);
 if(!['issueJudgment','issueNotes','issueComplete','comparison','summary'].includes(action.type)){
  legacy.invariant(action.type!=='flag','Issue review has no dependency flags.');
  if(['judgment','notes','complete','flag'].includes(action.type))legacy.invariant(legacy.judgedClaims(content).some(c=>c.id===action.id),'Issue review has no per-argument judgment controls.');
  return {...legacy.editState(content,state,action,now),issueSource:sourceIdentity(content)};
 }
 const next=structuredClone(state);next.release=releaseMetadata(content);next.issueSource=sourceIdentity(content);next.procedureRevision=content.procedure.revision;next.eventRevision++;
 if(action.type==='issueJudgment'){
  legacy.invariant(issue,'Unknown issue.');legacy.invariant(presences.includes(action.presence),'Choose an answer for this issue.');
  legacy.invariant(note(action.notes??''),'Notes must be at most 2,000 characters.');
  const availability=availableSides(content,next,issue);
  legacy.invariant(sides(action.presence).every(side=>availability[side].available),'You cannot choose a side that has no argument with a path that can give a reason. Review the shared claims if your view of one has changed.');
  if(action.presence==='Both')legacy.invariant(action.strength===undefined||action.strength===null||strengths.includes(action.strength),'Invalid issue strength.');
  else legacy.invariant(action.strength===undefined,'The stronger-reason question is only available when you choose Both.');
  next.issueJudgments[issue.id]={presence:action.presence,...(action.presence==='Both'?{strength:action.strength??null}:{}),notes:action.notes??'',basis:issueBasis(content,next,issue.id),revision:next.eventRevision,at:now,release:releaseMetadata(content)};
 }else if(action.type==='issueNotes'){
  legacy.invariant(issue&&note(action.notes),'Issue notes must be at most 2,000 characters.');next.issueNotes[issue.id]=action.notes;
 }else if(action.type==='issueComplete'){
  legacy.invariant(issue,'Unknown issue.');const result=issueResult(content,next,issue.id);
  legacy.invariant(result.origin==='direct'&&!result.stale,'Choose a current answer for this issue. You can choose Pending if you cannot decide yet.');
  legacy.invariant(result.presence!=='Both'||strengths.includes(result.strength),'Choose which side has the stronger reason on this issue. You can choose Pending if you have no justified comparison.');
  next.issueCompleted[issue.id]={at:now,basis:issueBasis(content,next,issue.id),presence:result.presence,strength:result.strength};
 }else if(action.type==='comparison'){
  legacy.invariant(value&&valueResult(content,next,value.id).outcome==='Both','The value comparison is only available when both directions have a substantiated reason.');
  legacy.invariant(strengths.includes(action.answer),'Invalid comparison.');legacy.invariant(note(action.notes??''),'Comparison notes must be at most 2,000 characters.');
  next.comparisons[value.id]={answer:action.answer,notes:action.notes??'',basis:comparisonBasis(content,next,value.id),at:now,release:releaseMetadata(content)};
 }else{
  legacy.invariant(value,'Unknown value.');const result=valueResult(content,next,value.id);
  legacy.invariant(content.issue_review.issues.filter(i=>i.value_id===value.id).every(i=>pageComplete(content,next,i.id)),'Review every issue before completing the value.');
  if(result.outcome==='Both')legacy.invariant(next.comparisons[value.id]?.basis===comparisonBasis(content,next,value.id),'Choose a comparison, including Pending if needed.');
  next.summaryCompleted[value.id]=comparisonBasis(content,next,value.id);
 }
 next.history.push({action:structuredClone(action),at:now,release:releaseMetadata(content)});return next;
}
export const codingOrder=(content,state)=>state.order;
export const currentCursor=(content,state)=>state.cursor;
export function nextCursor(content,state,direction){legacy.invariant([1,-1].includes(direction),'Invalid navigation direction.');const cursor=state.cursor+direction;return cursor>=0&&cursor<state.order.length?cursor:-1;}
export function progress(content,state){return {claims:legacy.judgedClaims(content).filter(c=>legacy.pageComplete(content,state,c.id)).length,totalClaims:legacy.judgedClaims(content).length,issues:content.issue_review.issues.filter(i=>pageComplete(content,state,i.id)).length,totalIssues:content.issue_review.issues.length};}
export function includedArguments(content,state,value){return content.issue_review.issues.filter(i=>i.value_id===value).flatMap(issue=>members(content,issue).filter(a=>sides(issueResult(content,state,issue.id).presence).includes(a.direction)&&argumentRoutes(content,state,a).some(p=>!['blocked','unresolved'].includes(p.status))).map(a=>a.id));}
export function csvExport(content,state){
 const keys=['content_id','procedure_id','mapping_id','rendered_id'],columns=['id','type','value','member_argument_ids','recorded_presence','presence','recorded_issue_strength','issue_strength','recorded_shared_claim_answer','shared_claim_answer','recorded_value_strength','value_strength','origin','needs_reassessment','page_complete','notes','basis','recorded_basis','judgment_revision','judgment_mapping_id','judgment_rendered_id','content_version','procedure_revision','recorded_procedure_revision','source_content_id','source_sha256','issue_map_sha256','issue_copy_sha256',...keys.map(key=>`loaded_${key}`),...keys.map(key=>`recorded_${key}`)],rows=[];
 const add=(row,saved)=>rows.push({...row,recorded_basis:saved?.basis,judgment_revision:saved?.revision,judgment_mapping_id:saved?.release?.mapping_id,judgment_rendered_id:saved?.release?.rendered_id,content_version:content.version,procedure_revision:content.procedure.revision,recorded_procedure_revision:state.procedureRevision,source_content_id:content.issue_review.source_content_id,source_sha256:content.issue_review.source_sha256,issue_map_sha256:content.issue_review.map_sha256,issue_copy_sha256:content.issue_review.copy_sha256,...Object.fromEntries(keys.flatMap(key=>[[`loaded_${key}`,releaseMetadata(content)[key]],[`recorded_${key}`,state.release[key]]]))});
 for(const claim of legacy.judgedClaims(content)){const saved=state.judgments[claim.id],e=legacy.effective(content,state,claim.id);add({id:claim.id,type:'shared_claim',recorded_shared_claim_answer:saved?.answer,shared_claim_answer:e.answer,origin:e.origin,needs_reassessment:e.stale,page_complete:legacy.pageComplete(content,state,claim.id),notes:state.nodeNotes[claim.id]??saved?.notes??'',basis:legacy.basis(content,state,claim.id)},saved);}
 for(const issue of content.issue_review.issues){const saved=state.issueJudgments[issue.id],result=issueResult(content,state,issue.id);add({id:issue.id,type:'issue',value:issue.value_id,member_argument_ids:issue.argument_ids.join('|'),recorded_presence:saved?.presence,presence:result.presence,recorded_issue_strength:saved?.strength,issue_strength:result.strength,origin:result.origin,needs_reassessment:result.stale,page_complete:pageComplete(content,state,issue.id),notes:state.issueNotes[issue.id]??saved?.notes??'',basis:issueBasis(content,state,issue.id)},saved);}
 for(const value of content.values){const saved=state.comparisons[value.id],currentBasis=comparisonBasis(content,state,value.id),result=valueResult(content,state,value.id);add({id:`summary:${value.id}`,type:'issue_value_summary',value:value.id,presence:result.outcome,recorded_value_strength:saved?.answer,value_strength:result.outcome==='Both'?strengthResult(content,state,value.id):'',origin:'issue_summary',needs_reassessment:!!saved&&saved.basis!==currentBasis,page_complete:state.summaryCompleted[value.id]===currentBasis,notes:state.comparisonNotes[value.id]??saved?.notes??'',basis:currentBasis},saved);for(const direction of ['support','oppose'])if(state.omissions[`${value.id}:${direction}`])add({id:`omission:${value.id}:${direction}`,type:'omitted_reason',value:value.id,notes:state.omissions[`${value.id}:${direction}`].text});}
 const quote=value=>'"'+String(value??'').replaceAll('"','""')+'"';return [columns,...rows.map(row=>columns.map(key=>row[key]))].map(row=>row.map(quote).join(',')).join('\r\n');
}
