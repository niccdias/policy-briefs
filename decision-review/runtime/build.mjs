import {readFile,writeFile,mkdir,readdir} from 'node:fs/promises';
import {resolve,join,dirname} from 'node:path';
import {fileURLToPath,pathToFileURL} from 'node:url';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {Script} from 'node:vm';
import {createDecisionTree,createState,nextDecision,answerDecision,decisionStates,derivedResults,completion,validateRelease} from './model.mjs';
import {renderDecision,renderReview,renderResults,renderShell} from './app.js';
import {measurePaths} from './measure.mjs';
import {build} from 'esbuild';

const runtimeDir=dirname(fileURLToPath(import.meta.url));
const catalogStyle=await readFile(new URL('./style.css',import.meta.url),'utf8');
const runtimeFiles=['source.mjs','validators.mjs','originals.mjs','model.mjs','storage.mjs','firebase.mjs','app.js','style.css','build.mjs','measure.mjs','copy.json'];
let firebaseBundle;
function bundledFirebase(){return firebaseBundle??=build({entryPoints:[join(runtimeDir,'firebase.mjs')],bundle:true,write:false,format:'esm',platform:'browser',target:'es2022',minify:true,legalComments:'none'}).then(result=>result.outputFiles[0].text);}
const sha=value=>createHash('sha256').update(value).digest('hex');
const parts=items=>sha(JSON.stringify(items.map(([name,value])=>[name,sha(value)])));
const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const markers=(html,name)=>[...html.matchAll(new RegExp(name+'="([^"]+)"','g'))].map(match=>match[1]);
async function read(path){try{return await readFile(path,'utf8');}catch(error){throw new Error(`Required decision-review input is missing or unreadable: ${path}`,{cause:error});}}
function parse(bytes,name){try{return JSON.parse(bytes);}catch(error){throw new Error('Invalid JSON: '+name,{cause:error});}}
// What a reader saw at each decision: claim, routes, value link, reading blocks and contexts as displayed.
// Earlier releases displayed blocks through their own rule, named in session-history.json.
export const DISPLAY_RULES={'none':html=>html,'strip-lead-strong':html=>html.replace(/^(\s*)<p><strong>[^<]+<\/strong>\s*/,'$1<p>')};
export function decisionFingerprints(decisions,copy,display='none'){
 const show=DISPLAY_RULES[display];assert(show,'Unknown display rule: '+display);const blocks=new Map(decisions.blocks.map(block=>[block.id,block])),contexts=new Map(decisions.contexts.map(context=>[context.id,context]));
 return Object.fromEntries(decisions.nodes.map(node=>[node.id,sha(JSON.stringify({kind:node.kind,claim_html:node.claim_html,routes:node.routes.map(route=>({id:route.id,requires:[...route.requires].sort()})),value_id:node.value_id,direction:node.direction,value_subject:decisions.value_subjects[node.id]??null,value_goals:node.value_id?copy.value_goals?.[node.value_id]??null:null,blocks:node.block_ids.map(id=>({id,role:blocks.get(id).role,html:show(blocks.get(id).html)})),contexts:node.context_ids.map(id=>({id,title:contexts.get(id).title,html:contexts.get(id).html}))}))]));
}
function sessionHistory(bytes,billId){
 const history=parse(bytes,'session-history.json');if(!history.schema_version)return [];assert.equal(history.schema_version,1,'Unsupported session-history schema.');
 const entries=history.bills?.[billId]??[];assert(Array.isArray(entries),'Invalid session history for '+billId);
 for(const entry of entries){assert.deepEqual(Object.keys(entry).sort(),['display','fingerprints','recorded_from','release'],'Invalid session-history entry for '+billId);validateRelease(entry.release);assert.equal(entry.release.bill_id,billId);assert(DISPLAY_RULES[entry.display],'Unknown display rule: '+entry.display);}
 return entries.map(({release,fingerprints})=>({release,fingerprints}));
}
async function optional(path){try{return await readFile(path,'utf8');}catch(error){if(error.code==='ENOENT')return '{}\n';throw error;}}
async function commonOverrides(){const path=join(runtimeDir,'..','site-copy.json');let bytes;try{bytes=await readFile(path,'utf8');}catch(error){if(error.code==='ENOENT')return {};throw error;}const data=parse(bytes,path);assert(data.schema_version===1&&data.review_copy!==null&&typeof data.review_copy==='object'&&!Array.isArray(data.review_copy),'site-copy.json must include schema_version:1 and review_copy.');return data.review_copy;}

