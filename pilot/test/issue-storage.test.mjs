import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {doc,setDoc,deleteDoc,getDoc,getDocs,collection} from 'firebase/firestore';
import {deleteApp} from 'firebase/app';
import {connect,ConflictError} from '../src/storage.mjs';
import {newState,editState,validateState,csvExport} from '../src/issues.mjs';
import {fixture} from './issue-fixture.mjs';

test('issue responses reuse atomic revisions, close/return, conflicts and reviewer isolation',async()=>{
 const env=await initializeTestEnvironment({projectId:'demo-s1582-pilot',firestore:{host:'127.0.0.1',port:8089,rules:await readFile('backend/firestore.rules','utf8')}}),c=fixture(),session=`${c.version}--qa`;
 const service=connect({authDomain:'localhost',appId:'local-qa'},true,'issue-worker-one');let uid,otherUid;
 try{
  ({user:{uid}}=await service.signIn());
  await env.withSecurityRulesDisabled(ctx=>setDoc(doc(ctx.firestore(),'assignments',uid),{active:true,role:'reviewer',versions:[c.version],kinds:['qa']}));
  let state=editState(c,newState(c,20261108),{type:'issueJudgment',id:'I',presence:'Both',strength:'Pending',notes:'Synthetic only.'});
  assert.equal(await service.save(uid,session,c.version,'qa',0,state),1);assert.deepEqual(JSON.parse((await service.load(uid,session)).payload),state);
  await service.signOut();await service.signIn();assert.deepEqual(validateState(c,JSON.parse((await service.load(uid,session)).payload)),state);
  const changed=editState(c,state,{type:'issueNotes',id:'I',notes:'New synthetic notes.'});assert.equal(await service.save(uid,session,c.version,'qa',1,changed),2);
  await assert.rejects(service.save(uid,session,c.version,'qa',1,state),error=>error instanceof ConflictError&&JSON.parse(error.remote.payload).issueNotes.I==='New synthetic notes.');
  state=editState(c,state,{type:'issueJudgment',id:'J',presence:'Neither',notes:'Retained conflicting draft.'});assert.equal(await service.save(uid,session,c.version,'qa',2,state),3);
  const revisions=await service.revisions(uid,session);assert.equal(revisions.length,3);assert.equal(JSON.parse(revisions[0].payload).issueJudgments.I.presence,'Both');assert.equal(JSON.parse(revisions[1].payload).issueNotes.I,'New synthetic notes.');assert.deepEqual(JSON.parse(revisions[2].payload),state);
  assert.ok(csvExport(c,state).includes('"I","issue"'));assert.ok(!csvExport(c,state).includes('"A","argument"'));
  await service.network(false);await assert.rejects(service.save(uid,session,c.version,'qa',3,state),/connection is interrupted/);await service.network(true);assert.equal((await service.load(uid,session)).revision,3);
  const other=env.authenticatedContext('issue-worker-two').firestore();otherUid='issue-worker-two';
  await env.withSecurityRulesDisabled(ctx=>setDoc(doc(ctx.firestore(),'assignments',otherUid),{active:true,role:'reviewer',versions:[c.version],kinds:['qa']}));
  await assert.rejects(getDoc(doc(other,'responses',uid,'sessions',session)),/permission|denied/i);
  await assert.rejects(setDoc(doc(other,'responses',uid,'sessions',session),{version:c.version,kind:'qa',revision:4,payload:JSON.stringify(state)}),/permission|denied/i);
  await assert.rejects(service.save(uid,`${c.version}--research`,c.version,'research',0,state),/permission|denied/i);
  await assert.rejects(service.save(uid,'legacy-session','legacy-version','qa',0,state),/permission|denied/i);
 }finally{
  await service.signOut();await deleteApp(service.auth.app);
  await env.withSecurityRulesDisabled(async ctx=>{for(const id of [uid,otherUid].filter(Boolean)){const db=ctx.firestore(),sessions=await getDocs(collection(db,'responses',id,'sessions'));for(const saved of sessions.docs){const versions=await getDocs(collection(saved.ref,'revisions'));for(const revision of versions.docs)await deleteDoc(revision.ref);await deleteDoc(saved.ref);}await deleteDoc(doc(db,'assignments',id));}});
  await env.cleanup();
 }
});
