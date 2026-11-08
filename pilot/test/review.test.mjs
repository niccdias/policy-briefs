import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {newState,editState,validateState} from '../src/core.mjs';
import {reviewFilters,newReviewView,reviewKey,makeReviewIndex,reviewRows,filterReviewRows,readReviewView} from '../src/review.mjs';

const content={schema_version:1,version:'review-test',bill:{bill:'S.1',title:'Test bill'},values:[{id:'V',name:'Concern'}],claims:[{id:'C',title:'Shared money claim',statement:'The funding reaches local lenders.',prerequisite_paths:[{id:'cp',requires:[]}],support_html:'<p>Claim evidence.</p>',objection_html:'<p>A disputed inference.</p>'}],arguments:[{id:'A',title:'Health access',value_id:'V',direction:'support',paths:[{id:'ap',requires:['C']}],pro_html:'<p>Lower treatment costs.</p>',con_html:'<p>Limited rural reach.</p>'},{id:'B',title:'Service risk',value_id:'V',direction:'oppose',paths:[{id:'bp',requires:['C']}],pro_html:'<p>Loss of local services.</p>',con_html:'<p>Other services remain.</p>'}],evidence_placement:{nodes:Object.fromEntries(['C','A','B'].map(id=>[id,{support:[],response:[],strength:[]}]))}};
const index=makeReviewIndex(content,html=>html.replace(/<[^>]+>/g,' ')),rows=s=>reviewRows(content,s,index),set=(s,id,answer,notes='')=>editState(content,s,{type:'judgment',id,answer,notes});
const filtered=(s,filters={})=>filterReviewRows(rows(s),{...reviewFilters,...filters});

