import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,getDocs,collection,query,where,writeBatch,deleteDoc,updateDoc,serverTimestamp,runTransaction,setLogLevel} from 'firebase/firestore';
import {deleteApp} from 'firebase/app';
import {connectFirebase,createCloudSessionStore,ConflictError} from './firebase.mjs';
import {createDecisionTree,createState,answerDecision,nextDecision,validateState,exportBackup} from './model.mjs';
import {createSessionStore} from './storage.mjs';

const read=path=>readFile(new URL(path,import.meta.url),'utf8'),sha=text=>createHash('sha256').update(text).digest('hex');
const sourceBytes=await read('../bills/hr5408/input/source.json'),source=JSON.parse(sourceBytes),hashes={source_sha256:sha(sourceBytes)};
const base=JSON.parse(await read('./copy.json')),common=JSON.parse(await read('../site-copy.json')).review_copy,overrides=JSON.parse(await read('../bills/hr5408/copy.json'));
const copy=Object.fromEntries(Object.entries({...base,...common,...overrides}).map(([key,value])=>[key,typeof value==='string'?value.replaceAll('{bill}',source.bill.bill).replaceAll('{bill_title}',source.bill.title):value]));
copy.value_goals=Object.fromEntries(source.values.map(value=>[value.id,copy.value_goals[value.id]??copy.value_goals[value.value_code??value.id]]));
const model=createDecisionTree(source,JSON.parse(await read('../bills/hr5408/decisions.json')),JSON.parse(await read('../bills/hr5408/coverage.json')),copy,hashes);
const release={review_id:'policy-stake-briefs-decision-review',bill_id:source.bill.id,source_sha256:hashes.source_sha256,content_id:'content-'+'1'.repeat(64),mapping_id:'mapping-'+'2'.repeat(64),procedure_id:'procedure-'+'3'.repeat(64),rendered_id:'rendered-'+'4'.repeat(64)};
const at=n=>new Date(Date.UTC(2026,10,9,12,0,n)).toISOString(),fresh=(id='session_firebase_001')=>createState(model,release,id,at(0));
const changed=(state,answer='Yes',notes='draft')=>answerDecision(model,state,nextDecision(model,state).id,answer,at(state.revision+1),notes);
function memory(){const data=new Map();return {fail:false,data,getItem:key=>data.get(key)??null,setItem(key,value){if(this.fail)throw new Error('Storage quota unavailable.');data.set(key,String(value));},key:index=>[...data.keys()][index]??null,get length(){return data.size;}};}
function locks(){const held=new Set();return {async request(name,options,callback){if(held.has(name))return callback(null);held.add(name);try{return await callback({name});}finally{held.delete(name);}}};}
function fakeService(){
 const rows=new Map();return {rows,fail:false,failure:null,readFailure:null,gate:null,saves:0,
  async load(uid,id){if(this.readFailure)throw this.readFailure;return rows.get(uid+':'+id)??null;},
  async list(uid,release,kind){if(this.readFailure)throw this.readFailure;return [...rows].filter(([key,row])=>key.startsWith(uid+':')&&row.kind===kind&&row.bill_id===release.bill_id&&row.rendered_id===release.rendered_id).map(([,row])=>row);},
  async save(uid,id,release,kind,expected,state){this.saves++;if(this.gate)await this.gate;if(this.failure)throw this.failure;if(this.fail)throw Object.assign(new Error('Connection unavailable.'),{code:'unavailable'});const remote=rows.get(uid+':'+id)??null;if((remote?.revision??0)!==expected)throw new ConflictError(remote);const revision=expected+1;rows.set(uid+':'+id,{version:'decision-review-v1',bill_id:release.bill_id,rendered_id:release.rendered_id,kind,revision,payload:JSON.stringify(state),state:structuredClone(state),session_id:id,modifiedAt:{toMillis:()=>revision}});return revision;}
 };
}
const cloud=(service,storage,manager=locks(),uid='one')=>createCloudSessionStore({service,user:{uid},kind:'qa',storage,locks:manager,model,release});

