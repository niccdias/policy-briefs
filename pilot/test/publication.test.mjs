import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile,writeFile,mkdir,mkdtemp,rm} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import {validatePublication,retainedSample,publicationBinding,assertPublicationReady,findingRecordHash} from '../publication-gate.mjs';

function candidate(){
 const content={schema_version:1,version:'frozen',claims:[],arguments:[{id:'A',value_id:'V',direction:'support',paths:[{requires:[]}],pro_html:'<p>A limited claim.</p>'},{id:'B',value_id:'V',direction:'support',paths:[{requires:[]}],pro_html:'<p>Another claim.</p>'}],values:[{id:'V',bill_id:'BILL'}],catalog:[{id:'A',retired:false},{id:'B',retired:false}],expected_counts:{active:2,historical:2},release:{content_id:'content-1'},procedure:{base_content_version:'frozen',revision:'p1',background:[],retained_questions:[]}};
 const binding={content_id:'content-1',procedure_id:'procedure-1',mapping_id:'mapping-1',rendered_id:'rendered-1',content_sha256:'c',procedure_sha256:'p',mapping_sha256:'m'};
 const findings=[{id:'F1',classification:'confirmed_defect',status:'closed',disposition:'corrected',patch_ids:['P1'],rationale:'The source scope was restored.',affected_ids:['A'],origins:[{path:'clarity-a.json',locator:'F1'}],source_locators:[],reading_limit:'Synthetic fixture, no external source.',comparable_scope:'The two synthetic arguments were inspected.',author:'Opus author'}];
 const approval={schema_version:1,binding:structuredClone(binding),findings,coverage:{arguments:2,values:1,historical_ids:2},mandatory_argument_ids:['A'],patches:[{patch_id:'P1',collection:'arguments',record_id:'A',field_path:['pro_html'],before:'<p>Too broad.</p>',after:'<p>A limited claim.</p>'}],banned_phrases:['This gap does not break the argument']};
 const author={model:'claude-opus-5-5',effort:'high',binding:structuredClone(binding),approved_findings:['F1'],dispositions:structuredClone(findings)};
 const verification={model:'gpt-6.1-sol',effort:'max',binding:structuredClone(binding),pass:true,open_material_findings:[],checked_findings:['F1'],findings:[{id:'F1',classification:'confirmed_defect',disposition:'corrected',pass:true,evidence:'The source and corrected text were inspected.',verifier:'Independent Sol verifier',checked_at:'2026-11-07T12:00:00Z',record_sha256:findingRecordHash(content,findings[0]),...Object.fromEntries(['content_id','procedure_id','mapping_id'].map(key=>[key,binding[key]]))}],mandatory_inspection:{pass:true,argument_ids:['A'],claim_ids:[]},retained_sample:{pass:true,content_id:'content-1',rows:retainedSample(content,['A']),argument_ids:['B']}};
 verification.checks=Object.fromEntries(['mirrors','quotations','source_bindings','retirements','dependencies','comparable_cases'].map(k=>[k,{pass:true,evidence:'Inspected the candidate.'}]));
 return {content,binding,inventory:[{id:'F1'}],approval,author,verification};
}