export function prepareCopy(source,base,overrides={}){
 assert(overrides!==null&&typeof overrides==='object'&&!Array.isArray(overrides),'Bill copy overrides must be an object.');
 for(const [key,value] of Object.entries(overrides))assert(Object.hasOwn(base,key)&&typeof base[key]==='string'&&typeof value==='string','Bill copy overrides must replace existing flat text: '+key);
 const result=Object.fromEntries(Object.entries({...base,...overrides}).map(([key,value])=>[key,typeof value==='string'?value.replaceAll('{bill}',source.bill.bill).replaceAll('{bill_title}',source.bill.title).replaceAll('{bill_description}',source.bill.description):value]));
 if(result.value_goals&&typeof result.value_goals==='object')result.value_goals=Object.fromEntries(source.values.map(value=>[value.id,result.value_goals[value.id]??result.value_goals[value.value_code??value.id]]));
 return result;
}

function bundle(bytes){
 const inline=code=>code.replace(/^import [^\n]+\n/gm,'').replace(/^export /gm,'');
 const scope=(name,names)=>`const {${names.join(',')}}=(()=>{\n${inline(bytes['runtime/'+name])}\nreturn {${names.join(',')}};\n})();\n`;
 const code=scope('source.mjs',['plainText','sourceField'])+scope('validators.mjs',['sourceValidators','validateCopy'])+scope('originals.mjs',['renderOriginals'])+scope('model.mjs',['createDecisionTree','createState','decisionStates','nextDecision','answerDecision','derivedResults','saveComparison','completion','navigate','exportBackup','importBackup','csvExport','csvHeader','csvRows','csvText','carrySession','carriedFrom','earlierRelease','validateState','validateRelease'])+scope('storage.mjs',['createSessionStore'])+scope('app.js',['renderShell','coordinatorCsv']);
 assert(!/<\/script/i.test(code)&&!/<\/style/i.test(bytes['runtime/style.css']),'Unexpected inline closing tag.');
 return code;
}

