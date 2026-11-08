import test from 'node:test';
import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {assembleIssueContent,issueCopyKeys,issueVersion} from '../assemble-issues.mjs';
import * as issues from '../src/issues.mjs';
import * as legacy from '../src/core.mjs';
import {makeReviewIndex,reviewRows,filterReviewRows,reviewFilters,newReviewView,readReviewView,reviewKey} from '../src/review.mjs';
import {keepDraft,readDraft,clearDraft,draftKey} from '../src/storage.mjs';

import {fixture} from './issue-fixture.mjs';

const judge=(c,s,id,presence,strength)=>issues.editState(c,s,{type:'issueJudgment',id,presence,...(presence==='Both'?{strength}:{}),notes:''});
const claim=(c,s,id,answer)=>issues.editState(c,s,{type:'judgment',id,answer});
const complete=(c,s,id)=>issues.editState(c,s,{type:'issueComplete',id});

test('issue presence is a separate five-way judgment and does not manufacture argument votes',()=>{
 const c=fixture();assert.ok(issues.validateContent(c));let s=issues.newState(c,12);
 assert.equal(issues.issueResult(c,s,'I').presence,'Pending');assert.equal(issues.issueResult(c,s,'I').origin,'unanswered');
 for(const presence of issues.presences){s=judge(c,s,'I',presence,presence==='Both'?'Pending':undefined);assert.equal(issues.issueResult(c,s,'I').presence,presence);}
 assert.deepEqual(s.judgments,{});assert.equal(legacy.effective(c,s,'A').answer,null);assert.equal(issues.valueResult(c,s,'V').outcome,'Pending');
 assert.throws(()=>issues.editState(c,s,{type:'judgment',id:'A',answer:'yes'}),/no per-argument/);
 assert.throws(()=>issues.editState(c,s,{type:'issueJudgment',id:'I',presence:'Neither',strength:'support'}),/only available when you choose Both/);
 assert.ok(issues.validateState(c,JSON.parse(JSON.stringify(s))));
});
test('AND/OR/unknown routes gate sides without automatic Yes or false rejection',()=>{
 const c=fixture();let s=issues.newState(c,4);
 assert.equal(issues.argumentRoutes(c,s,c.arguments[0])[0].status,'unknown');
 s=claim(c,s,'C1','no');assert.equal(issues.availableSides(c,s,c.issue_review.issues[0]).support.available,false);
 assert.equal(issues.availableSides(c,s,c.issue_review.issues[0]).oppose.available,true);
 assert.throws(()=>judge(c,s,'I','Both','support'),/path that can give a reason/);
 s=judge(c,s,'I','Oppose');assert.equal(issues.issueResult(c,s,'I').presence,'Oppose');
 assert.equal(issues.availableSides(c,s,c.issue_review.issues[1]).support.available,true,'The independent local alternative survives.');
 s=claim(c,s,'C2','no');assert.equal(issues.availableSides(c,s,c.issue_review.issues[0]).oppose.available,false);assert.equal(issues.issueResult(c,s,'I').presence,'Pending');
 assert.throws(()=>judge(c,s,'I','Oppose'),/path that can give a reason/);s=judge(c,s,'I','Neither');assert.equal(issues.issueResult(c,s,'I').presence,'Neither');
 s=claim(c,s,'C1','yes');s=claim(c,s,'C2','yes');assert.equal(issues.issueResult(c,s,'I').presence,'Pending','Accepted premises never create an issue answer.');assert.equal(s.issueJudgments.I.presence,'Neither');
});
test('one-sided and multiple-member issues preserve their actual members',()=>{
 const c=fixture();c.issue_review.issues[0].argument_ids.push('ALT');c.issue_review.issues[1].argument_ids=['E'];assert.ok(issues.validateContent(c));
 let s=issues.newState(c,4);s=judge(c,s,'K','Support');assert.equal(issues.valueResult(c,s,'W').outcome,'Support');
 assert.throws(()=>judge(c,s,'K','Both','Pending'),/path that can give a reason/);assert.throws(()=>judge(c,s,'K','Oppose'),/path that can give a reason/);
 s=claim(c,s,'C1','no');assert.equal(issues.availableSides(c,s,c.issue_review.issues[0]).support.available,true);s=judge(c,s,'I','Both','oppose');assert.equal(issues.issueResult(c,s,'I').presence,'Both');
});
test('shared edits reopen only related decisions and preserve earlier answers, order and comparisons',()=>{
 const c=fixture();let s=issues.newState(c,91);s=claim(c,s,'C1','yes');s=claim(c,s,'C2','yes');
 for(const [id,presence,strength] of [['I','Both','support'],['J','Neither'],['K','Support']]){s=judge(c,s,id,presence,strength);s=complete(c,s,id);}
 s=issues.editState(c,s,{type:'comparison',value:'V',answer:'oppose'});s=issues.editState(c,s,{type:'summary',value:'V'});s=issues.editState(c,s,{type:'summary',value:'W'});
 const before=structuredClone(s);s=claim(c,s,'C2','no');
 assert.equal(issues.issueResult(c,s,'I').presence,'Pending');assert.equal(issues.issueResult(c,s,'J').presence,'Neither');assert.equal(issues.issueResult(c,s,'K').presence,'Support');
 assert.equal(issues.pageComplete(c,s,'I'),false);assert.equal(issues.pageComplete(c,s,'J'),true);assert.equal(issues.strengthResult(c,s,'V'),'Pending');
 assert.deepEqual(s.issueJudgments,before.issueJudgments);assert.deepEqual(s.issueCompleted,before.issueCompleted);assert.deepEqual(s.comparisons,before.comparisons);assert.deepEqual(s.order,before.order);
 assert.equal(s.summaryCompleted.W,issues.comparisonBasis(c,s,'W'));assert.notEqual(s.summaryCompleted.V,issues.comparisonBasis(c,s,'V'));
 assert.ok(s.history.some(event=>event.action.type==='issueJudgment'));assert.ok(issues.validateState(c,s));
 s=claim(c,s,'C2','yes');assert.equal(issues.issueResult(c,s,'I').origin,'reassess');
 const changed=structuredClone(c);changed.arguments[0].paths[0].requires=['C1'];assert.notEqual(issues.issueBasis(changed,s,'I'),issues.issueBasis(c,s,'I'));assert.equal(issues.issueBasis(changed,s,'J'),issues.issueBasis(c,s,'J'));
});
test('Pending is retained as unresolved and Both requires an explicit within-issue comparison',()=>{
 const c=fixture();let s=issues.newState(c,5);s=judge(c,s,'I','Both');assert.throws(()=>complete(c,s,'I'),/stronger reason on this issue/);
 s=judge(c,s,'I','Both','Pending');s=complete(c,s,'I');s=judge(c,s,'J','Pending');s=complete(c,s,'J');
 assert.equal(issues.pageComplete(c,s,'J'),true);assert.equal(issues.valueResult(c,s,'V').support,'yes');assert.equal(issues.valueResult(c,s,'V').oppose,'yes');assert.equal(issues.valueResult(c,s,'V').outcome,'Both');
 assert.deepEqual(issues.valueResult(c,s,'V').unresolved,['J']);assert.equal(issues.strengthResult(c,s,'V'),'Pending');
 assert.throws(()=>issues.editState(c,s,{type:'summary',value:'V'}),/Choose a comparison/);
 s=issues.editState(c,s,{type:'comparison',value:'V',answer:'Pending'});s=issues.editState(c,s,{type:'summary',value:'V'});assert.equal(s.summaryCompleted.V,issues.comparisonBasis(c,s,'V'));
});
test('completed Pending issues allow a completed Pending value without implying absence',()=>{
 const c=fixture();let s=issues.newState(c,52);
 for(const id of ['I','J']){s=judge(c,s,id,'Pending');s=complete(c,s,id);}
 assert.deepEqual(issues.valueResult(c,s,'V'),{unresolved:['I','J'],support:null,oppose:null,outcome:'Pending'});
 s=issues.editState(c,s,{type:'summary',value:'V'});assert.equal(s.summaryCompleted.V,issues.comparisonBasis(c,s,'V'));assert.equal(s.comparisons.V,undefined);
 assert.ok(issues.validateState(c,JSON.parse(JSON.stringify(s))));
});
test('unanswered and stale issues still block value completion while direct Pending is retained',()=>{
 const c=fixture();let s=issues.newState(c,53);
 assert.throws(()=>issues.editState(c,s,{type:'summary',value:'V'}),/Review every issue/);
 s=judge(c,s,'I','Pending');s=complete(c,s,'I');s=judge(c,s,'J','Pending');
 assert.throws(()=>issues.editState(c,s,{type:'summary',value:'V'}),/Review every issue/);
 s=complete(c,s,'J');s=issues.editState(c,s,{type:'summary',value:'V'});const earlier=s.summaryCompleted.V;
 s=claim(c,s,'C1','yes');assert.equal(s.issueJudgments.I.presence,'Pending');assert.equal(issues.pageComplete(c,s,'I'),false);assert.notEqual(earlier,issues.comparisonBasis(c,s,'V'));
 assert.throws(()=>issues.editState(c,s,{type:'summary',value:'V'}),/Review every issue/);
});
test('known reasons in both directions plus explicit Pending require a human value comparison and reopen after edits',()=>{
 const c=fixture();c.issue_review.issues.find(i=>i.id==='K').value_id='V';c.arguments.find(a=>a.id==='U').value_id='V';let s=issues.newState(c,54);
 for(const [id,presence] of [['I','Support'],['J','Oppose'],['K','Pending']]){s=judge(c,s,id,presence);s=complete(c,s,id);}
 assert.deepEqual(issues.valueResult(c,s,'V'),{unresolved:['K'],support:'yes',oppose:'yes',outcome:'Both'});assert.equal(s.comparisons.V,undefined);
 assert.throws(()=>issues.editState(c,s,{type:'summary',value:'V'}),/Choose a comparison/);
 s=issues.editState(c,s,{type:'comparison',value:'V',answer:'oppose'});s=issues.editState(c,s,{type:'summary',value:'V'});const saved=structuredClone(s);
 s=judge(c,s,'K','Neither');s=complete(c,s,'K');assert.equal(issues.valueResult(c,s,'V').outcome,'Both');assert.equal(issues.strengthResult(c,s,'V'),'Pending');assert.deepEqual(s.comparisons,saved.comparisons);assert.deepEqual(s.summaryCompleted,saved.summaryCompleted);assert.notEqual(s.summaryCompleted.V,issues.comparisonBasis(c,s,'V'));
 assert.throws(()=>issues.editState(c,s,{type:'summary',value:'V'}),/Choose a comparison/);
});
test('final comparison is human and retains the weaker sides of issue comparisons',()=>{
 const c=fixture();let s=issues.newState(c,7);s=judge(c,s,'I','Both','support');s=judge(c,s,'J','Both','support');
 assert.equal(issues.valueResult(c,s,'V').outcome,'Both');assert.equal(issues.strengthResult(c,s,'V'),'Pending');assert.equal(s.comparisons.V,undefined);
 assert.deepEqual(issues.includedArguments(c,s,'V'),['A','B','ALT','E']);
 s=issues.editState(c,s,{type:'comparison',value:'V',answer:'oppose',notes:'All distinct synthetic effects considered.'});assert.equal(issues.strengthResult(c,s,'V'),'oppose');
 s=judge(c,s,'I','Both','oppose');assert.equal(issues.strengthResult(c,s,'V'),'Pending');assert.equal(s.comparisons.V.answer,'oppose');
});
test('issue search, filters and saved review target preserve position and state',()=>{
 const c=fixture(),index=makeReviewIndex(c,html=>html.replace(/<[^>]+>/g,' '));let s=issues.newState(c,8);s=judge(c,s,'I','Both','Pending');s=issues.editState(c,s,{type:'issueNotes',id:'I',notes:'Follow up on unique estimate'});
 const before=JSON.stringify(s),rows=reviewRows(c,s,index),filtered=filterReviewRows(rows,{...reviewFilters,type:'issue',status:'Both',query:'unique estimate'});
 assert.deepEqual(filtered.map(row=>row.id),['I']);assert.equal(index.has('A'),false);assert.equal(rows.find(row=>row.id==='I').strength,'Pending');
 assert.deepEqual(filterReviewRows(rows,{...reviewFilters,scope:'all',type:'issue',query:'Response B.'}).map(row=>row.id),['I']);
 const view={...newReviewView(),open:true,target:'I',focus:'I',filters:{...reviewFilters,type:'issue',query:'estimate'},scroll:123};assert.deepEqual(readReviewView(JSON.stringify(view),c,s),view);
 assert.throws(()=>readReviewView(JSON.stringify({...view,target:'A'}),c,s),/Invalid review/);assert.equal(JSON.stringify(s),before);
 s=issues.editState(c,s,{type:'issueNotes',id:'I',notes:'Changed note'});assert.equal(s.cursor,JSON.parse(before).cursor);assert.deepEqual(s.order,JSON.parse(before).order);
});
test('exports are issue-level and close/return drafts remain account/session isolated',()=>{
 const c=fixture();let s=judge(c,issues.newState(c,4),'I','Both','Pending');s=issues.editState(c,s,{type:'issueNotes',id:'I',notes:'Comma, quote " and newline\n.'});
 const csv=issues.csvExport(c,s);assert.ok(csv.includes('"I","issue","V","A|B","Both","Both","Pending","Pending"'));assert.ok(!csv.includes('"A","argument"'));assert.ok(!csv.includes('direct_answer'));assert.ok(csv.includes('Comma, quote ""'));
 const json=JSON.parse(JSON.stringify(s));assert.deepEqual(issues.validateState(c,json),s);assert.deepEqual(json.judgments,{});
 const storage=new Map();globalThis.localStorage={setItem:(key,value)=>storage.set(key,value),getItem:key=>storage.get(key)??null,removeItem:key=>storage.delete(key)};
 try{keepDraft('one',`${c.version}--qa`,3,s);assert.deepEqual(readDraft('one',`${c.version}--qa`).state,s);assert.equal(readDraft('two',`${c.version}--qa`),null);assert.equal(readDraft('one',`${c.version}--research`),null);assert.notEqual(draftKey('one','legacy--qa'),draftKey('one',`${c.version}--qa`));assert.notEqual(reviewKey('one','legacy--qa'),reviewKey('one',`${c.version}--qa`));clearDraft('one',`${c.version}--qa`);assert.equal(storage.size,0);}finally{delete globalThis.localStorage;}
 assert.throws(()=>issues.validateState(c,legacy.newState(c,4)),/not an issue-review/);assert.throws(()=>issues.validateState(c,{...s,judgments:{A:{answer:'yes',revision:1}}}),/per-argument/);
});

