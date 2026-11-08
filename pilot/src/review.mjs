import {judgedClaims,billFor,claimUsers,backgroundFact,pageComplete,effective,valueResult,strengthResult,comparisonBasis} from './core.mjs';
import {readingHTML,displayBackground,strengthEvidence} from './evidence.mjs';

export const reviewFilters={scope:'worked',query:'',bill:'',value:'',type:'',status:''};
export const reviewStatuses=['yes','no','derived','reassess','unresolved','unanswered','Pending','Support','Oppose','Both','Neither','strengthPending','complete','needsReview','hasNotes'];
export const newReviewView=()=>({open:false,target:null,filters:{...reviewFilters},scroll:0,focus:null});
export const reviewKey=(uid,session)=>`policy-review:${uid}:${session}`;
const normalize=text=>text.normalize('NFKC').replace(/\s+/g,' ').trim().toLowerCase();

// Index only the current displayed wording, once; personal notes stay in memory.
export function makeReviewIndex(content,plainText){
 const values=new Map(content.values.map(v=>[v.id,v]));
 const rows=[...judgedClaims(content),...content.arguments].map(node=>{
  const valueIds=node.value_id?[node.value_id]:[...new Set(claimUsers(content,node.id).map(a=>a.value_id))];
  return {id:node.id,type:node.value_id?'argument':'claim',bill:billFor(content,node),valueIds,title:node.title,direction:node.direction??'',html:[node.statement,node.scope_html,node.value_id?node.background_html:displayBackground(node),readingHTML(content,node,'support'),readingHTML(content,node,'response')].filter(Boolean).join(' ')};
 });
 for(const value of content.values){
  const argumentsForValue=content.arguments.filter(a=>a.value_id===value.id);
  rows.push({id:`summary:${value.id}`,type:'summary',bill:billFor(content,value),valueIds:[value.id],title:value.name,direction:'',html:argumentsForValue.map(a=>[a.title,readingHTML(content,a,'support'),readingHTML(content,a,'response')].join(' ')).join(' '),strengthEvidence:strengthEvidence(content,argumentsForValue.map(a=>a.id)).map(item=>({arguments:item.arguments,text:normalize(plainText(item.html))}))});
 }
 return new Map(rows.map(({html,...row})=>[row.id,{...row,bill:{...row.bill,id:row.bill.id??row.bill.bill},search:normalize([row.id,row.title,row.type,row.bill.bill,row.bill.title,row.direction,...row.valueIds.map(id=>values.get(id).name),plainText(html)].join(' '))}]));
}

export function reviewRows(content,state,index){
 return state.order.filter(id=>index.has(id)).map(id=>{
  const row=index.get(id),statuses=[],summary=row.type==='summary',value=row.valueIds[0];
  const saved=summary?state.comparisons[value]:state.judgments[id];
  const notes=summary?[state.comparisonNotes[value]??saved?.notes??'',...['support','oppose'].map(d=>state.omissions[`${value}:${d}`]?.text??'')].join(' '):state.nodeNotes[id]??saved?.notes??'';
  const summaryBasis=summary?comparisonBasis(content,state,value):null;
  const complete=summary?state.summaryCompleted[value]===summaryBasis:pageComplete(content,state,id);
  const worked=summary?!!(saved||Object.hasOwn(state.summaryCompleted,value)||Object.hasOwn(state.comparisonNotes,value)||['support','oppose'].some(d=>Object.hasOwn(state.omissions,`${value}:${d}`))):!!(saved||state.completed[id]||Object.hasOwn(state.nodeNotes,id));
  let answer,origin,stale,strength=null;
  if(summary){
   answer=valueResult(content,state,value).outcome;origin='summary';
   stale=!!(saved&&saved.basis!==summaryBasis||Object.hasOwn(state.summaryCompleted,value)&&!complete);
   if(answer==='Both')strength=strengthResult(content,state,value);
   statuses.push(answer);if(strength==='Pending')statuses.push('strengthPending');
  }else{
   const result=effective(content,state,id);({answer,origin,stale}=result);
   if(origin==='direct')statuses.push(answer);else if(origin==='unanswered')statuses.push('unanswered');
   if(origin==='derived')statuses.push('derived');
   if(origin==='unresolved')statuses.push('unresolved');
  }
  if(stale&&origin!=='derived')statuses.push('reassess');
  statuses.push(complete?'complete':'needsReview');if(notes.trim())statuses.push('hasNotes');
  const strengthText=summary&&answer==='Both'?row.strengthEvidence.filter(item=>item.arguments.some(id=>effective(content,state,id).answer==='yes')).map(item=>item.text).join(' '):'';
  return {...row,answer,origin,stale,strength,earlierAnswer:summary&&saved?.basis===summaryBasis?undefined:saved?.answer,complete,worked,notes,statuses,search:[row.search,normalize(notes),strengthText].join(' ')};
 });
}

export function filterReviewRows(rows,filters){
 const words=normalize(filters.query).split(' ').filter(Boolean);
 return rows.filter(row=>(filters.scope==='all'||row.worked)&&(!filters.bill||row.bill.id===filters.bill)&&(!filters.value||row.valueIds.includes(filters.value))&&(!filters.type||row.type===filters.type)&&(!filters.status||row.statuses.includes(filters.status))&&words.every(word=>row.search.includes(word)));
}

export function readReviewView(raw,content,state){
 if(raw===null)return newReviewView();
 const view=JSON.parse(raw),f=view?.filters;
 const decisions=new Set([...judgedClaims(content),...content.arguments].map(n=>n.id).concat(content.values.map(v=>`summary:${v.id}`)));
 const validTarget=id=>id===null||typeof id==='string'&&(decisions.has(id)&&state.order.includes(id)||!!backgroundFact(content,id));
 if(typeof view.open!=='boolean'||!validTarget(view.target)||!validTarget(view.focus)||!Number.isFinite(view.scroll)||view.scroll<0||!f||!['worked','all'].includes(f.scope)||typeof f.query!=='string'||f.query.length>2000||!['',...((content.bills??[content.bill]).map(b=>b.id??b.bill))].includes(f.bill)||!['',...content.values.map(v=>v.id)].includes(f.value)||!['','argument','claim','summary'].includes(f.type)||!['',...reviewStatuses].includes(f.status))throw new Error('Invalid review view.');
 return {open:view.open,target:view.target,filters:Object.fromEntries(Object.keys(reviewFilters).map(key=>[key,f[key]])),scroll:view.scroll,focus:view.focus};
}