export function verifyParity(model,release){
 const initial=createState(model,release,'session_pending','2026-11-09T00:00:00.000Z');
 const canonicalCoverage={nodes:[...model.nodes.keys()],blocks:Object.fromEntries(model.blockOwners),contexts:Object.fromEntries(model.contextOwners),arguments:model.coverage.arguments,responses:model.coverage.responses,qualifications:model.coverage.qualifications};
 const report={schema_version:1,release,semantic_coverage_sha256:sha(JSON.stringify(canonicalCoverage)),coverage:canonicalCoverage,question_panels:[],scenarios:{},one_active_decision:true,one_active_comparison:true,mandatory_original_argument_votes:0,human_usability_benefit_tested:false};
 for(const node of model.nodes.values()){
  const variants={};for(const mode of ['read','review']){const html=renderDecision(model,initial,node.id,mode,true);assert.deepEqual(markers(html,'data-decision-id'),[node.id]);assert.deepEqual(markers(html,'data-required-block-id'),node.block_ids);assert.deepEqual(markers(html,'data-context-id'),node.context_ids);assert.equal((html.match(/class="decision-form"/g)??[]).length,mode==='review'?1:0);variants[mode]={decision_ids:markers(html,'data-decision-id'),required_block_ids:markers(html,'data-required-block-id'),context_ids:markers(html,'data-context-id')};}assert.deepEqual(variants.read,variants.review);report.question_panels.push({id:node.id,...variants.review});
 }
 for(const [name,answer] of [['all_yes','Yes'],['all_no','No']]){
  let state=initial;const visited=[],fullBlocks=[],fullContexts=[];
  while(nextDecision(model,state)){
   assert(visited.length<model.nodes.size,'Scheduler repeated a required decision.');const node=nextDecision(model,state),html=renderReview(model,state,'review',true);assert.deepEqual(markers(html,'data-decision-id'),[node.id]);visited.push(node.id);
   const inherited=new Set(markers(html,'data-carried-consequence-id').flatMap(parent=>model.nodes.get(parent).context_ids));assert.deepEqual(markers(html,'data-context-id'),node.context_ids.filter(id=>!inherited.has(id)));
   for(const id of node.block_ids.filter(id=>model.blocks.get(id).role==='qualification'))assert(html.includes(`data-required-block-id="${id}" data-evidence-presentation="full"`),'A local qualification was hidden after earlier review.');
   fullBlocks.push(...[...html.matchAll(/data-required-block-id="([^"]+)" data-evidence-presentation="full"/g)].map(match=>match[1]));fullContexts.push(...[...html.matchAll(/class="legal-context"[^>]*data-context-id="([^"]+)"/g)].map(match=>match[1]));state=answerDecision(model,state,node.id,answer,state.updated_at);
  }
  const shared=fullBlocks.filter(id=>model.blocks.get(id).role!=='qualification');assert.equal(new Set(shared).size,shared.length,'Shared evidence was repeated in full along a path.');assert.equal(new Set(fullContexts).size,fullContexts.length,'Shared legal context was repeated in full along a path.');assert.equal(completion(model,state).remaining,0,'Required unresolved decision was bypassed.');assert((renderResults(model,state,'review',true).match(/class="comparison-form"/g)??[]).length<=1);
  report.scenarios[name]={visited,visited_count:visited.length,full_block_ids:fullBlocks,full_context_ids:fullContexts,status_counts:Object.fromEntries(['answered','pruned','waiting','stale','eligible'].map(status=>[status,[...decisionStates(model,state).values()].filter(item=>item.status===status).length])),results:Object.fromEntries(derivedResults(model,state)),completion:completion(model,state)};
 }
 return report;
}

export async function loadBill({billDir,procedurePath=join(runtimeDir,'..','PROCEDURE.md'),commonCopyOverrides}){
 assert(billDir,'billDir is required.');billDir=resolve(billDir);
 if(commonCopyOverrides===undefined)commonCopyOverrides=await commonOverrides();
 const files=[...runtimeFiles.map(name=>['runtime/'+name,join(runtimeDir,name)]),['input/source.json',join(billDir,'input/source.json')],['decisions.json',join(billDir,'decisions.json')],['coverage.json',join(billDir,'coverage.json')],['PROCEDURE.md',resolve(procedurePath)]];
 const bytes=Object.fromEntries(await Promise.all(files.map(async([name,path])=>[name,await read(path)])));bytes['copy-override.json']=await optional(join(billDir,'copy.json'));bytes['common-copy-override.json']=JSON.stringify(commonCopyOverrides);
 for(const name of ['firebase-config.json','package.json','package-lock.json'])bytes[name]=await read(join(runtimeDir,'..',name));
 bytes['firebase-bundle.js']=await bundledFirebase();
 bytes['session-history.json']=await optional(join(runtimeDir,'..','session-history.json'));
 assert(bytes['PROCEDURE.md'].trim(),'PROCEDURE.md must describe this decision procedure.');
 const source=parse(bytes['input/source.json'],'input/source.json'),decisions=parse(bytes['decisions.json'],'decisions.json'),coverage=parse(bytes['coverage.json'],'coverage.json');
 const base=parse(bytes['runtime/copy.json'],'runtime/copy.json'),commonCopy=prepareCopy(source,base,commonCopyOverrides),copy=prepareCopy(source,commonCopy,parse(bytes['copy-override.json'],'copy.json')),hashes={source_sha256:sha(bytes['input/source.json'])};
 const carry={fingerprints:decisionFingerprints(decisions,copy),prior:sessionHistory(bytes['session-history.json'],source.bill.id)},model=createDecisionTree(source,decisions,coverage,copy,hashes,carry);
 const release={review_id:'policy-stake-briefs-decision-review',bill_id:source.bill.id,source_sha256:hashes.source_sha256,content_id:'content-'+parts(['input/source.json','decisions.json','runtime/copy.json','common-copy-override.json','copy-override.json'].map(name=>[name,bytes[name]])),mapping_id:'mapping-'+parts(['input/source.json','decisions.json','coverage.json'].map(name=>[name,bytes[name]])),procedure_id:'procedure-'+sha(bytes['PROCEDURE.md']),rendered_id:'rendered-'+parts(Object.entries(bytes).sort(([a],[b])=>a.localeCompare(b)))};
 assert(!carry.prior.some(entry=>entry.release.rendered_id===release.rendered_id),'The current release is listed as an earlier version.');
 return {billDir,bytes,source,decisions,coverage,copy,hashes,model,release,carry};
}

