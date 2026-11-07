import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {assembleAllBills} from '../assemble-all-bills.mjs';
import {importResponses,resumePrevious} from '../src/resume.mjs';
import {validateContent,validateState,newState,makeOrder,nodes,editState,billFor,judgedClaims,codingOrder,effective,pageComplete,valueResult,strengthResult} from '../src/core.mjs';
import {readingHTML,strengthEvidence} from '../src/evidence.mjs';
const bytes=await Promise.all(['content.json','expansion/content.json'].map(p=>readFile(new URL(`../${p}`,import.meta.url))));
const originals=bytes.map(b=>JSON.parse(b)),c=assembleAllBills(...originals,bytes.map(b=>createHash('sha256').update(b).digest('hex')));
const stamp='2026-11-07T18:00:00.000Z';
function source(content,seed){
 let state=newState(content,seed);
 for(const claim of judgedClaims(content))state=editState(content,state,{type:'judgment',id:claim.id,answer:'yes',notes:''},stamp);
 const value=content.values.find(v=>['support','oppose'].every(d=>content.arguments.some(a=>a.value_id===v.id&&a.direction===d)));
 for(const a of content.arguments.filter(a=>a.value_id===value.id)){
  state=editState(content,state,{type:'judgment',id:a.id,answer:'yes',notes:'QA only — retain this note.'},stamp);
  state=editState(content,state,{type:'complete',id:a.id},stamp);
 }
 state=editState(content,state,{type:'comparison',value:value.id,answer:'support',notes:'QA only — comparison.'},stamp);
 state=editState(content,state,{type:'summary',value:value.id},stamp);
 state=editState(content,state,{type:'omission',value:value.id,direction:'oppose',text:'QA only — omitted reason.'},stamp);
 state=editState(content,state,{type:'notes',id:content.arguments[0].id,notes:''},stamp);
 return {content,state,revision:7,session:`${content.version}--qa`,draft:false};
}
const sources=originals.map((content,i)=>source(content,41+i));

test('one eight-bill content bank preserves every argument, shared item and evidence attachment exactly',()=>{
 assert.ok(validateContent(c));assert.equal(c.bills.length,8);assert.equal(c.arguments.length,503);assert.equal(c.catalog.length,567);
 assert.equal(c.values.length,48);assert.equal(judgedClaims(c).length,24);assert.equal(c.procedure.background.length,128);
 const s=newState(c,1);assert.equal(codingOrder(c,s).length,583);assert.equal(new Set(s.order).size,711);
 for(const original of originals)for(const node of nodes(original)){
  const combined=nodes(c).find(n=>n.id===node.id);
  for(const side of ['support','response'])assert.equal(readingHTML(c,combined,side),readingHTML(original,node,side));
  assert.deepEqual(c.evidence_placement.nodes[node.id],original.evidence_placement.nodes[node.id]);
  assert.deepEqual(combined.paths??combined.prerequisite_paths,node.paths??node.prerequisite_paths);
  if(node.value_id)assert.deepEqual(strengthEvidence(c,[node.id]),strengthEvidence(original,[node.id]));
 }
});

