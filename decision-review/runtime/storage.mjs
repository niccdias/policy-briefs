import {validateState,validateRelease,exportBackup,carriedFrom} from './model.mjs';

const check=(condition,message)=>{if(!condition)throw new Error(message);};
export function storagePrefix(release){validateRelease(release);return `policy-rationales:decision-review:v1:${release.bill_id}:${release.rendered_id}:`;}
export function sessionKey(release,sessionId){check(/^[A-Za-z0-9_-]{8,100}$/.test(sessionId),'Invalid storage session ID.');return storagePrefix(release)+'session:'+sessionId;}
export function activeKey(release){return storagePrefix(release)+'active';}

export function createSessionStore({storage,locks,model,release,onStatus=()=>{}}){
 validateRelease(release);let writable=false,sessionId=null,savedRevision=null,savedBytes=null,releaseLock=null,closed=false,status='idle',lockTask=null;
 const report=(next,error)=>{status=next;onStatus(next,error);return next;};
 function requireStorage(){check(storage&&typeof storage.getItem==='function'&&typeof storage.setItem==='function','Browser storage is unavailable.');return storage;}
 function load(id){const raw=requireStorage().getItem(sessionKey(release,id));if(raw===null)return null;const state=validateState(JSON.parse(raw),model,release);check(state.session_id===id,'Saved session identity differs from its storage key.');return state;}
 function active(){const id=requireStorage().getItem(activeKey(release));if(id===null)return null;check(/^[A-Za-z0-9_-]{8,100}$/.test(id),'Invalid active-session pointer.');return load(id);}
 function sessions(){const target=requireStorage(),prefix=storagePrefix(release)+'session:',result=[];for(let index=0;index<target.length;index++){const key=target.key(index);if(typeof key!=='string'||!key.startsWith(prefix))continue;const id=key.slice(prefix.length),state=load(id);check(state!==null,'Saved session disappeared during enumeration.');result.push({session_id:id,updated_at:state.updated_at,revision:state.revision,carried_from:carriedFrom(state)});}return result.sort((a,b)=>b.updated_at.localeCompare(a.updated_at)||a.session_id.localeCompare(b.session_id));}
 async function acquire(state){
  validateState(state,model,release);check(!sessionId,'Close the existing session store before opening another session.');sessionId=state.session_id;closed=false;
  if(!locks||typeof locks.request!=='function'){report('lock_unavailable');return false;}
  return new Promise(resolve=>{let resolved=false;const finish=value=>{if(!resolved){resolved=true;resolve(value);}};lockTask=Promise.resolve().then(()=>locks.request(sessionKey(release,sessionId)+':writer',{ifAvailable:true},async lock=>{
   if(!lock){report('read_only');finish(false);return;}if(closed){finish(false);return;}writable=true;
   try{const disk=load(sessionId);savedRevision=disk?.revision??null;savedBytes=disk?requireStorage().getItem(sessionKey(release,sessionId)):null;if(disk&&exportBackup(disk)!==exportBackup(state)){writable=false;report('conflict');finish(false);return;}}catch(error){savedRevision=null;report('storage_failure',error);}
   let unlock;const held=new Promise(done=>{unlock=done;});releaseLock=unlock;finish(true);await held;writable=false;
  })).catch(error=>{writable=false;report('lock_unavailable',error);finish(false);});});
 }
 function save(state){validateState(state,model,release);check(state.session_id===sessionId,'Cannot save into another session.');if(!writable||closed)return {ok:false,status};
  try{const disk=load(sessionId);if((disk?.revision??null)!==savedRevision||requireStorage().getItem(sessionKey(release,sessionId))!==savedBytes){writable=false;report('conflict');return {ok:false,status};}if(disk&&(state.revision<disk.revision||state.revision===disk.revision&&exportBackup(disk)!==exportBackup(state))){writable=false;report('conflict');return {ok:false,status};}
   const serialized=JSON.stringify(state),key=sessionKey(release,sessionId);requireStorage().setItem(key,serialized);check(requireStorage().getItem(key)===serialized,'Saved bytes differ after writing.');savedRevision=state.revision;savedBytes=serialized;requireStorage().setItem(activeKey(release),sessionId);check(requireStorage().getItem(activeKey(release))===sessionId,'Active-session pointer was not saved.');report('saved');return {ok:true,status};
  }catch(error){report('storage_failure',error);return {ok:false,status,error};}
 }
 function observe(key,newValue){if(key!==sessionKey(release,sessionId)||!writable||closed)return;try{const disk=newValue===null?null:validateState(JSON.parse(newValue),model,release);if(!disk||disk.session_id!==sessionId||disk.revision!==savedRevision||newValue!==savedBytes){writable=false;report('conflict');}}catch(error){writable=false;report('conflict',error);}}
 async function close(){closed=true;writable=false;if(releaseLock)releaseLock();releaseLock=null;if(lockTask)await lockTask;}
 return {load,active,sessions,acquire,save,observe,close,get writable(){return writable&&!closed;},get status(){return status;},get savedRevision(){return savedRevision;}};
}
