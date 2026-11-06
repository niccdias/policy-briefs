import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {validateContent,claimUsers} from './src/core.mjs';

const read=async name=>JSON.parse(await readFile(new URL(name,import.meta.url),'utf8'));
const [authority,mapping,checks]=await Promise.all(['review/authority.json','review/mapping.json','review/checks.json'].map(read));
if(!checks.all_pass)throw new Error('The reviewed mapping has failed checks.');
const byId=new Map(mapping.arguments.map(a=>[a.point_id,a]));
const catalog=[],argumentsOut=[],values=[];
const mainEffect=html=>html.replace(/<span class="lbl">Main effect<\/span>\s*/, '');
for(const page of authority.pages){
 values.push({id:page.value_id,name:page.value,statements:page.statements,reference:page.reference,source_url:page.source_url,source_bindings:page.source_bindings,main_effect_html:mainEffect(page.directions[0].main_effect_html)});
 for(const direction of page.directions)for(const original of direction.points){
  catalog.push({id:original.point_id,retired:!!original.retired,url:`${page.source_url}#${original.point_id}`});
  if(original.retired)continue;
  const revised=byId.get(original.point_id);
  if(!revised)throw new Error(`Missing reviewed argument ${original.point_id}.`);
  argumentsOut.push({...revised,id:revised.point_id,kind:'argument',value_id:page.value_id,direction:direction.direction,number:original.number,source_url:page.source_url,original});
 }
}
if(argumentsOut.length!==byId.size)throw new Error('Mapping has arguments outside the frozen authority.');
const p=authority.pages[0];
const content={schema_version:1,draft:false,catalog,bill:{bill:p.bill,title:p.bill_title,description:p.description,main_effect_html:mainEffect(p.directions[0].main_effect_html),comparison:p.comparison,text_version:p.text_version,text_date:p.text_date,evidence_cutoff:p.evidence_cutoff,source_url:p.source_url},values,claims:mapping.claims,arguments:argumentsOut,provenance:{bank_sha256:authority.bank_sha256,mapping_sha256:createHash('sha256').update(await readFile(new URL('review/mapping.json',import.meta.url))).digest('hex'),website_base:'b4e514cbce8c41b19c2d22ccfa46303955812ab3',review_model:'claude-opus-5-5',review_effort:'high',history_audit:'./review/history_audit.json'}};
content.version=`s1582-pilot-20261106-${createHash('sha256').update(JSON.stringify(content)).digest('hex').slice(0,12)}`;
validateContent(content);
for(const claim of content.claims)if(claimUsers(content,claim.id).length<2)throw new Error(`Claim without reuse: ${claim.id}`);
await writeFile(new URL('content.json',import.meta.url),JSON.stringify(content,null,2)+'\n');
console.log(`Assembled ${content.version}: ${content.claims.length} shared claims, ${content.arguments.length} active arguments, ${catalog.length} historical IDs.`);
