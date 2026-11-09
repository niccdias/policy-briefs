import {initializeApp,getApps,getApp} from 'firebase/app';
import {getAuth,GoogleAuthProvider,signInWithPopup,signInWithCredential,signOut,onAuthStateChanged,connectAuthEmulator} from 'firebase/auth';
import {getFirestore,doc,collection,query,where,getDocFromServer,getDocsFromServer,runTransaction,serverTimestamp,connectFirestoreEmulator,disableNetwork,enableNetwork} from 'firebase/firestore';
import {validateRelease,validateState,exportBackup,importBackup} from './model.mjs';
import {createSessionStore,storagePrefix,sessionKey,activeKey} from './storage.mjs';

const version='decision-review-v1',codec='gzip-base64-v1:',maxJsonBytes=30000000;
const check=(condition,message)=>{if(!condition)throw new Error(message);};
const bytes=text=>new TextEncoder().encode(text).length;
const canonical=value=>JSON.stringify(value,(_,item)=>item&&typeof item==='object'&&!Array.isArray(item)&&Object.getPrototypeOf(item)===Object.prototype?Object.fromEntries(Object.keys(item).sort().map(key=>[key,item[key]])):item);
const same=(left,right)=>canonical(left)===canonical(right);
const sessionId=id=>check(typeof id==='string'&&/^[A-Za-z0-9_-]{8,100}$/.test(id),'Invalid cloud session ID.');
const userId=uid=>check(typeof uid==='string'&&uid.length>0&&uid.length<=128&&!uid.includes('/'),'Invalid account identity.');
const kindId=kind=>check(['qa','research'].includes(kind),'Invalid review kind.');
const authError=error=>['permission-denied','unauthenticated'].some(code=>error.code===code||error.code==='firestore/'+code);
const networkError=error=>['unavailable','deadline-exceeded','network-request-failed'].some(code=>error.code===code||error.code==='firestore/'+code);
const emulatedApps=new WeakSet();
const emulatedNetworks=new WeakMap();

export class ConflictError extends Error{
 constructor(remote){super('A newer saved version exists. Your unsent draft has been preserved.');this.name='ConflictError';this.remote=remote;}
}

