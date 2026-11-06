import test from 'node:test';
import assert from 'node:assert/strict';
import {validateContent,validateState,claimUsers,newState,editState,effective,pageComplete,valueResult,strengthResult,makeOrder,csvExport,progress,basis,codingOrder,nextCursor} from '../src/core.mjs';
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
const backgroundContent=()=>({...C,procedure:{revision:'background-v1',base_content_version:C.version,background:[{id:'C1',statement:'Written rule.',section:'Section 1',source_quote:'Written rule.',source_refs:[{doc_id:'bill_text'}]}],retained_questions:[{id:'C2',reason:'Practical effect.'}]}});
test('verified provisions are not reviewer Yes or No, and old No cannot block a path',()=>{
 const c=backgroundContent();assert.ok(validateContent(c));
 let old=newState(C,17);old=set(old,'C1','no');old=editState(C,old,{type:'complete',id:'A'});
 const frozen=JSON.stringify(old);assert.equal(validateState(c,old),old);
 assert.equal(effective(c,old,'C1').origin,'background');assert.equal(effective(c,old,'C1').answer,null);
 assert.equal(effective(c,old,'C2').origin,'unanswered');assert.equal(effective(c,old,'A').answer,null);
 assert.equal(pageComplete(c,old,'A'),false);assert.equal(JSON.stringify(old),frozen);
 assert.equal(old.judgments.C1.answer,'no');assert.throws(()=>editState(c,old,{type:'judgment',id:'C1',answer:'yes'}),/background/);
 assert.throws(()=>editState(c,old,{type:'complete',id:'C1'}),/required/);
 let current=editState(c,old,{type:'judgment',id:'C2',answer:'no'});
 assert.equal(effective(c,current,'A').origin,'derived');assert.equal(effective(c,current,'B').answer,null);
 current=editState(c,current,{type:'judgment',id:'C2',answer:'yes'});
 assert.equal(effective(c,current,'A').answer,null,'A textual provision or accepted premise must not accept an argument.');
 assert.equal(current.procedureRevision,'background-v1');assert.equal(current.judgments.C1.answer,'no');
 const csv=csvExport(c,current);assert.ok(csv.includes('"C1","background","","","no","","background"'));
});
test('procedure correction preserves answers, order and history while invalidating affected judgments and comparisons',()=>{
 const c=backgroundContent();let s=newState(C,3);
 for(const [id,answer] of [['C1','yes'],['C2','yes'],['A','yes'],['D','yes']])s=set(s,id,answer);
 s=editState(C,s,{type:'complete',id:'A'});s=editState(C,s,{type:'comparison',value:'V',answer:'support'});
 const before=JSON.stringify(s);assert.equal(strengthResult(C,s,'V'),'support');
 assert.ok(validateState(c,s));assert.equal(effective(c,s,'A').origin,'reassess');assert.equal(effective(c,s,'A').direct,'yes');
 assert.equal(pageComplete(c,s,'A'),false);assert.equal(strengthResult(c,s,'V'),'Pending');assert.equal(JSON.stringify(s),before);
 assert.deepEqual(makeOrder(c,s.seed),s.order);assert.deepEqual(codingOrder(c,s),s.order.filter(id=>id!=='C1'));
 const cursor=s.order.indexOf('C2');const next=editState(c,s,{type:'cursor',cursor});
 assert.deepEqual(next.judgments,s.judgments);assert.deepEqual(next.order,s.order);assert.equal(next.history.length,s.history.length+1);
 assert.equal(progress(c,next).totalClaims,1);assert.equal(codingOrder(c,next)[0],'C2');
 assert.equal(nextCursor(c,{...next,cursor},-1),-1);assert.equal(nextCursor(c,{...next,cursor:0},1),cursor);
 // A later historical-answer edit cannot alter the current basis of an argument.
 assert.equal(basis(c,s,'A'),basis(c,{...s,judgments:{...s.judgments,C1:{...s.judgments.C1,answer:'no',revision:99}}},'A'));
});
