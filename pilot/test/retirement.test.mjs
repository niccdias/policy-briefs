import test from 'node:test';
import assert from 'node:assert/strict';
import * as core from '../src/core.mjs';
import {importResponses} from '../src/resume.mjs';
const {validateContent,validateState,newState,makeOrder,editState,recordMappingDisposition,codingOrder,currentCursor,nextCursor,valueResult,strengthResult,progress,csvExport,paths}=core;

const stamp='2026-11-07T22:00:00.000Z';
function fixture(version='combined'){
 const argumentsHere=[['A','V','support'],['A2','V','support'],['B','V','oppose'],['U','W','support'],['O','W','oppose']].map(([id,value_id,direction])=>({id,bill_id:'bill',value_id,direction,title:id,pro_html:'<p>Synthetic QA fixture.</p>',con_html:'',notes_html:'',paths:[{id:`${id}-p`,requires:['C']}]}));
 return {schema_version:1,version,bills:[{id:'bill',bill:'QA'}],claims:[{id:'C',bill_id:'bill',prerequisite_paths:[{id:'C-p',requires:[]}]}],arguments:argumentsHere,values:['V','W'].map(id=>({id,bill_id:'bill'})),catalog:argumentsHere.map(a=>({id:a.id,bill_id:a.bill_id,retired:false,original:structuredClone(a)})),expected_counts:{active:5,historical:5},release:{content_id:'before',procedure_id:'procedure',mapping_id:'mapping',rendered_id:'rendered-before',order_history:[{claim_paths:{C:[{id:'C-p',requires:[]}]}}]}};
}
function retire(content){
 const next=structuredClone(content),argument=next.arguments.find(a=>a.id==='A');
 next.release.order_argument_ids=content.release.order_argument_ids??content.arguments.map(a=>a.id);
 next.arguments=next.arguments.filter(a=>a.id!=='A');next.expected_counts.active=next.arguments.length;
 Object.assign(next.catalog.find(a=>a.id==='A'),{retired:true,original:argument,retirement_reason:'Synthetic QA retirement.'});
 next.release.content_id='after';next.release.rendered_id='rendered-after';return next;
}
function completed(content,seed=41){
 let state=newState(content,seed);
 for(const id of ['C',...content.arguments.map(a=>a.id)]){
  state=editState(content,state,{type:'judgment',id,answer:'yes',notes:`QA ${id}`},stamp);
  state=editState(content,state,{type:'complete',id},stamp);
 }
 state=editState(content,state,{type:'notes',id:'A',notes:'QA retained note'},stamp);
 state=editState(content,state,{type:'flag',id:'A',dependency:false,notes:'QA retained flag'},stamp);
 state=recordMappingDisposition(content,state,{id:'A',status:'No mapping change',note:'QA disposition',coordinator:'QA human'},stamp);
 for(const value of ['V','W']){
  state=editState(content,state,{type:'comparison',value,answer:'support'},stamp);
  state=editState(content,state,{type:'summary',value},stamp);
 }
 return editState(content,state,{type:'cursor',cursor:state.order.indexOf('A')},stamp);
}
function targetFor(source){
 const target=retire(source);target.version='combined';
 target.workflow={resume_sources:[{version:source.version,bill_ids:['bill'],url:'./prior/original-content.json',sha256:'a'.repeat(64)}]};return target;
}

