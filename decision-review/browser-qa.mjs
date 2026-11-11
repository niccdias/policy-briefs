import assert from 'node:assert/strict';
import {readFile,writeFile,mkdtemp,mkdir,rm,readdir} from 'node:fs/promises';
import {createServer} from 'node:http';
import {spawn} from 'node:child_process';
import {tmpdir} from 'node:os';
import {join,resolve,dirname,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createHash,randomUUID} from 'node:crypto';
import {createDecisionTree,createState,decisionStates,nextDecision,completion,navigate} from './runtime/model.mjs';
import {storagePrefix} from './runtime/storage.mjs';
import {connectFirebase} from './runtime/firebase.mjs';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {doc,setDoc} from 'firebase/firestore';

assert(process.env.FIRESTORE_EMULATOR_HOST==='127.0.0.1:8095'&&process.env.FIREBASE_AUTH_EMULATOR_HOST==='127.0.0.1:9105','Browser checks require the isolated decision-review emulators.');
const testUser='browser-'+randomUUID(),qaService=connectFirebase({}, {emulator:true,testUser}),qaUser=(await qaService.signIn()).user;
const qaEnvironment=await initializeTestEnvironment({projectId:'demo-decision-review',firestore:{host:'127.0.0.1',port:8095}});
await qaEnvironment.withSecurityRulesDisabled(context=>setDoc(doc(context.firestore(),'assignments',qaUser.uid),{active:true,kinds:['qa'],versions:[],role:'reviewer'}));

