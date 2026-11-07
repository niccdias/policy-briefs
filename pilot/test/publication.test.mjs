import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {validatePublication,retainedSample} from '../publication-gate.mjs';

function candidate(){
 const content={schema_version:1,version:'frozen',claims:[],arguments:[{id:'A',value_id:'V',direction:'support',paths:[{requires:[]}],pro_html:'<p>A limited claim.</p>'}],values:[{id:'V'}],catalog:[{id:'A',retired:false}],expected_counts:{active:1,historical:1},release:{content_id:'content-1'},procedure:{base_content_version:'frozen',revision:'p1',background:[],retained_questions:[]}};
 const binding={content_id:'content-1',procedure_id:'procedure-1',mapping_id:'mapping-1',rendered_id:'rendered-1',content_sha256:'c',procedure_sha256:'p',mapping_sha256:'m'};
 const findings=[{id:'F1',classification:'confirmed_defect',status:'closed',disposition:'corrected',patch_ids:['P1'],rationale:'The source scope was restored.',affected_ids:['A']}];
 const approval={schema_version:1,binding:structuredClone(binding),findings,coverage:{arguments:1,values:1,historical_ids:1},mandatory_argument_ids:[],patches:[{patch_id:'P1',collection:'arguments',record_id:'A',field_path:['pro_html'],before:'<p>Too broad.</p>',after:'<p>A limited claim.</p>'}],banned_phrases:['This gap does not break the argument']};
 const author={model:'claude-opus-5-5',effort:'high',binding:structuredClone(binding),approved_findings:['F1'],dispositions:structuredClone(findings)};
 const verification={model:'gpt-6.1-sol',effort:'max',binding:structuredClone(binding),pass:true,open_material_findings:[],checked_findings:['F1'],findings:[{id:'F1',classification:'confirmed_defect',disposition:'corrected',pass:true,evidence:'The source and corrected text were inspected.'}],mandatory_inspection:{pass:true,argument_ids:[],claim_ids:[]},retained_sample:{pass:true,content_id:'content-1',rows:retainedSample(content,[]),argument_ids:['A']}};
 verification.checks=Object.fromEntries(['mirrors','quotations','source_bindings','retirements','dependencies','comparable_cases'].map(k=>[k,{pass:true,evidence:'Inspected the candidate.'}]));
 return {content,binding,inventory:[{id:'F1'}],approval,author,verification};
}

test('the closure gate accepts a complete independently checked candidate',()=>{
 assert.equal(validatePublication(candidate()).pass,true);
});

test('an audit log, human-judgment waiver, or missing inventory row cannot close a defect',()=>{
 for(const change of [
  c=>c.approval.findings[0].disposition='open',
  c=>c.approval.findings[0].disposition='human_judgment',
  c=>c.inventory.push({id:'F2'}),
  c=>c.approval.findings.push({...c.approval.findings[0]}),
  c=>c.verification.open_material_findings.push('F1'),
  c=>c.verification.findings[0].pass=false,
 ]){
  const c=candidate();change(c);assert.throws(()=>validatePublication(c),/Publication blocked/);
 }
});

test('content, procedure, mapping and rendered approvals all expire on a candidate change',()=>{
 for(const key of Object.keys(candidate().binding)){
  const c=candidate();c.binding[key]+='changed';assert.throws(()=>validatePublication(c),/different candidate|stale/);
 }
 const c=candidate();c.author.binding={...c.binding,content_sha256:'older'};
 assert.throws(()=>validatePublication(c),/stale/);
});

test('uncertainty must have its approved qualification in the current content',()=>{
 const c=candidate(),finding=c.approval.findings[0];
 Object.assign(finding,{classification:'genuine_uncertainty',disposition:'qualified',qualifications:[{id:'A',field:'pro_html',text:'A limited claim.'}]});
 c.author.dispositions=structuredClone(c.approval.findings);c.verification.findings[0].disposition='qualified';c.verification.findings[0].classification='genuine_uncertainty';
 assert.equal(validatePublication(c).pass,true);
 c.content.arguments[0].pro_html='<p>Unqualified.</p>';
 assert.throws(()=>validatePublication(c),/qualification|not applied/);
});

test('a retirement disposition requires the historical ID to be retired',()=>{
 const c=candidate();c.approval.findings[0].disposition='retired';c.author.dispositions=structuredClone(c.approval.findings);c.verification.findings[0].disposition='retired';
 assert.throws(()=>validatePublication(c),/still active/);
});

test('mandatory inspection and the seeded retained sample cannot be replaced by a pass label',()=>{
 for(const change of [c=>c.verification.mandatory_inspection.claim_ids.push('invented'),c=>c.verification.retained_sample.argument_ids=[],c=>c.verification.retained_sample.rows[0].argument_id=null,c=>c.verification.retained_sample.content_id='older']){
  const c=candidate();change(c);assert.throws(()=>validatePublication(c),/Publication blocked/);
 }
});

test('every publication entry point enforces closure before writing build output',async()=>{
 const publicView=await readFile(new URL('../public-view.mjs',import.meta.url),'utf8');
 const build=await readFile(new URL('../build.mjs',import.meta.url),'utf8');
 const workflow=await readFile(new URL('../../.github/workflows/deploy.yml',import.meta.url),'utf8');
 assert.ok(publicView.indexOf('await assertPublicationReady();')<publicView.indexOf('const content=JSON.parse(await readFile(source'));
 assert.ok(build.indexOf('await assertPublicationReady();')<build.indexOf('await mkdir(out'));
 assert.ok(workflow.indexOf('node pilot/publication-gate.mjs')<workflow.indexOf('node pilot/public-view.mjs --write'));
});