test('retirement accepts the exact earlier state without changing its answers, order, cursor or history',()=>{
 const before=fixture(),state=completed(before),content=retire(before),saved=JSON.stringify(state);
 assert.ok(validateContent(content));assert.equal(validateState(content,state),state);assert.equal(JSON.stringify(state),saved);
 assert.deepEqual(state.judgments.A.release,{content_id:'before',procedure_id:'procedure',mapping_id:'mapping',rendered_id:'rendered-before'});
 assert.equal(strengthResult(content,state,'V'),'Pending');assert.equal(strengthResult(content,state,'W'),'support');
 assert.equal(progress(content,state).totalArguments,4);assert.equal(codingOrder(content,state).includes('A'),false);
});
test('fresh sessions preserve every original RNG draw and hide retired slots',()=>{
 const before=fixture(),content=retire(before);
 for(const seed of [0,1,2,3,4,5,7,12,41,42,99,65535,20261107]){
  assert.deepEqual(newState(content,seed).order,newState(before,seed).order,`seed ${seed}`);
  assert.equal(codingOrder(content,newState(content,seed)).includes('A'),false);
 }
});
test('a cursor on a retired argument renders the next active page and navigation advances from that page',()=>{
 const before=fixture(),state=completed(before),content=retire(before),saved=JSON.stringify(state);
 const cursor=currentCursor(content,state),visible=state.order[cursor];
 assert.ok(cursor>state.cursor);assert.notEqual(visible,'A');assert.equal(codingOrder(content,state).includes(visible),true);
 const next=nextCursor(content,state,1),previous=nextCursor(content,state,-1),visibleOrder=codingOrder(content,state),index=visibleOrder.indexOf(visible);
 assert.equal(next<0?null:state.order[next],visibleOrder[index+1]??null);
 assert.equal(previous<0?null:state.order[previous],visibleOrder[index-1]??null);assert.equal(JSON.stringify(state),saved);
});
test('retired direct Yes is preserved but cannot affect current outcomes or receive a new vote',()=>{
 const before=fixture();let state=completed(before);state=editState(before,state,{type:'judgment',id:'A2',answer:'no'},stamp);
 const content=retire(before),saved=JSON.stringify(state);
 assert.equal(valueResult(before,state,'V').outcome,'Both');assert.equal(valueResult(content,state,'V').outcome,'Oppose');assert.equal(state.judgments.A.answer,'yes');
 for(const action of [{type:'judgment',id:'A',answer:'yes'},{type:'judgment',id:'A',answer:'no'},{type:'complete',id:'A'}])assert.throws(()=>editState(content,state,action));
 assert.equal(JSON.stringify(state),saved);
});
test('JSON and CSV retain retired answers, notes and original rendered identity',()=>{
 const before=fixture(),state=completed(before),content=retire(before),saved=JSON.stringify(state);
 const roundtrip=validateState(content,JSON.parse(saved));assert.deepEqual(roundtrip,state);
 const csv=csvExport(content,state),row=csv.split('\r\n').find(line=>line.startsWith('"A","retired_argument",'));
 assert.ok(row);assert.ok(row.includes('"yes","","retired"'));assert.ok(row.includes('QA retained note'));assert.ok(row.endsWith('"rendered-before"'));
 assert.equal(JSON.stringify(state),saved);
});
test('earlier source import preserves retired records and exact internal order while staling only the affected comparison',()=>{
 const sourceContent=fixture('prior'),state=completed(sourceContent),source={content:sourceContent,state,session:'prior--qa',revision:7,draft:false},saved=JSON.stringify(source);
 const content=targetFor(sourceContent),imported=importResponses(content,[source],600,stamp);
 assert.ok(validateState(content,imported));assert.equal(JSON.stringify(source),saved);assert.deepEqual(imported.order,state.order);
 for(const key of ['judgments','nodeNotes','completed','flags','mappingDispositions'])assert.deepEqual(imported[key].A,state[key].A,key);
 assert.deepEqual(imported.migration.sources[0].history,state.history);
 assert.equal(strengthResult(content,imported,'V'),'Pending');assert.equal(strengthResult(content,imported,'W'),'support');
 assert.equal(codingOrder(content,imported).includes('A'),false);
});
test('all registered earlier argument populations remain valid and source imports retain the verified population',()=>{
 const before=fixture(),content=retire(before),earlier=structuredClone(content);delete earlier.release.order_argument_ids;
 const state=newState(earlier,41),claim_paths=Object.fromEntries(content.claims.map(c=>[c.id,paths(c)]));
 content.release.order_history.push({claim_paths,argument_ids:earlier.arguments.map(a=>a.id)});
 assert.ok(validateState(content,state));assert.deepEqual(state.order,makeOrder(earlier,41));
 earlier.version='prior';state.version='prior';const source={content:earlier,state,session:'prior--qa',revision:1,draft:false};
 const target=structuredClone(content);target.workflow={resume_sources:[{version:'prior',bill_ids:['bill'],url:'./prior/original-content.json',sha256:'a'.repeat(64)}]};
 const imported=importResponses(target,[source],600,stamp);assert.deepEqual(imported.order,state.order);assert.ok(validateState(target,imported));
});
test('unknown, duplicate, incomplete or unregistered order populations and forged saved order are rejected',()=>{
 const before=fixture(),content=retire(before),state=completed(before);
 for(const ids of [null,{},['unknown',...content.release.order_argument_ids],['A',...content.release.order_argument_ids],content.release.order_argument_ids.filter(id=>id!=='B')]){
  const bad=structuredClone(content);bad.release.order_argument_ids=ids;assert.throws(()=>validateContent(bad));
 }
 const bad=structuredClone(state);bad.order=bad.order.filter(id=>id!=='A');assert.throws(()=>validateState(content,bad));
 const unregistered=structuredClone(state);unregistered.sourceOrderArgumentIds=content.arguments.map(a=>a.id);assert.throws(()=>validateState(content,unregistered));
});
