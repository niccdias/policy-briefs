import {initializeApp} from 'firebase/app';
import {getAuth,GoogleAuthProvider,signInWithPopup,signOut,onAuthStateChanged,connectAuthEmulator,signInWithCredential} from 'firebase/auth';
import {getFirestore,doc,getDoc,getDocs,collection,runTransaction,serverTimestamp,onSnapshot,connectFirestoreEmulator,disableNetwork,enableNetwork} from 'firebase/firestore';
export class ConflictError extends Error{constructor(remote){super('A newer saved version exists. Your unsent draft has been preserved.');this.remote=remote;}}
export function connect(config,emulator=false,testUser='one'){
 const app=initializeApp(emulator?{...config,projectId:'demo-s1582-pilot',apiKey:'demo-key'}:config);const auth=getAuth(app),db=getFirestore(app);
 if(emulator){connectAuthEmulator(auth,'http://127.0.0.1:9099',{disableWarnings:true});connectFirestoreEmulator(db,'127.0.0.1',8089);}
 let qaNetworkPaused=false;
 return {
  auth,db,
  network:enabled=>{if(!emulator)throw new Error('Network simulation is available only in the local QA emulator.');qaNetworkPaused=!enabled;return enabled?enableNetwork(db):disableNetwork(db);},
  signIn:()=>emulator?signInWithCredential(auth,GoogleAuthProvider.credential(JSON.stringify({sub:`local-qa-${testUser}`,email:`local-qa-${testUser}@example.test`,email_verified:true,name:`Local QA ${testUser}`}))):signInWithPopup(auth,new GoogleAuthProvider()),signOut:()=>signOut(auth),
  watchAuth:callback=>onAuthStateChanged(auth,callback),
  assignment:async uid=>{const s=await getDoc(doc(db,'assignments',uid));return s.exists()?s.data():null;},
  load:async(uid,id)=>{const s=await getDoc(doc(db,'responses',uid,'sessions',id));return s.exists()?s.data():null;},
  watch:(uid,id,callback,error)=>onSnapshot(doc(db,'responses',uid,'sessions',id),{includeMetadataChanges:true},s=>{if(!s.metadata.fromCache&&!s.metadata.hasPendingWrites)callback(s.exists()?s.data():null);},error),
  save:async(uid,id,version,kind,expectedRevision,state)=>{
   if(qaNetworkPaused)throw new Error('Local QA: the simulated connection is interrupted. Your draft remains in this browser.');
   const payload=JSON.stringify(state);if(payload.length>=690000)throw new Error('The response is too large to save. Export a private backup and contact the project owner.');
   const ref=doc(db,'responses',uid,'sessions',id);
   return runTransaction(db,async tx=>{
    const current=await tx.get(ref),remote=current.exists()?current.data():null;
    if((remote?.revision??0)!==expectedRevision)throw new ConflictError(remote);
    const revision=expectedRevision+1,data={version,kind,revision,payload,modifiedAt:serverTimestamp()};
    tx.set(ref,data);tx.set(doc(db,'responses',uid,'sessions',id,'revisions',String(revision)),data);return revision;
   });
  },
  revisions:async(uid,id)=>{const rows=await getDocs(collection(db,'responses',uid,'sessions',id,'revisions'));return rows.docs.map(d=>d.data()).sort((a,b)=>a.revision-b.revision);},
  backups:async()=>{const users=await getDocs(collection(db,'assignments')),backups=[];for(const u of users.docs){const sessions=await getDocs(collection(db,'responses',u.id,'sessions'));for(const s of sessions.docs){const revisions=await getDocs(collection(db,'responses',u.id,'sessions',s.id,'revisions'));backups.push({uid:u.id,session:s.id,current:s.data(),revisions:revisions.docs.map(r=>r.data())});}}return backups;}
 };
}
export function draftKey(uid,session){return `s1582-pilot:${uid}:${session}`;}
export function keepDraft(uid,session,baseRevision,state){localStorage.setItem(draftKey(uid,session),JSON.stringify({baseRevision,state,at:new Date().toISOString()}));}
export function readDraft(uid,session){const raw=localStorage.getItem(draftKey(uid,session));if(!raw)return null;try{return JSON.parse(raw);}catch{throw new Error('The local draft cannot be read. Export the browser draft before clearing it.');}}
export function clearDraft(uid,session){localStorage.removeItem(draftKey(uid,session));}
