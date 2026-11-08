import {useState} from 'preact/hooks';
import {claimAncestors,backgroundFact,billFor,effective} from './core.mjs';
import {readingHTML,strengthEvidence} from './evidence.mjs';
import {members,issueResult,argumentRoutes,pageComplete,valueResult,comparisonBasis,strengthResult,includedArguments,commonIssueEvidence,presences,strengths} from './issues.mjs';
import releaseCopy from '../release/ui-copy.json';

const claimLabel=answer=>answer==='yes'?'Yes':answer==='no'?'No':'Not yet judged';
export function IssueReadings({content,state,issue,jump,HTML}){
 const copy=content.issue_review.copy,argumentsForIssue=members(content,issue),ancestors=[...new Set(argumentsForIssue.flatMap(a=>claimAncestors(content,a.id)))].sort(),evidence=commonIssueEvidence(content,issue);
 const reading=(node,side)=>readingHTML(content,node,side,new Set(evidence.suppressed.get(`${node.id}:${side}`)??[]));
 return <>
  <div class="pair issue-columns">{['support','oppose'].map(direction=><section key={direction}><h2>Reasons to {direction.toUpperCase()} {billFor(content,argumentsForIssue[0]).bill}</h2>
   {!argumentsForIssue.some(a=>a.direction===direction)&&<p class="status">{copy.noSide}</p>}
   {argumentsForIssue.filter(a=>a.direction===direction).map(argument=><article class="issue-member" id={argument.id} key={argument.id}>
    <h3>{argument.title}</h3><p class="status">{argument.id}</p>
    {argument.background_html&&<HTML claims={content.claims} text={argument.background_html}/>}
    <h4>Argument</h4><HTML claims={content.claims} text={reading(argument,'support').replace(/^<p><span class="lbl">Point \d+<\/span>[\s\S]*?<\/p>/,'')}/>
    <h4>Response</h4><HTML claims={content.claims} text={reading(argument,'response').replace(/<span class="lbl">Response<\/span>\s*/,'')}/>
    <details class="earlier-claims"><summary>Supporting paths</summary>{argumentRoutes(content,state,argument).map((path,index)=><div class="path" key={path.id}>
     {index>0&&<p class="status">OR — another supporting path</p>}<p><strong>{path.label??path.id}</strong> · {path.status==='blocked'?copy.pathBlocked:path.status==='open'?copy.pathOpen:path.status==='unresolved'?copy.pathUnresolved:copy.pathUnknown}</p>
     {path.requires.length?<ul>{path.claims.map(claim=><li key={claim.id}><button class="link" onClick={()=>jump(claim.id)}>{content.claims.find(c=>c.id===claim.id).title}</button> · {backgroundFact(content,claim.id)?'Sourced context':claimLabel(claim.answer)}</li>)}</ul>:<p>This path does not depend on a separately judged shared claim.</p>}
    </div>)}</details>
    <details><summary>{copy.originalReadings}</summary><HTML claims={content.claims} text={argument.pro_html}/><HTML claims={content.claims} text={argument.con_html}/><HTML claims={content.claims} text={argument.notes_html}/>{argument.original&&<details><summary>Original argument, response and notes</summary><p class="notice">{releaseCopy.originalViewNotice}</p><HTML claims={content.claims} text={argument.original.pro_html}/><HTML claims={content.claims} text={argument.original.con_html}/><HTML claims={content.claims} text={argument.original.notes_html}/></details>}</details>
   </article>)}
  </section>)}</div>
  {evidence.common.length>0&&<details class="issue-common-evidence" open><summary>Evidence notes used by more than one argument or claim on this issue</summary>{evidence.common.map((item,index)=><section key={`${item.id}:${index}`}><HTML claims={content.claims} text={item.html}/><ul>{item.uses.map(use=>{const node=[...content.claims,...content.arguments].find(n=>n.id===use.id);return <li key={`${use.id}:${use.side}`}><p class="status">{use.id} · {node.direction?node.direction.toUpperCase():'Shared claim'} · {node.title} · {use.side==='response'?'Response':node.direction?'Argument':'Supporting evidence'}</p><HTML claims={content.claims} text={use.sources_html}/></li>;})}</ul></section>)}</details>}
  {ancestors.length>0&&<details class="earlier-claims issue-context"><summary>{copy.sharedContext}</summary>{ancestors.map(id=>{
   const claim=content.claims.find(c=>c.id===id),fact=backgroundFact(content,id);
   return <section key={id}><h3><button class="link" onClick={()=>jump(id)}>{claim.title}</button></h3><p>{fact?.statement??claim.statement}</p><p class="status">{fact?'Sourced context':claimLabel(effective(content,state,id).answer)}</p><HTML claims={content.claims} text={fact?.scope_html??claim.scope_html}/><HTML claims={content.claims} text={reading(claim,'support')}/><HTML claims={content.claims} text={reading(claim,'response')}/></section>;
  })}</details>}
 </>;
}
function IssueEvidence({content,argumentIds,HTML}){
 const evidence=strengthEvidence(content,argumentIds);
 if(!evidence.length)return null;
 return <details class="strength-evidence"><summary>Evidence about size, timing and reach</summary>{evidence.map(item=><section key={item.id}><p class="status">{item.arguments.map(id=>{const argument=content.arguments.find(a=>a.id===id);return `${argument.direction.toUpperCase()} · ${argument.title}`;}).join('; ')}</p><HTML claims={content.claims} text={item.html}/></section>)}</details>;
}
export function IssuePage({content,state,issue,act,jump,HTML,next,back,backLabel='Back',nextLabel='Save and continue'}){
 const copy=content.issue_review.copy,result=issueResult(content,state,issue.id),saved=state.issueJudgments[issue.id],notes=state.issueNotes[issue.id]??saved?.notes??'',current=result.origin==='direct'&&!result.stale;
 const judge=(presence,strength)=>act({type:'issueJudgment',id:issue.id,presence,...(presence==='Both'?{strength}:{}),notes});
 const disabled=presence=>(presence==='Support'||presence==='Both')&&!result.availability.support.available||(presence==='Oppose'||presence==='Both')&&!result.availability.oppose.available;
 return <article class="issue-page"><p class="eyebrow">{content.values.find(v=>v.id===issue.value_id).name} · {copy.issueType}</p><h1>{issue.title}</h1><p>{issue.introduction}</p>
  {result.stale&&<p class="notice" role="status">{copy.reassessIssue} {copy.earlierPresence}: {copy.presenceLabels[saved?.presence]}</p>}
  <IssueReadings content={content} state={state} issue={issue} jump={jump} HTML={HTML}/>
  {['support','oppose'].filter(direction=>result.availability[direction].exists&&!result.availability[direction].available).map(direction=><p class="derived" role="status" key={direction}><strong>{direction.toUpperCase()}</strong> · {copy.blockedSide}</p>)}
  <section class="judgment"><fieldset><legend>{copy.presenceQuestion}</legend><div class="choices">{presences.map(presence=><label class={`choice${disabled(presence)?' unavailable':''}`} key={presence}><input type="radio" name={`presence-${issue.id}`} checked={current&&saved.presence===presence} disabled={disabled(presence)} onChange={()=>judge(presence,null)}/>{copy.presenceLabels[presence]}</label>)}</div></fieldset>
   {current&&result.presence==='Both'&&<><p>{copy.issueStrengthGuide}</p><IssueEvidence content={content} argumentIds={includedArguments(content,state,issue.value_id).filter(id=>issue.argument_ids.includes(id))} HTML={HTML}/><fieldset><legend>{copy.strengthQuestion}</legend><div class="choices">{strengths.map(strength=><label class="choice" key={strength}><input type="radio" name={`issue-strength-${issue.id}`} checked={result.strength===strength} onChange={()=>judge('Both',strength)}/>{copy.strengthLabels[strength]}</label>)}</div></fieldset></>}
   <details class="optional-note"><summary>{notes?'Your note (optional)':'Add a note (optional)'}</summary><label>Optional notes<textarea maxLength={2000} value={notes} onInput={event=>act({type:'issueNotes',id:issue.id,notes:event.currentTarget.value})}/></label></details>
   <p class="status">{issue.id}</p><nav class="navigation"><button onClick={back}>{backLabel}</button><button class="primary" onClick={next}>{nextLabel}</button></nav>
  </section>
 </article>;
}
function SummaryIssue({content,state,issue,jump,HTML}){
 const [open,setOpen]=useState(false),copy=content.issue_review.copy,result=issueResult(content,state,issue.id);
 return <li class={['Support','Oppose','Both'].includes(result.presence)?'accepted':''}><button class="link" onClick={()=>jump(issue.id)}>{issue.title}</button><span class="answer">{copy.presenceLabels[result.presence]}</span>{result.presence==='Both'&&<p class="status">{copy.issueStrengthLabel}: {result.strength?copy.strengthLabels[result.strength]:'Not yet judged'}</p>}{(!pageComplete(content,state,issue.id)||result.presence==='Pending')&&<p class="status">{copy.pendingSummary}</p>}<details onToggle={event=>setOpen(event.currentTarget.open)}><summary>{copy.issueReadings}</summary>{open&&<IssueReadings content={content} state={state} issue={issue} jump={jump} HTML={HTML}/>}</details></li>;
}
export function IssueSummary({content,state,value,act,jump,HTML,next,back,last,backLabel='Back',nextLabel}){
 const copy=content.issue_review.copy,context=content.values.find(v=>v.id===value),result=valueResult(content,state,value),issues=content.issue_review.issues.filter(i=>i.value_id===value),saved=state.comparisons[value],current=saved?.basis===comparisonBasis(content,state,value),bill=billFor(content,context);
 return <section><p class="eyebrow">{bill.bill} · {copy.issueSummaryHeading}</p><h1>{context.name}</h1><p><strong>Initial outcome: {result.outcome}</strong></p><p>{copy.allConsequencesGuide}</p>
  {result.unresolved.length>0&&<div class="notice" role="status"><p>{copy.pendingSummary}</p><ul>{result.unresolved.map(id=><li key={id}><button class="link" onClick={()=>jump(id)}>{issues.find(i=>i.id===id).title}</button></li>)}</ul></div>}
  <ul class="summary-list">{issues.map(issue=><SummaryIssue key={issue.id} content={content} state={state} issue={issue} jump={jump} HTML={HTML}/>)}</ul>
  {['support','oppose'].filter(direction=>result[direction]==='no').map(direction=><div class="notes" key={direction}><p>Before a final No: <a href={context.source_url} target="_blank" rel="noopener">review the bill and evidence</a>.</p><label>Optional omitted reason to {direction} {bill.bill}<textarea maxLength={4000} value={state.omissions[`${value}:${direction}`]?.text??''} onInput={event=>act({type:'omission',value,direction,text:event.currentTarget.value})}/></label><p class="status">This is recorded separately from the frozen arguments.</p></div>)}
  {copy.summaryDefaults?.[result.outcome.toLowerCase()]&&<p>{copy.summaryDefaults[result.outcome.toLowerCase()]}</p>}{result.outcome==='Neither'&&copy.summaryDefaults?.Neither&&<p>{copy.summaryDefaults.Neither}</p>}
  {result.outcome==='Both'&&<section class="judgment"><IssueEvidence content={content} argumentIds={includedArguments(content,state,value)} HTML={HTML}/><fieldset><legend>{copy.valueStrengthQuestion}</legend>{saved&&!current&&<p class="notice">The judgments changed. The earlier comparison is retained; choose again.</p>}<div class="choices">{strengths.map(answer=><label class="choice" key={answer}><input type="radio" name="strength" checked={current&&saved.answer===answer} onChange={()=>act({type:'comparison',value,answer,notes:state.comparisonNotes[value]??saved?.notes??''})}/>{copy.strengthLabels[answer]}</label>)}</div></fieldset><label>Optional comparison notes<textarea maxLength={2000} value={state.comparisonNotes[value]??saved?.notes??''} onInput={event=>act({type:'comparisonNotes',value,notes:event.currentTarget.value})}/></label><p class="status">Current comparison: {copy.strengthLabels[strengthResult(content,state,value)]}</p></section>}
  <nav class="navigation"><button onClick={back}>{backLabel}</button><button class="primary" onClick={next}>{nextLabel??(last?'Finish this value':'Save and continue')}</button></nav>{state.summaryCompleted[value]===comparisonBasis(content,state,value)&&<p class="status">Value summary completed.</p>}
  {content.values.every(v=>state.summaryCompleted[v.id]===comparisonBasis(content,state,v.id))&&<p class="notice" role="status">All {content.values.length} value summaries are complete. Wait for “Saved to server” before closing. You can return to review or export your response.</p>}
 </section>;
}
export function IssueGuide({content,continueToBill}){
 const copy=content.issue_review.copy;
 return <section><h1>{copy.appTitle}</h1>{copy.guideParagraphs.map((paragraph,index)=><p key={index}>{paragraph.replaceAll('{bill}',content.bills[0].bill)}</p>)}<nav class="navigation"><button class="primary" onClick={continueToBill}>Continue to bill overview</button></nav></section>;
}
export function IssueConflict({content,server,draft}){
 const copy=content.issue_review.copy;
 const strength=x=>x?.strength?` · ${copy.issueStrengthLabel}: ${copy.strengthLabels[x.strength]}`:'';
 return <ul>{Object.keys({...server.issueJudgments,...draft.issueJudgments,...server.issueNotes,...draft.issueNotes}).filter(id=>JSON.stringify([server.issueJudgments?.[id],server.issueNotes?.[id]])!==JSON.stringify([draft.issueJudgments?.[id],draft.issueNotes?.[id]])).map(id=><li key={id}>{id} · {copy.presenceLabel}<p>Server: {copy.presenceLabels[server.issueJudgments?.[id]?.presence]??copy.presenceLabels.Pending}{strength(server.issueJudgments?.[id])}</p><p>Draft: {copy.presenceLabels[draft.issueJudgments?.[id]?.presence]??copy.presenceLabels.Pending}{strength(draft.issueJudgments?.[id])}</p><p>Server notes: {server.issueNotes?.[id]??server.issueJudgments?.[id]?.notes??'(blank)'}</p><p>Draft notes: {draft.issueNotes?.[id]??draft.issueJudgments?.[id]?.notes??'(blank)'}</p></li>)}</ul>;
}