function refresh(c){
 c.author.dispositions=structuredClone(c.approval.findings);
 c.author.approved_findings=c.approval.findings.map(f=>f.id);c.inventory=c.approval.findings.map(({id})=>({id}));
 c.verification.checked_findings=[...c.author.approved_findings];
 c.verification.findings=c.approval.findings.map(f=>({...c.verification.findings[0],id:f.id,classification:f.classification,disposition:f.disposition,record_sha256:findingRecordHash(c.content,f)}));
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

test('merged defects cannot be waived as human decisions or declared limits',()=>{
 for(const [classification,disposition] of [['human_coding_judgment','left_for_human_coding'],['declared_limit','disclosed']]){
  const c=candidate(),f=c.approval.findings[0];
  c.approval.findings.push({...f,id:'F2',classification,disposition,patch_ids:[]});
  Object.assign(f,{disposition:'merged',merged_into:'F2',patch_ids:[]});c.approval.patches=[];refresh(c);
  assert.throws(()=>validatePublication(c),/cannot close its original class/);
 }
});

test('a correction needs a real related change and mandatory inspection',()=>{
 for(const change of [
  c=>c.approval.patches[0].before=c.approval.patches[0].after,
  c=>Object.assign(c.approval.patches[0],{record_id:'B',after:c.content.arguments[1].pro_html}),
  c=>{c.approval.mandatory_argument_ids=[];c.verification.mandatory_inspection.argument_ids=[];c.verification.retained_sample.rows=retainedSample(c.content,[]);c.verification.retained_sample.argument_ids=c.verification.retained_sample.rows.map(r=>r.argument_id).filter(Boolean);},
 ]){const c=candidate();change(c);assert.throws(()=>validatePublication(c),/Publication blocked/);}
});

test('editorial wording is checked inside quotes, bill context and separate background',()=>{
 for(const change of [
  c=>{c.content.arguments[0].pro_html='<p>“This gap does not break the argument”</p>';c.approval.patches[0].after=c.content.arguments[0].pro_html;},
  c=>c.content.bill={id:'BILL',description:'This gap does not break the argument'},
  c=>{c.content.claims=[{id:'C',statement:'A synthetic provision.',prerequisite_paths:[{requires:[]}]}];for(const a of c.content.arguments)a.paths[0].requires=['C'];c.content.procedure.background=[{id:'C',statement:'A synthetic provision.',section:'1',source_quote:'Synthetic source.',source_refs:['source'],background_html:'This gap does not break the argument'}];c.verification.mandatory_inspection.claim_ids=['C'];},
 ]){const c=candidate();change(c);refresh(c);assert.throws(()=>validatePublication(c),/editorial-verdict/);}
});

test('source limits, authorship, comparable checks and dated record verification are required',()=>{
 for(const field of ['origins','source_locators','reading_limit','comparable_scope','author']){
  const c=candidate();delete c.approval.findings[0][field];refresh(c);assert.throws(()=>validatePublication(c),/Publication blocked/);
 }
 for(const field of ['verifier','checked_at','record_sha256','content_id','procedure_id','mapping_id']){
  const c=candidate();delete c.verification.findings[0][field];assert.throws(()=>validatePublication(c),/Publication blocked/);
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

test('on-disk inventory edits, missing sources and changed receipts block publication',async()=>{
 const dir=await mkdtemp(join(tmpdir(),'publication-gate-test-')),base=pathToFileURL(dir+'/');
 const sha=value=>createHash('sha256').update(value).digest('hex');
 const put=async(path,value)=>writeFile(new URL(path,base),typeof value==='string'?value:JSON.stringify(value));
 try{
  for(const name of ['procedure','review-inputs','review-receipts'])await mkdir(new URL(name+'/',base));
  const c=candidate();
  for(const finding of [c.approval.findings[0],c.author.dispositions[0],c.verification.findings[0]])finding.id='clarity-a:F1';
  c.author.approved_findings=['clarity-a:F1'];c.verification.checked_findings=['clarity-a:F1'];
  await put('content.json',c.content);await put('procedure/contract.md','Approved procedure.');await put('ui-copy.json',{});
  const sources=[],hashes={};
  for(const name of ['clarity-a.json','clarity-b.json','clarity-c.json','retained.json','closure.json']){
   const rows=name==='clarity-a.json'?[{id:'F1'}]:[],bytes=JSON.stringify(rows);
   await put('review-inputs/'+name,bytes);hashes[name]=sha(bytes);sources.push({path:name,sha256:hashes[name],findings:rows.map(()=>({id:'clarity-a:F1',locator:'F1'}))});
  }
  const report='The independent report inspected F1.';await put('review-inputs/report.md',report);hashes['report.md']=sha(report);
  sources.push({path:'report.md',sha256:sha(report),findings:[{id:'clarity-a:F1',locator:'F1'}]});
  const sourceBytes=JSON.stringify(sources);await put('finding_sources.json',sourceBytes);
  const binding=await publicationBinding(c.content,base);
  for(const receipt of [c.approval,c.author,c.verification]){receipt.binding=binding;receipt.inventory_sources=hashes;receipt.finding_sources_sha256=sha(sourceBytes);}
  for(const check of c.verification.findings)for(const key of ['content_id','procedure_id','mapping_id'])check[key]=binding[key];
  c.approval.receipts={};
  for(const [key,receipt] of [['author',c.author],['verification',c.verification]]){
   const path=`review-receipts/${key}.json`,bytes=JSON.stringify(receipt);await put(path,bytes);c.approval.receipts[key]={path,sha256:sha(bytes)};
  }
  await put('publication.json',c.approval);
  assert.equal((await assertPublicationReady(base)).pass,true);
  await put('review-inputs/report.md','A new finding F2.');await assert.rejects(assertPublicationReady(base),/inventory changed/);
  await put('review-inputs/report.md',report);
  await put('review-receipts/verification.json',{});await assert.rejects(assertPublicationReady(base),/receipt hash/);
  await rm(new URL('review-inputs/retained.json',base));await assert.rejects(assertPublicationReady(base),/inventory is incomplete/);
 }finally{await rm(dir,{recursive:true,force:true});}
});
