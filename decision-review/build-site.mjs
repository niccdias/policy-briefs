import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {buildBill,renderCatalog} from './runtime/build.mjs';

const root=dirname(fileURLToPath(import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const readJSON=async path=>JSON.parse(await readFile(path,'utf8'));

export async function buildSite(outputDir){
 outputDir=resolve(outputDir);
 const manifest=await readJSON(join(root,'input-manifest.json'));
 const copy=await readJSON(join(root,'site-copy.json'));
 assert.equal(manifest.reviewer_records_included,false,'Source inputs must exclude reviewer records.');
 assert.equal(manifest.bills.length,8,'The approved rollout contains eight bills.');
 assert.equal(new Set(manifest.bills.map(bill=>bill.slug)).size,8,'Bill slugs must be unique.');
 assert.equal(new Set(manifest.bills.map(bill=>bill.bill_id)).size,8,'Bill IDs must be unique.');
 assert.equal(copy.schema_version,1,'Unsupported site-copy schema.');
 const entries=[];
 for(const entry of manifest.bills){
  assert(/^[a-z0-9]+$/.test(entry.slug),'Invalid bill slug.');
  const billDir=join(root,'bills',entry.slug);
  assert.equal(sha(await readFile(join(billDir,'input/source.json'))),entry.source_sha256,'Frozen source changed: '+entry.slug);
  const result=await buildBill({billDir,outputDir:join(outputDir,'arguments',entry.slug),commonCopyOverrides:copy.review_copy});
  assert.equal(result.bill.id,entry.bill_id,'Bill identity changed: '+entry.slug);
  assert.equal(result.parity.coverage.arguments.length,entry.arguments,'Argument coverage changed: '+entry.slug);
  assert.equal(result.parity.coverage.responses.length,entry.responses,'Response coverage changed: '+entry.slug);
  assert.equal(result.parity.coverage.qualifications.length,entry.qualifications,'Qualification coverage changed: '+entry.slug);
  entries.push({...entry,release:result.release,html_sha256:result.descriptor.html_sha256['index.html'],paths:result.measurement.scenarios});
  console.log(JSON.stringify({bill:entry.bill,nodes:result.parity.coverage.nodes.length,release:result.release.rendered_id}));
 }
 const catalogs={};
 for(const [relative,prefix] of [['index.html','arguments/'],['arguments/index.html','']]){
  const html=renderCatalog({bills:entries.map(entry=>({slug:entry.slug,bill:entry.bill,title:entry.title,href:prefix+entry.slug+'/'})),copy:copy.catalog});
  await mkdir(dirname(join(outputDir,relative)),{recursive:true});
  await writeFile(join(outputDir,relative),html);
  catalogs[relative]=sha(html);
 }
 const release={schema_version:1,source_manifest_sha256:sha(await readFile(join(root,'input-manifest.json'))),catalogs,bills:entries};
 await writeFile(join(outputDir,'decision-review-release.json'),JSON.stringify(release,null,2)+'\n');
 return release;
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 const args=process.argv.slice(2);
 assert(args.length===2&&args[0]==='--out','Usage: node build-site.mjs --out <public-directory>');
 await buildSite(args[1]);
}
