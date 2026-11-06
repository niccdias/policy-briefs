import test,{before,after} from 'node:test';
import {readFile} from 'node:fs/promises';
import {initializeTestEnvironment,assertSucceeds,assertFails} from '@firebase/rules-unit-testing';
import {doc,setDoc,getDoc,getDocs,collection,runTransaction,serverTimestamp,updateDoc} from 'firebase/firestore';
import assert from 'node:assert/strict';
let env;
before(async()=>{
 env=await initializeTestEnvironment({projectId:'demo-s1582-rules',firestore:{host:'127.0.0.1',port:8089,rules:await readFile('backend/firestore.rules','utf8')}});
 await env.clearFirestore();
 await env.withSecurityRulesDisabled(async c=>{
  for(const uid of ['one','two'])await setDoc(doc(c.firestore(),'assignments',uid),{active:true,role:'reviewer',versions:['v1'],kinds:['qa']});
  await setDoc(doc(c.firestore(),'assignments','owner'),{active:true,role:'coordinator',versions:['v1'],kinds:['research','qa']});
 });
});
after(()=>env?.cleanup());
const db=uid=>env.authenticatedContext(uid,{email:`${uid}@example.test`,email_verified:true}).firestore();
async function save(d,uid,expected,payload='{}'){
 const ref=doc(d,'responses',uid,'sessions','v1-qa');
 return runTransaction(d,async tx=>{
  const s=await tx.get(ref);if((s.data()?.revision??0)!==expected)throw new Error('conflict');
  const data={version:'v1',kind:'qa',revision:expected+1,payload,modifiedAt:serverTimestamp()};
  tx.set(ref,data);tx.set(doc(d,'responses',uid,'sessions','v1-qa','revisions',String(expected+1)),data);
 });
}
test('only own authorized assignment is readable; clients cannot grant access',async()=>{
 await assertSucceeds(getDoc(doc(db('one'),'assignments','one')));
 await assertFails(getDoc(doc(db('one'),'assignments','two')));
 await assertFails(setDoc(doc(db('one'),'assignments','one'),{active:true,role:'coordinator'}));
 await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'assignments','one')));
});
test('new assigned session and immutable revision backup save atomically',async()=>{
 await assertSucceeds(save(db('one'),'one',0));
 await assertSucceeds(getDoc(doc(db('one'),'responses','one','sessions','v1-qa')));
 await assertSucceeds(save(db('one'),'one',1,'{"saved":true}'));
 await assertFails(updateDoc(doc(db('one'),'responses','one','sessions','v1-qa','revisions','1'),{payload:'changed'}));
 const rows=await assertSucceeds(getDocs(collection(db('one'),'responses','one','sessions','v1-qa','revisions')));assert.equal(rows.size,2);
});
test('another reviewer cannot read, list or alter records or backups',async()=>{
 await assertFails(getDoc(doc(db('two'),'responses','one','sessions','v1-qa')));
 await assertFails(getDocs(collection(db('two'),'responses','one','sessions','v1-qa','revisions')));
 await assertFails(updateDoc(doc(db('two'),'responses','one','sessions','v1-qa'),{payload:'intruder'}));
 await assertFails(getDocs(collection(db('two'),'assignments')));
 await assertFails(getDoc(doc(db('unassigned'),'responses','one','sessions','v1-qa')));
});
test('server revision prevents silent overwrite from stale device',async()=>{
 await assert.rejects(save(db('one'),'one',0,'stale'),/conflict/);
 const row=await getDoc(doc(db('one'),'responses','one','sessions','v1-qa'));assert.equal(row.data().payload,'{"saved":true}');
});
test('direct writes without revision backup, unassigned releases and research writes fail',async()=>{
 const base={version:'v1',kind:'qa',revision:1,payload:'{}',modifiedAt:serverTimestamp()};
 await assertFails(setDoc(doc(db('two'),'responses','two','sessions','no-backup'),base));
 await assertFails(setDoc(doc(db('two'),'responses','two','sessions','v2'),{...base,version:'v2'}));
 await assertFails(setDoc(doc(db('two'),'responses','two','sessions','research'),{...base,kind:'research'}));
});
test('coordinator can export private backups; anonymous and unverified cannot',async()=>{
 await assertSucceeds(getDocs(collection(db('owner'),'assignments')));
 await assertSucceeds(getDoc(doc(db('owner'),'responses','one','sessions','v1-qa','revisions','1')));
 await assertFails(getDoc(doc(env.unauthenticatedContext().firestore(),'responses','one','sessions','v1-qa')));
 const unverified=env.authenticatedContext('one',{email_verified:false}).firestore();
 await assertFails(getDoc(doc(unverified,'responses','one','sessions','v1-qa')));
});
test('two simultaneous devices cannot overwrite each other',async()=>{
 const results=await Promise.allSettled([save(db('two'),'two',0,'device A'),save(db('two'),'two',0,'device B')]);
 assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
 const loser=results.find(r=>r.status==='rejected');
 assert.ok(loser,JSON.stringify(results));
 assert.ok(/conflict|already exists|aborted|PERMISSION_DENIED/i.test(loser.reason.message),loser.reason.message);
 const revisions=await getDocs(collection(db('two'),'responses','two','sessions','v1-qa','revisions'));
 assert.equal(revisions.size,1);
});
