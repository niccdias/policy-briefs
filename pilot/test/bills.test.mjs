import test from 'node:test';
import assert from 'node:assert/strict';
import {billFor,validateContent,validateState,makeOrder,newState,editState,effective,pageComplete,valueResult,strengthResult,progress} from '../src/core.mjs';

function fixture(){
 const bills=['A','B','empty'].map(id=>({id,bill:`Bill ${id}`}));
 const values=bills.flatMap(b=>['nature','care'].map(value=>({id:`${b.id}_${value}`,bill_id:b.id})));
 const claims=['A','B'].map(bill_id=>({id:`${bill_id}_claim`,bill_id,prerequisite_paths:[{id:'local',requires:[]}]}));
 const argumentsOut=['A','B'].flatMap(bill_id=>['nature','care'].flatMap(value=>['support','oppose'].map(direction=>({id:`${bill_id}_${value}_${direction}`,bill_id,value_id:`${bill_id}_${value}`,direction,paths:[{id:'shared',requires:[`${bill_id}_claim`]},...(value==='care'?[{id:'alternative',requires:[]}]:[])]}))));
 return {schema_version:1,version:'multi-test',bills,values,claims,arguments:argumentsOut,catalog:argumentsOut.map(a=>({id:a.id,bill_id:a.bill_id,retired:false})),expected_counts:{active:8,historical:8}};
}
test('randomization keeps bills, values, directions and arguments together, sampled once',()=>{
 const c=fixture();assert.ok(validateContent(c));
 const billOrders=new Set();
 for(let seed=1;seed<=40;seed++){
  const order=makeOrder(c,seed),billIds=order.filter(id=>id.startsWith('bill:'));
  billOrders.add(billIds.join());assert.equal(order.length,19);assert.equal(new Set(order).size,order.length);
  let currentBill=null;const seenBills=new Set();
  for(const id of order){
   const bill=billFor(c,id).id;
   if(id.startsWith('bill:')){assert.ok(!seenBills.has(bill));seenBills.add(bill);currentBill=bill;}
   assert.equal(bill,currentBill,'No return to an earlier bill in the guided sequence.');
  }
  for(const bill of c.bills){
   const local=order.filter(id=>billFor(c,id).id===bill.id);
   assert.equal(local[0],`bill:${bill.id}`);
   if(bill.id!=='empty')assert.equal(local[1],`${bill.id}_claim`);
   for(const value of c.values.filter(v=>v.bill_id===bill.id)){
    const args=c.arguments.filter(a=>a.value_id===value.id),positions=args.map(a=>order.indexOf(a.id));
    if(positions.length)assert.equal(Math.max(...positions)-Math.min(...positions),positions.length-1);
    assert.ok(positions.every(i=>i<order.indexOf(`summary:${value.id}`)));
   }
  }
  const state=newState(c,seed),copy=JSON.parse(JSON.stringify(state));assert.equal(validateState(c,copy),copy);assert.deepEqual(copy.order,order);
 }
 assert.ok(billOrders.size>1);
});
test('a shared rejection affects only that bill and only paths needing it',()=>{
 const c=fixture();let s=newState(c,5);
 s=editState(c,s,{type:'judgment',id:'A_claim',answer:'no',notes:''});
 assert.equal(effective(c,s,'A_nature_support').origin,'derived');
 assert.equal(effective(c,s,'A_care_support').answer,null);
 assert.equal(effective(c,s,'B_nature_support').answer,null);
 assert.equal(pageComplete(c,s,'A_nature_support'),false);
 s=editState(c,s,{type:'complete',id:'A_nature_support'});assert.ok(pageComplete(c,s,'A_nature_support'));
 s=editState(c,s,{type:'judgment',id:'A_claim',answer:'yes'});assert.equal(effective(c,s,'A_nature_support').answer,null);
 assert.equal(progress(c,s).totalArguments,8);
});
test('empty reviewed value still gets a summary and a separate optional omitted reason',()=>{
 const c=fixture();let s=newState(c,1);
 assert.equal(valueResult(c,s,'empty_care').outcome,'Neither');
 s=editState(c,s,{type:'omission',value:'empty_care',direction:'support',text:''});
 s=editState(c,s,{type:'summary',value:'empty_care'});assert.equal(s.summaryCompleted.empty_care,'[]');
 assert.ok(validateState(c,JSON.parse(JSON.stringify(s))));
});
test('cross-bill dependencies and incorrect frozen counts fail at the content boundary',()=>{
 const c=fixture();c.arguments[0].paths[0].requires=['B_claim'];assert.throws(()=>validateContent(c),/crosses bills/);
 const d=fixture();d.expected_counts.active=9;assert.throws(()=>validateContent(d),/coverage/);
 const e=fixture();e.values[0].bill_id='missing';assert.throws(()=>validateContent(e),/bill assignment/);
});
test('comparisons use only their own bill/value and become stale after relevant edits',()=>{
 const c=fixture();let s=newState(c,1);
 for(const claim of c.claims)s=editState(c,s,{type:'judgment',id:claim.id,answer:'yes'});
 for(const arg of c.arguments)s=editState(c,s,{type:'judgment',id:arg.id,answer:'yes'});
 for(const value of ['A_nature','B_nature'])s=editState(c,s,{type:'comparison',value,answer:'support',notes:''});
 s=editState(c,s,{type:'judgment',id:'A_claim',answer:'no'});
 assert.equal(strengthResult(c,s,'A_nature'),'Pending');assert.equal(strengthResult(c,s,'B_nature'),'support');
 assert.equal(s.comparisons.A_nature.answer,'support');
});
