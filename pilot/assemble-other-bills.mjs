import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validateContent,claimUsers,invariant,nodes} from './src/core.mjs';

export const sha256=value=>createHash('sha256').update(value).digest('hex');
const paragraphs=html=>html.match(/<p>[\s\S]*?<\/p>/g)??[];
const destinations=new Set(['support','response','strength','audit']);
const prefixLinks=(html,prefix)=>html.replace(/href="#(C\d+)"/g,`href="#${prefix}_$1"`);
function rewriteLinks(value,prefix){
 if(typeof value==='string')return prefixLinks(value,prefix);
 if(Array.isArray(value))return value.map(v=>rewriteLinks(v,prefix));
 if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([k,v])=>[k,rewriteLinks(v,prefix)]));
 return value;
}

// Every source paragraph remains intact in the frozen record. This display
// overlay removes editorial labels and repeats source links after split notes.
function routeEvidence(node,originalId){
 const placement={support:[],response:[],strength:[]};
 const ps=paragraphs(node.notes_html??'');
 const routes=new Map((node.note_routes??[]).map(r=>[r.index,r]));
 invariant(routes.size===ps.length&&routes.size===(node.note_routes??[]).length,`${originalId}: incomplete or duplicate note routing.`);
 ps.forEach((p,index)=>{
  const body=p.slice(3,-4),route=routes.get(index);
  invariant(route&&route.fragments.map(f=>f.body_html).join('')===body,`${originalId}:${index}: note text changed.`);
  const sources=body.match(/\s*<span class="note-sources">[\s\S]*<\/span>$/)?.[0]??'';
  for(const [part,f] of route.fragments.entries()){
   invariant(destinations.has(f.destination)&&f.reason,`${originalId}:${index}: invalid note destination.`);
   invariant(!(f.destination==='response'&&node.no_point_specific_con),`${originalId}: evidence routing would invent a CON.`);
   if(f.destination==='audit')continue;
   const display=f.body_html.replace(/^<strong>(?:Evidence note|Brief context note):<\/strong>\s*/,'').replace(/\s*<span class="note-sources">[\s\S]*<\/span>$/,'');
   if(display.trim())placement[f.destination].push({id:`${originalId}:note:${index}:${part}`,html:`<p>${display}${sources}</p>`,inherit:true});
  }
 });
 for(const [i,gap] of (node.gaps??[]).entries()){
  invariant(destinations.has(gap.destination),`${originalId}: gap destination missing.`);
  invariant(!(gap.destination==='response'&&node.no_point_specific_con),`${originalId}: gap would invent a CON.`);
  if(gap.destination==='audit')continue;
  const escaped=gap.explanation.replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;');
  placement[gap.destination].push({id:`${originalId}:gap:${i}`,html:`<p>${escaped}</p>`,inherit:false});
 }
 return placement;
}