export async function buildBill({billDir,outputDir,procedurePath,commonCopyOverrides}){
 assert(outputDir,'outputDir is required.');outputDir=resolve(outputDir);
 const {bytes,source,decisions,coverage,copy,hashes,model,release,carry}=await loadBill({billDir,procedurePath,commonCopyOverrides});
 const parity=verifyParity(model,release),measurement=measurePaths(model,release),standalone=bundle(bytes);
 const config=parse(bytes['firebase-config.json'],'firebase-config.json'),firebaseAsset='firebase-'+sha(bytes['firebase-bundle.js'])+'.js';
 assert(/^[a-z0-9-]+\.firebaseapp\.com$/.test(config.authDomain)&&typeof config.projectId==='string'&&config.apiKey,'Invalid public Firebase configuration.');
 const payload=JSON.stringify({source,decisions,coverage,copy,hashes,carry,release,mode:'review',firebase:{config,module:'./'+firebaseAsset}}).replaceAll('<','\\u003c');
 const bundledOriginals=new Script(standalone+`\nconst checkData=JSON.parse(verificationPayload),checkModel=createDecisionTree(checkData.source,checkData.decisions,checkData.coverage,checkData.copy,checkData.hashes,checkData.carry),checkState=createState(checkModel,checkData.release,'session_bundle_check','2026-11-09T00:00:00.000Z');checkState.navigation={page:'originals',decision_id:null,anchor:''};renderShell(checkModel,checkState,'review',checkData.release,{status:'saved'});`,{filename:'standalone-originals-regression.js'}).runInNewContext({verificationPayload:payload},{timeout:10000});
 assert.deepEqual(markers(bundledOriginals,'data-source-record-id'),[...source.claims,...source.arguments].map(record=>record.id),'Compiled standalone Originals must render every frozen source record.');
 const initial=createState(model,release,'session_pending','2026-11-09T00:00:00.000Z'),shell=renderShell(model,initial,'review',release,{status:'auth_loading'});
 const csp=`default-src 'none'; connect-src https://*.googleapis.com https://${config.authDomain}; script-src 'self' 'unsafe-inline' https://apis.google.com; frame-src https://${config.authDomain}; style-src 'unsafe-inline'; img-src data:; font-src 'none'; base-uri 'none'; form-action 'none'`;
 const html=`<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="${escape(csp)}"><title>${escape(copy.tree_title)}</title><style>${bytes['runtime/style.css']}</style></head><body><div id="pilot">${shell}</div><script type="application/json" id="pilot-data">${payload}</script><script type="module">${standalone}</script></body></html>\n`;
 const descriptor={schema_version:1,release,earlier_releases:carry.prior.map(entry=>entry.release.rendered_id),input_sha256:Object.fromEntries(Object.entries(bytes).map(([name,value])=>[name,sha(value)])),html_sha256:{'index.html':sha(html),'review.html':sha(html)},asset_sha256:{[firebaseAsset]:sha(bytes['firebase-bundle.js'])},semantic_coverage_sha256:parity.semantic_coverage_sha256};
 await mkdir(outputDir,{recursive:true});for(const name of ['index.html','review.html'])await writeFile(join(outputDir,name),html);
 await writeFile(join(outputDir,firebaseAsset),bytes['firebase-bundle.js']);
 for(const [name,value] of [['release.json',descriptor],['parity.json',parity],['path-benchmark.json',measurement]])await writeFile(join(outputDir,name),JSON.stringify(value,null,2)+'\n');
 return {bill:source.bill,release,outputDir,descriptor,parity,measurement};
}

