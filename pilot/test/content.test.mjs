import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validateContent,validateState,newState,editState,effective,paths,claimAncestors,claimUsers,makeOrder,progress,backgroundFact,judgedClaims,codingOrder,basis,pageComplete,comparisonBasis,strengthResult} from '../src/core.mjs';
const content=JSON.parse(await readFile(new URL('../content.json',import.meta.url),'utf8'));
const authority=JSON.parse(await readFile(new URL('../review/authority.json',import.meta.url),'utf8'));
const mapping=JSON.parse(await readFile(new URL('../review/mapping.json',import.meta.url),'utf8'));
const originals=authority.pages.flatMap(p=>p.directions.flatMap(d=>d.points));
test('only substantive disputed bridges require a separate shared judgment',()=>{
 assert.deepEqual(judgedClaims(content).map(c=>c.id),['C03','C11','C19']);
 const prior=JSON.parse(JSON.stringify(content));prior.procedure=JSON.parse(JSON.stringify(content.procedure));
 prior.procedure.background=prior.procedure.background.filter(f=>f.classification!=='uncontested_sourced_context');
 prior.procedure.revision='statutory-background-20261106-v1';
 prior.procedure.retained_questions=content.claims.filter(c=>!backgroundFact(prior,c.id)).map(c=>({id:c.id}));
 assert.ok(validateContent(prior));
 let saved=newState(prior,42);
 for(const claim of judgedClaims(prior))saved=editState(prior,saved,{type:'judgment',id:claim.id,answer:'no'});
 const before=JSON.stringify(saved);assert.ok(validateState(content,saved));
 for(const id of ['C01','C02','C09','C10','C12','C18','C21','C22','C23','C28','C24','C25']){
  assert.equal(effective(content,saved,id).origin,'background');assert.equal(effective(content,saved,id).answer,null);
  assert.throws(()=>editState(content,saved,{type:'judgment',id,answer:'yes'}),/background/);
 }
 assert.equal(effective(content,saved,'S1582_SEP_oppose_02').answer,null,'A historical No on an uncontested possibility must not block the complete argument.');
 const reviewed=editState(content,saved,{type:'judgment',id:'C03',answer:'no'});
 assert.equal(effective(content,reviewed,'S1582_UNN_oppose_01').origin,'derived','A currently rejected contested mining bridge still blocks its arguments.');
 assert.equal(JSON.stringify(saved),before);assert.equal(codingOrder(content,saved).length,88);
});
test('frozen authority, coverage, notes, responses and source bindings survive assembly',()=>{
 assert.equal(validateContent(content),true);assert.equal(content.draft,false);
 assert.equal(content.claims.length,25);assert.equal(content.arguments.length,79);assert.equal(content.catalog.length,85);
 assert.equal(content.catalog.filter(a=>a.retired).length,6);
 assert.equal(content.arguments.filter(a=>a.no_point_specific_con).length,35);
 for(const argument of content.arguments){
  assert.deepEqual(argument.original,originals.find(a=>a.point_id===argument.id));
  const mapped=mapping.arguments.find(a=>a.point_id===argument.id);
  for(const field of ['pro_html','notes_html','note_ids','paths','gaps','edits'])assert.deepEqual(argument[field],mapped[field],`${argument.id} ${field}`);
  const relocation=content.procedure.response_context.find(r=>r.argument_id===argument.id);
  assert.equal(argument.con_html,relocation?mapped.con_html.replace(relocation.before,relocation.after):mapped.con_html);
 }
 for(const value of content.values)assert.deepEqual(value.source_bindings,authority.pages.find(p=>p.value_id===value.id).source_bindings);
 assert.equal(content.arguments.reduce((n,a)=>n+a.paths.length,0),130);
 assert.equal(content.arguments.reduce((n,a)=>n+new Set(a.paths.flatMap(p=>p.requires)).size,0),109);
 assert.equal(content.claims.reduce((n,c)=>n+claimUsers(content,c.id).length,0),130); // Includes all transitive prerequisites.
 assert.equal(content.procedure.background.length,22);assert.equal(judgedClaims(content).length,3);
 assert.deepEqual(content.claims,mapping.claims,'The frozen mapping remains unchanged; the procedure is an explicit overlay.');
 assert.equal(codingOrder(content,newState(content,19)).length,88);
 for(const r of content.procedure.response_context){
  const argument=content.arguments.find(a=>a.id===r.argument_id);
  assert.ok(argument.con_html.includes(r.after));assert.ok(!argument.con_html.includes(r.before));
  assert.ok(mapping.claims.find(c=>c.id===r.from_claim).objection_html.includes(r.response_context_html),'Relocated evidence must be exact and retain its citations.');
 }
});
test('every final path blocks only when all alternative paths have a rejected necessary claim',()=>{
 for(const arg of content.arguments){
  const deps=[...new Set(paths(arg).flatMap(p=>p.requires))];
  // Test all combinations of direct dependencies while holding their own prerequisites accepted.
  for(let mask=0;mask<2**deps.length;mask++){
   let state=newState(content,19);
   for(const id of makeOrder(content,19).filter(id=>judgedClaims(content).some(c=>c.id===id)))state=editState(content,state,{type:'judgment',id,answer:deps.includes(id)&&mask&(1<<deps.indexOf(id))?'no':'yes'});
   // Independently calculate the blocked set to include prerequisites of direct dependencies.
   const blocked=new Set(deps.filter((id,i)=>!backgroundFact(content,id)&&mask&(1<<i)));
   let changed=true;
   while(changed){changed=false;for(const c of judgedClaims(content))if(!blocked.has(c.id)&&paths(c).every(p=>p.requires.some(id=>blocked.has(id)))){blocked.add(c.id);changed=true;}}
   const expected=paths(arg).every(p=>p.requires.some(id=>blocked.has(id)));
   assert.equal(effective(content,state,arg.id).origin==='derived',expected,`${arg.id}, ${mask}`);
   if(!expected)assert.equal(effective(content,state,arg.id).answer,null,'Accepting premises must not accept an argument.');
  }
 }
});
test('unchallenged mechanisms stay separate context and do not block local alternatives',()=>{
 let state=newState(content,8);
 assert.equal(effective(content,state,'S1582_UNC_oppose_03').answer,null);
 for(const id of ['S1582_SES_oppose_03','S1582_SEP_oppose_02'])assert.equal(effective(content,state,id).answer,null);
 for(const id of ['C23','C28','C25','C18'])assert.equal(effective(content,state,id).origin,'background');
 assert.equal(effective(content,state,'C27').origin,'background');
 assert.equal(effective(content,state,'C18').answer,null,'Context has no reviewer answer.');
 assert.equal(effective(content,state,'C19').origin,'unanswered','Secondary-market monitoring remains a distinct disputed inference.');
 assert.equal(claimUsers(content,'C27').length,4);
 assert(!claimAncestors(content,'S1582_TR_oppose_02').includes('C27'));
 assert(claimAncestors(content,'S1582_TR_oppose_02').includes('C17'));
 assert.equal(progress(content,state).arguments,0,'Derived outcomes do not complete unread pages.');
});
test('prior procedure answers survive while only affected argument bases and comparisons become stale',()=>{
 const prior=structuredClone(content);
 prior.procedure.revision='statutory-background-20261106-v1';
 prior.procedure.background=prior.procedure.background.filter(f=>f.classification!=='uncontested_sourced_context');
 prior.procedure.retained_questions=prior.claims.filter(c=>!backgroundFact(prior,c.id)).map(c=>({id:c.id}));
 let saved=newState(prior,77);
 for(const claim of judgedClaims(prior))saved=editState(prior,saved,{type:'judgment',id:claim.id,answer:'yes'});
 for(const argument of prior.arguments)saved=editState(prior,saved,{type:'judgment',id:argument.id,answer:'yes'});
 const affected='S1582_UNC_oppose_03';
 const unaffected=content.arguments.find(a=>claimAncestors(content,a.id).length>0&&claimAncestors(content,a.id).every(id=>backgroundFact(content,id)?.classification==='verified_statutory_background'));
 assert.ok(unaffected,'Fixture must include an unchanged statutory-only basis.');
 for(const id of [affected,unaffected.id])saved=editState(prior,saved,{type:'complete',id});
 saved=editState(prior,saved,{type:'comparison',value:'UNC',answer:'support'});
 const before=structuredClone(saved);
 assert.equal(validateState(content,saved),saved);
 assert.equal(effective(content,saved,affected).origin,'reassess');
 assert.equal(effective(content,saved,affected).direct,'yes');
 assert.equal(pageComplete(content,saved,affected),false);
 assert.equal(basis(content,saved,unaffected.id),basis(prior,saved,unaffected.id));
 assert.equal(pageComplete(content,saved,unaffected.id),true);
 assert.notEqual(comparisonBasis(content,saved,'UNC'),saved.comparisons.UNC.basis);
 assert.equal(strengthResult(content,saved,'UNC'),'Pending');
 assert.deepEqual(saved,before,'Reading the new procedure must not rewrite a response.');
 const updated=editState(content,saved,{type:'judgment',id:affected,answer:'yes'});
 assert.equal(updated.procedureRevision,content.procedure.revision);
 assert.deepEqual(updated.order,saved.order);assert.deepEqual(updated.judgments.C01,saved.judgments.C01);
 assert.deepEqual(updated.history.slice(0,-1),saved.history);assert.deepEqual(updated.comparisons,saved.comparisons);
 assert.equal(effective(content,updated,affected).origin,'direct');
 assert.throws(()=>validateState(content,{...saved,procedureRevision:'unknown-v99'}),/different coding procedure/);
});
