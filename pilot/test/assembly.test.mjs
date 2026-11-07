import test from 'node:test';
import assert from 'node:assert/strict';
import {assembleOtherBills,sha256} from '../assemble-other-bills.mjs';
import {newState,editState,effective,codingOrder} from '../src/core.mjs';
import {readingHTML,strengthEvidence} from '../src/evidence.mjs';

function fixture(slug='a'){
 const note='<strong>Evidence note:</strong> The study covers one place. Size is unknown. <span class="note-sources">Sources: <a href="https://example.test/source">[1]</a>.</span>';
 const ps=[1,2].map(i=>({point_id:`${slug}_${i}`,number:i,title:'Original title',pro_html:`<p>Original supported route ${i}.</p>`,con_html:'<p>No defensible CON retained.</p>',no_point_specific_con:true,notes_html:`<div><p>${note}</p></div>`,note_ids:['N1']}));
 const authority={bank_sha256:'frozen',pages:[{bill_id:slug,bill:slug.toUpperCase(),bill_title:'Test bill',value_id:'UNC',value:'Concern',statements:['Care about others'],reference:'[NAME]',description:'Old description',source_url:'https://example.test/brief',comparison:'Law in force',text_version:'ih',text_date:'2025-01-01',evidence_cutoff:'2026-07-17',directions:[{direction:'support',points:ps},{direction:'oppose',points:[]}]}]};
 const mapping={bill_id:slug,bill_description:'Plain bill description',retired_ids:[],proposed_retirements:[],claims:[{id:'C01',title:'Shared law',statement:'The bill has this rule.',classification:'verified_statutory_background',classification_reason:'Direct law',section:'1',source_quote:'Exact rule',scope_html:'<p>Scope.</p>',support_html:'<p>Evidence.</p>',objection_html:'<p>No objection.</p>',notes_html:'',source_refs:[{brief_id:'UNC_support_pro',doc_id:'bill_text'}],members:ps.map(p=>({point_id:p.point_id,original_excerpt:p.pro_html,equivalence_reason:'Same rule.'})),prerequisite_paths:[{id:'CP1',requires:[]}]}],arguments:ps.map(p=>({...p,title:'Clear title',pro_html:`<p>Read <a href="#C01">C01</a>. Complete local link.</p>`,paths:[{id:p.point_id+'P1',requires:['C01'],original_excerpt:p.pro_html,necessity_reason:'Rule carries this route.'}],gaps:[],edits:{classification:'clarity_only',reason:'Explained the terms.'},note_routes:[{index:0,fragments:[{body_html:'<strong>Evidence note:</strong> The study covers one place. ',destination:'support',reason:'Limits source applicability.'},{body_html:note.slice('<strong>Evidence note:</strong> The study covers one place. '.length),destination:'strength',reason:'Size only.'}]}]}))};
 return {slug,authority,mapping,checks:{all_pass:true}};
}
function approve(p){p.mappingBytes=Buffer.from(JSON.stringify(p.mapping));p.review={approved:true,mapping_sha256:sha256(p.mappingBytes),accepted_retirements:p.mapping.proposed_retirements.map(a=>a.point_id)};return p;}
const assemble=(...ps)=>assembleOtherBills(ps.map(approve),{current_shared_claim_rule:'Disputed reused claims only.'});

test('assembly namespaces reused local IDs, keeps original notes and routes their qualifications and size',()=>{
 const c=assemble(fixture('a'),fixture('b'));
 assert.deepEqual(c.claims.map(c=>c.id),['A_C01','B_C01']);
 const a=c.arguments[0];assert.equal(a.notes_html,a.original.notes_html);assert.match(a.pro_html,/#A_C01/);
 const support=readingHTML(c,a,'support');assert.match(support,/study covers one place/);assert.doesNotMatch(support,/Size is unknown|Evidence note:/);
 assert.match(support,/https:\/\/example.test\/source/);
 assert.match(strengthEvidence(c,[a.id])[0].html,/Size is unknown/);
 const s=newState(c,4);assert.equal(codingOrder(c,s).filter(id=>id.includes('_C01')).length,0);
 assert.equal(effective(c,s,a.id).answer,null); // background never accepts the inference
});
test('assembly refuses unsaved review decisions, altered notes and invented responses',()=>{
 const p=approve(fixture());p.mappingBytes=Buffer.from('changed');assert.throws(()=>assembleOtherBills([p],{}),/main review/);
 const notes=fixture();notes.mapping.arguments[0].notes_html='';assert.throws(()=>assemble(notes),/notes changed/);
 const con=fixture();con.mapping.arguments[0].no_point_specific_con=false;assert.throws(()=>assemble(con),/absent CON/);
});
test('a retired point remains recoverable and an unapproved retirement cannot publish',()=>{
 const p=fixture(),removed=p.mapping.arguments.pop();p.mapping.proposed_retirements.push({point_id:removed.point_id,reason:'Wrong value',source_refs:[]});
 p.mapping.claims=[];p.mapping.arguments[0].paths[0].requires=[];p.mapping.arguments[0].pro_html='<p>Local inference.</p>';
 const c=assemble(p);assert.equal(c.catalog.length,2);assert.equal(c.arguments.length,1);assert.equal(c.catalog[1].original.title,'Original title');assert.equal(c.catalog[1].retired,true);
 const unapproved=approve(p);unapproved.review.accepted_retirements=[];assert.throws(()=>assembleOtherBills([unapproved],{}),/unreviewed retirement/);
});
test('a rejected genuinely disputed claim blocks only its dependent routes',()=>{
 const p=fixture();Object.assign(p.mapping.claims[0],{classification:'judgment'});
 const c=assemble(p);let s=newState(c,2);s=editState(c,s,{type:'judgment',id:'A_C01',answer:'no'});
 assert.equal(effective(c,s,'a_1').origin,'derived');assert.equal(effective(c,s,'a_2').origin,'derived');
});
