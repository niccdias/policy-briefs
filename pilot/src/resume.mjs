import {invariant,validateContent,validateState,newState,makeOrder,nodes,basis,comparisonBasis,pageComplete,backgroundFact} from './core.mjs';

// Copy a snapshot into the combined workflow. Earlier sessions and immutable
// revisions remain in their original documents; nothing writes back to them.
export function importResponses(content,sources,seed,now=new Date().toISOString()){
 const next=newState(content,seed),sourceSeeds={};
 for(const source of sources){
  const spec=content.workflow.resume_sources.find(s=>s.version===source.content.version);
  invariant(spec,'An earlier response belongs to an unrecognized release.');
  validateState(source.content,source.state);sourceSeeds[spec.version]=source.state.seed;
  for(const key of ['judgments','nodeNotes','completed','flags','comparisons','comparisonNotes','omissions','summaryCompleted']){
   for(const [id,value] of Object.entries(source.state[key])){
    invariant(!Object.hasOwn(next[key],id),`Earlier responses overlap at ${id}; no answers were combined.`);
    next[key][id]=structuredClone(value);
   }
  }
 }
 next.sourceSeeds=sourceSeeds;next.order=makeOrder(content,seed,sourceSeeds);
 const stale=(version,old)=>`earlier-unreassessed:${version}:${old}`;
 for(const source of sources){
  for(const key of ['judgments','completed'])for(const [id,value] of Object.entries(source.state[key])){
   next[key][id].basis=value.basis===basis(source.content,source.state,id)?basis(content,next,id):stale(source.content.version,value.basis);
  }
  for(const [id,value] of Object.entries(source.state.comparisons))next.comparisons[id].basis=value.basis===comparisonBasis(source.content,source.state,id)?comparisonBasis(content,next,id):stale(source.content.version,value.basis);
  for(const [id,value] of Object.entries(source.state.summaryCompleted))next.summaryCompleted[id]=value===comparisonBasis(source.content,source.state,id)?comparisonBasis(content,next,id):stale(source.content.version,value);
 }
 const byId=new Map(nodes(content).map(n=>[n.id,n]));
 next.cursor=next.order.findIndex(id=>{
  if(backgroundFact(content,id))return false;
  if(id.startsWith('bill:'))return !Object.keys(next.judgments).some(key=>byId.get(key)?.bill_id===id.slice(5));
  if(id.startsWith('summary:')){const value=id.slice(8);return next.summaryCompleted[value]!==comparisonBasis(content,next,value);}
  return !pageComplete(content,next,id);
 });
 if(next.cursor<0)next.cursor=next.order.length-1;
 next.eventRevision=Math.max(0,...sources.map(s=>s.state.eventRevision))+1;
 next.migration={at:now,sources:sources.map(s=>({version:s.content.version,session:s.session,serverRevision:s.revision,includesUnsentDraft:s.draft,seed:s.state.seed,order:[...s.state.order],cursor:s.state.cursor,eventRevision:s.state.eventRevision})),judgments:Object.keys(next.judgments).length};
 next.history=[{action:{type:'import',sources:next.migration.sources.map(({order,...s})=>s)},at:now}];
 return validateState(content,next);
}

export async function resumePrevious(content,assignment,kind,uid,service,readDraft,seed,fetchContent=async spec=>{
 const response=await fetch(spec.url,{cache:'no-store'});invariant(response.ok,'An earlier frozen release could not load. Retry before starting a combined response.');
 const bytes=await response.arrayBuffer(),hash=Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',bytes)),b=>b.toString(16).padStart(2,'0')).join('');
 invariant(hash===spec.sha256,'An earlier release changed. No answers were imported; contact the project owner.');
 return JSON.parse(new TextDecoder().decode(bytes));
}){
 const sources=[];
 for(const spec of content.workflow.resume_sources){
  if(!assignment.versions.includes(spec.version))continue;
  const session=`${spec.version}--${kind}`,remote=await service.load(uid,session),draft=readDraft(uid,session);
  if(!remote&&!draft)continue;
  invariant(!remote||(remote.version===spec.version&&remote.kind===kind),'An earlier saved record has a different release or record kind. No answers were imported.');
  invariant(!draft||draft.baseRevision===(remote?.revision??0),'An earlier session has a conflicting unsent draft. Both versions remain preserved; resolve that conflict in the earlier session before importing.');
  const sourceContent=await fetchContent(spec);validateContent(sourceContent);
  invariant(sourceContent.version===spec.version,'The earlier response does not match its frozen content release.');
  sources.push({content:sourceContent,state:draft?.state??JSON.parse(remote.payload),session,revision:remote?.revision??0,draft:!!draft});
 }
 return sources.length?importResponses(content,sources,seed):newState(content,seed);
}
