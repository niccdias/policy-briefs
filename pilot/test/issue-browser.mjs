// Synthetic browser fixture only; all reads and writes use the demo emulators.
import {readFile,writeFile,mkdtemp,mkdir} from 'node:fs/promises';
import {tmpdir} from 'node:os';
import {join} from 'node:path';
import {createServer} from 'node:http';
import {build} from 'esbuild';
import {initializeTestEnvironment} from '@firebase/rules-unit-testing';
import {doc,setDoc} from 'firebase/firestore';
import {GoogleAuthProvider,signInWithCredential} from 'firebase/auth';
import {deleteApp} from 'firebase/app';
import {connect} from '../src/storage.mjs';
import * as issues from '../src/issues.mjs';
import * as legacy from '../src/core.mjs';
import {loadIssueContent} from '../assemble-issues.mjs';
import {identifyRenderedRelease} from '../rendered-release.mjs';

const root=new URL('../',import.meta.url),out=await mkdtemp(join(tmpdir(),'coding-issue-browser-'));
const content=await loadIssueContent();
content.release={...content.release,...await identifyRenderedRelease(content)};
const oldContent=JSON.parse(await readFile(new URL('release/content.json',root)));
oldContent.release={...oldContent.release,...await identifyRenderedRelease(oldContent)};
let worked=issues.newState(content,20261108);
for(const claim of legacy.judgedClaims(content))worked=issues.editState(content,worked,{type:'judgment',id:claim.id,answer:'yes',notes:'Synthetic premise note'});
for(const issue of content.issue_review.issues){
 const available=issues.availableSides(content,worked,issue);
 const presence=available.support.exists?(available.oppose.exists?'Both':'Support'):'Oppose';
 worked=issues.editState(content,worked,{type:'issueJudgment',id:issue.id,presence,...(presence==='Both'?{strength:'support'}:{}),notes:'Synthetic issue note'});
 worked=issues.editState(content,worked,{type:'issueComplete',id:issue.id});
}
for(const value of content.values){
 if(issues.valueResult(content,worked,value.id).outcome==='Both')worked=issues.editState(content,worked,{type:'comparison',value:value.id,answer:'support',notes:'Synthetic value comparison'});
 worked=issues.editState(content,worked,{type:'summary',value:value.id});
}
worked.history=[];
const blank=issues.newState(content,1234),oldState=legacy.newState(oldContent,20261108);
const env=await initializeTestEnvironment({projectId:'demo-s1582-pilot',firestore:{host:'127.0.0.1',port:8089,rules:await readFile(new URL('backend/firestore.rules',root),'utf8')}});
const service=connect({authDomain:'localhost',appId:'local-qa'},true,'one');
const session=`${content.version}--qa`,legacySession=`${oldContent.version}--qa`,users={};
for(const name of ['one','two']){
 const {user}=await signInWithCredential(service.auth,GoogleAuthProvider.credential(JSON.stringify({sub:`local-qa-${name}`,email:`local-qa-${name}@example.test`,email_verified:true,name:`Local QA ${name}`})));
 users[name]=user.uid;
 await env.withSecurityRulesDisabled(ctx=>setDoc(doc(ctx.firestore(),'assignments',user.uid),{active:true,role:'coordinator',versions:[content.version,oldContent.version],kinds:['qa','research']}));
 for(const [recordSession,recordVersion,recordState] of [[session,content.version,name==='one'?blank:worked],[legacySession,oldContent.version,oldState]]){
  const previous=await service.load(user.uid,recordSession);
  await service.save(user.uid,recordSession,recordVersion,'qa',previous?.revision??0,recordState);
 }
}
await deleteApp(service.auth.app);await env.cleanup();
for(const [route,release] of [['',content],['legacy',oldContent]]){
 const dest=join(out,route);await mkdir(dest,{recursive:true});
 for(const name of ['index.html','style.css','firebase-config.json'])await writeFile(join(dest,name),await readFile(new URL(name,root)));
 await writeFile(join(dest,'content.json'),JSON.stringify(release));
 await build({entryPoints:[new URL('src/app.jsx',root).pathname],outfile:join(dest,'app.js'),bundle:true,format:'esm',target:'es2022',jsx:'automatic',jsxImportSource:'preact',define:{__POLICY_APP_RELEASE__:JSON.stringify(release.release)}});
}
await writeFile(join(out,'fixture.json'),JSON.stringify({users,session,legacySession,issueVersion:content.version,blank,worked}));
const allowed=new Set(['index.html','style.css','firebase-config.json','content.json','app.js','fixture.json']);
createServer(async(req,res)=>{
 const path=new URL(req.url,'http://localhost').pathname,route=path.includes('/legacy/')?'legacy':'';
 const name=path.split('/').pop()||'index.html';
 if(!allowed.has(name)){res.writeHead(404);res.end();return;}
 try{res.setHeader('Cache-Control','no-store');res.setHeader('Content-Type',name.endsWith('.js')?'text/javascript':name.endsWith('.css')?'text/css':name.endsWith('.html')?'text/html':'application/json');res.end(await readFile(join(out,route,name)));}catch(error){console.error(error);res.writeHead(500);res.end();}
}).listen(8789,'127.0.0.1',()=>console.log('Synthetic issue browser QA: http://127.0.0.1:8789/coding/s1582-issues/?qa=1&emulator=1'));