export function assembleOtherBills(packages,historyAudit){
 const bills=[],values=[],claims=[],args=[],catalog=[],background=[],retainedQuestions=[],evidence={revision:'evidence-placement-20261107-v1',nodes:{}},billAudit=[];
 const bankHashes=new Set();
 for(const {slug,authority,mapping,checks,review,mappingBytes} of packages){
  invariant(checks.all_pass===true,`${slug}: worker checks did not pass.`);
  invariant(review.approved===true&&review.mapping_sha256===sha256(mappingBytes),`${slug}: main review does not approve this exact mapping.`);
  const p=authority.pages[0],billId=p.bill_id,prefix=slug.toUpperCase();
  invariant(mapping.bill_id===billId&&authority.pages.every(page=>page.bill_id===billId),`${slug}: bill assignment mismatch.`);
  invariant(mapping.bill_description,`${slug}: neutral bill description missing.`);
  bankHashes.add(authority.bank_sha256);
  bills.push({id:billId,bill:p.bill,title:p.bill_title,description:mapping.bill_description,comparison:p.comparison,text_version:p.text_version,text_date:p.text_date,evidence_cutoff:p.evidence_cutoff,source_url:p.source_url});
  const originalPoints=authority.pages.flatMap(page=>page.directions.flatMap(d=>d.points));
  const oldRetired=originalPoints.filter(a=>a.retired).map(a=>a.point_id).sort();
  invariant(JSON.stringify([...mapping.retired_ids].sort())===JSON.stringify(oldRetired),`${slug}: historical retirements changed.`);
  const revised=new Map(mapping.arguments.map(a=>[a.point_id,a])),retirements=new Map(mapping.proposed_retirements.map(a=>[a.point_id,a]));
  invariant(revised.size===mapping.arguments.length&&retirements.size===mapping.proposed_retirements.length,`${slug}: duplicate argument decisions.`);
  const approvedRetirements=new Set(review.accepted_retirements??[]);
  invariant(retirements.size===approvedRetirements.size&&[...retirements.keys()].every(id=>approvedRetirements.has(id)),`${slug}: unreviewed retirement.`);
  const seen=new Set(),claimIds=new Set(mapping.claims.map(c=>c.id));
  invariant(claimIds.size===mapping.claims.length,`${slug}: duplicate claim ID.`);
  const newId=id=>{invariant(claimIds.has(id),`${slug}: unknown shared claim ${id}.`);return `${prefix}_${id}`;};
  for(const page of authority.pages){
   const valueId=`${prefix}_${page.value_id}`;
   values.push({id:valueId,bill_id:billId,value_code:page.value_id,name:page.value,statements:page.statements,reference:page.reference,source_url:page.source_url,source_bindings:page.source_bindings});
   for(const direction of page.directions)for(const original of direction.points){
    const id=original.point_id,retirement=retirements.get(id);
    catalog.push({id,bill_id:billId,retired:!!original.retired||!!retirement,retirement:retirement??original.retirement??null,retirement_reason:retirement?.reason??original.retirement_reason,url:`${page.source_url}#${id}`,original});
    if(original.retired){invariant(!revised.has(id)&&!retirement,`${id}: retired ID reused.`);continue;}
    invariant(revised.has(id)!==!!retirement,`${id}: missing or conflicting editorial decision.`);seen.add(id);
    if(retirement)continue;
    const r=revised.get(id);
    invariant(r.notes_html===original.notes_html&&JSON.stringify(r.note_ids)===JSON.stringify(original.note_ids),`${id}: original notes changed.`);
    invariant(!original.no_point_specific_con||r.no_point_specific_con,`${id}: an absent CON was invented.`);
    invariant(r.edits?.classification&&r.edits.reason,`${id}: no edit audit.`);
    for(const path of r.paths){
     invariant(path.original_excerpt&&original.pro_html.includes(path.original_excerpt),`${id}: supporting path lacks an exact original passage.`);
     invariant(path.necessity_reason,`${id}: supporting path lacks a necessity rationale.`);
    }
    const normalized=rewriteLinks(r,prefix);
    const node={...normalized,id,kind:'argument',bill_id:billId,value_id:valueId,direction:direction.direction,number:original.number,source_url:page.source_url,original,paths:r.paths.map(path=>({...path,requires:path.requires.map(newId)}))};
    args.push(node);evidence.nodes[id]=routeEvidence(node,id);
   }
  }
  invariant(seen.size===revised.size+retirements.size,`${slug}: mapping has unknown IDs.`);
  for(const c of mapping.claims){
   const id=newId(c.id),normalized=rewriteLinks(c,prefix);
   invariant(c.classification_reason&&c.source_refs?.length,`${id}: missing classification evidence.`);
   invariant(c.members.every(m=>revised.has(m.point_id)&&revised.get(m.point_id)&&originalPoints.find(p=>p.point_id===m.point_id).pro_html.includes(m.original_excerpt)),`${id}: member passage is not original or active.`);
   const node={...normalized,id,bill_id:billId,kind:'claim',prerequisite_paths:c.prerequisite_paths.map(path=>({...path,id:`${prefix}_${path.id}`,requires:path.requires.map(newId)}))};
   claims.push(node);evidence.nodes[id]=routeEvidence(node,id);
   if(c.classification==='judgment')retainedQuestions.push({id,reason:c.classification_reason});
   else{
    invariant(['verified_statutory_background','uncontested_sourced_context'].includes(c.classification),`${id}: invalid claim classification.`);
    background.push({id,classification:c.classification,statement:c.statement,reason:c.classification_reason,scope_html:normalized.scope_html,section:c.section,source_quote:c.source_quote,source_refs:c.source_refs,basis_revision:'other-bills-20261107-v1'});
   }
  }
  billAudit.push({slug,bill_id:billId,mapping_sha256:review.mapping_sha256,main_review:review,arguments:revised.size,retired:retirements.size,claims:mapping.claims.length});
 }
 invariant(bankHashes.size===1,'Bills came from different authority snapshots.');
 const content={schema_version:1,draft:false,bills,values,claims,arguments:args,catalog,expected_counts:{active:args.length,historical:catalog.length},provenance:{bank_sha256:[...bankHashes][0],website_base:'7b74e0004dc7d4fc177a932e4f04c6a5a969e0d0',review_model:'claude-opus-5-5',review_effort:'high',history_audit:'./review/history_audit.json',bills:billAudit}};
 content.version=`other-bills-20261107-${sha256(JSON.stringify(content)).slice(0,12)}`;
 content.procedure={base_content_version:content.version,revision:'other-bills-20261107-v1',background,retained_questions:retainedQuestions,previous_revisions:[],selection_rule:historyAudit.current_shared_claim_rule};
 content.evidence_placement=evidence;
 validateContent(content);
 for(const c of claims){
  const users=claimUsers(content,c.id).map(a=>a.id).sort(),members=c.members.map(m=>m.point_id).sort();
  invariant(JSON.stringify(users)===JSON.stringify(members),`${c.id}: member list differs from actual dependencies.`);
 }
 for(const n of nodes(content))for(const html of [n.pro_html,n.con_html,n.support_html,n.objection_html,n.background_html,n.scope_html,n.notes_html].filter(Boolean)){
  for(const match of html.matchAll(/href="#(C\d+)"/g))throw new Error(`${n.id}: unprefixed claim link ${match[1]}.`);
  for(const match of html.matchAll(/href="#([A-Z0-9_]+)"/g))invariant(claims.some(c=>c.id===match[1]),`${n.id}: unknown internal link ${match[1]}.`);
 }
 return content;
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
 const root=new URL('expansion/',import.meta.url),read=async name=>JSON.parse(await readFile(new URL(name,root),'utf8'));
 const manifest=await read('manifest.json'),packages=[];
 for(const slug of manifest.bills){
  const mappingBytes=await readFile(new URL(`${slug}/mapping.json`,root));
  packages.push({slug,authority:await read(`${slug}/authority.json`),mapping:JSON.parse(mappingBytes),mappingBytes,checks:await read(`${slug}/checks.json`),review:await read(`${slug}/main_review.json`)});
 }
 const content=assembleOtherBills(packages,await read('history_audit.json'));
 await writeFile(new URL('content.json',root),JSON.stringify(content,null,2)+'\n');
 console.log(`Assembled ${content.version}: ${content.bills.length} bills, ${content.arguments.length} arguments, ${content.procedure.retained_questions.length} shared questions, ${content.catalog.length} historical IDs.`);
}
