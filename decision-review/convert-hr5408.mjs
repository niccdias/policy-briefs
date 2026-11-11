import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {resolve} from 'node:path';
import {pathToFileURL} from 'node:url';
const root=new URL('./',import.meta.url),pilot=new URL('../bill_reasoning_pilot_20261108/hr5408/',root),read=async url=>JSON.parse(await readFile(url,'utf8'));
const sha=value=>createHash('sha256').update(value).digest('hex');
const jsonSha=value=>sha(JSON.stringify(value,null,2)+'\n');

// The original conversion remains exact. Only the separately reviewed, release-bound
// definition amendments may be applied to it, in either direction.
export function applyHr5408Amendment(decisions,copy,amendment,reverse=false){
 assert.equal(amendment.schema_version,1,'Unsupported H.R.5408 editorial amendment.');
 const result=structuredClone({decisions,copy}),from=reverse?'amended_package_sha256':'initial_package_sha256',to=reverse?'initial_package_sha256':'amended_package_sha256';
 for(const [name,value] of [['decisions.json',result.decisions],['copy.json',result.copy]])assert.equal(jsonSha(value),amendment[from][name],'Unexpected H.R.5408 amendment input: '+name);
 assert(Array.isArray(amendment.changes)&&amendment.changes.length>0,'H.R.5408 amendment has no changes.');
 const targets=new Set();
 for(const change of amendment.changes){
  const key=[change.collection,change.id??'',change.field].join('/');assert(!targets.has(key),'Duplicate H.R.5408 amendment target: '+key);targets.add(key);
  assert.notDeepEqual(change.before,change.after,'Empty H.R.5408 amendment: '+key);
  let owner;
  if(['contexts','blocks','nodes'].includes(change.collection)){
   assert.equal(change.field,change.collection==='nodes'?'claim_html':'html','Unsupported H.R.5408 amendment field.');
   assert(typeof change.before==='string'&&typeof change.after==='string','H.R.5408 text amendments require complete strings.');
   const matches=result.decisions[change.collection].filter(item=>item.id===change.id);assert.equal(matches.length,1,'Unknown H.R.5408 amendment owner: '+key);owner=matches[0];
  }else if(change.collection==='decisions'&&change.field==='source_sha256'){
   // The November 10, 2026 corpus amendment changed citation labels in the frozen source, and with it this binding.
   assert.equal(change.id,undefined);assert(/^[a-f0-9]{64}$/.test(change.before)&&/^[a-f0-9]{64}$/.test(change.after),'Invalid H.R.5408 source binding amendment.');owner=result.decisions;
  }else if(change.collection==='decisions'&&change.field==='glossary'){
   assert.equal(change.id,undefined,'A glossary amendment must replace the complete glossary.');
   for(const entries of [change.before,change.after]){assert(Array.isArray(entries),'Invalid glossary amendment.');const terms=new Set();for(const entry of entries){assert.deepEqual(Object.keys(entry).sort(),['definition','term']);assert(typeof entry.term==='string'&&entry.term.trim()&&typeof entry.definition==='string'&&entry.definition.trim(),'Empty glossary amendment entry.');const term=entry.term.toLowerCase();assert(!terms.has(term),'Duplicate glossary term: '+entry.term);terms.add(term);}}
   owner=result.decisions;
  }else{
   assert.equal(change.collection,'copy','Unsupported H.R.5408 amendment collection.');assert.equal(change.field,'bill_description','Only the displayed bill description may be amended in copy.');assert.equal(change.id,undefined);assert.equal(change.before,null,'The original H.R.5408 description override must be absent.');assert(typeof change.after==='string'&&change.after.trim(),'Missing amended bill description.');owner=result.copy;
  }
  const before=reverse?change.after:change.before,after=reverse?change.before:change.after;
  assert.deepEqual(Object.hasOwn(owner,change.field)?owner[change.field]:null,before,'H.R.5408 amendment text mismatch: '+key);
  if(after===null)delete owner[change.field];else owner[change.field]=structuredClone(after);
 }
 for(const [name,value] of [['decisions.json',result.decisions],['copy.json',result.copy]])assert.equal(jsonSha(value),amendment[to][name],'Unexpected H.R.5408 amendment output: '+name);
 return result;
}

export async function verifyHr5408LegacyInputs(amendment,pilotDir){
 const names=['bill-wide/reading.json','decision-tree/copy.json','decision-tree/coverage.json','decision-tree/decisions.json','input/source.json'];
 assert.deepEqual(Object.keys(amendment.legacy_inputs_sha256).sort(),names,'Incomplete H.R.5408 legacy input binding.');
 for(const name of names)assert.equal(sha(await readFile(new URL(name,pilotDir))),amendment.legacy_inputs_sha256[name],'Approved H.R.5408 pilot changed: '+name);
}

async function main(){
const sourceBytes=await readFile(new URL('bills/hr5408/input/source.json',root)),source=JSON.parse(sourceBytes),old=await read(new URL('decision-tree/decisions.json',pilot)),reading=await read(new URL('bill-wide/reading.json',pilot)),copy=await read(new URL('decision-tree/copy.json',pilot)),coverage=await read(new URL('decision-tree/coverage.json',pilot));
const blocks=new Map(reading.units.flatMap(unit=>unit.blocks).concat(old.blocks).map(block=>[block.id,block]));
const used=[...new Set(old.nodes.flatMap(node=>node.block_ids))];
const decisions={schema_version:1,bill_id:source.bill.id,source_sha256:createHash('sha256').update(sourceBytes).digest('hex'),contexts:old.contexts,blocks:used.map(id=>{const {role,html,source_refs}=blocks.get(id);return {id,role,html,source_refs};}),nodes:old.nodes.map(({source_node_ids,implication_ids,...node})=>node),glossary:[...reading.glossary,...copy.glossary_additions],value_subjects:copy.value_subjects};
const nativeCoverage={schema_version:1,arguments:coverage.arguments,responses:coverage.challenges.map(item=>({...source.requirements.responses.find(prior=>prior.id===item.id),decision_ids:item.decision_ids,block_ids:item.block_ids,disposition:item.disposition,rationale:item.rationale})),qualifications:coverage.qualifications};
assert.equal(decisions.nodes.length,108);assert.equal(decisions.blocks.length,144);assert.equal(nativeCoverage.arguments.length,69);assert.equal(nativeCoverage.responses.length,34);assert.equal(nativeCoverage.qualifications.length,62);
const conversion=await read(new URL('bills/hr5408/conversion.json',root)),amendment=conversion.editorial_amendment;
if(amendment)await verifyHr5408LegacyInputs(amendment,pilot);
const amended=amendment?applyHr5408Amendment(decisions,{},amendment):{decisions,copy:{}};
for(const [name,value] of [['decisions.json',amended.decisions],['coverage.json',nativeCoverage],['copy.json',amended.copy]])await writeFile(new URL('bills/hr5408/'+name,root),JSON.stringify(value,null,name==='copy.json'?1:2)+'\n');
console.log(JSON.stringify({bill:source.bill.id,decisions:decisions.nodes.length,blocks:decisions.blocks.length,source_sha256:decisions.source_sha256}));
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)await main();
