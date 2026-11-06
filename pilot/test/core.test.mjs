import test from 'node:test';
import assert from 'node:assert/strict';
import {validateContent,validateState,claimUsers,newState,editState,effective,pageComplete,valueResult,strengthResult,makeOrder,csvExport} from '../src/core.mjs';
const claim=(id,requires=[])=>({id,prerequisite_paths:[{id:id+'p',requires}]});
const arg=(id,requires,direction='support',extra=[])=>({id,value_id:'V',direction,paths:[{id:id+'p',requires},...extra]});
const C={schema_version:1,version:'test-v1',claims:[claim('C1'),claim('C2',['C1'])],arguments:[arg('A',['C1','C2']),arg('B',['C2'],'support',[{id:'alt',requires:[]}]),arg('D',['C1'],'oppose')]};
const set=(s,id,answer)=>editState(C,s,{type:'judgment',id,answer});
test('AND, OR and unanswered claims remain distinct',()=>{
 assert.ok(validateContent(C));let s=newState(C,1);
 assert.equal(effective(C,s,'A').answer,null);
 s=set(s,'C1','no');assert.equal(effective(C,s,'A').origin,'derived');assert.equal(effective(C,s,'C2').origin,'derived');
 assert.equal(effective(C,s,'B').answer,null); // independent local path stays open
 assert.equal(pageComplete(C,s,'A'),false); // no hidden page completion
 s=editState(C,s,{type:'complete',id:'A'});assert.equal(pageComplete(C,s,'A'),true);
});
test('premise acceptance never accepts an argument',()=>{
 let s=newState(C,1);s=set(s,'C1','yes');s=set(s,'C2','yes');
 assert.equal(effective(C,s,'A').answer,null);assert.equal(valueResult(C,s,'V').outcome,'Pending');
});
test('direct answers are preserved and explicitly reassessed after premise edits',()=>{
 let s=newState(C,1);s=set(s,'C1','yes');s=set(s,'C2','yes');s=set(s,'A','yes');
 s=editState(C,s,{type:'complete',id:'A'});s=set(s,'C1','no');
 assert.equal(effective(C,s,'A').answer,'no');assert.equal(effective(C,s,'A').direct,'yes');assert.equal(pageComplete(C,s,'A'),false);
 s=set(s,'C1','yes');assert.equal(effective(C,s,'C2').origin,'reassess');
 assert.equal(effective(C,s,'A').origin,'reassess');assert.equal(effective(C,s,'A').direct,'yes');assert.equal(pageComplete(C,s,'A'),false);assert.ok(s.history.length>=6);
 s=set(s,'C2','no');s=set(s,'C1','no');s=set(s,'C1','yes');
 assert.equal(effective(C,s,'A').origin,'reassess');s=set(s,'C2','no');assert.equal(effective(C,s,'A').origin,'derived');
});
test('changed claims that open paths preserve direct answer but require review',()=>{
 let s=newState(C,1);s=set(s,'C1','no');s=set(s,'B','yes');s=set(s,'C1','yes');
 assert.equal(effective(C,s,'B').origin,'reassess');assert.equal(effective(C,s,'B').direct,'yes');
});
test('Both and strength use different judgments; edits invalidate comparisons',()=>{
 let s=newState(C,1);s=set(s,'C1','yes');s=set(s,'C2','yes');s=set(s,'A','yes');s=set(s,'D','yes');
 assert.equal(valueResult(C,s,'V').outcome,'Both');
 s=editState(C,s,{type:'comparison',value:'V',answer:'support',notes:''});assert.equal(strengthResult(C,s,'V'),'support');
 s=set(s,'B','yes');assert.equal(strengthResult(C,s,'V'),'Pending');assert.equal(s.comparisons.V.answer,'support');
});
test('flagging mistaken dependency stops automatic derived No',()=>{
 let s=set(newState(C,1),'C1','no');s=editState(C,s,{type:'flag',id:'A',dependency:true,notes:'This path can stand alone.'});
 assert.equal(effective(C,s,'A').answer,null);s=set(s,'A','yes');assert.equal(effective(C,s,'A').answer,'yes');
});
test('cycles, missing claims and accidental one-use claims fail validation',()=>{
 assert.throws(()=>validateContent({...C,claims:[claim('C1',['C2']),claim('C2',['C1'])]}),/Circular/);
 assert.throws(()=>validateContent({...C,arguments:[arg('A',['missing'])]}),/missing shared/);
 assert.throws(()=>validateContent({...C,arguments:[arg('A',['C1','C2'])]}),/genuine reuse/);
});
test('orders persist with hierarchy and prerequisites, and reject blank required answers',()=>{
 assert.deepEqual(makeOrder(C,12),makeOrder(C,12));let s=newState(C,5);
 assert.ok(s.order.indexOf('C1')<s.order.indexOf('C2'));
 assert.throws(()=>editState(C,s,{type:'judgment',id:'A',answer:''}),/Yes or No/);
 assert.throws(()=>editState(C,s,{type:'complete',id:'A'}),/required/);
 assert.equal(set(s,'C1','yes').judgments.C1.notes,'');
});
test('transitively reused claims need no redundant direct edge',()=>{
 const c={...C,arguments:[arg('A',['C2']),arg('B',['C2'],'oppose')]};
 assert.ok(validateContent(c));assert.equal(claimUsers(c,'C1').length,2);
 let s=newState(c,1);s=editState(c,s,{type:'judgment',id:'C1',answer:'no'});
 assert.equal(effective(c,s,'A').origin,'derived');
});
test('independent outage and attack paths survive rejection of only one mechanism',()=>{
 const c={schema_version:1,version:'split',claims:[claim('money'),claim('outage'),claim('attack')],arguments:[arg('A',['money','outage'],'support',[{id:'a2',requires:['money','attack']}]),arg('B',['money','attack'],'oppose',[{id:'b2',requires:['money','outage']}])]};
 let s=newState(c,1);
 for(const [id,answer] of [['money','yes'],['outage','no'],['attack','yes']])s=editState(c,s,{type:'judgment',id,answer});
 assert.equal(effective(c,s,'A').answer,null);
 s=editState(c,s,{type:'judgment',id:'attack',answer:'no'});assert.equal(effective(c,s,'A').origin,'derived');
});
test('blank notes are valid and comparison drafts survive before a comparison',()=>{
 let s=newState(C,10);s=editState(C,s,{type:'notes',id:'A',notes:''});
 s=editState(C,s,{type:'comparisonNotes',value:'V',notes:'A draft before choosing'});
 assert.equal(s.comparisonNotes.V,'A draft before choosing');assert.equal(s.comparisons.V,undefined);
 assert.throws(()=>editState(C,s,{type:'comparisonNotes',value:'V',notes:'x'.repeat(2001)}),/2,000/);
 assert.ok(validateState(C,JSON.parse(JSON.stringify(s))));
 assert.throws(()=>validateState(C,{...s,order:[...s.order].reverse()}),/order/);
 assert.throws(()=>validateState(C,{...s,version:'other'}),/version/);
 const c={...C,values:[{id:'V'}]};s=editState(C,s,{type:'omission',value:'V',direction:'oppose',text:'Separate omitted reason'});
 const csv=csvExport(c,s);assert.ok(csv.includes('Separate omitted reason'));assert.ok(csv.includes('A draft before choosing'));assert.ok(csv.includes('summary:V'));
});