const root=dirname(fileURLToPath(import.meta.url));
assert(process.argv[2],'Usage: node browser-qa.mjs <built-public-directory>');
const publicDir=resolve(process.argv[2]),profile=await mkdtemp(join(tmpdir(),'bill-review-browser-'));
const checks=[],layouts=[],errors=[],clients=[],bills=[];
const sha=bytes=>createHash('sha256').update(bytes).digest('hex');
const pause=ms=>new Promise(resolve=>setTimeout(resolve,ms));
async function until(probe,message){const deadline=Date.now()+30000;while(Date.now()<deadline){const result=await probe();if(result)return result;await pause(20);}throw new Error(message);}
const server=createServer(async(request,response)=>{try{let path=decodeURIComponent(new URL(request.url,'http://localhost').pathname);if(path.endsWith('/'))path+='index.html';const file=resolve(publicDir,'.'+path);assert(file.startsWith(publicDir+'/'));let bytes=await readFile(file);if(extname(file)==='.html')bytes=Buffer.from(bytes.toString().replace('connect-src https://*.googleapis.com','connect-src http://127.0.0.1:8095 http://127.0.0.1:9105 ws://127.0.0.1:8095 https://*.googleapis.com').replace('service.watchAuth(nextUser=>','window.__qaStore=()=>store;service.watchAuth(nextUser=>'));response.writeHead(200,{'Content-Type':extname(file)==='.html'?'text/html; charset=utf-8':extname(file)==='.js'?'text/javascript; charset=utf-8':'application/json'});response.end(bytes);}catch{response.writeHead(404);response.end('Not found');}});
await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
const base='http://127.0.0.1:'+server.address().port+'/';
const child=spawn(process.env.REVIEW_CHROME_BIN??'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',['--headless=new','--no-first-run','--no-default-browser-check','--disable-background-networking','--disable-sync','--disable-component-update','--disable-default-apps','--remote-debugging-port=0','--user-data-dir='+profile,'about:blank'],{stdio:'ignore'});
let launchError,endpoint;child.on('error',error=>launchError=error);
function client(target){
 const socket=new WebSocket(target.webSocketDebuggerUrl),pending=new Map();let sequence=0;
 const ready=new Promise((resolve,reject)=>{socket.onopen=resolve;socket.onerror=reject;});
 socket.onmessage=event=>{const message=JSON.parse(event.data);if(message.id){const task=pending.get(message.id);pending.delete(message.id);if(message.error)task.reject(new Error(JSON.stringify(message.error)));else task.resolve(message.result);}else if(message.method==='Runtime.exceptionThrown')errors.push(message.params.exceptionDetails.text);};
 const send=async(method,params={})=>{await ready;return new Promise((resolve,reject)=>{const id=++sequence;pending.set(id,{resolve,reject});socket.send(JSON.stringify({id,method,params}));});};
 const evaluate=async(fn,...args)=>{const result=await send('Runtime.evaluate',{expression:'('+fn.toString()+')(...'+JSON.stringify(args)+')',awaitPromise:true,returnByValue:true});assert(!result.exceptionDetails,JSON.stringify(result.exceptionDetails));return result.result.value;};
 const click=selector=>evaluate(selector=>{const element=document.querySelector(selector);if(!element||element.matches(':disabled'))throw new Error('Missing or disabled control: '+selector);element.click();},selector);
 const waitFor=selector=>until(()=>evaluate(selector=>Boolean(document.querySelector(selector)),selector),'Missing selector: '+selector);
 const page={send,evaluate,click,waitFor,close:async()=>{socket.close();await fetch(endpoint+'/json/close/'+target.id);}};clients.push(page);return page;
}
async function inspectIntroduction(page){
 const intro=await page.evaluate(()=>{const p=JSON.parse(document.getElementById('pilot-data').textContent),main=document.querySelector('.bill-intro');return {title:main.querySelector('h1').textContent,description:main.querySelector('p').textContent,expectedTitle:p.copy.bill_context_label,expectedDescription:p.copy.bill_description,children:main.children.length,screens:document.getElementById('pilot').children.length,extra:document.querySelectorAll('header,aside,form,.page-heading,.decision-outline,.trail,.release-details').length};});
 assert.equal(intro.title,intro.expectedTitle);assert.equal(intro.description,intro.expectedDescription);assert.equal(intro.children,4);assert.equal(intro.screens,1);assert.equal(intro.extra,0);
 const tooltip=await page.evaluate(async()=>{const term=document.querySelector('.bill-intro [data-term]'),popup=document.getElementById('glossary-popover');if(!term)return null;const data=JSON.parse(document.getElementById('pilot-data').textContent);term.dispatchEvent(new MouseEvent('mouseover',{bubbles:true}));const shown=!popup.hidden,text=popup.querySelector('p')?.textContent,expected=data.decisions.glossary.find(entry=>entry.term===term.dataset.term).definition;term.dispatchEvent(new MouseEvent('mouseout',{bubbles:true,relatedTarget:document.body}));await new Promise(resolve=>setTimeout(resolve,180));return {shown,text,expected,closed:popup.hidden};});
 if(tooltip){assert(tooltip.shown);assert.equal(tooltip.text,tooltip.expected);assert(tooltip.closed,'Introduction tooltip must close when the pointer leaves.');}
}
async function inspectStablecoinDefinitions(page){
 const result=await page.evaluate(async()=>{
  const data=JSON.parse(document.getElementById('pilot-data').textContent),panel=document.querySelector('.active-decision'),reading=panel.cloneNode(true);reading.querySelectorAll('.source-details').forEach(item=>item.remove());
  const definitions=[];
  for(const name of ['stablecoin','issuer','redeem','CRS','OCC','Brookings']){
   const term=[...panel.querySelectorAll('[data-term]')].find(item=>item.dataset.term.toLowerCase()===name.toLowerCase());if(!term){definitions.push({name,missing:true});continue;}
   term.scrollIntoView({block:'center'});await new Promise(resolve=>setTimeout(resolve,80));const popup=document.getElementById('glossary-popover'),entry=data.decisions.glossary.find(item=>item.term===term.dataset.term);term.dispatchEvent(new MouseEvent('mouseover',{bubbles:true}));const shown=!popup.hidden,text=popup.querySelector('p')?.textContent;term.dispatchEvent(new MouseEvent('mouseout',{bubbles:true,relatedTarget:document.body}));await new Promise(resolve=>setTimeout(resolve,180));definitions.push({name,shown,text,expected:entry.definition,closed:popup.hidden});
  }
  return {text:reading.textContent,definitions};
 });
 for(const removed of ['These are digital coins.','CRS is the Congressional Research Service','OCC is the Office of the Comptroller of the Currency','Brookings is a policy research group.','which means exchanging them for money'])assert(!result.text.includes(removed),'Inline definition remains: '+removed);
 for(const term of result.definitions){assert(!term.missing,'Missing hover definition: '+term.name);assert(term.shown,'Definition did not open in the viewport: '+term.name);assert.equal(term.text,term.expected);assert(term.closed,'Definition did not close on hover-out: '+term.name);}
 checks.push('s1582: stablecoin, issuer, redeem, CRS, OCC and Brookings definitions open and close on hover; the reported inline definitions are absent from the reading.');
}
async function newPage(path,writable=true){
 let unstartedId=null;const target=await(await fetch(endpoint+'/json/new?about:blank',{method:'PUT'})).json(),page=client(target);await page.send('Runtime.enable');await page.send('Page.enable');await page.send('Page.navigate',{url:new URL(path+'?firebaseEmulator=1&testUser='+encodeURIComponent(testUser),base).href});
 await until(()=>page.evaluate(()=>Boolean(document.querySelector('#begin-review:not(:disabled),.save-status.auth_signed_out,#sign-out'))),'Auth did not load.');
 if(await page.evaluate(()=>Boolean(document.querySelector('#begin-review')))){
  await inspectIntroduction(page);await page.evaluate(()=>location.hash='results');await pause(80);await inspectIntroduction(page);
  for(const [width,height] of [[320,740],[390,844],[768,1000],[1280,900],[1600,1000]]){await page.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'Introduction overflows.');layouts.push({slug:path.split('/')[1],width,height,fragment:'introduction',overflow:false});}
  await page.send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});
  await mkdir(join(root,'private/screenshots'),{recursive:true});const shot=await page.send('Page.captureScreenshot',{format:'png'});await writeFile(join(root,'private/screenshots',path.split('/')[1]+'-introduction.png'),Buffer.from(shot.data,'base64'));
  if(await page.evaluate(()=>!window.__qaStore())){
   const data=await payload(page),model=createDecisionTree(data.source,data.decisions,data.coverage,data.copy,data.hashes),unstarted=createState(model,data.release,'unstarted_'+data.source.bill.id,new Date().toISOString());
   await qaService.save(qaUser.uid,unstarted.session_id,data.release,'qa',0,unstarted);unstartedId=unstarted.session_id;checks.push(path.split('/')[1]+': pre-existing untouched cloud session seeded before anonymous Continue and sign-in.');
  }
  await page.click('#begin-review');await until(()=>page.evaluate(()=>Boolean(document.querySelector('.save-status.auth_signed_out,#sign-out'))),'Continue did not open the review.');
  checks.push(path.split('/')[1]+': first screen contains only the approved short bill description, bill title and Continue; glossary terms use hover definitions; navigation cannot bypass it; five viewport sizes fit.');
 }
 if(await page.evaluate(()=>Boolean(document.querySelector('#sign-in'))))await page.click('#sign-in');await page.waitFor('#session-id');if(writable)await waitSaved(page);else await until(()=>page.evaluate(()=>!document.querySelector('.save-status.cloud_loading')),'Session did not load.');if(unstartedId)assert.equal(await page.evaluate(()=>document.getElementById('session-id').textContent),unstartedId,'Continue must resume the existing untouched session without a conflict.');assert.equal(await page.evaluate(()=>document.querySelector('.bill-intro')),null,'Signing in repeated the introduction.');return page;
}
const payload=page=>page.evaluate(()=>JSON.parse(document.getElementById('pilot-data').textContent));
const savedState=(page,prefix)=>page.evaluate(prefix=>JSON.parse(localStorage.getItem(prefix+'session:'+document.getElementById('session-id').textContent))?.state,prefix);
const activeId=page=>page.evaluate(()=>document.querySelector('.active-decision')?.dataset.decisionId??null);
const waitSaved=page=>until(()=>page.evaluate(()=>document.querySelector('#save-status')?.classList.contains('cloud_saved')),'Save did not finish.');
// The page ignores a second Yes/No within 800 ms of an answer (accidental double activation); wait it out.
async function answer(page,prefix,choice){const before=await savedState(page,prefix);await pause(850);await page.click('[data-decision-answer="'+choice+'"]');await until(async()=>(await savedState(page,prefix)).revision>before.revision,'Answer was not saved.');await waitSaved(page);}
async function go(page,fragment){await page.evaluate(fragment=>{location.hash=fragment;},fragment);await page.waitFor(fragment==='results'?'#results':fragment==='originals'?'#source-search':'#'+fragment);await waitSaved(page);}
async function inspect(page,data,model){
 const info=await page.evaluate(()=>{const panel=document.querySelector('.active-decision');return {id:panel.dataset.decisionId,kind:panel.dataset.decisionKind,forms:document.querySelectorAll('.decision-form').length,buttons:[...panel.querySelectorAll('[data-decision-answer]')].map(item=>item.value),legend:panel.querySelector('legend').textContent,goals:[...panel.querySelectorAll('.value-goals li')].map(item=>item.textContent),blocks:[...panel.querySelectorAll('[data-required-block-id]')].map(item=>({id:item.dataset.requiredBlockId,hidden:Boolean(item.closest('details:not([open])'))})),notesAfter:panel.querySelector('.decision-choices')?.nextElementSibling?.getAttribute('for')==='decision-notes',unwanted:panel.querySelectorAll('.block-heading,.legal-context>h3,.eyebrow,.value-goals-label').length,boxes:[...panel.querySelectorAll('[data-claim-box]')].map(item=>item.dataset.claimBox),labels:[...panel.querySelectorAll('.decision-label')].map(item=>({text:item.textContent,size:getComputedStyle(item).fontSize})),refs:[...panel.querySelectorAll('a')].filter(item=>/^\[\d+\]$/.test(item.textContent)).map(item=>({number:item.textContent,href:item.getAttribute('href'),title:item.getAttribute('title')}))};});
 const node=model.nodes.get(info.id);assert(node);assert.equal(info.forms,1);assert.deepEqual(info.buttons,['Yes','No']);assert(info.notesAfter);assert.equal(info.unwanted,0);assert.deepEqual(info.blocks.map(block=>block.id),node.block_ids);assert(info.blocks.every(block=>!block.hidden));assert.equal(info.labels.length,2);assert.equal(info.labels[0].size,info.labels[1].size);
 assert.equal(info.legend,node.kind==='causal'?data.copy.causal_question:data.copy.value_questions[node.direction]);assert.deepEqual(info.boxes,node.kind==='causal'?['top','question']:['question']);if(node.kind==='value')assert.deepEqual(info.goals,model.copy.value_goals[node.value_id]);
 const destinations=new Map();for(const ref of info.refs){const destination=JSON.stringify([ref.href,ref.href.startsWith('#decision-')?null:ref.title]);if(destinations.has(ref.number))assert.equal(destinations.get(ref.number),destination,'Reference number collision.');destinations.set(ref.number,destination);}
 return info;
}
try{
 const port=await until(async()=>{if(launchError)throw launchError;try{return(await readFile(join(profile,'DevToolsActivePort'),'utf8')).split('\n')[0];}catch{return null;}},'Isolated Chrome did not start.');endpoint='http://127.0.0.1:'+port;
 const manifest=JSON.parse(await readFile(join(root,'input-manifest.json'),'utf8'));
 const selected=process.argv[3]?manifest.bills.filter(entry=>entry.slug===process.argv[3]):manifest.bills;
 assert(selected.length,'Unknown test bill.');
 for(const entry of selected){
  const page=await newPage('arguments/'+entry.slug+'/'),data=await payload(page),model=createDecisionTree(data.source,data.decisions,data.coverage,data.copy,data.hashes),prefix='policy-rationales:decision-review:account:'+encodeURIComponent(qaUser.uid)+':qa:'+storagePrefix(data.release),first=nextDecision(model,await savedState(page,prefix));
  assert.equal(data.source.bill.id,entry.bill_id);assert.equal(await activeId(page),first.id);await inspect(page,data,model);
  if(first.kind==='causal'){
   await answer(page,prefix,'No');const state=await savedState(page,prefix),statuses=decisionStates(model,state),pruned=[...statuses].filter(([,item])=>item.status==='pruned').map(([id])=>id);assert(pruned.length>0,'The highest-priority root should prune a dependent question.');assert(pruned.every(id=>!state.answers[id]));
   bills.push({slug:entry.slug,release:data.rendered_release??data.release,session_release:data.release,root:first.id,root_no_pruned:pruned.length});
   await page.click('#new-session');await page.waitFor('#begin-review:not(:disabled)');await inspectIntroduction(page);
   const introOrigin=await page.evaluate(()=>performance.timeOrigin);await page.send('Page.reload',{ignoreCache:true});await until(async()=>{try{return await page.evaluate(()=>performance.timeOrigin)!==introOrigin;}catch{return false;}},'Introduction reload did not complete.');await page.waitFor('#begin-review:not(:disabled)');await inspectIntroduction(page);await page.click('#begin-review');await page.waitFor('#session-id');
   await until(async()=>(await savedState(page,prefix)).session_id!==state.session_id,'New session did not open.');await waitSaved(page);
   const started=await savedState(page,prefix);assert.deepEqual(started.answers,{});assert.equal(started.navigation.anchor,'reading');assert.equal(started.history.at(-1).type,'navigation');checks.push(entry.slug+': a new session and its reload show the introduction; Continue is persisted as navigation with no judgment.');
  }else bills.push({slug:entry.slug,release:data.rendered_release??data.release,session_release:data.release,root:first.id,root_no_pruned:0});
  const order=[],panels=[];
  for(let guard=0;guard<=model.nodes.size;guard++){
   const id=await activeId(page);if(!id)break;assert(!order.includes(id),'A decision repeated on an unchanged path.');const info=await inspect(page,data,model);order.push(id);panels.push(info);assert.equal(nextDecision(model,await savedState(page,prefix)).id,id);await answer(page,prefix,'Yes');
  }
  assert.equal(order.length,model.nodes.size,'The all-Yes UI path lost a decision.');assert.equal((await savedState(page,prefix)).history.filter(event=>event.type==='answer').length,model.nodes.size);
  let comparisons=0;
  while(await page.evaluate(()=>Boolean(document.querySelector('.comparison-form')))){
   if(comparisons===0){assert(!completion(model,await savedState(page,prefix)).complete);await page.evaluate(()=>document.querySelector('.comparison-form').scrollIntoView({block:'center'}));const shot=await page.send('Page.captureScreenshot',{format:'png'});await writeFile(join(root,'private/screenshots',entry.slug+'-comparison.png'),Buffer.from(shot.data,'base64'));}
   const before=await savedState(page,prefix);await page.evaluate(()=>{const form=document.querySelector('.comparison-form'),choices=[...form.querySelectorAll('input[type=radio]')].map(input=>input.value);if(JSON.stringify(choices)!==JSON.stringify(['support','oppose']))throw new Error('Comparison must offer only SUPPORT and OPPOSE.');const radio=form.querySelector('input[value="support"]');radio.checked=true;radio.dispatchEvent(new Event('change',{bubbles:true}));form.requestSubmit();});await until(async()=>(await savedState(page,prefix)).revision>before.revision,'Comparison did not save.');await waitSaved(page);assert(++comparisons<=data.source.values.length);
  }
  assert(completion(model,await savedState(page,prefix)).complete);
  const before=await savedState(page,prefix),serverBefore=await qaService.load(qaUser.uid,before.session_id),origin=await page.evaluate(()=>performance.timeOrigin);await page.send('Page.reload',{ignoreCache:true});await until(async()=>{try{return await page.evaluate(()=>performance.timeOrigin)!==origin;}catch{return false;}},'Reload did not complete.');await page.waitFor('#session-id');await waitSaved(page);assert.deepEqual(await savedState(page,prefix),before);assert.equal((await qaService.load(qaUser.uid,before.session_id)).revision,serverBefore.revision,'Returning must not create a new server revision.');
  const second=await newPage('arguments/'+entry.slug+'/review.html',false);
  await second.waitFor('.save-status.read_only');await second.close();
  if(entry===selected[0]&&first.kind==='causal'){
   await go(page,'decision-'+first.id);await answer(page,prefix,'No');let changed=await savedState(page,prefix);
   assert.deepEqual(changed.comparisons,before.comparisons,'Backtracking must retain comparisons.');assert.equal(Object.keys(changed.answers).length,model.nodes.size);assert(Object.keys(changed.stale.decisions).length>0);
   await go(page,'decision-'+first.id);await page.click('[data-reopen-decision="'+first.id+'"]');await until(async()=>!(await savedState(page,prefix)).answers[first.id],'Reopen did not clear direct answer.');await waitSaved(page);await answer(page,prefix,'Yes');
   changed=await savedState(page,prefix);assert(Object.keys(changed.stale.decisions).length>0,'Restoring a premise must require reassessment.');
   const downloads=join(profile,'downloads');await mkdir(downloads);await page.send('Page.setDownloadBehavior',{behavior:'allow',downloadPath:downloads});await page.click('[data-export="json"]');await page.click('[data-export="csv"]');
   const names=await until(async()=>{const names=await readdir(downloads);return names.some(name=>name.endsWith('.json'))&&names.some(name=>name.endsWith('.csv'))?names:null;},'Exports did not download.');
   const backupPath=join(downloads,names.find(name=>name.endsWith('.json'))),backup=JSON.parse(await readFile(backupPath,'utf8'));assert.deepEqual(backup.state,await savedState(page,prefix));
   const previousId=backup.state.session_id,doc=await page.send('DOM.getDocument'),input=await page.send('DOM.querySelector',{nodeId:doc.root.nodeId,selector:'#backup-import'});await page.send('DOM.setFileInputFiles',{nodeId:input.nodeId,files:[backupPath]});await until(async()=>(await savedState(page,prefix)).session_id!==previousId,'Import did not open a new session.');await waitSaved(page);const imported=await savedState(page,prefix);assert.deepEqual(imported.answers,backup.state.answers);assert.deepEqual(imported.stale,backup.state.stale);assert.equal(imported.history.at(-1).type,'import');
   checks.push(entry.slug+': actual browser backtracking/reopening retains saved descendants and comparisons, marks reassessment, and JSON/CSV export plus isolated import work.');
   await go(page,'decision-'+first.id);
   const offlineBase=await savedState(page,prefix),offlineServer=await qaService.load(qaUser.uid,offlineBase.session_id);
   await page.evaluate(async()=>{const p=JSON.parse(document.getElementById('pilot-data').textContent),module=await import(p.firebase.module);await module.connectFirebase(p.firebase.config,{emulator:true}).network(false);});
   await page.click('[data-decision-answer="No"]');await page.waitFor('.save-status.cloud_pending');await until(async()=>(await savedState(page,prefix)).answers[first.id]?.answer==='No','Offline answer was not cached.');
   assert.equal((await qaService.load(qaUser.uid,offlineBase.session_id)).revision,offlineServer.revision,'Offline UI must not claim a server write.');
   await page.evaluate(async()=>{const p=JSON.parse(document.getElementById('pilot-data').textContent),module=await import(p.firebase.module);await module.connectFirebase(p.firebase.config,{emulator:true}).network(true);});
   await page.click('#retry-cloud');await waitSaved(page);assert.deepEqual((await qaService.load(qaUser.uid,offlineBase.session_id)).state,await savedState(page,prefix));
   for(const resolution of ['use-server','keep-draft']){
    await go(page,'decision-'+first.id);const local=await savedState(page,prefix),remote=await qaService.load(qaUser.uid,local.session_id),remoteState=navigate(model,local,{page:'results',decision_id:null,anchor:''},new Date(Math.max(Date.now(),Date.parse(local.updated_at))).toISOString());
    assert.notDeepEqual(remoteState,local);await qaService.save(qaUser.uid,local.session_id,data.release,'qa',remote.revision,remoteState);
    await page.click('[data-decision-answer="Yes"]');await page.waitFor('.save-status.cloud_conflict');assert(await page.evaluate(()=>document.querySelector('[data-decision-answer]').matches(':disabled')),'Conflict must pause editing.');
    const draft=await savedState(page,prefix);assert.equal(draft.answers[first.id].answer,'Yes');assert.deepEqual((await qaService.load(qaUser.uid,local.session_id)).state,remoteState);
    await page.click('#'+resolution);await waitSaved(page);const resolved=await savedState(page,prefix);
    if(resolution==='use-server')assert.deepEqual(resolved,remoteState);else{assert.notEqual(resolved.session_id,local.session_id);assert.deepEqual(resolved.answers,draft.answers);assert.deepEqual((await qaService.load(qaUser.uid,local.session_id)).state,remoteState);assert.deepEqual((await qaService.load(qaUser.uid,resolved.session_id)).state,resolved);}
   }
   await go(page,'decision-'+first.id);const raceLocal=await savedState(page,prefix),raceRemote=await qaService.load(qaUser.uid,raceLocal.session_id),raceState=navigate(model,raceLocal,{page:'results',decision_id:null,anchor:''},new Date(Math.max(Date.now(),Date.parse(raceLocal.updated_at))).toISOString());await qaService.save(qaUser.uid,raceLocal.session_id,data.release,'qa',raceRemote.revision,raceState);
   await page.click('[data-decision-answer="No"]');await page.waitFor('.save-status.cloud_conflict');await page.evaluate(()=>{const store=window.__qaStore(),original=store.useServer.bind(store);store.useServer=async()=>{const next=await original();await new Promise(resolve=>window.__qaResumeResolution=resolve);return next;};});await page.click('#use-server');await until(()=>page.evaluate(()=>typeof window.__qaResumeResolution==='function'),'The real server resolution did not reach the delayed completion.');
   await page.click('#sign-out');await page.waitFor('.save-status.auth_signed_out');await page.evaluate(()=>window.__qaResumeResolution());await pause(100);assert(await page.evaluate(()=>Boolean(document.querySelector('.save-status.auth_signed_out'))),'A stale resolution must not repaint a signed-out account.');assert.equal(await activeId(page),first.id,'A stale resolution must not restore private session navigation after sign-out.');assert.equal(await page.evaluate(()=>document.querySelectorAll('[data-reopen-decision],.saved-verdict').length),0,'Old private answers must stay hidden after a delayed completion.');assert.equal(await page.evaluate(()=>document.querySelector('#session-id')),null,'Signed-out view must not expose account sessions.');assert(await page.evaluate(()=>document.querySelector('[data-decision-answer]').matches(':disabled')));
   const expectedResume=(await qaService.list(qaUser.uid,data.release,'qa'))[0];await page.click('#sign-in');await waitSaved(page);assert.equal((await savedState(page,prefix)).session_id,expectedResume.session_id);assert.deepEqual((await savedState(page,prefix)).navigation,expectedResume.state.navigation,'Sign-in must preserve the saved position rather than the generic Continue destination.');
   checks.push(entry.slug+': offline answer stays in account cache until Retry confirms cloud save; independent Firebase client creates a real stale-revision conflict; both explicit resolution paths preserve server history; sign-out during a delayed conflict resolution keeps old private answers hidden and sign-in resumes.');

  }
  const value=panels.find(panel=>panel.kind==='value');assert(value);
  for(const [width,height] of [[320,740],[390,844],[768,1000],[1280,900],[1600,1000]]){
   await page.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});
   for(const fragment of ['decision-'+first.id,'decision-'+value.id,'results','originals']){
    await go(page,fragment);const geometry=await page.evaluate(()=>{const ids=[...document.querySelectorAll('[id]')].map(item=>item.id);return {width:document.documentElement.scrollWidth,duplicates:ids.filter((id,index)=>ids.indexOf(id)!==index),aside:document.querySelector('aside').getBoundingClientRect().toJSON(),claimTop:document.querySelector('.decision-claim,.value-bridge')?.getBoundingClientRect().top};});
    assert(geometry.width<=width+1,entry.slug+' horizontal overflow: '+width+' / '+fragment);assert.deepEqual(geometry.duplicates,[]);if(width<=1000&&fragment.startsWith('decision-'))assert(geometry.claimTop>=geometry.aside.bottom-1,'Anchored statement is obscured by sidebar.');layouts.push({slug:entry.slug,width,height,fragment,overflow:false});
   }
  }
  await page.send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});await page.evaluate(()=>document.documentElement.style.zoom='2');await go(page,'decision-'+value.id);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1),'200% zoom overflows.');await page.evaluate(()=>document.documentElement.style.zoom='');
  await go(page,'originals');assert.equal(await page.evaluate(()=>document.querySelectorAll('[data-source-record-id]').length),data.source.claims.length+data.source.arguments.length);
  await page.send('Emulation.setDeviceMetricsOverride',{width:1280,height:900,deviceScaleFactor:1,mobile:false});await go(page,'decision-'+first.id);
  if(entry.slug==='s1582')await inspectStablecoinDefinitions(page);
  if(await page.evaluate(()=>Boolean(document.querySelector('.glossary-term')))){
   const point=await page.evaluate(()=>{const term=document.querySelector('.glossary-term');term.scrollIntoView({block:'center'});const box=term.getBoundingClientRect(),style=getComputedStyle(term);return {x:box.x+box.width/2,y:box.y+box.height/2,weight:style.fontWeight,decoration:style.textDecorationStyle};});assert.equal(Number(point.weight),400);assert.equal(point.decoration,'dotted');
   await pause(80);await page.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});await page.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:point.x,y:point.y});await until(()=>page.evaluate(()=>!document.getElementById('glossary-popover').hidden),'Definition did not open on hover.');assert.equal(await page.evaluate(()=>document.querySelectorAll('#glossary-popover button').length),0);await page.send('Input.dispatchMouseEvent',{type:'mouseMoved',x:0,y:0});await until(()=>page.evaluate(()=>document.getElementById('glossary-popover').hidden),'Definition did not close after hovering away.');
   checks.push(entry.slug+': normal-weight dotted glossary opens and closes on hover without a dismissal button.');
  }
  await mkdir(join(root,'private/screenshots'),{recursive:true});
  for(const [name,width,height,fragment] of [['causal',1280,900,'decision-'+first.id],['value',390,844,'decision-'+value.id]]){await page.send('Emulation.setDeviceMetricsOverride',{width,height,deviceScaleFactor:1,mobile:false});await go(page,fragment);const shot=await page.send('Page.captureScreenshot',{format:'png'});await writeFile(join(root,'private/screenshots',entry.slug+'-'+name+'.png'),Buffer.from(shot.data,'base64'));}
  bills.at(-1).all_yes_order=order;bills.at(-1).comparisons=comparisons;bills.at(-1).html_sha256=sha(await readFile(join(publicDir,'arguments',entry.slug,'index.html')));
  checks.push(entry.slug+': root pruning, complete all-Yes UI path, adjacent evidence and goals, notes after buttons, unique references, save/return, second-writer lock, originals, five viewport sizes and 200% zoom.');
  await page.close();console.log(JSON.stringify({bill:entry.slug,decisions:order.length,comparisons,layouts:20}));
 }
 assert.deepEqual(errors,[]);
 const report={schema_version:1,status:'passed',open_findings:[],browser:'Isolated headless Chrome with Firebase Auth/Firestore emulators; synthetic assigned Google accounts only. The test server adds emulator loopback endpoints to connect-src and a store handle used solely to delay a completed conflict resolution during sign-out; published HTML has neither.',script_sha256:sha(await readFile(fileURLToPath(import.meta.url))),checks,bills,layouts,limits:['No human reading-time or comprehension measurement, physical-device or screen-reader test.','No production reviewer records accessed; all cloud writes used the demo-decision-review emulator project.']};
 const reportPath=process.argv[3]?join(root,'private','browser-'+process.argv[3]+'.json'):join(root,'browser-verification.json');
 await writeFile(reportPath,JSON.stringify(report,null,2)+'\n');
}finally{for(const page of clients){try{await page.close();}catch{}}child.kill('SIGTERM');server.close();await pause(250);await rm(profile,{recursive:true,force:true});await qaEnvironment.cleanup();await qaService.signOut();}
