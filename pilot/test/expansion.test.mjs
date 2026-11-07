import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateContent,newState,editState,effective,paths,claimAncestors,judgedClaims,codingOrder,pageComplete} from '../src/core.mjs';
const c=JSON.parse(await readFile(new URL('../expansion/content.json',import.meta.url),'utf8'));
const claims=judgedClaims(c),judged=new Set(claims.map(q=>q.id));

test('the reviewed seven-bill release preserves coverage and asks only disputed shared questions',()=>{
 assert.equal(validateContent(c),true);assert.equal(c.draft,false);
 assert.equal(c.bills.length,7);assert.equal(c.arguments.length,424);assert.equal(c.catalog.length,482);
 assert.equal(c.catalog.filter(a=>a.retired).length,58);assert.equal(claims.length,21);
 assert.equal(c.procedure.background.length,106);assert.equal(c.values.length,42);
 const s=newState(c,20261107),order=codingOrder(c,s);
 assert.equal(order.length,494);assert.equal(new Set(order).size,494);
 assert.ok(c.arguments.every(a=>order.includes(a.id)));
 assert.ok(c.catalog.filter(a=>a.retired).every(a=>!order.includes(a.id)));
 for(const a of c.arguments)assert.equal(effective(c,s,a.id).answer,null,'Unanswered claims must not block or accept arguments.');
});

test('every real argument respects its alternative paths for every relevant shared-answer combination',()=>{
 let allYes=newState(c,123);
 for(const q of claims)allYes=editState(c,allYes,{type:'judgment',id:q.id,answer:'yes',notes:''});
 for(const a of c.arguments){
  const deps=claimAncestors(c,a.id).filter(id=>judged.has(id));
  for(let mask=0;mask<2**deps.length;mask++){
   let s=allYes;const rejected=new Set(deps.filter((id,i)=>mask&(1<<i)));
   for(const id of rejected)s=editState(c,s,{type:'judgment',id,answer:'no',notes:''});
   const independentlyBlocked=id=>rejected.has(id)||(judged.has(id)&&paths(c.claims.find(q=>q.id===id)).every(p=>p.requires.some(independentlyBlocked)));
   const blocked=paths(a).every(p=>p.requires.some(independentlyBlocked));
   assert.equal(effective(c,s,a.id).origin==='derived',blocked,`${a.id}, combination ${mask}`);
   if(!blocked)assert.equal(effective(c,s,a.id).answer,null,'Accepted premises never accept an argument.');
   assert.equal(pageComplete(c,s,a.id),false,'A derived answer must still be read.');
  }
 }
 let allNo=newState(c,123);
 for(const q of claims)allNo=editState(c,allNo,{type:'judgment',id:q.id,answer:'no',notes:''});
 assert.equal(c.arguments.filter(a=>effective(c,allNo,a.id).origin==='derived').length,38);
});
