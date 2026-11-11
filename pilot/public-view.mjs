import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validateContent,billFor,claimAncestors,nodes,stable} from './src/core.mjs';
import {readingHTML,strengthEvidence,displayBackground} from './src/evidence.mjs';
import {releaseMetadata} from './src/release.mjs';
import {identifyRenderedRelease} from './rendered-release.mjs';
import {assertPublicationReady} from './publication-gate.mjs';
import copy from './release/ui-copy.json' with {type:'json'};
import {fromHtml} from 'hast-util-from-html';
// The briefs show the frozen release with the recorded November 10, 2026 citation amendment applied
// (Record speaker labels and two dead primary-text links). The frozen content.json stays byte-identical,
// so the coding app and the S.1582 issue pilot keep their identities and saved sessions.
import {amendJson} from './release/amendments/corpus-20261110/write-amendment.mjs';
export const amendedRelease=content=>amendJson(content,null);
const root=new URL('../',import.meta.url),source=new URL('release/content.json',import.meta.url);
const sha=value=>createHash('sha256').update(value).digest('hex');
const escape=value=>String(value??'').replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const slug=value=>value.source_url.match(/\/arguments\/([^/#]+)\/([^/#]+)/)?.slice(1,3);
function part(id,field,html){const tag=field==='value'?'ul':['title','description','comparison','laterEvidence','statement','reference'].includes(field)?'span':'div';return `<${tag} data-release-part="${id}:${field}">${html}</${tag}>`;}
function comparable(tree){
 if(tree.type==='text')return tree.value.trim()?{text:tree.value.replace(/\s+/g,' ')}:null;
 if(tree.type==='comment')return null;
 if(tree.tagName==='svg'&&tree.properties?.className?.includes('external-icon'))return null;
 const properties={...tree.properties};delete properties.target;delete properties.rel;
 if(properties.className){properties.className=properties.className.filter(c=>!['external','external-link','internal','internal-link','alias'].includes(c));if(!properties.className.length)delete properties.className;}
 return {...(tree.tagName?{tag:tree.tagName,properties}:{}),children:(tree.children??[]).map(comparable).filter(Boolean)};
}
function publicParts(text){
 const found={};function walk(node){const key=node.properties?.dataReleasePart;if(key){if(Object.hasOwn(found,key))throw new Error(`Duplicate public part: ${key}`);found[key]=comparable({children:node.children});}for(const child of node.children??[])walk(child);}
 walk(fromHtml(text,{fragment:true}));return found;
}
export function contentParts(content,value){
 const argumentsHere=content.arguments.filter(a=>a.value_id===value.id),claimIds=new Set(argumentsHere.flatMap(a=>claimAncestors(content,a.id)));
 const result={};
 for(const node of [...argumentsHere,...content.claims.filter(c=>claimIds.has(c.id))]){
  result[`${node.id}:title`]=escape(node.title);
  for(const side of ['support','response'])result[`${node.id}:${side}`]=readingHTML(content,node,side);
  result[`${node.id}:strength`]=strengthEvidence(content,[node.id]).map(e=>e.html).join('');
  if(!node.value_id){const fact=content.procedure.background.find(f=>f.id===node.id);result[`${node.id}:statement`]=escape(fact?.statement??node.statement);result[`${node.id}:background`]=(fact?.scope_html??node.scope_html??'')+displayBackground(node);}
 }
 const bill=billFor(content,value);result[`${bill.id}:description`]=escape(bill.description);result[`${bill.id}:comparison`]=escape(bill.comparison);result[`${bill.id}:laterEvidence`]=escape(copy.laterEvidenceNote);
 result[`${value.id}:value`]=value.statements.map(s=>`<li>${escape(s)}</li>`).join('');result[`${value.id}:reference`]=escape(value.reference);
 for(const key of Object.keys(result))result[key]=result[key].replace(/<a\b([^>]*\bhref="\#([A-Za-z0-9_-]+)"[^>]*)>[\s\S]*?<\/a>/g,(whole,attrs,id)=>{const claim=content.claims.find(c=>c.id===id);return claim?`<a${attrs.replace(/\s+title="[^"]*"/g,'')} title="${escape(claim.title)}">${escape(claim.title)}</a>`:whole;});
 return result;
}
export function renderValue(content,value,previous=''){
 const bill=billFor(content,value),parts=contentParts(content,value),p=(id,field)=>part(id,field,parts[`${id}:${field}`]??'');
 const front=previous.match(/^---\n[\s\S]*?\n---/)?.[0]??`---\ntitle: ${JSON.stringify(`${bill.bill} × ${value.name}`)}\n---`;
 const args=content.arguments.filter(a=>a.value_id===value.id),ids=new Set(args.flatMap(a=>claimAncestors(content,a.id)));
 let out=`${front}\n\n<div class="approved-release" data-content-release="${content.release.content_id}" data-mapping-release="${content.release.mapping_id}">\n<p><strong>${escape(bill.bill)} · ${escape(bill.title)}</strong></p><p>${p(bill.id,'description')}</p><p><strong>Comparison:</strong> ${p(bill.id,'comparison')}</p><details><summary>Bill version and evidence cutoff</summary><p>${escape(bill.text_version)} · ${escape(bill.text_date)}. Evidence cutoff: ${escape(bill.evidence_cutoff)}.</p><p>${p(bill.id,'laterEvidence')}</p><a href="${escape(bill.source_url)}">Bill and sources</a></details>\n<h2>${escape(value.name)}</h2>${p(value.id,'value')}<p>${p(value.id,'reference')}</p>\n`;
 for(const direction of ['support','oppose']){
  out+=`\n</div>\n\n## Does this value give [NAME] a reason to ${direction==='support'?'favor':'oppose'} ${bill.bill}?\n\n<div class="approved-arguments">\n<table class="pc"><tr><th>Argument</th><th>Response</th></tr>\n`;
  for(const a of args.filter(a=>a.direction===direction)){
   out+=`<tr id="${a.id}" data-argument-id="${a.id}"><td><h3>${p(a.id,'title')}</h3>${p(a.id,'support')}</td><td>${p(a.id,'response')}</td></tr>\n<tr class="argument-notes-row"><td colspan="2"><details><summary>Evidence about size, timing and reach</summary>${p(a.id,'strength')}</details><details><summary>Shared claims and background</summary><ul>${claimAncestors(content,a.id).map(id=>`<li><a href="#${id}">${escape(content.claims.find(c=>c.id===id).title)}</a></li>`).join('')}</ul></details></td></tr>\n`;
  }
  out+='</table>\n';
 }
 out+='</div>\n\n## Shared claims and background\n\n<div class="approved-shared">\n';
 for(const c of content.claims.filter(c=>ids.has(c.id)))out+=`<details id="${c.id}"><summary>${p(c.id,'title')}</summary><p>${p(c.id,'statement')}</p>${p(c.id,'background')}<h3>Supporting evidence</h3>${p(c.id,'support')}<h3>Response</h3>${p(c.id,'response')}<details><summary>Evidence about size, timing and reach</summary>${p(c.id,'strength')}</details></details>\n`;
 out+='</div>\n\n';
 const oldIds=[...previous.matchAll(/\bid="([^"]+)"/g)].map(m=>m[1]);const renderedIds=new Set([...args.map(a=>a.id),...ids]);
 const retired=content.catalog.filter(a=>a.retired&&oldIds.includes(a.id));
 if(retired.length)out+=`<details><summary>Historical IDs</summary>${retired.map(a=>`<div id="${a.id}"><strong>${a.id}</strong><p>${escape(a.retirement_reason)}</p></div>`).join('')}</details>\n`;
 for(const id of new Set(oldIds))if(!renderedIds.has(id)&&!retired.some(a=>a.id===id))out+=`<span id="${escape(id)}"></span>\n`;
 // Preserve existing bibliography metadata and its anchors; no references are authored here.
 const bibliography=previous.match(/\n## Sources\n[\s\S]*/)?.[0];if(bibliography)out+=bibliography;
 return out;
}
export function verifyValue(content,value,text){
 const expected=Object.fromEntries(Object.entries(contentParts(content,value)).map(([key,html])=>[key,comparable(fromHtml(html,{fragment:true}))])),found=publicParts(text);
 if(stable(found)!==stable(expected)){
  const key=[...new Set([...Object.keys(expected),...Object.keys(found)])].find(k=>stable(found[k])!==stable(expected[k]));
  throw new Error(`Public/coding content parity failed: ${value.id} / ${key}`);
 }
 const ids=[...text.matchAll(/data-argument-id="([^"]+)"/g)].map(m=>m[1]);
 if(stable(ids.sort())!==stable(content.arguments.filter(a=>a.value_id===value.id).map(a=>a.id).sort()))throw new Error(`Argument coverage failed: ${value.id}`);
 return {value_id:value.id,arguments:ids.length,parts:Object.keys(found).length,sha256:sha(stable(found))};
}
export async function publicView({write=false}={}){
 await assertPublicationReady();
 const frozen=JSON.parse(await readFile(source,'utf8'));frozen.release={...frozen.release,...await identifyRenderedRelease(frozen)};validateContent(frozen);if(frozen.values.length!==48||frozen.catalog.length!==567)throw new Error('Unexpected approved release coverage.');const content=amendedRelease(frozen);validateContent(content);
 const rows=[];
 for(const value of content.values){
  const route=slug(value);if(!route)throw new Error(`Missing preserved route: ${value.id}`);
  const target=new URL(`content/arguments/${route.join('/')}.md`,root),previous=await readFile(target,'utf8');
  const text=write?renderValue(content,value,previous):previous;if(write)await writeFile(target,text);
  rows.push(verifyValue(content,value,text));
 }
 const manifest={...releaseMetadata(content),arguments:content.arguments.length,values:content.values.length,catalog:content.catalog.length,rows};
 await mkdir(new URL('release/',import.meta.url),{recursive:true});if(write)await writeFile(new URL('release/parity.json',import.meta.url),JSON.stringify(manifest,null,2)+'\n');
 console.log(JSON.stringify({parity:'passed',arguments:content.arguments.length,values:content.values.length,content_id:manifest.content_id}));return manifest;
}
export async function verifyRenderedPublic(frozen){
 const content=amendedRelease(frozen),rows=[];for(const value of content.values){const route=slug(value),text=await readFile(new URL(`public/arguments/${route.join('/')}.html`,root),'utf8');rows.push(verifyValue(content,value,text));if(!text.includes(`data-content-release="${content.release.content_id}"`))throw new Error(`Rendered public version mismatch: ${value.id}`);}
 return rows;
}
if(process.argv[1]===fileURLToPath(import.meta.url))await publicView({write:process.argv.includes('--write')});