export function renderCatalog({bills,copy}){
 for(const key of ['title','intro','open_review'])assert(typeof copy[key]==='string'&&copy[key].trim(),'Missing approved catalog copy: '+key);
 assert(Array.isArray(bills)&&bills.length>0,'Catalog bills are required.');
 return `<!doctype html>\n<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta http-equiv="Content-Security-Policy" content="default-src 'none'; connect-src 'none'; style-src 'unsafe-inline'; base-uri 'none'; form-action 'none'"><title>${escape(copy.title)}</title><style>${catalogStyle}</style></head><body><div class="page-heading"><h1>${escape(copy.title)}</h1><p>${escape(copy.intro)}</p></div><main class="preview-layout"><div class="reading-column"><ul>${bills.map(entry=>{assert(/^[a-z0-9][a-z0-9-]*$/.test(entry.slug),'Invalid catalog bill slug.');assert(typeof entry.href==='string'&&/^(?:\.\/|\/)?[a-z0-9/_-]+\/?$/i.test(entry.href)&&!entry.href.startsWith('//'),'Catalog href must be a relative local path.');assert(typeof entry.bill==='string'&&typeof entry.title==='string','Catalog bill metadata must be text.');return `<li><h2>${escape(entry.bill)}, ${escape(entry.title)}</h2><a href="${escape(entry.href)}">${escape(copy.open_review)}</a></li>`;}).join('')}</ul></div></main></body></html>\n`;
}

export async function buildCatalog({entries,copy,outputDir}){
 const html=renderCatalog({bills:entries.map(entry=>({slug:entry.slug,bill:entry.bill.bill,title:entry.bill.title,href:entry.slug+'/'})),copy});await mkdir(outputDir,{recursive:true});await writeFile(join(outputDir,'index.html'),html);
 const descriptor={schema_version:1,html_sha256:sha(html),bills:entries.map(({slug,bill,release})=>({slug,bill_id:bill.id,release}))};await writeFile(join(outputDir,'catalog.json'),JSON.stringify(descriptor,null,2)+'\n');return descriptor;
}

async function main(args){
 const all=args[0]==='--all';if(all)args=args.slice(1);const input=args.shift(),outIndex=args.indexOf('--out');assert(input&&outIndex>=0&&args[outIndex+1],'Usage: node build.mjs [--all] <bill-or-bills-dir> --out <output-dir> [--catalog-copy <json>] [--procedure <markdown>]');
 const outputDir=resolve(args[outIndex+1]),procedureIndex=args.indexOf('--procedure'),procedurePath=procedureIndex<0?undefined:args[procedureIndex+1];
 if(!all){const result=await buildBill({billDir:input,outputDir,procedurePath});console.log(JSON.stringify({bill_id:result.bill.id,release:result.release.rendered_id,outputDir},null,2));return;}
 const slugs=(await readdir(resolve(input),{withFileTypes:true})).filter(entry=>entry.isDirectory()).map(entry=>entry.name).sort(),entries=[];
 for(const slug of slugs){const result=await buildBill({billDir:join(input,slug),outputDir:join(outputDir,slug),procedurePath});entries.push({slug,...result});console.log(JSON.stringify({bill_id:result.bill.id,release:result.release.rendered_id,outputDir:result.outputDir}));}
 const copyIndex=args.indexOf('--catalog-copy');if(copyIndex>=0)await buildCatalog({entries,copy:parse(await read(args[copyIndex+1]),args[copyIndex+1]),outputDir});
}
if(process.argv[1]&&pathToFileURL(resolve(process.argv[1])).href===import.meta.url)await main(process.argv.slice(2));
