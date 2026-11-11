import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {readFile,readdir} from 'node:fs/promises';
import {dirname,join,resolve} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {loadBill} from './runtime/build.mjs';

const root=dirname(fileURLToPath(import.meta.url));
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');

export async function approvalInputs(){
 const manifest=JSON.parse(await readFile(join(root,'input-manifest.json'),'utf8'));
 const files=['input-manifest.json','PROCEDURE.md','site-copy.json','session-history.json','record-session-history.mjs','build-site.mjs','publication-gate.mjs','browser-qa.mjs','audit-content.mjs','convert-hr5408.mjs','content-audit-findings.json','package.json','package-lock.json','firebase-config.json','firebase.json','backend/firestore.rules'];
 for(const name of (await readdir(join(root,'runtime'))).sort()){
  assert(/^[a-z0-9.-]+\.(?:mjs|js|json|css)$/.test(name),'Unexpected file in public runtime: '+name);
  files.push('runtime/'+name);
 }
 for(const bill of manifest.bills){
  assert(/^[a-z0-9]+$/.test(bill.slug),'Invalid bill slug.');
  for(const name of ['input/source.json','decisions.json','coverage.json','copy.json',bill.slug==='hr5408'?'conversion.json':'EDITORIAL_REVIEW.md'])files.push('bills/'+bill.slug+'/'+name);
 }
 for(const name of ['content-verification.json','browser-verification.json','cloud-verification.json'])files.push(name);
 return Object.fromEntries(await Promise.all(files.map(async name=>[name,sha(await readFile(join(root,name)))])));
}

export async function checkPublication(){
 const approval=JSON.parse(await readFile(join(root,'release-approval.json'),'utf8'));
 assert.equal(approval.schema_version,1,'Unsupported decision-review approval schema.');
 assert.equal(approval.status,'approved','Decision-review publication is not approved.');
 assert.deepEqual(approval.open_findings,[],'Decision-review findings remain open.');
 for(const field of ['content_review','browser_review','cloud_review'])assert(typeof approval[field]==='string'&&approval[field].trim(),'Missing verification reference: '+field);
 assert.deepEqual(await approvalInputs(),approval.input_sha256,'Decision-review approval is stale; reverify the changed inputs.');
 for(const name of ['content-verification.json','browser-verification.json']){
  const report=JSON.parse(await readFile(join(root,name),'utf8'));
  assert.equal(report.status,'passed',name+' has not passed.');
  assert.deepEqual(report.open_findings,[],name+' has unresolved findings.');
  const manifest=JSON.parse(await readFile(join(root,'input-manifest.json'),'utf8'));
  assert.deepEqual(report.bills.map(bill=>bill.slug).sort(),manifest.bills.map(bill=>bill.slug).sort(),name+' must verify all eight bills.');
 }
 const manifest=JSON.parse(await readFile(join(root,'input-manifest.json'),'utf8'));
 const audit=JSON.parse(await readFile(join(root,'content-audit-findings.json'),'utf8'));
 const browser=JSON.parse(await readFile(join(root,'browser-verification.json'),'utf8'));
 const cloud=JSON.parse(await readFile(join(root,'cloud-verification.json'),'utf8'));
 assert.equal(cloud.status,'passed','Cloud verification has not passed.');
 assert.deepEqual(cloud.open_findings,[],'Cloud verification has unresolved findings.');
 for(const name of ['runtime/firebase.mjs','runtime/firebase.test.mjs','runtime/app.js','runtime/build.mjs','runtime/copy.json','site-copy.json','package.json','package-lock.json','firebase-config.json','firebase.json','backend/firestore.rules','browser-qa.mjs'])assert.equal(cloud.input_sha256[name],sha(await readFile(join(root,name))),'Cloud verification is stale: '+name);
 assert.equal(audit.schema_version,1,'Unsupported content-audit schema.');
 assert(audit.findings.every(finding=>finding.status==='resolved'),'Independent content-audit findings remain open.');
 assert.deepEqual(Object.keys(audit.bills).sort(),manifest.bills.map(bill=>bill.slug).sort(),'Independent content audit must cover all eight bills.');
 assert.equal(browser.script_sha256,sha(await readFile(join(root,'browser-qa.mjs'))),'Browser verification used a different check script.');
 for(const entry of manifest.bills){
  const reviewed=audit.bills[entry.slug];
  assert.equal(reviewed.semantic_review.status,'passed','Semantic review has not passed: '+entry.slug);
  for(const name of ['input/source.json','decisions.json','coverage.json','copy.json'])assert.equal(reviewed.input_sha256[name],sha(await readFile(join(root,'bills',entry.slug,name))),'Independent content review is stale: '+entry.slug+'/'+name);
  const current=await loadBill({billDir:join(root,'bills',entry.slug)});
  assert.deepEqual(browser.bills.find(bill=>bill.slug===entry.slug).release,current.release,'Browser verification is stale: '+entry.slug);
 }
 return approval;
}

if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url){
 await checkPublication();console.log('Decision-review findings are closed and approval matches all eight packages and the runtime.');
}
