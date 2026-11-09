import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {pathToFileURL,fileURLToPath} from 'node:url';
import {resolve} from 'node:path';
import {execFileSync} from 'node:child_process';
import assert from 'node:assert/strict';
import {plainText} from '../bill_reasoning_pilot_20261108/hr5408/logic.mjs';
const site=resolve(process.argv[2]??'');
assert(process.argv[2],'Pass the approved website checkout path.');
const here=new URL('./',import.meta.url),read=async path=>JSON.parse(await readFile(path,'utf8')),sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const contentPath=resolve(site,'pilot/release/content.json'),contentBytes=await readFile(contentPath),content=JSON.parse(contentBytes);
const ui=await read(resolve(site,'pilot/release/ui-copy.json'));
const {readingHTML,strengthEvidence,displayBackground}=await import(pathToFileURL(resolve(site,'pilot/src/evidence.mjs')));
assert.equal(content.bills.length,8);assert.equal(content.arguments.length,502);
const upstreamCommit=execFileSync('git',['-C',site,'rev-parse','HEAD'],{encoding:'utf8'}).trim(),rows=[];
for(const bill of content.bills){
 const values=content.values.filter(item=>item.bill_id===bill.id),args=content.arguments.filter(item=>item.bill_id===bill.id),claims=content.claims.filter(item=>item.bill_id===bill.id);
 const slug=values[0].source_url.match(/\/arguments\/([^/]+)/)?.[1];assert(slug);
 const folder=new URL('bills/'+slug+'/',here);await mkdir(new URL('input/',folder),{recursive:true});
 let source;
 if(slug==='hr5408'){
  source=await read(new URL('../bill_reasoning_pilot_20261108/hr5408/input/source.json',here));
  const coverage=await read(new URL('../bill_reasoning_pilot_20261108/hr5408/decision-tree/coverage.json',here));
  const mapping=await read(new URL('../bill_reasoning_pilot_20261108/hr5408/map.json',here));
  source.requirements={arguments:source.arguments.map(item=>item.id),responses:coverage.challenges.map(item=>({id:item.id,argument_ids:[],source_refs:[]})),qualifications:coverage.qualifications.map(({id,argument_ids,source_refs})=>({id,argument_ids,source_refs}))};
  for(const item of source.requirements.responses){const challenge=mapping.challenges.find(prior=>prior.id===item.id);assert(challenge);item.source_refs=challenge.source_refs??[];item.argument_ids=[...new Set((challenge.argument_ids??challenge.targets?.filter(target=>target.type==='argument').map(target=>target.id)??[]).filter(id=>source.arguments.some(arg=>arg.id===id)))];}
 }else{
  const background=new Map(content.procedure.background.filter(item=>!item.bill_id||item.bill_id===bill.id).map(item=>[item.id,item]));
  const scopedClaims=claims.map(claim=>({...claim,...(background.has(claim.id)?Object.fromEntries(Object.entries(background.get(claim.id)).filter(([key])=>['classification','classification_reason','section','source_quote','scope_html','statement'].includes(key))):{}),background_html:displayBackground(claim)}));
  source={schema_version:1,bill,values,claims:scopedClaims,arguments:args,readings:Object.fromEntries([...args,...claims].map(item=>[item.id,{support:readingHTML(content,item,'support'),response:readingHTML(content,item,'response'),strength:strengthEvidence(content,[item.id])}])),ui_copy:ui,release:content.release,version:content.version};
  const responses=[],qualifications=[],argIds=new Set(args.map(item=>item.id)),prefix=values[0].id.split('_')[0];
  const ref=(item,field,text)=>({id:item.id,field,quote:plainText(text).slice(0,240)});
  for(const item of [...args,...scopedClaims]){
   const members=item.value_id?[item.id]:[...new Set((item.members??[]).map(member=>member.point_id).filter(id=>argIds.has(id)))];
   const response=source.readings[item.id].response;
   if(item.value_id?!item.no_point_specific_con:plainText(item.objection_html??'').length>0){assert(plainText(response));responses.push({id:prefix+'_RESPONSE_'+item.id,argument_ids:members,source_refs:[ref(item,'response_reading',response)]});}
   for(const field of ['notes_html','scope_html'])if(plainText(item[field]??''))qualifications.push({id:prefix+'_QUAL_'+item.id+'_'+field,argument_ids:members,source_refs:[ref(item,field,item[field])]});
   for(const [index,gap] of (item.gaps??[]).entries())if(gap.explanation?.trim())qualifications.push({id:prefix+'_QUAL_'+item.id+'_gap_'+index,argument_ids:members,source_refs:[ref(item,`gaps[${index}].explanation`,gap.explanation)]});
  }
  source.requirements={arguments:args.map(item=>item.id),responses,qualifications};
 }
 assert.equal(source.values.length,6);assert.equal(source.arguments.length,args.length);
 const bytes=JSON.stringify(source,null,2)+'\n',target=new URL('input/source.json',folder);
 try{const previous=await readFile(target);assert.equal(previous.toString(),bytes,'Frozen input already exists with different bytes: '+target);}catch(error){if(error.code!=='ENOENT')throw error;await writeFile(target,bytes);}
 const row={slug,bill_id:bill.id,bill:bill.bill,title:bill.title,source_sha256:sha(bytes),arguments:args.length,responses:source.requirements.responses.length,qualifications:source.requirements.qualifications.length};rows.push(row);
 console.log(JSON.stringify(row));
}
await writeFile(new URL('input-manifest.json',here),JSON.stringify({schema_version:1,upstream_repository:'niccdias/policy-briefs',upstream_commit:upstreamCommit,upstream_content_sha256:sha(contentBytes),reviewer_records_included:false,bills:rows},null,2)+'\n');
