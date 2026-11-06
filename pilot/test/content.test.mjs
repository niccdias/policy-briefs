import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateContent,newState,editState,effective,paths,claimAncestors,claimUsers,makeOrder,progress} from '../src/core.mjs';
const content=JSON.parse(await readFile(new URL('../content.json',import.meta.url),'utf8'));
const authority=JSON.parse(await readFile(new URL('../review/authority.json',import.meta.url),'utf8'));
const mapping=JSON.parse(await readFile(new URL('../review/mapping.json',import.meta.url),'utf8'));
const originals=authority.pages.flatMap(p=>p.directions.flatMap(d=>d.points));
test('frozen authority, coverage, notes, responses and source bindings survive assembly',()=>{
 assert.equal(validateContent(content),true);assert.equal(content.draft,false);
 assert.equal(content.claims.length,25);assert.equal(content.arguments.length,79);assert.equal(content.catalog.length,85);
 assert.equal(content.catalog.filter(a=>a.retired).length,6);
 assert.equal(content.arguments.filter(a=>a.no_point_specific_con).length,35);
 for(const argument of content.arguments){
  assert.deepEqual(argument.original,originals.find(a=>a.point_id===argument.id));
  const mapped=mapping.arguments.find(a=>a.point_id===argument.id);
  for(const field of ['pro_html','con_html','notes_html','note_ids','paths','gaps','edits'])assert.deepEqual(argument[field],mapped[field],`${argument.id} ${field}`);
 }
 for(const value of content.values)assert.deepEqual(value.source_bindings,authority.pages.find(p=>p.value_id===value.id).source_bindings);
 assert.equal(content.arguments.reduce((n,a)=>n+a.paths.length,0),130);
 assert.equal(content.arguments.reduce((n,a)=>n+new Set(a.paths.flatMap(p=>p.requires)).size,0),109);
 assert.equal(content.claims.reduce((n,c)=>n+claimUsers(content,c.id).length,0),130); // Includes all transitive prerequisites.
});
test('every final path blocks only when all alternative paths have a rejected necessary claim',()=>{
 for(const arg of content.arguments){
  const deps=[...new Set(paths(arg).flatMap(p=>p.requires))];
  // Test all combinations of direct dependencies while holding their own prerequisites accepted.
  for(let mask=0;mask<2**deps.length;mask++){
   let state=newState(content,19);
   for(const id of makeOrder(content,19).filter(id=>content.claims.some(c=>c.id===id)))state=editState(content,state,{type:'judgment',id,answer:deps.includes(id)&&mask&(1<<deps.indexOf(id))?'no':'yes'});
   // Independently calculate the blocked set to include prerequisites of direct dependencies.
   const blocked=new Set(deps.filter((id,i)=>mask&(1<<i)));
   let changed=true;
   while(changed){changed=false;for(const c of content.claims)if(!blocked.has(c.id)&&paths(c).every(p=>p.requires.some(id=>blocked.has(id)))){blocked.add(c.id);changed=true;}}
   const expected=paths(arg).every(p=>p.requires.some(id=>blocked.has(id)));
   assert.equal(effective(content,state,arg.id).origin==='derived',expected,`${arg.id}, ${mask}`);
   if(!expected)assert.equal(effective(content,state,arg.id).answer,null,'Accepting premises must not accept an argument.');
  }
 }
});
test('local alternative survives, written reporting stays separate, and outages differ from attack incentives',()=>{
 let state=newState(content,8);
 const set=(id,answer)=>state=editState(content,state,{type:'judgment',id,answer});
 set('C01','yes');set('C02','yes');set('C25','no');
 assert.equal(effective(content,state,'S1582_UNC_oppose_03').answer,null);
 set('C23','no');set('C28','yes');
 for(const id of ['S1582_SES_oppose_03','S1582_SEP_oppose_02'])assert.equal(effective(content,state,id).answer,null);
 set('C28','no');
 for(const id of ['S1582_SES_oppose_03','S1582_SEP_oppose_02'])assert.equal(effective(content,state,id).origin,'derived');
 set('C27','no');assert.equal(effective(content,state,'C18').origin,'derived');
 assert.equal(claimUsers(content,'C27').length,4);
 assert(!claimAncestors(content,'S1582_TR_oppose_02').includes('C27'));
 assert(claimAncestors(content,'S1582_TR_oppose_02').includes('C17'));
 assert.equal(progress(content,state).arguments,0,'Derived outcomes do not complete unread pages.');
});