const sourceBytes=await readFile(new URL('../release/content.json',import.meta.url)),source=JSON.parse(sourceBytes);
const draftCopy=Object.fromEntries(issueCopyKeys.map(key=>[key,`SYNTHETIC ${key}`]));draftCopy.guideParagraphs=['SYNTHETIC guide only'];draftCopy.presenceLabels=Object.fromEntries(issues.presences.map(p=>[p,p]));draftCopy.strengthLabels=Object.fromEntries(issues.strengths.map(p=>[p,p]));
const map={schema_version:1,bill_id:'119_S_1582',source_content_id:source.release.content_id,source_sha256:createHash('sha256').update(sourceBytes).digest('hex'),issues:source.values.filter(v=>v.bill_id==='119_S_1582').map(v=>({id:`S1582_${v.id}_I01`,value_id:v.id,title:'SYNTHETIC issue',introduction:'SYNTHETIC introduction',grouping_rationale:'SYNTHETIC test fixture',argument_ids:source.arguments.filter(a=>a.bill_id==='119_S_1582'&&a.value_id===v.id).map(a=>a.id)}))};

test('derived pilot covers all 79 arguments exactly and preserves every frozen source field',()=>{
 const before=sourceBytes.toString(),c=assembleIssueContent(sourceBytes,map,draftCopy);assert.equal(c.version,issueVersion);assert.ok(issues.validateContent(c));
 assert.equal(c.arguments.length,79);assert.equal(c.claims.length,25);assert.equal(c.values.length,6);assert.equal(c.catalog.length,85);assert.equal(c.workflow,undefined);assert.deepEqual(legacy.judgedClaims(c).map(n=>n.id),['C03','C11','C19']);
 for(const key of ['arguments','claims','values','catalog'])assert.deepEqual(c[key],source[key].filter(n=>n.bill_id==='119_S_1582'));
 for(const [id,evidence] of Object.entries(c.evidence_placement.nodes))assert.deepEqual(evidence,source.evidence_placement.nodes[id]);
 assert.deepEqual(c.procedure.background,source.procedure.background.filter(f=>c.claims.some(claim=>claim.id===f.id)));assert.equal(sourceBytes.toString(),before);
 const s=issues.newState(c,120);assert.ok(issues.validateState(c,s));assert.equal(s.order.length,1+3+c.issue_review.issues.length+6);assert.deepEqual(s.judgments,{});assert.equal(s.migration,undefined);
 const changed=structuredClone(map);changed.issues[0].introduction+=' changed';const updated=assembleIssueContent(sourceBytes,changed,draftCopy);assert.notEqual(updated.issue_review.basis_ids[changed.issues[0].id],c.issue_review.basis_ids[changed.issues[0].id]);assert.equal(updated.issue_review.basis_ids[changed.issues[1].id],c.issue_review.basis_ids[changed.issues[1].id]);
});
test('map coverage and canonical bytes are hard build boundaries',()=>{
 for(const mutate of [m=>m.issues[0].argument_ids.pop(),m=>m.issues[1].argument_ids.push(m.issues[0].argument_ids[0]),m=>m.issues[0].argument_ids.push(m.issues[0].argument_ids[0]),m=>m.issues[0].value_id='TR',m=>m.source_content_id='stale',m=>m.source_sha256='0'.repeat(64)]){const changed=structuredClone(map);mutate(changed);assert.throws(()=>assembleIssueContent(sourceBytes,changed,draftCopy));}
 assert.throws(()=>assembleIssueContent(Buffer.concat([sourceBytes,Buffer.from('\n')]),map,draftCopy),/exact canonical/);assert.throws(()=>assembleIssueContent(sourceBytes,map,{}),/copy is incomplete/);
});