async function encodePayload(json){
 check(bytes(json)<=maxJsonBytes,'The review exceeds the 30 MB backup limit.');
 if(bytes(json)<500000)return json;
 const compressed=new Uint8Array(await new Response(new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
 let binary='';for(let index=0;index<compressed.length;index+=8192)binary+=String.fromCharCode(...compressed.subarray(index,index+8192));
 return codec+btoa(binary);
}
async function decodeRecord(data,id){
 if(data===null)return null;
 sessionId(id);check(same(Object.keys(data).sort(),['version','bill_id','rendered_id','kind','revision','payload','modifiedAt'].sort()),'Unexpected cloud record fields.');
 check(data.version===version&&Number.isSafeInteger(data.revision)&&data.revision>0,'Invalid cloud record version or revision.');kindId(data.kind);
 check(typeof data.payload==='string'&&bytes(data.payload)<700000&&data.modifiedAt&&typeof data.modifiedAt.toMillis==='function','Invalid cloud payload or saved timestamp.');
 let payload=data.payload;
 if(payload.startsWith(codec)){
  try{
   const compressed=Uint8Array.from(atob(payload.slice(codec.length)),character=>character.charCodeAt(0));
   const reader=new Blob([compressed]).stream().pipeThrough(new DecompressionStream('gzip')).getReader(),chunks=[];let size=0;
   for(;;){const result=await reader.read();if(result.done)break;size+=result.value.length;if(size>maxJsonBytes){await reader.cancel();throw new Error('Decompressed review exceeds 30 MB.');}chunks.push(result.value);}
   const content=new Uint8Array(size);let offset=0;for(const chunk of chunks){content.set(chunk,offset);offset+=chunk.length;}payload=new TextDecoder('utf-8',{fatal:true}).decode(content);
  }catch(error){throw new Error('The saved review could not be decompressed. Its server revision is preserved.',{cause:error});}
 }
 check(bytes(payload)<=maxJsonBytes,'The saved review exceeds 30 MB.');
 let state;try{state=JSON.parse(payload);}catch(error){throw new Error('The saved review is not valid JSON.',{cause:error});}
 validateRelease(state.release);
 check(state.schema_version===1&&state.session_id===id&&state.release.bill_id===data.bill_id&&state.release.rendered_id===data.rendered_id,'Saved review metadata differs from its session or release.');
 return {...data,payload,state,session_id:id};
}

export function connectFirebase(config,{emulator=false,testUser='one'}={}){
 const effective=emulator?{...config,projectId:'demo-decision-review',apiKey:'demo-key'}:config;
 const app=getApps().some(app=>app.name==='decision-review')?getApp('decision-review'):initializeApp(effective,'decision-review');
 check(app.options.projectId===effective.projectId,'The existing decision-review connection uses another Firebase project.');
 const auth=getAuth(app),db=getFirestore(app);
 if(emulator&&!emulatedApps.has(app)){connectAuthEmulator(auth,'http://127.0.0.1:9105',{disableWarnings:true});connectFirestoreEmulator(db,'127.0.0.1',8095);emulatedApps.add(app);emulatedNetworks.set(app,true);}
 const ref=(uid,id)=>{userId(uid);sessionId(id);return doc(db,'decisionReviews',uid,'sessions',id);};
 return {
  auth,db,
  network:enabled=>{check(emulator,'Network simulation is available only in the local emulator.');emulatedNetworks.set(app,enabled);return enabled?enableNetwork(db):disableNetwork(db);},
  signIn:()=>emulator?signInWithCredential(auth,GoogleAuthProvider.credential(JSON.stringify({sub:`local-qa-${testUser}`,email:`local-qa-${testUser}@example.test`,email_verified:true,name:`Local QA ${testUser}`}))):signInWithPopup(auth,new GoogleAuthProvider()),
  signOut:()=>signOut(auth),
  watchAuth:(callback,error)=>onAuthStateChanged(auth,callback,error),
  assignment:async uid=>{userId(uid);const snapshot=await getDocFromServer(doc(db,'assignments',uid));return snapshot.exists()?snapshot.data():null;},
  list:async(uid,release,kind)=>{
   userId(uid);validateRelease(release);kindId(kind);
   const rows=await getDocsFromServer(query(collection(db,'decisionReviews',uid,'sessions'),where('version','==',version),where('bill_id','==',release.bill_id),where('rendered_id','==',release.rendered_id),where('kind','==',kind)));
   const records=await Promise.all(rows.docs.map(row=>decodeRecord(row.data(),row.id)));
   return records.sort((left,right)=>right.modifiedAt.toMillis()-left.modifiedAt.toMillis()||right.state.updated_at.localeCompare(left.state.updated_at)||left.session_id.localeCompare(right.session_id));
  },
  load:async(uid,id)=>{const snapshot=await getDocFromServer(ref(uid,id));return decodeRecord(snapshot.exists()?snapshot.data():null,id);},
  save:async(uid,id,release,kind,expectedServerRevision,state)=>{
   if(emulatedNetworks.get(app)===false)throw Object.assign(new Error('The simulated cloud connection is unavailable. The account draft remains in this browser.'),{code:'unavailable'});
   validateRelease(release);kindId(kind);sessionId(id);
   check(Number.isSafeInteger(expectedServerRevision)&&expectedServerRevision>=0,'Invalid expected server revision.');
   check(state.schema_version===1&&state.session_id===id&&same(state.release,release),'The review does not match its cloud session or release.');
   const payload=await encodePayload(JSON.stringify(state));check(bytes(payload)<690000,'This review is too large for a cloud save. Export a JSON backup.');
   const target=ref(uid,id);
   try{return await runTransaction(db,async transaction=>{
    const snapshot=await transaction.get(target),remote=snapshot.exists()?snapshot.data():null;
    if((remote?.revision??0)!==expectedServerRevision)throw new ConflictError(await decodeRecord(remote,id));
    if(remote)check(remote.version===version&&remote.bill_id===release.bill_id&&remote.rendered_id===release.rendered_id&&remote.kind===kind,'The saved session belongs to another release or review kind.');
    const revision=expectedServerRevision+1,data={version,bill_id:release.bill_id,rendered_id:release.rendered_id,kind,revision,payload,modifiedAt:serverTimestamp()};
    transaction.set(target,data);transaction.set(doc(target,'revisions',String(revision)),data);return revision;
   });}catch(error){
    if(error instanceof ConflictError)throw error;
    let latest;try{const snapshot=await getDocFromServer(target);latest=snapshot.exists()?snapshot.data():null;}catch{throw error;}
    if((latest?.revision??0)!==expectedServerRevision)throw new ConflictError(await decodeRecord(latest,id));
    throw error;
   }
  }
 };
}

export function createCloudSessionStore({service,user,kind,storage,locks,model,release,onStatus=()=>{}}){
 validateRelease(release);userId(user.uid);kindId(kind);
 const uid=user.uid,scope=`policy-rationales:decision-review:account:${encodeURIComponent(uid)}:${kind}:`,prefix=storagePrefix(release)+'session:';
 let status='idle',conflict=null,currentId=null,currentState=null,serverRevision=0,closed=false,forbidden=false,queue=Promise.resolve(),local;
 const report=(next,error)=>{status=next;onStatus(next,error);};
 function readEnvelope(id){
  const raw=storage.getItem(scope+sessionKey(release,id));if(raw===null)return null;
  let envelope;try{envelope=JSON.parse(raw);}catch(error){throw new Error('The account draft cannot be read. Preserve it before clearing browser storage.',{cause:error});}
  check(same(Object.keys(envelope).sort(),['schema_version','baseRevision','pending','state'].sort())&&envelope.schema_version===1&&Number.isSafeInteger(envelope.baseRevision)&&envelope.baseRevision>=0&&typeof envelope.pending==='boolean','Invalid account draft metadata.');
  validateState(envelope.state,model,release);check(envelope.state.session_id===id,'Account draft identity differs from its key.');return envelope;
 }
 function writeEnvelope(id,envelope){
  const key=scope+sessionKey(release,id),serialized=JSON.stringify(envelope);storage.setItem(key,serialized);check(storage.getItem(key)===serialized,'The account draft was not saved correctly.');
 }
 const accountStorage={
  getItem(key){if(key.startsWith(prefix)){const envelope=readEnvelope(key.slice(prefix.length));return envelope?JSON.stringify(envelope.state):null;}return storage.getItem(scope+key);},
  setItem(key,value){if(key.startsWith(prefix)){const state=validateState(JSON.parse(value),model,release),previous=readEnvelope(state.session_id);writeEnvelope(state.session_id,{schema_version:1,baseRevision:previous?.baseRevision??0,pending:!previous||previous.pending||!same(previous.state,state),state});}else storage.setItem(scope+key,value);},
  key(index){const keys=[];for(let cursor=0;cursor<storage.length;cursor++){const key=storage.key(cursor);if(key?.startsWith(scope))keys.push(key.slice(scope.length));}return keys[index]??null;},
  get length(){let count=0;for(let index=0;index<storage.length;index++)if(storage.key(index)?.startsWith(scope))count++;return count;}
 };
 const accountLocks=locks&&{request:(name,options,callback)=>locks.request(scope+name,options,callback)};
 function makeLocal(){return createSessionStore({storage:accountStorage,locks:accountLocks,model,release,onStatus:(next,error)=>{if(next!=='saved'){if(next==='conflict'){conflict??=new ConflictError(null);conflict.draft??=currentState;}report(next,error);}}});}
 local=makeLocal();
 function setConflict(remote,draft){conflict=new ConflictError(remote);conflict.draft=draft;report('conflict',conflict);return draft;}
 function validateRemote(remote,id){if(remote){validateState(remote.state,model,release);check(remote.session_id===id&&remote.kind===kind&&remote.bill_id===release.bill_id&&remote.rendered_id===release.rendered_id,'Cloud session identity differs from the current review.');}return remote;}
 async function load(id){
  sessionId(id);const cached=readEnvelope(id);let remote;
  try{remote=validateRemote(await service.load(uid,id),id);}catch(error){if(authError(error)){forbidden=true;report('auth_forbidden',error);throw error;}if(!cached||!networkError(error))throw error;report('cloud_pending',error);serverRevision=cached.baseRevision;return cached.state;}
  if(cached?.pending){
   if(remote&&same(remote.state,cached.state)){writeEnvelope(id,{...cached,baseRevision:remote.revision,pending:false});serverRevision=remote.revision;return cached.state;}
   if((remote?.revision??0)!==cached.baseRevision)return setConflict(remote,cached.state);
   serverRevision=cached.baseRevision;report('cloud_pending');return cached.state;
  }
  if(remote){writeEnvelope(id,{schema_version:1,baseRevision:remote.revision,pending:false,state:remote.state});serverRevision=remote.revision;return remote.state;}
  if(cached)return setConflict(null,cached.state);
  serverRevision=0;return null;
 }
 async function sessions(){
  let remote;try{remote=await service.list(uid,release,kind);}catch(error){if(authError(error)){forbidden=true;report('auth_forbidden',error);throw error;}if(!networkError(error)||local.sessions().length===0)throw error;remote=[];report('cloud_pending',error);}
  const items=new Map(remote.map(row=>{validateRemote(row,row.session_id);return [row.session_id,{session_id:row.session_id,updated_at:row.state.updated_at,revision:row.state.revision,server_revision:row.revision,pending:false}];}));
  for(const row of local.sessions()){const cached=readEnvelope(row.session_id);if(cached.pending||!items.has(row.session_id))items.set(row.session_id,{...row,server_revision:cached.baseRevision,pending:cached.pending});}
  return [...items.values()].sort((left,right)=>right.updated_at.localeCompare(left.updated_at)||left.session_id.localeCompare(right.session_id));
 }
 async function active(){const id=accountStorage.getItem(activeKey(release));if(id!==null)return load(id);const available=await sessions();return available.length?load(available[0].session_id):null;}
 async function acquire(state){
  validateState(state,model,release);check(currentId===null,'Close the existing cloud session store before opening another session.');closed=false;currentState=state;
  const latest=await load(state.session_id);if(conflict)return false;
  if(latest&&!same(latest,state)){setConflict({state:latest,revision:serverRevision,session_id:state.session_id},state);return false;}
  currentId=state.session_id;const acquired=await local.acquire(state);return acquired&&!conflict;
 }
 async function upload(){
  if(conflict||forbidden)return {ok:false,status,local_saved:true,error:conflict};
  const id=currentId,cached=readEnvelope(id);if(!cached.pending){report('saved');return {ok:true,status};}
  try{
   const revision=await service.save(uid,id,release,kind,cached.baseRevision,cached.state),latest=readEnvelope(id);
   check(latest&&latest.baseRevision===cached.baseRevision,'The account draft changed its server base during a save.');
   const pending=!same(latest.state,cached.state);writeEnvelope(id,{...latest,baseRevision:revision,pending});serverRevision=revision;report(pending?'cloud_pending':'saved');return {ok:true,status};
  }catch(error){if(error instanceof ConflictError){setConflict(error.remote,currentState??cached.state);}else if(authError(error)){forbidden=true;report('auth_forbidden',error);}else report('cloud_pending',error);return {ok:false,status,error,local_saved:true};}
 }
 async function save(state){
  validateState(state,model,release);if(conflict)return {ok:false,status,error:conflict};check(state.session_id===currentId,'Cannot save into another cloud session.');
  if(closed||forbidden||!local.writable)return {ok:false,status,error:conflict};
  currentState=state;const result=local.save(state);if(!result.ok)return result;
  report('cloud_pending');const task=queue.then(upload);queue=task.then(()=>{},()=>{});return task;
 }
 function observe(key,newValue){
  if(!key?.startsWith(scope))return;const inner=key.slice(scope.length);
  try{const value=inner.startsWith(prefix)&&newValue!==null?JSON.stringify(JSON.parse(newValue).state):newValue;local.observe(inner,value);}catch(error){conflict??=new ConflictError(null);conflict.draft??=currentState;report('conflict',error);}
 }
 async function close(){closed=true;await queue;await local.close();}
 async function useServer(){
  check(conflict,'There is no cloud conflict to resolve.');const id=currentId??conflict.draft?.session_id;sessionId(id);
  const remote=validateRemote(await service.load(uid,id),id);check(remote,'No server version exists for this session. Save the draft as a new session.');
  await close();writeEnvelope(id,{schema_version:1,baseRevision:remote.revision,pending:false,state:remote.state});local=makeLocal();conflict=null;currentId=null;serverRevision=remote.revision;
  check(await acquire(remote.state),'The server version could not acquire the local writer lock.');report('saved');return remote.state;
 }
 async function saveDraftAsNew(newSessionId,now){
  check(conflict,'There is no cloud conflict to resolve.');const draft=conflict.draft??currentState;check(draft,'The conflicting draft is unavailable.');
  const imported=importBackup(exportBackup(draft),model,release,newSessionId,now);await close();local=makeLocal();conflict=null;currentId=null;serverRevision=0;
  check(await acquire(imported),'The new draft session could not acquire its writer lock.');await save(imported);return imported;
 }
 return {load,active,sessions,acquire,save,observe,close,useServer,saveDraftAsNew,get writable(){return !closed&&!forbidden&&!conflict&&local.writable;},get status(){return status;},get savedRevision(){return serverRevision;},get conflict(){return conflict;}};
}
