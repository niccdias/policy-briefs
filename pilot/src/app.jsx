import {render} from 'preact';
import {useEffect,useRef,useState} from 'preact/hooks';
import {validateContent,validateState,nodes,paths,claimAncestors,claimUsers,backgroundFact,codingOrder,nextCursor,newState,editState,effective,basis,pageComplete,progress,valueResult,strengthResult,comparisonBasis,csvExport,stable} from './core.mjs';
import {connect,ConflictError,keepDraft,readDraft,clearDraft} from './storage.mjs';

const $params=new URLSearchParams(location.search);
const isQA=$params.get('qa')==='1';
const isEmulator=$params.get('emulator')==='1'&&['localhost','127.0.0.1'].includes(location.hostname);
const label=x=>x==='yes'?'Yes':x==='no'?'No':x==='reassess'?'Reassess':'Not yet judged';
const htmlCache=new Map();
function cleanHTML(raw=''){
 if(htmlCache.has(raw))return htmlCache.get(raw);
 const t=document.createElement('template');t.innerHTML=raw;
 const allowed=new Set(['P','UL','OL','LI','DIV','SPAN','A','STRONG','EM','B','I','BR','H3','H4','BLOCKQUOTE','DETAILS','SUMMARY','SUP','SUB','CODE']);
 for(const el of [...t.content.querySelectorAll('*')]){
  if(!allowed.has(el.tagName)){if(['SCRIPT','STYLE','IFRAME','OBJECT','FORM'].includes(el.tagName))el.remove();else el.replaceWith(...el.childNodes);continue;}
  for(const attr of [...el.attributes])if(!['href','class','title','role'].includes(attr.name))el.removeAttribute(attr.name);
  if(el.tagName==='A'){
   const href=el.getAttribute('href')??'';
   if(/^#C\d+$/.test(href))continue;
   if(!/^https:\/\//.test(href))el.removeAttribute('href');
   else{el.target='_blank';el.rel='noopener noreferrer';}
  }
 }
 const result=t.innerHTML;htmlCache.set(raw,result);return result;
}
const HTML=({text,className=''})=><div class={className} dangerouslySetInnerHTML={{__html:cleanHTML(text)}}/>;
const argumentBody=html=>html.replace(/^<p><span class="lbl">Point \d+<\/span>[\s\S]*?<\/p>/,'');
const responseBody=html=>html.replace(/<span class="lbl">Response<\/span>\s*/,'');
function saveFile(filename,body,type='application/json'){
 const blob=new Blob([body],{type}),a=document.createElement('a');a.href=URL.createObjectURL(blob);a.download=filename;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),1000);
}
function App({content,service}){
 const [exported,setExported]=useState(null);
 function download(filename,body,type='application/json'){setExported({filename,body,type});window.scrollTo({top:0});}
 const [user,setUser]=useState(undefined),[assignment,setAssignment]=useState(null),[state,setState]=useState(null),[error,setError]=useState(''),[saveStatus,setSaveStatus]=useState(''),[conflict,setConflict]=useState(null),[network,setNetwork]=useState(false),[intro,setIntro]=useState('guide'),[historyOpen,setHistoryOpen]=useState(false),[networkPaused,setNetworkPaused]=useState(false);
 const current=useRef(null),revision=useRef(0),dirty=useRef(false),saving=useRef(false),timer=useRef(null),watch=useRef(null),sent=useRef(''),userRef=useRef(null),authGeneration=useRef(0),session=`${content.version}--${isQA?'qa':'research'}`,conflictRef=useRef(null);
 function showConflict(remote){conflictRef.current=remote;setConflict(remote);setError('');setSaveStatus('Conflict — unsent draft retained');}
 function local(s){current.current=s;setState(s);}
 function remember(s){
  try{keepDraft(userRef.current.uid,session,revision.current,s);}catch(e){setError('This browser could not retain the unsent draft. Keep this page open and export JSON. '+e.message);}
 }
 async function save(){
  if(!dirty.current||saving.current||conflictRef.current||!current.current)return;
  saving.current=true;const uid=userRef.current.uid,s=structuredClone(current.current),expected=revision.current;sent.current=JSON.stringify(s);setSaveStatus('Saving…');
  try{
   const nextRevision=await service.save(uid,session,content.version,isQA?'qa':'research',expected,s);
   if(userRef.current?.uid!==uid)return;
   revision.current=nextRevision;
   if(current.current.eventRevision===s.eventRevision){dirty.current=false;local({...current.current,history:[]});clearDraft(userRef.current.uid,session);setError('');setSaveStatus(`Saved to server · revision ${nextRevision}`);}
   else{remember(current.current);setSaveStatus('Saving further changes…');}
  }catch(e){
   if(userRef.current?.uid!==uid)return;
   if(e instanceof ConflictError)showConflict(e.remote);
   else{setSaveStatus('Not saved — draft retained in this browser');setError(e.message);}
  }finally{saving.current=false;sent.current='';if(dirty.current&&!conflictRef.current&&navigator.onLine)timer.current=setTimeout(save,2500);}
 }
 function act(action){
  try{const next=editState(content,current.current,action);local(next);dirty.current=true;remember(next);setSaveStatus('Unsent changes retained in this browser');clearTimeout(timer.current);timer.current=setTimeout(save,450);setError('');return true;}
  catch(e){setError(e.message);return false;}
 }
 useEffect(()=>service.watchAuth(async u=>{
  watch.current?.();clearTimeout(timer.current);const generation=++authGeneration.current;dirty.current=false;revision.current=0;conflictRef.current=null;setConflict(null);setExported(null);userRef.current=u;setUser(u);setAssignment(null);local(null);setError('');
  if(!u)return;
  try{
   const a=await service.assignment(u.uid);if(generation!==authGeneration.current)return;setAssignment(a);
   if(!a?.active||!a.versions?.includes(content.version)||!a.kinds?.includes(isQA?'qa':'research'))return;
   const remote=await service.load(u.uid,session);if(generation!==authGeneration.current)return;revision.current=remote?.revision??0;
   const saved=remote?validateState(content,JSON.parse(remote.payload)):newState(content,crypto.getRandomValues(new Uint32Array(1))[0]);
   const draft=readDraft(u.uid,session);
   if(draft){validateState(content,draft.state);local(draft.state);dirty.current=true;if(draft.baseRevision!==revision.current)showConflict(remote);else setSaveStatus('Unsent draft restored');}
   else{local(saved);dirty.current=!remote;setSaveStatus(remote?`Saved to server · revision ${revision.current}`:'Starting private saved session…');}
   watch.current=service.watch(u.uid,session,r=>{
    if(!r||r.revision<=revision.current)return;
    if(saving.current&&r.revision===revision.current+1&&r.payload===sent.current)return;
    if(dirty.current)showConflict(r);
    else{revision.current=r.revision;local(validateState(content,JSON.parse(r.payload)));setSaveStatus(`Saved to server · revision ${r.revision}`);}
   },e=>{setSaveStatus('Server connection unavailable');setError(e.message);});
   if(dirty.current&&!conflictRef.current)timer.current=setTimeout(save,300);
  }catch(e){setError(e.message);}
 }),[]);
 useEffect(()=>{
  const online=()=>{setError('');save();},unload=e=>{if(dirty.current){e.preventDefault();e.returnValue='';}};
  addEventListener('online',online);addEventListener('beforeunload',unload);
  return()=>{removeEventListener('online',online);removeEventListener('beforeunload',unload);watch.current?.();clearTimeout(timer.current);};
 },[]);
 async function signIn(){try{await service.signIn();}catch(e){setError(e.code==='auth/popup-blocked'?'Allow the Google sign-in window, then try again.':e.message);}}
 async function signOut(){
  if(dirty.current){await save();if(dirty.current){setError('There are unsent changes. Save or export them before signing out.');return;}}
  await service.signOut();setIntro('guide');conflictRef.current=null;setConflict(null);
 }
 function showIntro(page){setIntro(page);setHistoryOpen(false);setNetwork(false);window.scrollTo({top:0});}
 function jump(id){if(backgroundFact(content,id)){showIntro(id);return;}const cursor=current.current.order.indexOf(id);if(cursor>=0){act({type:'cursor',cursor});setIntro(null);setHistoryOpen(false);window.scrollTo({top:0});}}
 function beginCoding(){if(backgroundFact(content,state.order[state.cursor])){const cursor=nextCursor(content,state,1);if(cursor>=0)act({type:'cursor',cursor});}showIntro(null);}
 function navigate(delta){const cursor=nextCursor(content,state,delta);if(cursor<0){if(delta<0)showIntro('bill');return;}act({type:'cursor',cursor});window.scrollTo({top:0});}
 function nextNode(id){if(act({type:'complete',id}))navigate(1);}
 async function exportRevisions(){try{const revisions=await service.revisions(user.uid,session);download(`s1582-${isQA?'QA':'coding'}-backup.json`,JSON.stringify({version:content.version,procedure_revision:content.procedure.revision,uid:user.uid,session,state:current.current,serverRevision:revision.current,revisions},null,2));}catch(e){setError(e.message);}}
 async function exportAll(){try{download('s1582-private-coordinator-backup.json',JSON.stringify({at:new Date().toISOString(),sessions:await service.backups()},null,2));}catch(e){setError(e.message);}}
 function resolve(useDraft){
  const remote=conflictRef.current;if(!remote){setError('No server version was available. Retry the save.');return;}
  revision.current=remote.revision;
  if(useDraft){dirty.current=true;remember(current.current);}
  else{local(validateState(content,JSON.parse(remote.payload)));dirty.current=false;clearDraft(user.uid,session);setSaveStatus(`Saved to server · revision ${remote.revision}`);}
  conflictRef.current=null;setConflict(null);if(useDraft)save();
 }
 const login=<main class="welcome"><p class="eyebrow">S.1582 · shared-premise pilot{isQA?' · QA ONLY':''}</p><h1>Code the arguments</h1><p>Review shared claims once, then judge the value-specific arguments. Your answers are saved privately in your assigned account.</p><p>Use your own device. Unsent changes are retained in this browser until the server confirms saving.</p><button class="primary" onClick={signIn}>Sign in with Google</button>{error&&<p class="error" role="alert">{error}</p>}<p class="status">Content version: {content.version}</p></main>;
 if(user===undefined)return <main class="welcome">Checking sign-in…</main>;
 if(!user)return login;
 if(!assignment?.active||!assignment.versions?.includes(content.version)||!assignment.kinds?.includes(isQA?'qa':'research'))return <main class="welcome"><h1>Reviewer access required</h1><p>This Google account has no assignment for this pilot{isQA?' QA session':''}. No coding record has been created.</p><p>{user.email}</p><p class="status">Account ID: {user.uid}</p><button onClick={signOut}>Sign out</button>{error&&<p class="error">{error}</p>}</main>;
 if(!state)return <main class="welcome"><p>Loading your private response…</p>{error&&<p class="error" role="alert">{error}</p>}</main>;
 const p=progress(content,state),currentId=state.order[state.cursor],node=nodes(content).find(n=>n.id===currentId),value=node?.value_id??(currentId.startsWith('summary:')?currentId.split(':')[1]:null),ctx=content.values.find(v=>v.id===value),sequence=codingOrder(content,state);
 const info=<><p><strong>{content.bill.bill}</strong> · {content.bill.title}</p><p>{content.bill.description}</p><h2>Main effect</h2><HTML text={ctx?.main_effect_html??content.bill.main_effect_html}/>{ctx&&<><h2>{ctx.name}</h2><ul>{ctx.statements.map(s=><li key={s}>{s}</li>)}</ul><p class="reference"><strong>Reference person:</strong> {ctx.reference||'[NAME].'}</p></>}</>;
 return <>
  <header class="appbar"><div><a class="brand" href="../../" target="_blank" rel="noopener">Policy rationale briefs</a><div class="status">S.1582 coding pilot{isQA?' · QA ONLY':''}</div><div class={`save ${saveStatus.startsWith('Saved')?'saved':''}`} role="status" aria-live="polite">{saveStatus}</div></div><div class="toolbar"><button onClick={()=>showIntro('guide')}>Guide</button><button onClick={()=>showIntro('bill')}>Bill overview</button><button onClick={()=>showIntro('provisions')}>Background</button>{!intro&&<button aria-expanded={network} onClick={()=>{setHistoryOpen(false);setNetwork(!network);}}>Network</button>}<button onClick={()=>download('s1582-response.json',JSON.stringify({version:content.version,procedure_revision:content.procedure.revision,session,state},null,2))}>JSON</button><button onClick={()=>download('s1582-response.csv',csvExport(content,state),'text/csv')}>CSV</button>{!intro&&<button onClick={()=>setHistoryOpen(!historyOpen)}>Backups</button>}<button onClick={signOut}>Sign out</button>{isEmulator&&<button onClick={async()=>{await service.network(networkPaused);setNetworkPaused(!networkPaused);if(networkPaused)save();}}>{networkPaused?'Local QA: restore network':'Local QA: interrupt network'}</button>}</div></header>
  {exported&&<section class="export-preview welcome" aria-label="Private export"><h1>Private export</h1><p>{exported.filename}. This file contains private coding data. Copy it below or save it to your device.</p><label>Export contents<textarea readOnly value={exported.body}/></label><div class="toolbar"><button onClick={()=>saveFile(exported.filename,exported.body,exported.type)}>Save file</button><button onClick={()=>setExported(null)}>Close export</button></div></section>}
  <div class={`layout${intro?' introduction':''}`}><main class="reader" onClick={event=>{const a=event.target.closest?.('a[href^="#C"]');if(a){event.preventDefault();jump(a.getAttribute('href').slice(1));}}}>
   {error&&<div class="error" role="alert">{error}<button class="link" onClick={()=>{setError('');save();}}>Retry saving</button></div>}
   {conflict&&<section class="conflict" role="alert"><h2>Another saved version exists</h2><p>Server revision {conflict.revision} differs from this browser’s draft. Both versions are retained. Compare them before choosing.</p><details><summary>Compare changed judgments</summary><ul>{Object.keys({...JSON.parse(conflict.payload).judgments,...state.judgments,...JSON.parse(conflict.payload).nodeNotes,...state.nodeNotes}).filter(id=>stable([JSON.parse(conflict.payload).judgments[id],JSON.parse(conflict.payload).nodeNotes[id]])!==stable([state.judgments[id],state.nodeNotes[id]])).map(id=><li key={id}>{id}: server {label(JSON.parse(conflict.payload).judgments[id]?.answer)}, draft {label(state.judgments[id]?.answer)}<p>Server notes: {JSON.parse(conflict.payload).nodeNotes[id]??JSON.parse(conflict.payload).judgments[id]?.notes??'(blank)'}</p><p>Draft notes: {state.nodeNotes[id]??state.judgments[id]?.notes??'(blank)'}</p></li>)}</ul><p>Progress, flags and comparison notes are also preserved in each complete version.</p><button onClick={()=>download('s1582-conflicting-versions.json',JSON.stringify({server:conflict,draft:state},null,2))}>Export both versions</button></details><div class="toolbar"><button onClick={()=>resolve(false)}>Use server revision {conflict.revision}</button><button onClick={()=>resolve(true)}>Save this draft as the next revision</button></div></section>}
   {state.procedureRevision!==content.procedure.revision&&Object.keys(state.judgments).length>0&&<p class="notice">Procedure updated: only three disputed shared claims need separate judgments. Bill provisions and unchallenged shared statements are now sourced context. Your earlier answers and order are retained. Affected judgments will ask for reassessment.</p>}
   {!intro&&<p class="status">Shared claims {p.claims}/{p.totalClaims} · Arguments {p.arguments}/{p.totalArguments} · {sequence.includes(currentId)?`Page ${sequence.indexOf(currentId)+1}/${sequence.length}`:'Sourced context'}</p>}
   {intro==='bill'?<section aria-label="Bill overview"><p class="eyebrow">Bill overview</p><h1>{content.bill.bill} · {content.bill.title}</h1><h2>Bill description</h2><p>{content.bill.description}</p><h2>Main effect</h2><HTML text={content.bill.main_effect_html}/><p><a href={content.bill.source_url} target="_blank" rel="noopener">Read the bill brief and sources</a></p><nav class="navigation" aria-label="Page navigation"><button onClick={()=>showIntro('guide')}>Back</button><button class="primary" onClick={beginCoding}>{Object.keys(state.judgments).length?'Resume coding':'Begin coding'}</button></nav></section>:
    intro==='provisions'?<section aria-label="Bill and shared context"><p class="eyebrow">Sourced background</p><h1>Bill and shared context</h1><p>These statements need no separate Yes/No answer. Relevant context appears with each argument that uses it. You can open the sources and qualifications here at any time.</p><p>Context is not a judgment that a complete argument succeeds. If you find a problem with its use, record it when judging that argument.</p>{[['verified_statutory_background','What the bill says'],['uncontested_sourced_context','Shared context']].map(([kind,title])=><details key={kind}><summary>{title} · {content.procedure.background.filter(f=>f.classification===kind).length} statements</summary>{content.procedure.background.filter(f=>f.classification===kind).map(f=><BackgroundCard key={f.id} content={content} state={state} fact={f} jump={jump}/>)}</details>)}<nav class="navigation" aria-label="Page navigation"><button onClick={()=>showIntro('bill')}>Back</button><button class="primary" onClick={beginCoding}>{Object.keys(state.judgments).length?'Resume coding':'Begin coding'}</button></nav></section>:
    backgroundFact(content,intro)?<section><BackgroundCard content={content} state={state} fact={backgroundFact(content,intro)} jump={jump} expanded/><nav class="navigation" aria-label="Page navigation"><button onClick={()=>showIntro('provisions')}>All background</button><button class="primary" onClick={beginCoding}>Return to coding</button></nav></section>:
    intro==='guide'?<section><h1>S.1582 shared-premise pilot</h1><p>Begin with the bill overview. Bill provisions and unchallenged shared statements are supplied as context, without separate questions. Judge {p.totalClaims} shared claims with substantive disputes, then every value-specific argument, including any argument with a derived No.</p><p>A No on a shared claim means the evidence is insufficient. It does not prove the claim is false. A shared claim marked Yes does not automatically establish an argument.</p><p>If every supporting path needs a claim you marked No, the app derives No. You can revisit that claim or flag a mistaken dependency. Earlier direct judgments remain in the record when reassessment is needed.</p><p>{content.bill.comparison}. Bill text: {content.bill.text_version}, {content.bill.text_date}. Use evidence dated no later than {content.bill.evidence_cutoff}. Keep the stated value and reference person fixed.</p><p>Judge whether a reason exists before comparing its strength. When both directions have a reason, compare them in the value summary. Choose Pending when a justified comparison is unavailable.</p><p>Use Back or the network to revisit earlier pages. Wait for “Saved to server” before closing. Your assigned order stays the same when you return.</p><nav class="navigation" aria-label="Page navigation"><button class="primary" onClick={()=>showIntro('bill')}>Continue to bill overview</button></nav><details><summary>Historical IDs</summary><p>All 85 historical IDs are preserved; 79 are active. Retired arguments are not assigned.</p><ul>{content.catalog.filter(n=>n.retired).map(n=><li key={n.id} class="retired"><a href={n.url} target="_blank" rel="noopener">{n.id}</a> — retired by the Tradition amendment</li>)}</ul></details></section>:
    historyOpen?<section><h1>Private backups</h1><p>Every server save also creates an immutable revision. JSON includes judgments, order, progress and saved revisions.</p><button onClick={exportRevisions}>Export this session and all revisions</button>{assignment.role==='coordinator'&&<p><button onClick={exportAll}>Export all authorized records and revisions</button></p>}<button class="link" onClick={()=>setHistoryOpen(false)}>Return to coding</button></section>:
    <>
     {network&&<Network content={content} state={state} focus={currentId} jump={jump}/>}
     {node&&backgroundFact(content,node.id)?<section><BackgroundCard content={content} state={state} fact={backgroundFact(content,node.id)} jump={jump} expanded/><nav class="navigation"><button onClick={()=>navigate(-1)}>Back</button><button class="primary" onClick={()=>navigate(1)}>Continue to shared claims</button></nav></section>:node?<NodePage key={node.id} content={content} state={state} node={node} act={act} jump={jump} next={()=>nextNode(node.id)} back={()=>navigate(-1)} canBack/>:
      <Summary key={currentId} content={content} state={state} value={value} act={act} jump={jump} back={()=>navigate(-1)} next={()=>{if(act({type:'summary',value}))navigate(1);}} last={state.cursor===state.order.length-1}/>}
    </>}
  </main>{!intro&&<aside class="context" aria-label="Fixed bill and value context">{info}</aside>}</div>
 </>;
}
function BackgroundCard({content,state,fact,jump,expanded=false}){
 const node=content.claims.find(c=>c.id===fact.id),users=claimUsers(content,fact.id),saved=state.judgments[fact.id],Heading=expanded?'h1':'h2';
 const provision=fact.classification==='verified_statutory_background';
 return <article class="background-card" id={fact.id}><p class="eyebrow">{provision?`Bill provision · ${fact.section}`:'Shared context'}</p><Heading>{node.title}</Heading><p>{fact.statement}</p><HTML text={fact.scope_html}/><details open={expanded}><summary>Supporting evidence, sources and qualifications</summary>{!provision&&<HTML text={node.background_html}/>}<HTML text={node.support_html}/>{!provision&&<HTML text={node.objection_html}/>}<HTML className="notes" text={node.notes_html}/></details><details><summary>Used in {users.length} arguments</summary><ul>{users.map(a=><li key={a.id}><button class="link" onClick={()=>jump(a.id)}>{a.title}</button> <span class="status">({a.direction}, {a.value_id})</span></li>)}</ul></details>{saved&&<details><summary>Earlier response retained</summary><p>Your earlier answer was {label(saved.answer)}. This item is now sourced background, so that answer is no longer used to derive outcomes.</p><p>{state.nodeNotes[fact.id]??saved.notes}</p></details>}</article>;
}
function SharedContext({content,node,jump}){
 const facts=claimAncestors(content,node.id).map(id=>backgroundFact(content,id)).filter(Boolean);
 if(!facts.length)return null;
 return <section class="context-cards" aria-label="Background used here"><h2>Background used here</h2>{facts.map(fact=>{const claim=content.claims.find(c=>c.id===fact.id);return <details class="context-fact" key={fact.id}><summary>{fact.statement}</summary><HTML text={fact.scope_html}/><HTML text={claim.support_html}/>{fact.classification==='uncontested_sourced_context'&&<HTML text={claim.objection_html}/>}<HTML className="notes" text={claim.notes_html}/><button class="link" onClick={()=>jump(fact.id)}>Sources and all uses</button></details>;})}</section>;
}
function NodePage({content,state,node,act,jump,next,back,canBack}){
 const isClaim=!node.value_id,e=effective(content,state,node.id),saved=state.judgments[node.id];
 // Controlled fields commit immediately into the recoverable draft; blank notes are valid.
 const notes=state.nodeNotes[node.id]??saved?.notes??'',answer=!e.stale?saved?.answer:null;
 const judge=(a,n=notes)=>act({type:'judgment',id:node.id,answer:a,notes:n});
 const deps=[...new Set(paths(node).flatMap(p=>p.requires))];
 // Keep usage explanations in the frozen content, outside the coding page.
 const backgroundHTML=isClaim?node.background_html
  .replace(' Each argument adds its own group: poor and rural areas, local firms and farms, or ministry lenders.','')
  .replace(' This claim is used on both sides: some arguments want more monitoring to find crime, and one fears it exposes private ties.',''):node.background_html;
 return <article>
  <p class="eyebrow">{isClaim?'Shared claim':content.values.find(v=>v.id===node.value_id).name}</p>
  {!isClaim&&<span class={`direction ${node.direction}`}>Reasons to {node.direction==='support'?'SUPPORT':'OPPOSE'} {content.bill.bill}</span>}
  <h1>{node.title}</h1>
  {isClaim&&<p><strong>{node.statement}</strong></p>}
  {backgroundHTML&&<HTML text={backgroundHTML}/>}
  {deps.some(id=>!backgroundFact(content,id))&&<section class="paths"><h2>{isClaim?'Shared premises':'Shared premises in this argument'}</h2>{paths(node).map((path,i)=><div key={path.id}>{i>0&&<div class="or">OR — another supporting path</div>}<div class="path">{path.requires.length? <><span class="status">{path.requires.length>1?'Together, this path uses:':'This path uses:'}</span><ul>{path.requires.map(id=><li key={id}><button class="link" onClick={()=>jump(id)}>{content.claims.find(c=>c.id===id).title}</button> · {backgroundFact(content,id)?'Sourced context':label(effective(content,state,id).answer)}</li>)}</ul></>:<p>This path does not depend on a separately judged shared claim.</p>}</div></div>)}</section>}
  <SharedContext content={content} node={node} jump={jump}/>
  <div class="pair"><section><h2>{isClaim?'Supporting evidence':'Argument'}</h2><HTML text={isClaim?node.support_html:argumentBody(node.pro_html)}/></section><section><h2>Response</h2><HTML text={isClaim?node.objection_html:responseBody(node.con_html)}/></section></div>
  {node.notes_html&&<HTML className="notes" text={node.notes_html}/>}
  {!!node.gaps?.length&&<section class="notes"><h2>Evidence gaps</h2><ul>{node.gaps.map((g,i)=><li key={i}>{g.explanation}</li>)}</ul></section>}
  {!isClaim&&<details><summary>Full original argument, response and notes</summary><HTML text={node.original.pro_html}/><HTML text={node.original.con_html}/><HTML text={node.original.notes_html}/><p class="status">{node.id}</p></details>}
  <section class="judgment">
   {e.origin==='derived'?<div class="derived"><strong>Derived No</strong><p>Every supporting path is blocked by a shared claim marked No. This is a derived outcome, not a new direct judgment.</p>{saved&&<p>Earlier direct judgment retained: {label(saved.answer)}. {saved.notes}</p>}<p>Review the shared claims above, or flag a mistaken dependency below.</p></div>:
    <fieldset><legend>{isClaim?'Does the evidence support this shared claim?':`Does this argument establish a reason to ${node.direction==='support'?'SUPPORT':'OPPOSE'} ${content.bill.bill}?`}</legend>{e.stale&&<p class="notice">A shared premise or its treatment changed. Reassess this judgment. Earlier answer: {label(saved?.answer)}.</p>}<div class="choices">{['yes','no'].map(a=><label class="choice" key={a}><input type="radio" name={`judge-${node.id}`} value={a} checked={answer===a} required onChange={()=>judge(a)}/>{label(a)}</label>)}</div>{isClaim&&<p class="status">No means insufficient support, not proof that the claim is false.</p>}</fieldset>}
   <label>Optional notes<textarea maxLength={2000} value={notes} onInput={event=>act({type:'notes',id:node.id,notes:event.currentTarget.value})}/></label>
   
   {deps.length>0&&<details open={!!state.flags[node.id]?.dependency}><summary>Flag a mistaken dependency</summary><label><input type="checkbox" checked={!!state.flags[node.id]?.dependency} onChange={event=>act({type:'flag',id:node.id,dependency:event.currentTarget.checked,notes:state.flags[node.id]?.notes??''})}/> This item may have a supporting path the mapping misses.</label><label>Optional dependency note<textarea maxLength={2000} value={state.flags[node.id]?.notes??''} onInput={event=>act({type:'flag',id:node.id,dependency:!!state.flags[node.id]?.dependency,notes:event.currentTarget.value})}/></label><p class="status">A flag suspends automatic derivation here and keeps the issue for separate review.</p></details>}
   <nav class="navigation" aria-label="Page navigation"><button disabled={!canBack} onClick={back}>Back</button><button class="primary" onClick={next}>Save and continue</button></nav>
  </section>
 </article>;
}
function ArgumentDetails({content,argument,jump}){
 const [open,setOpen]=useState(false);
 return <details onToggle={event=>setOpen(event.currentTarget.open)}><summary>Read argument, response and evidence notes</summary>{open&&<><SharedContext content={content} node={argument} jump={jump}/><HTML text={argument.pro_html}/><HTML text={argument.con_html}/><HTML text={argument.notes_html}/></>}</details>;
}
function Summary({content,state,value,act,jump,back,next,last}){
 const ctx=content.values.find(v=>v.id===value),result=valueResult(content,state,value),complete=content.arguments.filter(a=>a.value_id===value).every(a=>pageComplete(content,state,a.id));
 const comparison=state.comparisons[value],comparisonCurrent=comparison?.basis===comparisonBasis(content,state,value);
 return <section><p class="eyebrow">{content.bill.bill} · value summary</p><h1>{ctx.name}</h1><p><strong>Initial outcome: {result.outcome}</strong></p>{!complete&&<p class="notice">Every argument must be viewed and completed, including derived-No cases. Use the links below to finish outstanding pages.</p>}
  {['support','oppose'].map(direction=><section key={direction}><h2>Reasons to {direction==='support'?'SUPPORT':'OPPOSE'} {content.bill.bill}</h2><ul class="summary-list">{content.arguments.filter(a=>a.value_id===value&&a.direction===direction).map(a=>{const e=effective(content,state,a.id);return <li key={a.id} class={e.answer==='yes'?'accepted':''}><button class="link" onClick={()=>jump(a.id)}>{a.title}</button><span class="answer">{label(e.answer)}{e.origin==='derived'?' (derived)':''}</span>{!pageComplete(content,state,a.id)&&<span class="status"> · page needs review</span>}<ArgumentDetails content={content} argument={a} jump={jump}/></li>;})}</ul>
   {result[direction]==='no'&&<div class="notes"><p>Before a final No: <a href={ctx.source_url} target="_blank" rel="noopener">review the bill and evidence</a>.</p><label>Optional omitted reason to {direction} {content.bill.bill}<textarea maxLength={4000} value={state.omissions[`${value}:${direction}`]?.text??''} onInput={event=>act({type:'omission',value,direction,text:event.currentTarget.value})}/></label><p class="status">This is recorded separately from the frozen arguments.</p></div>}
  </section>)}
  {result.outcome==='Both'&&<section class="judgment"><fieldset><legend>Which direction has the stronger reason, considering all accepted arguments for this value?</legend>{comparison&&!comparisonCurrent&&<p class="notice">The judgments changed. The earlier comparison is retained; choose again.</p>}<div class="choices">{[['support','SUPPORT'],['oppose','OPPOSE'],['Pending','Pending — no justified comparison yet']].map(([answer,text])=><label class="choice" key={answer}><input type="radio" name="strength" checked={comparisonCurrent&&comparison.answer===answer} onChange={()=>act({type:'comparison',value,answer,notes:state.comparisonNotes[value]??comparison?.notes??''})}/>{text}</label>)}</div></fieldset><label>Optional comparison notes<textarea maxLength={2000} value={state.comparisonNotes[value]??comparison?.notes??''} onInput={event=>act({type:'comparisonNotes',value,notes:event.currentTarget.value})}/></label><p class="status">Current comparison: {strengthResult(content,state,value)}</p></section>}
  {last&&complete&&<p class="notice">This is the last value in your assigned order. All records remain available for review and private export.</p>}{content.values.every(v=>state.summaryCompleted[v.id]===comparisonBasis(content,state,v.id))&&<p class="notice" role="status">All six value summaries are complete. Wait for “Saved to server” before closing. You can return to review or export your response.</p>}
  <nav class="navigation"><button onClick={back}>Back</button><button class="primary" onClick={next}>{last?'Finish this value':'Save and continue'}</button></nav>
  {state.summaryCompleted[value]===comparisonBasis(content,state,value)&&<p class="status">Value summary completed.</p>}
 </section>;
}
function Network({content,state,focus,jump}){
 const [all,setAll]=useState(false),byId=new Map(nodes(content).map(n=>[n.id,n]));
 const focusNode=byId.get(focus),deps=focusNode?claimAncestors(content,focus):[],users=claimUsers(content,focus);
 let claimIds=all?content.claims.map(c=>c.id):focusNode?.value_id?deps:[focus,...deps].filter(id=>byId.has(id));
 let args=all?content.arguments:focusNode?.value_id?[focusNode]:users;
 return <section class="network" aria-label="Clickable argument network"><h2>Argument network</h2><p class="status">Shared premises → supporting paths → value-specific arguments. Sourced context needs no separate vote; three disputed shared claims need a judgment. Premises in one path are needed together; separate paths are alternatives.</p><label><input type="checkbox" checked={all} onChange={e=>setAll(e.currentTarget.checked)}/> Show the whole network</label><div class="network-grid"><div class="network-column"><h3>Shared premises</h3>{claimIds.map(id=>{const n=byId.get(id),e=effective(content,state,id);return <button class={`network-node ${e.answer??''} ${id===focus?'current':''}`} onClick={()=>jump(id)} key={id}>{n.title}<span>{id} · {backgroundFact(content,id)?'Sourced context':label(e.answer)}</span></button>;})}</div><div class="network-column"><h3>Arguments</h3>{args.map(n=><button class={`network-node ${effective(content,state,n.id).answer??''} ${n.id===focus?'current':''}`} onClick={()=>jump(n.id)} key={n.id}>{n.title}<span>{n.direction.toUpperCase()} · {n.value_id} · {paths(n).map(p=>p.requires.length?p.requires.join(' AND '):'local path').join(' OR ')}</span></button>)}</div></div><details><summary>Jump to a value summary</summary>{content.values.map(v=><p key={v.id}><button class="link" onClick={()=>jump(`summary:${v.id}`)}>{v.name}</button></p>)}</details></section>;
}
try{
 const [content,config]=await Promise.all([fetch('./content.json',{cache:'no-store'}).then(r=>{if(!r.ok)throw new Error('Content could not load.');return r.json();}),fetch('./firebase-config.json').then(r=>{if(!r.ok)throw new Error('Private saving configuration is unavailable.');return r.json();})]);
 validateContent(content);document.getElementById('app').replaceChildren();render(<App content={content} service={connect(config,isEmulator,$params.get('testUser')==='two'?'two':'one')}/>,document.getElementById('app'));
}catch(e){document.getElementById('app').replaceChildren();render(<main class="welcome"><h1>Pilot could not load</h1><p role="alert">{e.message}</p><p>No answers were changed. Reload to try again.</p></main>,document.getElementById('app'));}