test('account drafts are durable before a cloud request, recover unsent edits and retry without losing history',async()=>{
 const storage=memory(),service=fakeService(),manager=locks(),state=fresh(),first=cloud(service,storage,manager);assert(await first.acquire(state));assert((await first.save(state)).ok);
 let finish;service.gate=new Promise(resolve=>{finish=resolve;});const draft=changed(state),pending=first.save(draft);
 const envelope=JSON.parse([...storage.data.values()].find(value=>value.startsWith('{')));assert.deepEqual(envelope.state,draft);assert.equal(envelope.baseRevision,1);assert.equal(envelope.pending,true);
 service.fail=true;finish();assert.equal((await pending).status,'cloud_pending');assert.equal(first.writable,true);await first.close();
 service.gate=null;service.fail=false;const returned=cloud(service,storage,manager);assert.deepEqual(await returned.active(),draft);assert(await returned.acquire(draft));assert((await returned.save(draft)).ok);assert.equal(returned.savedRevision,2);assert.deepEqual((await service.load('one',draft.session_id)).state,draft);await returned.close();
});

test('divergent remote writes preserve the unsent draft and require explicit server or new-session resolution',async()=>{
 for(const resolution of ['server','new']){
  const storage=memory(),service=fakeService(),manager=locks(),state=fresh('session_conflict_'+resolution),first=cloud(service,storage,manager);assert(await first.acquire(state));await first.save(state);service.fail=true;const draft=changed(state);await first.save(draft);await first.close();service.fail=false;
  const remote=changed(state,'No','other device');await service.save('one',state.session_id,release,'qa',1,remote);
  const returned=cloud(service,storage,manager);assert.deepEqual(await returned.active(),draft);assert.equal(returned.status,'conflict');assert.equal(returned.writable,false);assert.equal(await returned.acquire(draft),false);assert.deepEqual(returned.conflict.remote.state,remote);assert.equal((await returned.save(draft)).ok,false);
  if(resolution==='server'){assert.deepEqual(await returned.useServer(),remote);assert.equal(returned.writable,true);}
  else {const imported=await returned.saveDraftAsNew('session_resolved_001',at(10));validateState(imported,model,release);assert.deepEqual(imported.answers,draft.answers);assert.equal(imported.history.at(-1).type,'import');assert.deepEqual((await service.load('one',state.session_id)).state,remote);assert.deepEqual((await service.load('one',imported.session_id)).state,imported);}
  await returned.close();
 }
});

test('external local envelope changes preserve this tab draft when saved as a new session',async()=>{
 for(const observe of [true,false]){
  const storage=memory(),service=fakeService(),manager=locks(),state=fresh('session_external_'+observe),store=cloud(service,storage,manager);assert(await store.acquire(state));await store.save(state);
  const draft=changed(state,'Yes','Keep this tab draft.');service.fail=true;assert.equal((await store.save(draft)).status,'cloud_pending');
  const key=[...storage.data.keys()].find(key=>key.endsWith(':session:'+state.session_id)),envelope=JSON.parse(storage.getItem(key)),external=changed(state,'No','External storage write.');
  const externalBytes=JSON.stringify({...envelope,state:external});storage.setItem(key,externalBytes);if(observe)store.observe(key,externalBytes);
  assert.equal((await store.save(draft)).ok,false);assert.equal(store.status,'conflict');assert.deepEqual(store.conflict.draft,draft);
  service.fail=false;const imported=await store.saveDraftAsNew('session_kept_'+observe,at(10));validateState(imported,model,release);assert.deepEqual(imported.answers,draft.answers);assert.deepEqual((await service.load('one',imported.session_id)).state,imported);assert.equal(storage.getItem(key),externalBytes);await store.close();
 }
});