test('common evidence appears once with complete per-use attribution and source links',()=>{
 const c=fixture(),sharedId='same-qualified-evidence',first='<p>A qualification shared by two effects. <span class="note-sources">Sources: <a href="https://example.test/first">[2]</a>.</span></p>',second='<p>A qualification shared by two effects. <span class="note-sources">Sources: <a href="https://example.test/second">[9]</a>.</span></p>';
 c.evidence_placement.nodes.A.support.push({id:sharedId,html:first});c.evidence_placement.nodes.B.response.push({id:sharedId,html:second});
 const result=issues.commonIssueEvidence(c,c.issue_review.issues[0]);assert.equal(result.common.length,1);assert.equal(result.common[0].html,'<p>A qualification shared by two effects.</p>');
 assert.deepEqual(result.common[0].uses.map(use=>[use.id,use.side]),[['A','support'],['B','response']]);assert.ok(result.common[0].uses[0].sources_html.includes('https://example.test/first'));assert.ok(result.common[0].uses[1].sources_html.includes('https://example.test/second'));
 assert.ok(result.suppressed.get('A:support').has(sharedId));assert.ok(result.suppressed.get('B:response').has(sharedId));assert.equal(c.evidence_placement.nodes.A.support[0].html,first);assert.equal(c.evidence_placement.nodes.B.response[0].html,second);
});
test('the actual reviewed map and copy assemble with exact 79-ID coverage and recoverable deduplication',async()=>{
 const {loadIssueContent}=await import('../assemble-issues.mjs'),c=await loadIssueContent();assert.ok(issues.validateContent(c));const s=issues.newState(c,20261108);assert.ok(issues.validateState(c,s));
 assert.equal(new Set(c.issue_review.issues.flatMap(issue=>issue.argument_ids)).size,79);assert.deepEqual(c.arguments,source.arguments.filter(a=>a.bill_id==='119_S_1582'));
 let duplicateUses=0;
 for(const issue of c.issue_review.issues){const result=issues.commonIssueEvidence(c,issue);for(const item of result.common){assert.ok(item.uses.length>1);for(const use of item.uses){const original=c.evidence_placement.nodes[use.id][use.side].find(note=>note.id===item.id);assert.ok(original);assert.equal(item.html.replace(/<\/p>$/,`${use.sources_html}</p>`),original.html);assert.ok(result.suppressed.get(`${use.id}:${use.side}`).has(item.id));duplicateUses++;}}}
 assert.ok(duplicateUses>0);
});
test('unresolved mapping blocks only its actual routes and cannot silently accept a side',()=>{
 const c=fixture();let s=issues.newState(c,17);s.mappingDispositions={C1:{status:'Unresolved',continued:false,note:'Synthetic coordinator question.'}};
 assert.equal(issues.argumentRoutes(c,s,c.arguments[0])[0].status,'unresolved');assert.equal(issues.availableSides(c,s,c.issue_review.issues[0]).support.available,false);assert.equal(issues.availableSides(c,s,c.issue_review.issues[1]).support.available,true);
 assert.throws(()=>judge(c,s,'I','Support'),/path that can give a reason/);s=judge(c,s,'J','Support');assert.equal(issues.issueResult(c,s,'J').presence,'Support');
 s.mappingDispositions.ALT={status:'Unresolved',continued:false,note:'Synthetic argument-map question.'};assert.equal(issues.availableSides(c,s,c.issue_review.issues[1]).support.available,false);assert.equal(issues.issueResult(c,s,'J').presence,'Pending');
});
test('actual background mapping concerns guard direct and ancestor routes while independent OR routes stay viable',async()=>{
 const {loadIssueContent}=await import('../assemble-issues.mjs'),c=await loadIssueContent(),argument=id=>c.arguments.find(a=>a.id===id),isolated=issues.issueFor(c,'S1582_SES_I10');
 for(const disposition of [{status:'Unresolved',continued:false},{status:'Mapping revised',continued:true}]){
  let s=issues.newState(c,1);s=judge(c,s,isolated.id,'Oppose');s=complete(c,s,isolated.id);const earlier=structuredClone(s.issueJudgments[isolated.id]);
  s.mappingDispositions={C01:{...disposition,note:'Synthetic background mapping question.'}};
  assert.equal(legacy.effective(c,s,'C01').origin,'background','Background context is not a reviewer answer.');
  for(const id of ['S1582_SES_oppose_02','S1582_SES_support_10','S1582_UNC_oppose_14','S1582_SES_oppose_09'])assert.ok(issues.argumentRoutes(c,s,argument(id)).every(path=>path.status==='unresolved'),`${id} depends directly or through C24 on C01.`);
  assert.equal(issues.availableSides(c,s,isolated).oppose.available,false);assert.throws(()=>judge(c,s,isolated.id,'Oppose'),/path that can give a reason/);
  assert.equal(issues.issueResult(c,s,isolated.id).presence,'Pending');assert.equal(issues.pageComplete(c,s,isolated.id),false);assert.deepEqual(s.issueJudgments[isolated.id],earlier);
  s=issues.newState(c,2);s.mappingDispositions={C09:{...disposition,note:'Synthetic route-specific mapping question.'}};
  const alternatives=argument('S1582_SES_oppose_04'),owner=c.issue_review.issues.find(issue=>issue.argument_ids.includes(alternatives.id));
  assert.deepEqual(issues.argumentRoutes(c,s,alternatives).map(path=>path.status),['unresolved','open','open','open']);
  assert.equal(issues.availableSides(c,s,owner).oppose.available,true);s=judge(c,s,owner.id,'Oppose');assert.equal(issues.issueResult(c,s,owner.id).presence,'Oppose');
  const unknown=argument('S1582_SES_oppose_05'),unknownOwner=c.issue_review.issues.find(issue=>issue.argument_ids.includes(unknown.id));
  assert.equal(issues.argumentRoutes(c,s,unknown)[0].status,'unknown');assert.equal(issues.availableSides(c,s,unknownOwner).oppose.available,true);
 }
});

