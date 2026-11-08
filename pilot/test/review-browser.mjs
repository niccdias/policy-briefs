// Local browser fixture only. Requires the demo auth/Firestore emulators.
import {readFile,writeFile,mkdtemp} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:http';
import {build} from 'esbuild';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {doc,setDoc} from 'firebase/firestore';
import {GoogleAuthProvider,signInWithCredential} from 'firebase/auth';
import {deleteApp} from 'firebase/app';
import {connect} from '../src/storage.mjs';
import {newState,editState,judgedClaims,claimAncestors} from '../src/core.mjs';
import {identifyRenderedRelease} from '../rendered-release.mjs';

const root=new URL('../',import.meta.url),out=await mkdtemp(join(tmpdir(),'coding-review-browser-'));
const content=JSON.parse(await readFile(new URL('release/content.json',root)));
content.release={...content.release,...await identifyRenderedRelease(content)};
const fixture=newState(content,20261108),claims=new Set(judgedClaims(content).map(n=>n.id));
const target=content.arguments.find(a=>claimAncestors(content,a.id).some(id=>claims.has(id)));
const worked=new Set([...content.arguments.filter(a=>a.value_id===target.value_id).map(a=>a.id),...fixture.order.filter(id=>content.arguments.some(a=>a.id===id)).slice(0,16)]);
let state=fixture;
for(const id of state.order.filter(id=>claims.has(id)))state=editState(content,state,{type:'judgment',id,answer:'yes',notes:''});
for(const id of state.order.filter(id=>worked.has(id))){
 state=editState(content,state,{type:'judgment',id,answer:'yes',notes:id===target.id?'QA review marker é':'QA fixture note'});
 state=editState(content,state,{type:'complete',id});
}
state=editState(content,state,{type:'comparison',value:target.value_id,answer:'support',notes:'QA comparison marker'});
state=editState(content,state,{type:'summary',value:target.value_id});
state=editState(content,state,{type:'cursor',cursor:state.order.findIndex(id=>content.arguments.some(a=>a.id===id)&&!worked.has(id))});
state.history=[];
const env=await initializeTestEnvironment({projectId:'demo-s1582-pilot',firestore:{host:'127.0.0.1',port:8089,rules:await readFile(new URL('backend/firestore.rules',root),'utf8')}});
const service=connect({authDomain:'localhost',appId:'local-qa'},true,'one'),session=`${content.version}--qa`;
const users={};
for(const name of ['one','two']){
 const {user}=await signInWithCredential(service.auth,GoogleAuthProvider.credential(JSON.stringify({sub:`local-qa-${name}`,email:`local-qa-${name}@example.test`,email_verified:true,name:`Local QA ${name}`})));
 users[name]=user.uid;
 await env.withSecurityRulesDisabled(ctx=>setDoc(doc(ctx.firestore(),'assignments',user.uid),{active:true,role:'coordinator',versions:[content.version],kinds:['qa','research']}));
 const previous=await service.load(user.uid,session);
 await service.save(user.uid,session,content.version,'qa',previous?.revision??0,name==='one'?state:newState(content,25));
}
await deleteApp(service.auth.app);await env.cleanup();
for(const name of ['index.html','style.css','firebase-config.json'])await writeFile(join(out,name),await readFile(new URL(name,root)));
await writeFile(join(out,'content.json'),JSON.stringify(content));
await writeFile(join(out,'fixture.json'),JSON.stringify({users,session,target:target.id,value:target.value_id,claim:claimAncestors(content,target.id).find(id=>claims.has(id)),background:claimAncestors(content,target.id).find(id=>!claims.has(id)),cursor:state.cursor,currentId:state.order[state.cursor],state}));
await build({entryPoints:[new URL('src/app.jsx',root).pathname],outfile:join(out,'app.js'),bundle:true,format:'esm',target:'es2022',jsx:'automatic',jsxImportSource:'preact',define:{__POLICY_APP_RELEASE__:JSON.stringify(content.release)}});
const allowed=new Set(['index.html','style.css','firebase-config.json','content.json','app.js','fixture.json']);
createServer(async(req,res)=>{
 const name=new URL(req.url,'http://localhost').pathname.split('/').pop()||'index.html';
 if(!allowed.has(name)){res.writeHead(404);res.end();return;}
 try{res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.html')?'text/html':'application/json');res.end(await readFile(join(out,name)));}catch{res.writeHead(500);res.end();}
}).listen(8778,'127.0.0.1',()=>console.log('Synthetic browser QA: http://127.0.0.1:8778/coding/?qa=1&emulator=1'));
