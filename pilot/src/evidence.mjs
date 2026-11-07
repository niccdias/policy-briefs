import {claimAncestors,invariant,nodes} from './core.mjs';

export const hiddenUsageSentences=[
 ' Each argument adds its own group: poor and rural areas, local firms and farms, or ministry lenders.',
 ' This claim is used on both sides: some arguments want more monitoring to find crime, and one fears it exposes private ties.'
];
export function displayBackground(node){return hiddenUsageSentences.reduce((html,sentence)=>html.replace(sentence,''),node.background_html??'');}

// The reviewed wording stays frozen. This overlay changes where its evidence is read.
export function assembleEvidence(content,review){
 invariant(review.base_content_version===content.version,'Evidence placement has a different frozen version.');
 const all=nodes(content),byId=new Map(all.map(n=>[n.id,n]));
 const result={revision:review.revision,nodes:Object.fromEntries(all.map(n=>[n.id,{support:[],response:[],strength:[]}]))};
 const covered=new Set();
 for(const note of review.notes){
  invariant(note.fragments.map(f=>f.body_html).join('')===note.source_body_html,`${note.id}: evidence text was dropped.`);
  for(const use of note.uses){
   const node=byId.get(use.node),paragraphs=node?.notes_html.match(/<p>[\s\S]*?<\/p>/g)??[];
   invariant(paragraphs[use.index],`${note.id}: missing original note.`);
   const key=`${use.node}:${use.index}`;
   invariant(!covered.has(key),`${key}: duplicate evidence placement.`);covered.add(key);
   // Citation labels can differ across briefs. Preserve each occurrence's source links.
   const body=paragraphs[use.index].replace(/^<p>(?:<strong>(?:Evidence note|Brief context note):<\/strong>\s*)?/,'').replace(/<\/p>$/,'');
   const links=body.match(/\s*<span class="note-sources">[\s\S]*<\/span>$/)?.[0]??'';
   invariant(body.slice(0,body.length-links.length)===note.source_body_html,`${key}: original evidence changed.`);
   for(const fragment of note.fragments){
    const destination=fragment.overrides[use.node]??fragment.destination;
    invariant(['support','response','strength','audit'].includes(destination),`${key}: unknown evidence destination.`);
    if(destination==='audit')continue;
    invariant(!(destination==='response'&&node.no_point_specific_con),`${key}: placement would invent a CON.`);
    result.nodes[use.node][destination].push({id:fragment.id,html:`<p>${fragment.display_body_html??fragment.body_html}${links}</p>`,inherit:fragment.inherit!==false});
   }
  }
 }
 invariant(covered.size===all.reduce((sum,n)=>sum+(n.notes_html.match(/<p>[\s\S]*?<\/p>/g)??[]).length,0),'Some evidence notes have no placement.');
 const gaps=new Set();
 for(const gap of review.gaps){
  const node=byId.get(gap.node),key=`${gap.node}:${gap.index}`;
  invariant(!gaps.has(key)&&node?.gaps[gap.index]?.explanation===gap.explanation,`${key}: gap placement does not match the frozen text.`);gaps.add(key);
  invariant(['support','response','strength','audit'].includes(gap.destination),`${key}: invalid gap destination.`);
  if(gap.destination!=='audit'){
   invariant(!(gap.destination==='response'&&node.no_point_specific_con),`${key}: gap would invent a CON.`);
   const escaped=gap.display_text.replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
   result.nodes[gap.node][gap.destination].push({id:`gap:${key}`,html:`<p>${escaped}</p>`,inherit:false});
  }
 }
 invariant(gaps.size===all.reduce((sum,n)=>sum+(n.gaps?.length??0),0),'Some evidence gaps have no placement.');
 for(const edit of review.body_edits){
  const node=byId.get(edit.node),reading=result.nodes[edit.node];
  invariant(node&&node[edit.field].includes(edit.before),`${edit.node}: evidence routing edit no longer matches.`);
  const field=reading[edit.field]??node[edit.field];
  invariant(field.includes(edit.before),`${edit.node}: overlapping evidence routing edits.`);
  reading[edit.field]=field.replace(edit.before,edit.after);
 }
 return result;
}

export function readingHTML(content,node,side,seen){
 const field=side==='support'?(node.value_id?'pro_html':'support_html'):(node.value_id?'con_html':'objection_html');
 const reading=content.evidence_placement.nodes[node.id];
 const additions=reading[side].filter(item=>{if(seen?.has(item.id))return false;seen?.add(item.id);return true;});
 return (reading[field]??node[field]) + additions.map(item=>item.html).join('');
}

export function strengthEvidence(content,argumentIds){
 const items=new Map();
 for(const id of argumentIds){
  for(const nodeId of [id,...claimAncestors(content,id)]){
   for(const item of content.evidence_placement.nodes[nodeId].strength){
    if(nodeId!==id&&!item.inherit)continue;
    if(!items.has(item.id))items.set(item.id,{...item,arguments:[]});
    if(!items.get(item.id).arguments.includes(id))items.get(item.id).arguments.push(id);
   }
  }
 }
 return [...items.values()];
}
