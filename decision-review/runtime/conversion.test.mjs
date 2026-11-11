import test from 'node:test';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {existsSync} from 'node:fs';
import {applyHr5408Amendment,buildHr5408} from '../convert-hr5408.mjs';

const sha=value=>createHash('sha256').update(JSON.stringify(value,null,2)+'\n').digest('hex');
function fixture(){
 const original={decisions:{contexts:[],blocks:[{id:'evidence',html:'<p>The study reports fewer infections. ILI means flu-like illness.</p>',source_refs:[{id:'source',quote:'fewer infections'}]}],nodes:[{id:'claim',claim_html:'<p>Fewer infections.</p>',routes:[{id:'root',requires:[]}]}],glossary:[]},copy:{}};
 const amended=structuredClone(original);amended.decisions.blocks[0].html='<p>The study reports fewer infections.</p>';amended.decisions.glossary=[{term:'ILI',definition:'Flu-like illness.'}];amended.copy.bill_description='The bill requires mediation.';
 const amendment={schema_version:1,initial_package_sha256:{'decisions.json':sha(original.decisions),'copy.json':sha(original.copy)},amended_package_sha256:{'decisions.json':sha(amended.decisions),'copy.json':sha(amended.copy)},changes:[{collection:'blocks',id:'evidence',field:'html',before:original.decisions.blocks[0].html,after:amended.decisions.blocks[0].html},{collection:'decisions',field:'glossary',before:original.decisions.glossary,after:amended.decisions.glossary},{collection:'copy',field:'bill_description',before:null,after:amended.copy.bill_description}]};
 return {original,amended,amendment};
}

test('approved definition amendments reproduce the exact current and original packages',()=>{
 const {original,amended,amendment}=fixture(),before=structuredClone(original);
 assert.deepEqual(applyHr5408Amendment(original.decisions,original.copy,amendment),amended);
 assert.deepEqual(applyHr5408Amendment(amended.decisions,amended.copy,amendment,true),original);
 assert.deepEqual(original,before,'Applying amendments must not change caller-owned data.');
});

test('unlisted text, reference, route, glossary and description edits fail the amendment proof',()=>{
 const {amended,amendment}=fixture();
 for(const mutate of [value=>value.decisions.blocks[0].html+=' Extra text.',value=>value.decisions.blocks[0].source_refs[0].quote='changed',value=>value.decisions.nodes[0].routes[0].requires.push('other'),value=>value.decisions.glossary[0].definition='Different meaning.',value=>value.copy.bill_description='Different description.']){
  const changed=structuredClone(amended);mutate(changed);assert.throws(()=>applyHr5408Amendment(changed.decisions,changed.copy,amendment,true),/Unexpected H.R.5408 amendment input/);
 }
});

test('amendments reject duplicate targets, unsupported fields and mismatched complete text',()=>{
 const {original,amendment}=fixture();
 const duplicate=structuredClone(amendment);duplicate.changes.push(duplicate.changes[0]);assert.throws(()=>applyHr5408Amendment(original.decisions,original.copy,duplicate),/Duplicate H.R.5408 amendment target/);
 const unsupported=structuredClone(amendment);unsupported.changes[0].field='source_refs';assert.throws(()=>applyHr5408Amendment(original.decisions,original.copy,unsupported),/Unsupported H.R.5408 amendment field/);
 const mismatch=structuredClone(amendment);mismatch.changes[0].before='A different paragraph.';assert.throws(()=>applyHr5408Amendment(original.decisions,original.copy,mismatch),/H.R.5408 amendment text mismatch/);
 const incomplete=structuredClone(amendment);incomplete.changes.pop();assert.throws(()=>applyHr5408Amendment(original.decisions,original.copy,incomplete),/Unexpected H.R.5408 amendment output/);
});
test('the converter rebuilds the committed H.R.5408 package byte for byte from the frozen pilot inputs',{skip:!existsSync(new URL('../../bill_reasoning_pilot_20261108/hr5408/',import.meta.url))&&'The frozen pilot inputs are kept only in the project.'},async()=>{
 for(const [name,text] of Object.entries(await buildHr5408()))assert.equal(text,await readFile(new URL('../bills/hr5408/'+name,import.meta.url),'utf8'),'Converter output differs from bills/hr5408/'+name);
});
