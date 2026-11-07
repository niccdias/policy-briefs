import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc} from 'firebase/firestore';
import {deleteApp} from 'firebase/app';
import {connect,ConflictError} from '../src/storage.mjs';
import {newState,editState,judgedClaims,validateState,valueResult} from '../src/core.mjs';
import {decodeRecord} from '../src/payload.mjs';

test('a complete eight-bill response with long notes saves, reloads and conflicts without losing revisions',async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-s1582-pilot',firestore:{host:'127.0.0.1',port:8089,rules:await readFile('backend/firestore.rules','utf8')}});
 const service=connect({authDomain:'localhost',appId:'local-qa'},true,'large-record');
 let unsubscribe;
 try{
  const {user}=await service.signIn(),c=JSON.parse(await readFile('expansion/all-bills.json','utf8'));
  await env.withSecurityRulesDisabled(ctx=>setDoc(doc(ctx.firestore(),'assignments',user.uid),{active:true,role:'coordinator',versions:[c.version],kinds:['qa']}));
  let state=newState(c,20261107);const note='QA only: supporting evidence with accents é, æ, 中文. '.repeat(50).slice(0,1900);
  for(const n of [...judgedClaims(c),...c.arguments]){
   state=editState(c,state,{type:'judgment',id:n.id,answer:'yes',notes:note});
   state=editState(c,state,{type:'complete',id:n.id});
  }
  for(const v of c.values){
   if(valueResult(c,state,v.id).outcome==='Both')state=editState(c,state,{type:'comparison',value:v.id,answer:'Pending',notes:note});
   state=editState(c,state,{type:'summary',value:v.id});
  }
  state.history=[];validateState(c,state);
  assert.ok(JSON.stringify(state).length>1000000);
  assert.equal(await service.save(user.uid,'large-qa',c.version,'qa',0,state),1);
  const raw=await getDoc(doc(service.db,'responses',user.uid,'sessions','large-qa'));
  assert.ok(raw.data().payload.startsWith('gzip-base64-v1:'));assert.ok(raw.data().payload.length<690000);
  assert.deepEqual(JSON.parse((await service.load(user.uid,'large-qa')).payload),state);
  await assert.rejects(service.save(user.uid,'large-qa',c.version,'qa',0,state),error=>error instanceof ConflictError&&error.remote.revision===1&&JSON.parse(error.remote.payload).version===c.version);
  const watched=new Promise((resolve,reject)=>{unsubscribe=service.watch(user.uid,'large-qa',row=>{if(row?.revision===2)resolve(row);},reject);});
  const changed=editState(c,state,{type:'judgment',id:judgedClaims(c)[0].id,answer:'no',notes:''});
  assert.equal(await service.save(user.uid,'large-qa',c.version,'qa',1,changed),2);
  const remote=await Promise.race([watched,new Promise((_,reject)=>setTimeout(()=>reject(new Error('Server-confirmed watch timed out')),10000))]);
  assert.deepEqual(JSON.parse(remote.payload),changed);
  await service.network(false);
  await assert.rejects(service.save(user.uid,'large-qa',c.version,'qa',2,changed),/connection is interrupted/);
  await service.network(true);
  assert.equal((await service.load(user.uid,'large-qa')).revision,2);
  assert.deepEqual((await service.revisions(user.uid,'large-qa')).map(r=>JSON.parse(r.payload)),[state,changed]);
  const backup=await service.backups();assert.equal(backup.length,1);assert.equal(backup[0].revisions.length,2);
  assert.ok(backup[0].current.payload.startsWith('gzip-base64-v1:'));
  assert.deepEqual(JSON.parse((await decodeRecord(backup[0].current)).payload),changed);
  await service.signOut();await service.signIn();
  assert.deepEqual(JSON.parse((await service.load(user.uid,'large-qa')).payload),changed);
 }finally{unsubscribe?.();await deleteApp(service.auth.app);await env.cleanup();}
});
