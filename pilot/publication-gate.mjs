import {readFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {stable,validateContent} from './src/core.mjs';
import {identifyRenderedRelease,renderedFiles} from './rendered-release.mjs';
import {readingHTML,strengthEvidence,displayBackground} from './src/evidence.mjs';
import {fromHtml} from 'hast-util-from-html';

const release=new URL('release/',import.meta.url);
const sha=value=>createHash('sha256').update(value).digest('hex');
const requireThat=(test,message)=>{if(!test)throw new Error(`Publication blocked: ${message}`);};
const same=(a,b)=>stable(a)===stable(b);
const unique=list=>Array.isArray(list)&&new Set(list).size===list.length;
const nonempty=value=>typeof value==='string'&&value.trim().length>0;
function readableText(html){
 const blocks=new Set(['p','div','li','ul','ol','section','article','h1','h2','h3','h4','br']);
 const visit=node=>node.type==='text'?node.value:`${blocks.has(node.tagName)?' ':''}${(node.children??[]).map(visit).join('')}${blocks.has(node.tagName)?' ':''}`;
 return visit(fromHtml(html,{fragment:true})).replace(/\s+/g,' ').trim().toLowerCase();
}
function containsPhrase(text,phrase){
 const escaped=readableText(phrase).replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 return new RegExp(`(?:^|\\W)${escaped}(?=$|\\W)`,'u').test(text);
}
const dispositions={
 confirmed_defect:['corrected','retired','merged'],
 genuine_uncertainty:['qualified','branch_removed','retired','corrected','merged'],
 human_coding_judgment:['left_for_human_coding','merged'],
 no_defect:['rejected_after_inspection','merged'],
 declared_limit:['disclosed'],
};

function patchValue(content,patch,binding,uiCopy){
 if(patch.collection==='implementation'){
  requireThat(patch.record_id==='release'&&patch.field_path?.length===1&&binding.implementation_sha256?.[patch.field_path[0]],`${patch.patch_id} has an invalid implementation target.`);
  return binding.implementation_sha256[patch.field_path[0]];
 }
 if(patch.collection==='ui'){
  requireThat(patch.record_id==='release'&&patch.field_path?.length===1&&nonempty(uiCopy?.[patch.field_path[0]]),`${patch.patch_id} has an invalid interface target.`);
  return uiCopy[patch.field_path[0]];
 }
 const editable={arguments:['title','pro_html','con_html','notes_html','gaps','paths','source_bindings'],claims:['title','statement','scope_html','background_html','support_html','objection_html','notes_html','gaps','prerequisite_paths','members','source_refs'],background:['statement','scope_html','section','source_quote','source_refs'],evidence:['support','response','strength','pro_html','con_html','support_html','objection_html'],bills:['title','description','comparison','text_version','text_date','evidence_cutoff','source_url'],values:['name','statements','reference']};
 requireThat(editable[patch.collection]?.includes(patch.field_path?.[0]),`${patch.patch_id} changes only audit metadata or an unsupported field.`);
 const list=patch.collection==='background'?content.procedure.background:patch.collection==='evidence'?Object.entries(content.evidence_placement.nodes).map(([id,fields])=>({id,...fields})):content[patch.collection];
 const record=list?.find(n=>n.id===patch.record_id);
 requireThat(record&&Array.isArray(patch.field_path)&&patch.field_path.length,`${patch.patch_id} has an invalid target.`);
 return patch.field_path.reduce((value,key)=>value?.[key],record);
}

function displayedText(content,node){
 if(!content.evidence_placement?.nodes?.[node.id])return [node.title,node.description,node.comparison,node.name,...(node.statements??[]),node.reference,node.pro_html,node.con_html,node.statement,node.scope_html,node.background_html,node.support_html,node.objection_html].filter(Boolean).join(' ');
 return [node.title,node.statement,node.scope_html,displayBackground(node),readingHTML(content,node,'support'),readingHTML(content,node,'response'),...strengthEvidence(content,[node.id]).map(e=>e.html)].filter(Boolean).join(' ');
}

function relatedArguments(content,recordIds){
 const related=new Set(recordIds);
 for(let changed=true;changed;){
  changed=false;
  for(const claim of content.claims)if(!related.has(claim.id)&&claim.prerequisite_paths?.some(path=>path.requires.some(id=>related.has(id)))){related.add(claim.id);changed=true;}
 }
 return content.arguments.filter(a=>related.has(a.id)||related.has(a.bill_id)||related.has(a.value_id)||a.paths.some(path=>path.requires.some(id=>related.has(id)))).map(a=>a.id);
}

export function mandatoryArguments(content,findings,patches){
 const records=new Set(patches.map(p=>p.record_id));
 for(const finding of findings)if(['confirmed_defect','genuine_uncertainty'].includes(finding.classification))for(const id of finding.affected_ids)records.add(id);
 return [...new Set([...relatedArguments(content,records),...content.catalog.filter(a=>a.retired&&records.has(a.id)).map(a=>a.id)])].sort();
}

export function findingRecordHash(content,finding){
 const all=[...content.arguments,...content.claims,...content.catalog,...(content.bills??[]),...content.values];
 return sha(stable([...finding.affected_ids].sort().map(id=>{
  if(id==='release')return [id,content.release];
  const node=all.find(n=>n.id===id);
  return [id,node?.retired?node.original:displayedText(content,node)];
 })));
}

export function retainedSample(content,mandatory){
 const excluded=new Set(mandatory),rows=[];
 for(const value of content.values)for(const direction of ['support','oppose']){
  const candidates=content.arguments.filter(a=>a.value_id===value.id&&a.direction===direction&&!excluded.has(a.id)).map(a=>a.id).sort();
  const seed=`${content.release.content_id}|${value.bill_id}|${value.id}|${direction}`;
  rows.push({bill_id:value.bill_id,value_id:value.id,direction,candidates:candidates.length,argument_id:candidates.length?candidates[Number(BigInt(`0x${sha(seed)}`)%BigInt(candidates.length))]:null});
 }
 return rows;
}

export async function publicationBinding(content,base=release){
 const procedureFiles=(await readdir(new URL('procedure/',base))).filter(p=>p.endsWith('.md')).sort();
 requireThat(procedureFiles.length>0,'approved procedure files are missing.');
 const procedure=[];for(const name of procedureFiles)procedure.push([name,sha(await readFile(new URL(`procedure/${name}`,base)))]);
 procedure.push(['ui-copy.json',sha(await readFile(new URL('ui-copy.json',base)))]);
 const mapping={claims:content.claims.map(c=>({id:c.id,paths:c.prerequisite_paths})),arguments:content.arguments.map(a=>({id:a.id,paths:a.paths})),catalog:content.catalog.map(({id,retired})=>({id,retired}))};
 const implementation={};for(const path of renderedFiles)implementation[path]=sha(await readFile(new URL(path,import.meta.url)));
 return {...await identifyRenderedRelease(content),content_sha256:sha(await readFile(new URL('content.json',base))),procedure_sha256:sha(stable(procedure)),mapping_sha256:sha(stable(mapping)),implementation_sha256:implementation};
}

export function validatePublication({content,binding,inventory,approval,author,verification,uiCopy}){
 validateContent(content);
 requireThat(approval.schema_version===1,'unsupported approval schema.');
 requireThat(same(approval.binding,binding),'the approval belongs to a different candidate release.');
 requireThat(same(author.binding,binding)&&same(verification.binding,binding),'review receipts are stale.');
 requireThat(author.model==='claude-opus-5-5'&&author.effort==='high','final prose needs Opus 5.5 High approval.');
 requireThat(verification.model==='gpt-6.1-sol'&&verification.effort==='max','independent verification needs Sol 6.1 Max.');
 const ids=inventory.map(i=>i.id).sort();
 requireThat(ids.length>0&&unique(ids),'the finding inventory is empty or has duplicate IDs.');
 requireThat(unique(approval.findings?.map(f=>f.id))&&same(approval.findings.map(f=>f.id).sort(),ids),'every inventoried finding needs exactly one disposition.');
 requireThat(unique(author.approved_findings)&&same([...author.approved_findings].sort(),ids),'Opus approval does not cover the full inventory.');
 requireThat(unique(verification.checked_findings)&&same([...verification.checked_findings].sort(),ids),'independent review does not cover the full inventory.');
 requireThat(verification.pass===true&&verification.open_material_findings?.length===0,'independent review has unresolved material findings.');
 requireThat(same(author.dispositions,approval.findings),'the dispositions differ from those approved by Opus.');
 const checked=new Map(verification.findings?.map(f=>[f.id,f]));
 requireThat(checked.size===ids.length&&verification.findings.length===ids.length,'independent disposition checks are incomplete or duplicated.');
 requireThat(unique(approval.patches?.map(p=>p.patch_id)),'the applied patch inventory is missing or duplicated.');
 for(const patch of approval.patches){
  requireThat(!same(patch.before,patch.after),`${patch.patch_id} makes no content change.`);
  const value=patchValue(content,patch,binding,uiCopy);
  requireThat(same(value,patch.after),`${patch.patch_id} was not applied to the current content.`);
  if(typeof patch.before==='string'&&patch.before&&typeof value==='string'&&!patch.after.includes(patch.before))requireThat(!value.includes(patch.before),`${patch.patch_id} still contains the superseded wording.`);
 }
 for(const finding of approval.findings){
  requireThat(finding.status==='closed',`${finding.id} remains open.`);
  requireThat(dispositions[finding.classification]?.includes(finding.disposition),`${finding.id} has an open or invalid disposition.`);
  requireThat(typeof finding.rationale==='string'&&finding.rationale.trim().length>0,`${finding.id} needs a reason for its disposition.`);
  requireThat(Array.isArray(finding.affected_ids)&&finding.affected_ids.every(id=>id==='release'||[...content.claims,...content.catalog,...(content.bills??[]),...content.values].some(n=>n.id===id)),`${finding.id} has an unknown affected ID.`);
  requireThat(Array.isArray(finding.origins)&&finding.origins.length>0&&finding.origins.every(o=>nonempty(o.path)&&nonempty(o.locator)),`${finding.id} has no resolvable origins.`);
  requireThat(Array.isArray(finding.source_locators)&&finding.source_locators.every(s=>nonempty(s.path)&&nonempty(s.passage??s.locator)),`${finding.id} has invalid source locators.`);
  requireThat(nonempty(finding.reading_limit)&&nonempty(finding.comparable_scope)&&nonempty(finding.author),`${finding.id} lacks its reading limit, comparable inspection or author.`);
  const check=checked.get(finding.id);
  requireThat(check?.pass===true&&check.classification===finding.classification&&check.disposition===finding.disposition&&typeof check.evidence==='string'&&check.evidence.trim(),`${finding.id} has no independent disposition evidence.`);
  requireThat(nonempty(check.verifier)&&check.verifier!==finding.author&&Number.isFinite(Date.parse(check.checked_at))&&check.record_sha256===findingRecordHash(content,finding),`${finding.id} has missing or stale independent record verification.`);
  requireThat(['content_id','procedure_id','mapping_id'].every(key=>check[key]===binding[key]),`${finding.id} verification belongs to a different release.`);
  let resolution=finding;
  if(finding.disposition==='merged'){
   const target=approval.findings.find(f=>f.id===finding.merged_into);
   requireThat(target&&target.disposition!=='merged'&&finding.affected_ids.every(id=>target.affected_ids.includes(id)),`${finding.id} has an invalid merged disposition.`);
   requireThat(dispositions[finding.classification].filter(d=>d!=='merged').includes(target.disposition),`${finding.id} merges into a disposition that cannot close its original class.`);
   resolution=target;
  }
  if(['confirmed_defect','genuine_uncertainty'].includes(finding.classification)&&resolution.disposition!=='retired'){
   const related=new Set([...finding.affected_ids,...relatedArguments(content,finding.affected_ids)]);
   requireThat(Array.isArray(resolution.patch_ids)&&resolution.patch_ids.length>0&&resolution.patch_ids.every(id=>approval.patches.some(p=>p.patch_id===id&&related.has(p.record_id))),`${finding.id} has only an audit entry, without a related content correction.`);
  }
  if(finding.disposition==='retired')requireThat(finding.affected_ids.length>0&&finding.affected_ids.every(id=>content.catalog.some(n=>n.id===id&&n.retired)),`${finding.id} is still active.`);
  if(finding.disposition==='qualified')requireThat(finding.affected_ids.length>0&&Array.isArray(finding.qualifications)&&finding.qualifications.length>0&&finding.qualifications.every(q=>{
   const node=[...content.arguments,...content.claims,...content.procedure.background].find(n=>n.id===q.id);
   return finding.affected_ids.includes(q.id)&&typeof q.text==='string'&&q.text.length>0&&typeof node?.[q.field]==='string'&&node[q.field].includes(q.text);
  }),`${finding.id} has no qualification in the candidate content.`);
 }
 requireThat(Array.isArray(approval.banned_phrases)&&approval.banned_phrases.length>0,'the editorial-verdict phrase inventory is missing.');
 for(const node of [...content.claims,...content.arguments,...content.procedure.background,...(content.bills??[]),...(content.bill?[content.bill]:[]),...content.values,...content.catalog.filter(c=>c.retired).map(c=>({id:c.id,description:c.retirement_reason}))]){
  const text=readableText(displayedText(content,node));
  requireThat(!approval.banned_phrases.some(phrase=>containsPhrase(text,phrase)),`${node.id} contains editorial-verdict wording.`);
 }
 requireThat(approval.coverage?.arguments===content.arguments.length&&approval.coverage.values===content.values.length&&approval.coverage.historical_ids===content.catalog.length,'approved coverage differs from the candidate.');
 requireThat(unique(approval.mandatory_argument_ids)&&approval.mandatory_argument_ids.every(id=>content.catalog.some(n=>n.id===id)),'the mandatory argument inventory is invalid.');
 requireThat(mandatoryArguments(content,approval.findings,approval.patches).every(id=>approval.mandatory_argument_ids.includes(id)),'a corrected, retired or dependent argument is missing from mandatory inspection.');
 const inspected=verification.mandatory_inspection;
 requireThat(inspected?.pass===true&&unique(inspected.argument_ids)&&approval.mandatory_argument_ids.every(id=>inspected.argument_ids.includes(id)),'mandatory argument inspection is incomplete.');
 requireThat(unique(inspected.claim_ids)&&same([...inspected.claim_ids].sort(),content.claims.map(c=>c.id).sort()),'shared merges and dependencies were not all inspected.');
 requireThat(verification.retained_sample?.pass===true,'the retained sample is incomplete.');
 requireThat(verification.retained_sample.content_id===binding.content_id,'the retained sample used another content release.');
 const sample=retainedSample(content,approval.mandatory_argument_ids);
 requireThat(same(verification.retained_sample.rows,sample),'the retained sample differs from the reproducible selection.');
 requireThat(unique(verification.retained_sample.argument_ids)&&same([...verification.retained_sample.argument_ids].sort(),sample.map(r=>r.argument_id).filter(Boolean).sort()),'retained sample inspection is incomplete.');
 for(const check of ['mirrors','quotations','source_bindings','retirements','dependencies','comparable_cases'])requireThat(verification.checks?.[check]?.pass===true&&typeof verification.checks[check].evidence==='string'&&verification.checks[check].evidence.trim(),`${check} verification is incomplete.`);
 return {pass:true,...binding,findings:ids.length,...approval.coverage};
}

export async function assertPublicationReady(base=release){
 const parse=async path=>JSON.parse(await readFile(new URL(path,base),'utf8'));
 const content=await parse('content.json'),approval=await parse('publication.json');
 const sourceNames=(await readdir(new URL('review-inputs/',base))).filter(p=>/\.(json|md)$/.test(p)).sort();
 requireThat(['clarity-a.json','clarity-b.json','clarity-c.json','retained.json','closure.json'].every(p=>sourceNames.includes(p)),'the original finding inventory is incomplete.');
 const inventory=[],inputHashes={},texts={};
 for(const name of sourceNames){
  const bytes=await readFile(new URL(`review-inputs/${name}`,base));inputHashes[name]=sha(bytes);texts[name]=bytes.toString('utf8');
  if(!name.endsWith('.json'))continue;
  const rows=JSON.parse(bytes);requireThat(Array.isArray(rows),`invalid issue source ${name}.`);
  rows.forEach((row,i)=>inventory.push({...row,id:`${name.slice(0,-5)}:${row.id??i+1}`}));
 }
 requireThat(same(approval.inventory_sources,inputHashes),'the finding inventory changed after approval.');
 const sourceBytes=await readFile(new URL('finding_sources.json',base)),sources=JSON.parse(sourceBytes);
 requireThat(sha(sourceBytes)===approval.finding_sources_sha256,'the finding source index changed after approval.');
 requireThat(unique(sources.map(s=>s.path))&&same(sources.map(s=>s.path).sort(),sourceNames),'the finding source index is incomplete.');
 for(const source of sources){
  requireThat(source.sha256===inputHashes[source.path]&&Array.isArray(source.findings),`source verification is incomplete for ${source.path}.`);
  for(const finding of source.findings)requireThat(inventory.some(i=>i.id===finding.id)&&typeof finding.locator==='string'&&finding.locator&&texts[source.path].includes(finding.locator),`an origin does not resolve in ${source.path}.`);
 }
 for(const finding of inventory)requireThat(sources.some(s=>s.findings.some(f=>f.id===finding.id)),`${finding.id} has no inventoried origin.`);
 for(const finding of approval.findings)for(const origin of finding.origins??[])requireThat(sources.some(s=>s.path===origin.path&&s.findings.some(f=>f.id===finding.id&&f.locator===origin.locator)),`${finding.id} has an unverified ledger origin.`);
 const receipts={};
 for(const key of ['author','verification']){
  const spec=approval.receipts?.[key];
  requireThat(/^review-receipts\/[a-zA-Z0-9_.-]+\.json$/.test(spec?.path??''),`invalid ${key} receipt path.`);
  const bytes=await readFile(new URL(spec.path,base));requireThat(sha(bytes)===spec.sha256,`${key} receipt hash differs.`);receipts[key]=JSON.parse(bytes);
  requireThat(same(receipts[key].inventory_sources,inputHashes)&&receipts[key].finding_sources_sha256===approval.finding_sources_sha256,`${key} review used a different finding inventory.`);
 }
 const uiCopy=await parse('ui-copy.json'),strings=value=>typeof value==='string'?[value]:value&&typeof value==='object'?Object.values(value).flatMap(strings):[];
 const result=validatePublication({content,binding:await publicationBinding(content,base),inventory,approval,...receipts,uiCopy});
 requireThat(!strings(uiCopy).some(text=>approval.banned_phrases.some(phrase=>containsPhrase(readableText(text),phrase))),'interface copy contains editorial-verdict wording.');
 console.log(JSON.stringify({publication_gate:'passed',findings:result.findings,content_id:result.content_id}));return result;
}

if(process.argv[1]===fileURLToPath(import.meta.url))await assertPublicationReady();
