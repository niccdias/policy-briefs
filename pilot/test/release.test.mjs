import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {renderValue,verifyValue,contentParts} from '../public-view.mjs';
import {releaseMetadata,recordedRelease,assertLoadedRelease} from '../src/release.mjs';
import {hiddenUsageSentences,displayBackground} from '../src/evidence.mjs';
import {validateContent,newState,editState,effective,recordMappingDisposition,comparisonBasis,strengthResult,csvExport,validateState} from '../src/core.mjs';
const content=JSON.parse(await readFile(new URL('../release/content.json',import.meta.url)));
test('the two omitted usage sentences still match their frozen text exactly',()=>{
 for(const sentence of hiddenUsageSentences){
  const matches=content.claims.filter(c=>c.background_html?.includes(sentence));
  assert.equal(matches.length,1);assert.ok(!displayBackground(matches[0]).includes(sentence));
 }
});
test('48 public value pages preserve every approved argument, response, note and shared premise',()=>{
 let count=0;for(const value of content.values){const text=renderValue(content,value),row=verifyValue(content,value,text);count+=row.arguments;assert.ok(Object.keys(contentParts(content,value)).length);}
 assert.equal(count,503);const v=content.values[0],text=renderValue(content,v),a=content.arguments.find(a=>a.value_id===v.id);
 const body=contentParts(content,v)[`${a.id}:support`],mutated=text.replace(body,'<p>Changed content</p>');assert.notEqual(mutated,text);
 assert.throws(()=>verifyValue(content,v,mutated),/parity/);
 assert.throws(()=>verifyValue(content,v,text+text),/Duplicate/);
});
test('existing anchors and retired IDs remain accessible',()=>{
 const v=content.values[0],text=renderValue(content,v,'---\ntitle: "Existing title"\n---\n<span id="old-anchor"></span>');
 assert.ok(text.startsWith('---\ntitle: "Existing title"'));assert.ok(text.includes('id="old-anchor"'));assert.doesNotMatch(text,/Main effect/);
});
const fixture=()=>({schema_version:1,version:'frozen',claims:[{id:'C',prerequisite_paths:[{id:'cp',requires:[]}]}],arguments:[{id:'A',value_id:'V',direction:'support',paths:[{id:'a',requires:['C']}]},{id:'B',value_id:'V',direction:'oppose',paths:[{id:'b',requires:['C']}]}],values:[{id:'V'}],release:{content_id:'content-1',mapping_id:'map-1',procedure_id:'procedure-1',rendered_id:'render-1',node_revisions:{}}});
const vote=(c,s,id,answer)=>editState(c,s,{type:'judgment',id,answer});
test('loaded browser IDs are recorded; cached app/content mismatch blocks coding',()=>{
 const c=fixture(),loaded=releaseMetadata(c);let s=newState(c,5);s=vote(c,s,'C','yes');
 assert.equal(s.judgments.C.release.rendered_id,'render-1');assert.equal(s.history[0].release.content_id,'content-1');
 assert.doesNotThrow(()=>assertLoadedRelease(c,loaded));assert.throws(()=>assertLoadedRelease({...c,release:{...c.release,rendered_id:'render-2'}},loaded),/Reload this page/);
});
test('cosmetic edits preserve answers, order, history, bases and comparisons',()=>{
 const c=fixture();let s=newState(c,12);for(const id of ['C','A','B'])s=vote(c,s,id,'yes');s=editState(c,s,{type:'comparison',value:'V',answer:'support'});
 const before=JSON.stringify(s),changed=structuredClone(c);changed.arguments[0].title='A clearer heading';changed.release.content_id='content-2';changed.release.rendered_id='render-2';
 assert.ok(validateState(changed,s));assert.equal(effective(changed,s,'A').answer,'yes');assert.equal(strengthResult(changed,s,'V'),'support');assert.equal(JSON.stringify(s),before);
});
test('judgment-relevant revision reopens only affected items and invalidates comparison',()=>{
 const c=fixture();let s=newState(c,12);for(const id of ['C','A','B'])s=vote(c,s,id,'yes');s=editState(c,s,{type:'comparison',value:'V',answer:'support'});
 const changed=structuredClone(c);changed.release.node_revisions={A:'meaning-2'};
 assert.equal(effective(changed,s,'A').origin,'reassess');assert.equal(effective(changed,s,'B').answer,'yes');assert.equal(s.judgments.A.answer,'yes');assert.equal(strengthResult(changed,s,'V'),'Pending');
});
test('mapping corrections recompute all-blocked and newly viable routes; unresolved prevents final No',()=>{
 const c=fixture();let s=vote(c,newState(c,7),'C','no');s=editState(c,s,{type:'notes',id:'A',notes:'A narrower route may remain.'});assert.equal(effective(c,s,'A').origin,'derived');
 const frozen=JSON.stringify(s),changed=structuredClone(c);changed.arguments[0].paths.push({id:'local',requires:[]});changed.release.node_revisions={A:'map-2'};
 assert.ok(validateContent(changed));assert.equal(effective(changed,s,'A').answer,null);assert.equal(JSON.stringify(s),frozen);
 const d=recordMappingDisposition(c,s,{id:'A',status:'Unresolved',note:'Scope requires a decision.',coordinator:'QA coordinator'});
 assert.equal(effective(c,d,'A').answer,null);assert.equal(effective(c,d,'A').origin,'unresolved');assert.equal(d.judgments.C.answer,'no');
 const continued=recordMappingDisposition(c,s,{id:'A',status:'No mapping change',continued:true,note:'Reviewer continues to disagree.',coordinator:'QA coordinator'});assert.equal(effective(c,continued,'A').origin,'unresolved');
 const closed=recordMappingDisposition(c,d,{id:'A',status:'No mapping change',note:'The narrower route is not in this argument.',coordinator:'QA coordinator'});assert.equal(effective(c,closed,'A').origin,'derived');
 assert.throws(()=>recordMappingDisposition(c,s,{id:'A',status:'Unresolved',note:'x'}),/human coordinator/);
});
test('legacy IDs stay unknown without changing old records; JSON and CSV retain release lineage',()=>{
 const c=fixture(),s=newState(c,6);delete s.release;const before=JSON.stringify(s);
 assert.equal(recordedRelease(s).rendered_id,'unknown_legacy');assert.equal(JSON.stringify(s),before);
 const csv=csvExport(c,s);assert.ok(csv.includes('loaded_rendered_id'));assert.ok(csv.includes('unknown_legacy'));assert.equal(csv.split('\r\n')[0].split(',').length,csv.split('\r\n')[1].split(',').length);
 const next=vote(c,s,'C','yes');assert.equal(next.release.rendered_id,'render-1');assert.equal(next.history[0].release.rendered_id,'render-1');assert.equal(JSON.stringify(s),before);
});