test('account scope hides other accounts and anonymous browser sessions; second local writer cannot overwrite',async()=>{
 const storage=memory(),service=fakeService(),manager=locks(),state=fresh('session_account_001'),anonymous=createSessionStore({storage,locks:manager,model,release});assert(await anonymous.acquire(state));anonymous.save(state);await anonymous.close();
 const one=cloud(service,storage,manager),two=cloud(service,storage,manager,'two');assert.equal(await one.active(),null);assert.equal(await two.active(),null);assert.equal(service.saves,0);assert(await one.acquire(state));assert((await one.save(changed(state))).ok);assert.equal(await two.active(),null);
 const duplicate=cloud(service,storage,manager);const current=await duplicate.active();assert.equal(await duplicate.acquire(current),false);assert.equal(duplicate.writable,false);assert.equal((await duplicate.save(current)).ok,false);await duplicate.close();await one.close();await two.close();
});

test('storage failure prevents cloud submission and malformed remote metadata is never treated as a network fallback',async()=>{
 const storage=memory(),service=fakeService(),store=cloud(service,storage),state=fresh('session_failure_001');assert(await store.acquire(state));storage.fail=true;assert.equal((await store.save(state)).status,'storage_failure');assert.equal(service.saves,0);storage.fail=false;assert((await store.save(state)).ok);await store.close();
 const remote=await service.load('one',state.session_id);remote.state={...remote.state,extra:true};const returned=cloud(service,storage);await assert.rejects(returned.active(),/Unexpected or missing fields/);await returned.close();
});

test('unchanged return does not create revisions, and revoked authorization preserves the draft while blocking writes',async()=>{
 const storage=memory(),service=fakeService(),manager=locks(),state=fresh('session_permission'),first=cloud(service,storage,manager);assert(await first.acquire(state));assert((await first.save(state)).ok);assert((await first.save(state)).ok);assert.equal(service.saves,1);await first.close();
 const returned=cloud(service,storage,manager);assert.deepEqual(await returned.active(),state);assert(await returned.acquire(state));assert((await returned.save(state)).ok);assert.equal(returned.savedRevision,1);assert.equal(service.saves,1);
 service.failure=Object.assign(new Error('Assignment revoked.'),{code:'permission-denied'});const draft=changed(state);assert.equal((await returned.save(draft)).status,'auth_forbidden');assert.equal(returned.writable,false);assert.equal((await returned.save(draft)).ok,false);assert.equal(service.saves,2);assert.deepEqual(JSON.parse([...storage.data.values()].find(value=>value.startsWith('{'))).state,draft);await returned.close();
});

test('a draft remains recoverable offline if writing its active pointer was interrupted',async()=>{
 const storage=memory(),service=fakeService(),manager=locks(),state=fresh('session_pointer_001'),first=cloud(service,storage,manager);assert(await first.acquire(state));service.fail=true;await first.save(state);await first.close();
 for(const key of storage.data.keys())if(key.endsWith(':active'))storage.data.delete(key);
 service.readFailure=Object.assign(new Error('Offline.'),{code:'unavailable'});const returned=cloud(service,storage,manager);assert.deepEqual(await returned.active(),state);assert.equal(returned.status,'cloud_pending');assert(await returned.acquire(state));await returned.close();
});

