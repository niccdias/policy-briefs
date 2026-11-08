import {judgedClaims,billFor,claimUsers,backgroundFact,effective,pageComplete as claimComplete,claimAncestors} from './core.mjs';
import {issueResult,pageComplete,valueResult,strengthResult,comparisonBasis,includedArguments,members} from './issues.mjs';
import {readingHTML,displayBackground,strengthEvidence} from './evidence.mjs';

const normalize=text=>text.normalize('NFKC').replace(/\s+/g,' ').trim().toLowerCase();
export function makeIssueReviewIndex(content,plainText){
 const values=new Map(content.values.map(v=>[v.id,v]));
 const argumentHTML=argument=>[argument.title,argument.background_html,readingHTML(content,argument,'support'),readingHTML(content,argument,'response'),argument.notes_html,argument.original?.pro_html,argument.original?.con_html,argument.original?.notes_html].filter(Boolean).join(' ');
 const rows=judgedClaims(content).map(claim=>({id:claim.id,type:'claim',bill:billFor(content,claim),valueIds:[...new Set(claimUsers(content,claim.id).map(a=>a.value_id))],title:claim.title,html:[claim.statement,claim.scope_html,displayBackground(claim),readingHTML(content,claim,'support'),readingHTML(content,claim,'response')].filter(Boolean).join(' ')}));
 for(const issue of content.issue_review.issues){
  const argumentsForIssue=members(content,issue),ancestors=[...new Set(argumentsForIssue.flatMap(a=>claimAncestors(content,a.id)))];
  const context=ancestors.map(id=>{const claim=content.claims.find(c=>c.id===id),fact=backgroundFact(content,id);return [claim.title,fact?.statement??claim.statement,fact?.scope_html??claim.scope_html,readingHTML(content,claim,'support'),readingHTML(content,claim,'response')].join(' ');}).join(' ');
  rows.push({id:issue.id,type:'issue',bill:billFor(content,argumentsForIssue[0]),valueIds:[issue.value_id],title:issue.title,html:[issue.introduction,...argumentsForIssue.map(argumentHTML),context,...strengthEvidence(content,issue.argument_ids).map(item=>item.html)].join(' ')});
 }
 for(const value of content.values){
  const argumentsForValue=content.arguments.filter(a=>a.value_id===value.id);
  rows.push({id:`summary:${value.id}`,type:'summary',bill:billFor(content,value),valueIds:[value.id],title:value.name,html:content.issue_review.issues.filter(i=>i.value_id===value.id).map(i=>[i.title,i.introduction,...members(content,i).map(argumentHTML)].join(' ')).join(' '),strengthEvidence:strengthEvidence(content,argumentsForValue.map(a=>a.id)).map(item=>({arguments:item.arguments,text:normalize(plainText(item.html))}))});
 }
 return new Map(rows.map(({html,...row})=>[row.id,{...row,direction:'',bill:{...row.bill,id:row.bill.id??row.bill.bill},search:normalize([row.id,row.title,row.type,row.bill.bill,row.bill.title,...row.valueIds.map(id=>values.get(id).name),plainText(html)].join(' '))}]));
}
export function issueReviewRows(content,state,index){
 return state.order.filter(id=>index.has(id)).map(id=>{
  const row=index.get(id),summary=row.type==='summary',issue=row.type==='issue',value=row.valueIds[0],saved=summary?state.comparisons[value]:issue?state.issueJudgments[id]:state.judgments[id],statuses=[];
  const notes=summary?[state.comparisonNotes[value]??saved?.notes??'',...['support','oppose'].map(d=>state.omissions[`${value}:${d}`]?.text??'')].join(' '):issue?state.issueNotes[id]??saved?.notes??'':state.nodeNotes[id]??saved?.notes??'';
  const complete=summary?state.summaryCompleted[value]===comparisonBasis(content,state,value):issue?pageComplete(content,state,id):claimComplete(content,state,id);
  const worked=summary?!!(saved||Object.hasOwn(state.summaryCompleted,value)||Object.hasOwn(state.comparisonNotes,value)||['support','oppose'].some(d=>Object.hasOwn(state.omissions,`${value}:${d}`))):issue?!!(saved||state.issueCompleted[id]||Object.hasOwn(state.issueNotes,id)):!!(saved||state.completed[id]||Object.hasOwn(state.nodeNotes,id));
  let answer,strength=null,origin,stale;
  if(summary){answer=valueResult(content,state,value).outcome;origin='summary';stale=!!(saved&&saved.basis!==comparisonBasis(content,state,value)||Object.hasOwn(state.summaryCompleted,value)&&!complete);if(answer==='Both')strength=strengthResult(content,state,value);statuses.push(answer);}
  else if(issue){const result=issueResult(content,state,id);answer=result.presence;strength=result.strength;origin=result.origin;stale=result.stale;statuses.push(answer);if(origin==='unanswered')statuses.push('unanswered');}
  else{const result=effective(content,state,id);({answer,origin,stale}=result);if(origin==='direct')statuses.push(answer);if(origin==='unanswered')statuses.push('unanswered');if(origin==='derived')statuses.push('derived');}
  if(strength==='Pending'||answer==='Both'&&strength===null)statuses.push('strengthPending');
  if(stale)statuses.push('reassess');if(origin==='unresolved')statuses.push('unresolved');
  statuses.push(complete?'complete':'needsReview');if(notes.trim())statuses.push('hasNotes');
  const strengthText=summary&&answer==='Both'?row.strengthEvidence.filter(item=>item.arguments.some(id=>includedArguments(content,state,value).includes(id))).map(item=>item.text).join(' '):'';
  return {...row,answer,strength,origin,stale,earlierAnswer:summary?saved?.basis===comparisonBasis(content,state,value)?undefined:saved?.answer:issue?saved?.presence:saved?.answer,complete,worked,notes,statuses,search:[row.search,normalize(notes),strengthText].join(' ')};
 });
}
