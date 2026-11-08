import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {stable,invariant,validateContent,judgedClaims,claimAncestors} from './src/core.mjs';

export const issueVersion='s1582-issues-20261108-v1';
export const issueProcedureRevision='issue-review-20261108-v1';
export const issueBill='119_S_1582';
const sha=value=>createHash('sha256').update(value).digest('hex');
export const issueCopyKeys=['appTitle','welcomeTitle','welcomeBody','guideParagraphs','issueType','presenceQuestion','strengthQuestion','presenceLabels','strengthLabels','noSide','blockedSide','pathOpen','pathBlocked','pathUnknown','pathUnresolved','earlierPresence','reassessIssue','issueProgress','issueSummaryHeading','pendingSummary','issueStrengthGuide','allConsequencesGuide','valueStrengthQuestion','issueReadings','originalReadings','sharedContext','presenceLabel','issueStrengthLabel'];
export function assembleIssueContent(sourceBytes,map,copy){
 const source=JSON.parse(sourceBytes),sourceHash=sha(sourceBytes),argumentsForBill=source.arguments.filter(a=>a.bill_id===issueBill),values=source.values.filter(v=>v.bill_id===issueBill),claimIds=new Set(source.claims.filter(c=>c.bill_id===issueBill).map(c=>c.id)),ids=argumentsForBill.map(a=>a.id);
 invariant(map.schema_version===1&&map.bill_id===issueBill,'Unsupported issue map.');
 invariant(map.source_content_id===source.release.content_id&&map.source_sha256===sourceHash,'The issue map does not match the exact canonical release bytes.');
 invariant(Array.isArray(map.issues)&&map.issues.length>0&&new Set(map.issues.map(i=>i.id)).size===map.issues.length,'Missing or duplicate issue IDs.');
 for(const issue of map.issues){
  invariant(values.some(v=>v.id===issue.value_id)&&new RegExp(`^S1582_${issue.value_id}_I[0-9]{2}$`).test(issue.id),'Invalid issue identity or value.');
  invariant(['title','introduction','grouping_rationale'].every(key=>typeof issue[key]==='string'&&issue[key].trim()),`${issue.id}: incomplete reviewed issue wording.`);
  invariant(Array.isArray(issue.argument_ids)&&issue.argument_ids.length>0&&issue.argument_ids.every(id=>argumentsForBill.some(a=>a.id===id&&a.value_id===issue.value_id)),`${issue.id}: an issue crosses values or references an unknown argument.`);
 }
 const covered=map.issues.flatMap(i=>i.argument_ids);
 invariant(covered.length===ids.length&&new Set(covered).size===ids.length&&ids.every(id=>covered.includes(id)),'The issue map must include every active S.1582 argument exactly once.');
 invariant(values.every(v=>map.issues.some(i=>i.value_id===v.id)),'The issue map must cover all six values.');
 invariant(issueCopyKeys.every(key=>copy[key]!==undefined),'Reviewed issue interface copy is incomplete.');
 invariant(Array.isArray(copy.guideParagraphs)&&copy.guideParagraphs.length&&copy.guideParagraphs.every(p=>typeof p==='string'&&p.trim()),'The issue guide is missing.');
 for(const key of issueCopyKeys.filter(key=>!['guideParagraphs','presenceLabels','strengthLabels'].includes(key)))invariant(typeof copy[key]==='string'&&copy[key].trim(),`Missing reviewed issue copy: ${key}.`);
 invariant(['Support','Oppose','Both','Neither','Pending'].every(key=>typeof copy.presenceLabels[key]==='string'&&copy.presenceLabels[key].trim())&&['support','oppose','Pending'].every(key=>typeof copy.strengthLabels[key]==='string'&&copy.strengthLabels[key].trim()),'Issue answer labels are incomplete.');
 const mapHash=sha(stable(map)),copyHash=sha(stable(copy));
 const content={...structuredClone(source),version:issueVersion,bills:source.bills.filter(b=>b.id===issueBill),values,arguments:argumentsForBill,claims:source.claims.filter(c=>claimIds.has(c.id)),catalog:source.catalog.filter(n=>n.bill_id===issueBill),expected_counts:{active:79,historical:85}};
 delete content.workflow;
 content.procedure={...source.procedure,revision:issueProcedureRevision,base_content_version:issueVersion,previous_revisions:[],background:source.procedure.background.filter(f=>claimIds.has(f.id)),retained_questions:source.procedure.retained_questions.filter(q=>claimIds.has(q.id))};
 content.evidence_placement={...source.evidence_placement,nodes:Object.fromEntries(Object.entries(source.evidence_placement.nodes).filter(([id])=>claimIds.has(id)||ids.includes(id)))};
 const basisIds=Object.fromEntries(map.issues.map(issue=>{
  const argumentsForIssue=argumentsForBill.filter(a=>issue.argument_ids.includes(a.id)),ancestors=[...new Set(argumentsForIssue.flatMap(a=>claimAncestors(content,a.id)))].sort();
  return [issue.id,sha(stable({issue,arguments:argumentsForIssue,claims:content.claims.filter(c=>ancestors.includes(c.id)),background:content.procedure.background.filter(f=>ancestors.includes(f.id)),evidence:Object.fromEntries([...issue.argument_ids,...ancestors].map(id=>[id,content.evidence_placement.nodes[id]]))}))];
 }));
 content.issue_review={schema_version:1,bill_id:issueBill,source_content_id:map.source_content_id,source_sha256:sourceHash,map_sha256:mapHash,copy_sha256:copyHash,basis_ids:basisIds,issues:structuredClone(map.issues),copy:structuredClone(copy)};
 content.provenance={...source.provenance,issue_source:{content_id:map.source_content_id,sha256:sourceHash,map_sha256:mapHash,copy_sha256:copyHash}};
 content.release={content_id:`s1582-issues-${sha(stable({sourceHash,mapHash,copyHash})).slice(0,20)}`,procedure_id:`issue-procedure-${sha(stable(content.procedure)).slice(0,20)}`,mapping_id:`issue-mapping-${mapHash.slice(0,20)}`,record_version:issueVersion,classification:'separate_issue_review_pilot',node_revisions:Object.fromEntries(Object.entries(source.release.node_revisions).filter(([id])=>claimIds.has(id)||ids.includes(id))),order_argument_ids:ids};
 validateContent(content);
 invariant(content.arguments.length===79&&content.values.length===6&&content.claims.length===25&&stable(judgedClaims(content).map(c=>c.id).sort())===stable(['C03','C11','C19']),'The single-bill pilot coverage changed.');
 return content;
}
export async function loadIssueContent(){
 const [source,map,copy]=await Promise.all(['release/content.json','issues/issue-map.json','issues/ui-copy.json'].map(path=>readFile(new URL(path,import.meta.url))));
 return assembleIssueContent(source,JSON.parse(map),JSON.parse(copy));
}