const emulator=process.env.FIRESTORE_EMULATOR_HOST==='127.0.0.1:8095'&&process.env.FIREBASE_AUTH_EMULATOR_HOST==='127.0.0.1:9105';
test('Firebase Auth and Firestore emulator authorization, immutable history and native-state roundtrip',{skip:!emulator},async t=>{
 setLogLevel('silent');const rules=await read('../backend/firestore.rules');
 const env=await initializeTestEnvironment({projectId:'demo-decision-review',firestore:{host:'127.0.0.1',port:8095,rules}});await env.clearFirestore();
 const db=(uid,claims={})=>env.authenticatedContext(uid,{email:`${uid}@example.test`,email_verified:true,firebase:{sign_in_provider:'google.com'},...claims}).firestore();
 const session=(database,uid,id='session_rules_001')=>doc(database,'decisionReviews',uid,'sessions',id);
 const data=(extra={})=>({version:'decision-review-v1',bill_id:release.bill_id,rendered_id:release.rendered_id,kind:'qa',revision:1,payload:'{}',modifiedAt:serverTimestamp(),...extra});
 async function atomic(database,uid,id,record,revisionRecord=record,revisionId=String(record.revision)){const batch=writeBatch(database),target=session(database,uid,id);batch.set(target,record);batch.set(doc(target,'revisions',revisionId),revisionRecord);return batch.commit();}
 await env.withSecurityRulesDisabled(async context=>{
  for(const uid of ['one','two','inactive'])await setDoc(doc(context.firestore(),'assignments',uid),{active:uid!=='inactive',role:'reviewer',versions:['v1'],kinds:['qa']});
  await setDoc(doc(context.firestore(),'assignments','owner'),{active:true,role:'coordinator',versions:['v1'],kinds:['qa','research']});
 });
 let service;
 try{
  await t.test('new guided collection saves without adding a legacy assignment version; history is immutable and atomic',async()=>{
   await assertSucceeds(atomic(db('one'),'one','session_rules_001',data()));
   await assertSucceeds(getDoc(session(db('one'),'one')));
   await assertFails(setDoc(session(db('two'),'two','session_nohistory'),data()));
   await assertFails(setDoc(doc(session(db('one'),'one'),'revisions','2'),data({revision:2})));
   await assertFails(updateDoc(doc(session(db('one'),'one'),'revisions','1'),{payload:'changed'}));
   await assertFails(deleteDoc(doc(session(db('one'),'one'),'revisions','1')));await assertFails(deleteDoc(session(db('one'),'one')));
   await assertFails(atomic(db('one'),'one','session_rules_001',data({revision:2}),data({revision:2,payload:'different'})));
   await assertSucceeds(atomic(db('one'),'one','session_rules_001',data({revision:2,payload:'{"second":true}'})));
   assert.equal((await getDocs(collection(session(db('one'),'one'),'revisions'))).size,2);
   await assertFails(atomic(db('two'),'two','session_alias_001',data(),data(),'01'));
  });
  await t.test('anonymous, other uid, inactive, unassigned, unverified and non-Google identities cannot read or write',async()=>{
   const unauthorized=[env.unauthenticatedContext().firestore(),db('two'),db('inactive'),db('unassigned'),db('one',{email_verified:false}),db('one',{firebase:{sign_in_provider:'password'}})];
   for(const database of unauthorized){await assertFails(getDoc(session(database,'one')));await assertFails(getDocs(collection(session(database,'one'),'revisions')));await assertFails(atomic(database,'one','session_forbidden',data()));}
   await assertFails(atomic(db('inactive'),'inactive','session_inactive',data()));
   await assertFails(setDoc(doc(db('one'),'assignments','one'),{active:true,role:'coordinator'}));
  });
  await t.test('own allowed-kind list succeeds; unrestricted lists, other users and legacy response lists cannot leak',async()=>{
   await env.withSecurityRulesDisabled(context=>setDoc(session(context.firestore(),'one','session_research'),data({kind:'research'})));
   const ownQuery=database=>query(collection(database,'decisionReviews','one','sessions'),where('version','==','decision-review-v1'),where('bill_id','==',release.bill_id),where('rendered_id','==',release.rendered_id),where('kind','==','qa'));
   assert.equal((await assertSucceeds(getDocs(ownQuery(db('one'))))).size,1);
   await assertFails(getDocs(collection(db('one'),'decisionReviews','one','sessions')));await assertFails(getDocs(ownQuery(db('two'))));
   await assertFails(getDoc(session(db('one'),'one','session_research')));await assertFails(getDocs(collection(db('one'),'responses','one','sessions')));
   assert.equal((await assertSucceeds(getDocs(collection(db('owner'),'decisionReviews','one','sessions')))).size,2);
   await assertSucceeds(getDoc(doc(session(db('owner'),'one'),'revisions','1')));
  });
  await t.test('earlier-release lists and the coordinator export are allowed only to their owners',async()=>{
   const earlierId='rendered-'+'6'.repeat(64);await env.withSecurityRulesDisabled(context=>setDoc(session(context.firestore(),'one','session_earlier'),data({rendered_id:earlierId})));
   const earlierQuery=database=>query(collection(database,'decisionReviews','one','sessions'),where('version','==','decision-review-v1'),where('bill_id','==',release.bill_id),where('rendered_id','in',[earlierId,'rendered-'+'7'.repeat(64)]),where('kind','==','qa'));
   assert.equal((await assertSucceeds(getDocs(earlierQuery(db('one'))))).size,1);await assertFails(getDocs(earlierQuery(db('two'))));
   const billQuery=(database,uid)=>query(collection(database,'decisionReviews',uid,'sessions'),where('version','==','decision-review-v1'),where('bill_id','==',release.bill_id));
   assert((await assertSucceeds(getDocs(collection(db('owner'),'assignments')))).size>=4);assert.equal((await assertSucceeds(getDocs(billQuery(db('owner'),'one')))).size,3);
   await assertFails(getDocs(collection(db('one'),'assignments')));await assertFails(getDocs(billQuery(db('one'),'one')));await assertFails(getDocs(billQuery(db('two'),'one')));
  });
  await t.test('strict metadata, bounds, server timestamp and immutable bill/release/kind are enforced',async()=>{
   const invalid=[{extra:true},{version:'v1'},{bill_id:'unlisted-bill'},{rendered_id:'rendered-invalid'},{kind:'unknown'},{revision:0},{payload:'x'.repeat(700000)},{payload:''},{modifiedAt:new Date('2026-01-01')}];
   for(const [index,extra] of invalid.entries())await assertFails(atomic(db('two'),'two','session_invalid_'+index,data(extra)));
   const missing=data();delete missing.rendered_id;await assertFails(atomic(db('two'),'two','session_missing',missing));
   await assertFails(atomic(db('two'),'two','short',data()));
   for(const extra of [{bill_id:'119_H_R_131'},{rendered_id:'rendered-'+'5'.repeat(64)},{kind:'research'},{version:'other'}])await assertFails(atomic(db('one'),'one','session_rules_001',data({revision:3,...extra})));
   await assertFails(atomic(db('one'),'one','session_rules_001',data({revision:4})));
  });
  await t.test('existing assignment and response authorization and revision behavior remain unchanged',async()=>{
   async function legacy(version,id){const database=db('one'),target=doc(database,'responses','one','sessions',id);return runTransaction(database,async transaction=>{await transaction.get(target);const record={version,kind:'qa',revision:1,payload:'{}',modifiedAt:serverTimestamp()};transaction.set(target,record);transaction.set(doc(target,'revisions','1'),record);});}
   await assertSucceeds(legacy('v1','legacy_assigned'));await assertFails(legacy('decision-review-v1','legacy_unassigned'));
   await assertSucceeds(getDoc(doc(db('one'),'responses','one','sessions','legacy_assigned')));await assertFails(getDoc(doc(db('two'),'responses','one','sessions','legacy_assigned')));
   await assertSucceeds(getDocs(collection(db('owner'),'responses','one','sessions')));await assertFails(getDocs(collection(db('one'),'responses','one','sessions')));
   await assertFails(updateDoc(doc(db('one'),'responses','one','sessions','legacy_assigned','revisions','1'),{payload:'changed'}));
  });
  await t.test('actual native state with long notes compresses, returns after sign-in and rejects stale devices',async()=>{
   service=connectFirebase({authDomain:'localhost',appId:'local-decision-review'},{emulator:true,testUser:'native-roundtrip'});const {user}=await service.signIn();
   await env.withSecurityRulesDisabled(context=>setDoc(doc(context.firestore(),'assignments',user.uid),{active:true,role:'reviewer',versions:['legacy-only'],kinds:['qa']}));
   let state=fresh('session_native_001'),count=0;const note=('Native QA: é, æ, 中文 and qualified evidence. '.repeat(220)).slice(0,9000);
   while(nextDecision(model,state)){state=answerDecision(model,state,nextDecision(model,state).id,'Yes',at(++count),note);assert(count<=model.nodes.size);}
   validateState(state,model,release);assert(Buffer.byteLength(JSON.stringify(state))>500000);
   assert.equal(await service.save(user.uid,state.session_id,release,'qa',0,state),1);
   const target=session(service.db,user.uid,state.session_id),raw=(await getDoc(target)).data();assert(raw.payload.startsWith('gzip-base64-v1:'));assert.deepEqual((await service.load(user.uid,state.session_id)).state,state);
   assert.deepEqual((await service.list(user.uid,release,'qa')).map(row=>row.session_id),[state.session_id]);
   await assert.rejects(service.save(user.uid,state.session_id,release,'qa',0,state),error=>error instanceof ConflictError&&error.remote.revision===1&&error.remote.state.session_id===state.session_id);
   const revisions=await getDocs(collection(target,'revisions'));assert.equal(revisions.size,1);
   const concurrent=await Promise.allSettled([service.save(user.uid,state.session_id,release,'qa',1,state),service.save(user.uid,state.session_id,release,'qa',1,state)]);assert.equal(concurrent.filter(result=>result.status==='fulfilled').length,1);assert(concurrent.some(result=>result.status==='rejected'&&result.reason instanceof ConflictError));
   await service.signOut();await service.signIn();assert.deepEqual((await service.load(user.uid,state.session_id)).state,state);
   const sharedConnection=connectFirebase({},{emulator:true});try{await sharedConnection.network(false);await assert.rejects(service.save(user.uid,state.session_id,release,'qa',2,state));}finally{await sharedConnection.network(true);}
   assert.equal((await service.load(user.uid,state.session_id)).revision,2);assert.equal((await getDocs(collection(target,'revisions'))).size,2);
   await env.withSecurityRulesDisabled(context=>setDoc(session(context.firestore(),user.uid,'session_forged_001'),{...raw,payload:JSON.stringify({...fresh('session_forged_001'),release:{...release,bill_id:'119_H_R_131'}})}));
   await assert.rejects(service.load(user.uid,'session_forged_001'),/metadata differs/);
  });
  await t.test('real offline cloud saves retain account drafts and recover them after reconnecting',async()=>{
   const user=service.auth.currentUser,storage=memory(),manager=locks(),state=fresh('session_offline_001');
   const options={service,user,kind:'qa',storage,locks:manager,model,release},first=createCloudSessionStore(options);assert(await first.acquire(state));assert((await first.save(state)).ok);
   await service.network(false);const draft=changed(state,'Yes','Unsent native state with a real server base.');assert.equal((await first.save(draft)).status,'cloud_pending');assert.equal(first.writable,true);await first.close();
   const offline=createCloudSessionStore(options);assert.deepEqual(await offline.active(),draft);assert(await offline.acquire(draft));await offline.close();await service.network(true);
   const returned=createCloudSessionStore(options);assert.deepEqual(await returned.active(),draft);assert(await returned.acquire(draft));assert((await returned.save(draft)).ok);assert.equal(returned.savedRevision,2);assert.deepEqual((await service.load(user.uid,draft.session_id)).state,draft);await returned.close();
  });
 }finally{if(service){await service.signOut();await deleteApp(service.auth.app);}await env.cleanup();}
});