test('import carries both earlier runs into one response without changing answers, notes, outcomes or within-bill order',()=>{
 const frozen=JSON.stringify(sources),s=importResponses(c,sources,600,stamp);
 assert.ok(validateState(c,JSON.parse(JSON.stringify(s))));assert.equal(JSON.stringify(sources),frozen);
 assert.equal(s.order.length,711);assert.equal(s.migration.sources.length,2);
 for(const source of sources){
  for(const key of ['nodeNotes','flags','comparisonNotes','omissions'])for(const [id,v] of Object.entries(source.state[key]))assert.deepEqual(s[key][id],v);
  for(const [id,j] of Object.entries(source.state.judgments)){
   assert.equal(s.judgments[id].answer,j.answer);assert.equal(s.judgments[id].notes,j.notes);assert.equal(s.judgments[id].at,j.at);assert.equal(s.judgments[id].revision,j.revision);
  }
  for(const node of nodes(source.content)){
   assert.deepEqual(effective(c,s,node.id),effective(source.content,source.state,node.id),node.id);
   assert.equal(pageComplete(c,s,node.id),pageComplete(source.content,source.state,node.id),node.id);
  }
  for(const v of source.content.values){assert.deepEqual(valueResult(c,s,v.id),valueResult(source.content,source.state,v.id));assert.equal(strengthResult(c,s,v.id),strengthResult(source.content,source.state,v.id));}
  const spec=c.workflow.resume_sources.find(x=>x.version===source.content.version);
  for(const billId of spec.bill_ids)assert.deepEqual(s.order.filter(id=>billFor(c,id).id===billId&&!id.startsWith('bill:')),source.state.order.filter(id=>billFor(c,id).id===billId&&!id.startsWith('bill:')));
 }
 const altered=structuredClone(s);[altered.order[0],altered.order[1]]=[altered.order[1],altered.order[0]];assert.throws(()=>validateState(c,altered),/randomized order/);
 const unknown=structuredClone(s);unknown.sourceSeeds.unknown=1;assert.throws(()=>validateState(c,unknown),/invalid earlier release/);
 assert.deepEqual(s.order,makeOrder(c,600,s.sourceSeeds));
});

test('import preserves stale judgments and comparisons, derived No, and restoration after premise edits',()=>{
 const source=structuredClone(sources[0]),claim=judgedClaims(source.content)[0];
 source.state=editState(source.content,source.state,{type:'judgment',id:claim.id,answer:'no'},stamp);
 let s=importResponses(c,[source],601,stamp);
 for(const n of nodes(source.content))assert.deepEqual(effective(c,s,n.id),effective(source.content,source.state,n.id),n.id);
 for(const v of source.content.values)assert.equal(strengthResult(c,s,v.id),strengthResult(source.content,source.state,v.id));
 s=editState(c,s,{type:'judgment',id:claim.id,answer:'yes'},stamp);
 assert.ok(validateState(c,s));
 assert.ok(Object.keys(source.state.judgments).every(id=>s.judgments[id]?.answer));
 for(const n of originals[1].arguments)assert.equal(effective(c,s,n.id).answer,null);
});

test('resume reads only the same reviewer and record kind, retains unsent drafts, and refuses unresolved conflicts',async()=>{
 const assignment={versions:originals.map(x=>x.version)},loads=[];
 const service={load:async(uid,id)=>{loads.push([uid,id]);const source=sources.find(x=>id===x.session);return source?{version:source.content.version,kind:'qa',revision:source.revision,payload:JSON.stringify(source.state)}:null;}};
 const fetchContent=async spec=>originals.find(x=>x.version===spec.version);
 const draft=structuredClone(sources[0].state);draft.nodeNotes[originals[0].arguments[0].id]='QA only — unsent note.';
 const readDraft=(_uid,id)=>id===sources[0].session?{baseRevision:7,state:draft}:null;
 const s=await resumePrevious(c,assignment,'qa','qa-reviewer',service,readDraft,600,fetchContent);
 assert.equal(s.nodeNotes[originals[0].arguments[0].id],draft.nodeNotes[originals[0].arguments[0].id]);
 assert.ok(s.migration.sources[0].includesUnsentDraft);assert.ok(loads.every(([uid,id])=>uid==='qa-reviewer'&&id.endsWith('--qa')));
 await assert.rejects(resumePrevious(c,assignment,'qa','qa-reviewer',service,()=>({baseRevision:6,state:draft}),600,fetchContent),/conflicting unsent draft/);
 const empty=await resumePrevious(c,assignment,'research','qa-reviewer',service,()=>null,600,fetchContent);
 assert.deepEqual(empty,newState(c,600));
 assert.equal(JSON.stringify(sources[0].state.nodeNotes).includes('unsent note'),false);
});