test('default review includes only actual work and all-assigned keeps assigned order',()=>{
 let s=newState(content,13);assert.deepEqual(filtered(s),[]);
 assert.deepEqual(filtered(s,{scope:'all'}).map(r=>r.id),s.order);
 s=editState(content,s,{type:'notes',id:'A',notes:'A draft note'});
 assert.deepEqual(filtered(s).map(r=>r.id),['A']);
 s=set(s,'C','yes');s=set(s,'B','no');
 assert.deepEqual(filtered(s).map(r=>r.id),s.order.filter(id=>['A','B','C'].includes(id)));
});
test('search finds wording, responses, identifiers and personal notes with combined filters',()=>{
 let s=set(newState(content,1),'A','yes','Check the clinic estimate');
 assert.deepEqual(filtered(s,{query:'TREATMENT costs'}).map(r=>r.id),['A']);
 assert.deepEqual(filtered(s,{query:'rural reach'}).map(r=>r.id),['A']);
 assert.deepEqual(filtered(s,{query:'clinic',bill:'S.1',value:'V',type:'argument',status:'yes'}).map(r=>r.id),['A']);
 assert.deepEqual(filtered(s,{query:'clinic',type:'claim'}),[]);
 assert.deepEqual(filtered(s,{query:'no matching phrase'}),[]);
 s=set(s,'C','yes');assert.deepEqual(filtered(s,{query:'lenders',type:'claim',value:'V'}).map(r=>r.id),['C']);
});
test('derived No retains direct Yes distinctly and becomes stale after premise edits',()=>{
 let s=set(newState(content,2),'C','yes');s=set(s,'A','yes','Prior direct judgment');
 s=editState(content,s,{type:'complete',id:'A'});s=set(s,'C','no');
 const row=rows(s).find(r=>r.id==='A');
 assert.equal(row.answer,'no');assert.equal(row.origin,'derived');assert.equal(row.earlierAnswer,'yes');assert.equal(row.complete,false);
 assert.ok(row.statuses.includes('derived'));assert.ok(row.statuses.includes('reassess'));
 assert.ok(!filtered(s,{status:'yes'}).some(r=>r.id==='A'));
 s=set(s,'C','yes');assert.equal(rows(s).find(r=>r.id==='A').origin,'reassess');
});
test('summary work includes comparison notes and omitted reasons, preserving distinct results',()=>{
 let s=newState(content,3);s=editState(content,s,{type:'omission',value:'V',direction:'oppose',text:'Missing access mechanism'});
 assert.deepEqual(filtered(s).map(r=>r.id),['summary:V']);
 assert.deepEqual(filtered(s,{query:'access mechanism'}).map(r=>r.id),['summary:V']);
 s=set(s,'C','yes');s=set(s,'A','yes');s=set(s,'B','yes');
 s=editState(content,s,{type:'comparison',value:'V',answer:'support',notes:'Wider reach'});
 let summary=rows(s).find(r=>r.type==='summary');assert.equal(summary.answer,'Both');assert.equal(summary.strength,'support');
 s=set(s,'A','no');summary=rows(s).find(r=>r.type==='summary');
 assert.equal(summary.answer,'Oppose');assert.equal(summary.strength,null);assert.equal(summary.earlierAnswer,'support');assert.equal(summary.stale,true);
 assert.equal(s.comparisons.V.answer,'support');
});
test('summary completion and Pending strength are independent statuses',()=>{
 let s=newState(content,3);for(const id of ['C','A','B'])s=set(s,id,'yes');
 for(const id of ['A','B'])s=editState(content,s,{type:'complete',id});
 s=editState(content,s,{type:'comparison',value:'V',answer:'Pending'});s=editState(content,s,{type:'summary',value:'V'});
 const row=rows(s).find(r=>r.type==='summary');assert.equal(row.complete,true);assert.equal(row.answer,'Both');assert.equal(row.strength,'Pending');assert.ok(row.statuses.includes('Pending'));
});
test('indexing, filtering and restoring review leave the complete saved record unchanged',()=>{
 let s=set(newState(content,8),'C','yes');s=set(s,'A','yes','Keep these notes');
 const before=JSON.stringify(s),view={...newReviewView(),open:true,target:'A',filters:{...reviewFilters,query:'notes',bill:'S.1'},scroll:813,focus:'A'};
 filtered(s,{scope:'all'});readReviewView(JSON.stringify(view),content,s);
 assert.equal(JSON.stringify(s),before);
 const edited=editState(content,s,{type:'notes',id:'A',notes:'Changed notes'});
 assert.equal(edited.cursor,s.cursor);assert.deepEqual(edited.order,s.order);assert.deepEqual(edited.judgments,s.judgments);assert.deepEqual(edited.comparisons,s.comparisons);
});
test('review restoration validates local data and namespaces accounts and session kinds',()=>{
 const s=newState(content,4),view={...newReviewView(),open:true,target:'summary:V',scroll:450,focus:'A'};
 assert.deepEqual(readReviewView(JSON.stringify(view),content,s),view);assert.deepEqual(readReviewView(null,content,s),newReviewView());
 assert.notEqual(reviewKey('one','v--qa'),reviewKey('two','v--qa'));assert.notEqual(reviewKey('one','v--qa'),reviewKey('one','v--research'));
 for(const patch of [{target:'missing'},{scroll:-1},{filters:{...reviewFilters,status:'invalid'}},{filters:{...reviewFilters,value:'missing'}},{open:'yes'}])assert.throws(()=>readReviewView(JSON.stringify({...view,...patch}),content,s));
 assert.throws(()=>readReviewView('broken',content,s));
});
test('summary search includes displayed argument bodies and only current strength evidence',()=>{
 const c=structuredClone(content);c.evidence_placement.nodes.A.strength=[{id:'strength-A',html:'<p>A unique measure of reach.</p>',inherit:true}];
 const i=makeReviewIndex(c,html=>html.replace(/<[^>]+>/g,' '));
 let s=newState(c,3);const matches=query=>filterReviewRows(reviewRows(c,s,i),{...reviewFilters,scope:'all',type:'summary',query});
 assert.equal(matches('treatment costs').length,1);assert.equal(matches('unique measure').length,0);
 for(const id of ['C','A','B'])s=editState(c,s,{type:'judgment',id,answer:'yes'});
 assert.equal(matches('unique measure').length,1);
 s=editState(c,s,{type:'judgment',id:'A',answer:'no'});assert.equal(matches('unique measure').length,0);
});
test('real release index covers every active decision and excludes background and retired IDs',async()=>{
 const c=JSON.parse(await readFile(new URL('../release/content.json',import.meta.url))),s=newState(c,51),before=JSON.stringify(s),realIndex=makeReviewIndex(c,html=>html.replace(/<[^>]+>/g,' '));
 const result=reviewRows(c,s,realIndex),background=new Set(c.procedure.background.map(f=>f.id));
 assert.equal(result.length,c.arguments.length+c.procedure.retained_questions.length+c.values.length);
 assert.ok(result.every(row=>!background.has(row.id)&&!c.catalog.some(a=>a.id===row.id&&a.retired)));
 assert.deepEqual(result.map(r=>r.id),s.order.filter(id=>realIndex.has(id)));assert.equal(JSON.stringify(s),before);assert.ok(validateState(c,s));
 for(const row of result.filter(r=>r.type==='claim'))assert.ok(row.valueIds.length>0);
 const bill=s.order.find(id=>id.startsWith('bill:'));
 assert.ok(bill);assert.throws(()=>readReviewView(JSON.stringify({...newReviewView(),open:true,target:bill}),c,s));
});