test('issue implementation, map and approved copy participate in the publication identity',async()=>{
 const {renderedFiles,identifyRenderedRelease}=await import('../rendered-release.mjs'),{publicationBinding}=await import('../publication-gate.mjs'),{loadIssueContent}=await import('../assemble-issues.mjs');
 const paths=['src/issues.mjs','src/issue-review.mjs','src/issue-ui.jsx','assemble-issues.mjs','issues/issue-map.json','issues/ui-copy.json','issues/REVIEW.md'];
 const binding=await publicationBinding(source);
 for(const path of paths){assert.ok(renderedFiles.includes(path));assert.equal(binding.implementation_sha256[path],createHash('sha256').update(await readFile(new URL(`../${path}`,import.meta.url))).digest('hex'));}
 const c=await loadIssueContent(),identity=await identifyRenderedRelease(c),changed=structuredClone(c);changed.issue_review.copy.presenceQuestion+=' stale change';assert.notEqual((await identifyRenderedRelease(changed)).rendered_id,identity.rendered_id);
 assert.notEqual(c.release.content_id,source.release.content_id);assert.notEqual(c.version,source.version);
});

test('a corrected shared semantic map reopens affected issue decisions without rejecting or rewriting the saved response',()=>{
 const original=assembleIssueContent(sourceBytes,map,draftCopy);let s=issues.newState(original,24);
 for(const issue of original.issue_review.issues){s=judge(original,s,issue.id,'Neither');s=complete(original,s,issue.id);}
 for(const value of original.values)s=issues.editState(original,s,{type:'summary',value:value.id});
 const saved=JSON.stringify(s),correctedSource=structuredClone(source);correctedSource.release.content_id='synthetic-corrected-source';correctedSource.claims.find(c=>c.id==='C11').prerequisite_paths[0].requires=['C12'];correctedSource.procedure.background.find(c=>c.id==='C12').scope_html+='<p>Synthetic revised context qualifier.</p>';
 const changedBytes=Buffer.from(JSON.stringify(correctedSource)),changedMap={...structuredClone(map),source_content_id:correctedSource.release.content_id,source_sha256:createHash('sha256').update(changedBytes).digest('hex')},corrected=assembleIssueContent(changedBytes,changedMap,draftCopy);
 assert.ok(issues.validateState(corrected,s));assert.notEqual(corrected.release.procedure_id,original.release.procedure_id);assert.equal(corrected.procedure.revision,original.procedure.revision);assert.equal(JSON.stringify(s),saved);
 let affected=0,untouched=0;
 for(const issue of original.issue_review.issues){const changed=original.issue_review.basis_ids[issue.id]!==corrected.issue_review.basis_ids[issue.id];assert.equal(issues.issueResult(corrected,s,issue.id).stale,changed);if(changed)affected++;else untouched++;}
 assert.ok(affected>0&&untouched>0);assert.deepEqual(s.issueJudgments,JSON.parse(saved).issueJudgments);assert.deepEqual(s.order,JSON.parse(saved).order);
});
