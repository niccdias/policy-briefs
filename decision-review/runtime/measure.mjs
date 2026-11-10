import assert from 'node:assert/strict';
import {plainText} from './source.mjs';
import {createState,nextDecision,answerDecision,derivedResults,saveComparison,completion,navigate} from './model.mjs';
import {renderDecision,renderResults,renderShell} from './app.js';

// Count default-open content, including prompts and reminders, but not source disclosures.
export function visibleText(html,{excludeClasses=[]}={}){
 const stack=[];let output='',position=0;
 for(const match of html.matchAll(/<\/?([a-z][a-z0-9]*)\b[^>]*>/gi)){
  const visible=()=>stack.at(-1)?.visible??true;
  if(visible())output+=' '+html.slice(position,match.index);position=match.index+match[0].length;
  const tag=match[1].toLowerCase(),closing=match[0].startsWith('</');
  if(closing){const index=stack.map(item=>item.tag).lastIndexOf(tag);if(index>=0)stack.splice(index);continue;}
  const parent=stack.at(-1);let show=visible();
  if(tag==='summary'&&parent?.tag==='details'&&parent.closed)show=parent.outerVisible;
  if(tag==='details'){const closed=!/\sopen(?:\s|>|=)/i.test(match[0]);stack.push({tag,visible:show&&!closed,closed,outerVisible:show});}
  else if(!['input','br','hr','meta','link','img'].includes(tag)){
   const classes=(match[0].match(/\bclass=["']([^"']*)["']/i)?.[1]??'').split(/\s+/);
   stack.push({tag,visible:show&&!classes.some(name=>excludeClasses.includes(name))&&!/\shidden(?:\s|>|=)/i.test(match[0])&&!['script','style'].includes(tag)});
  }
 }
 if(stack.at(-1)?.visible??true)output+=' '+html.slice(position);
 return plainText(output);
}
export const words=(html,options)=>(visibleText(html,options).match(/[\p{L}\p{N}]+(?:['’\-][\p{L}\p{N}]+)*/gu)??[]).length;

export function measurePath(model,release,{name='path',choose=()=> 'Yes'}={}){
 let state=createState(model,release,'benchmark_'+name,'2026-11-09T00:00:00.000Z');state=navigate(model,state,{page:'review',decision_id:null,anchor:'reading'},state.updated_at);const visited=[],contextIds=new Set(),blockIds=new Set();let referenceWords=0;
 const countReferences=()=>{const shell=renderShell(model,state,'review',release,{writable:true}),aside=shell.match(/<aside\b[\s\S]*?<\/aside>/)?.[0];assert(aside,'The rendered reference panel is missing.');return words(aside,{excludeClasses:['bill-context']});};
 for(let guard=0;guard<=model.nodes.size;guard++){
  const node=nextDecision(model,state);if(!node)break;
  assert(!visited.some(item=>item.id===node.id),'An unchanged path asks the same decision twice.');
  const html=renderDecision(model,state,node.id,'review',true),answer=choose(node);referenceWords+=countReferences();
  visited.push({id:node.id,kind:node.kind,answer,default_visible_words:words(html)});
  for(const match of html.matchAll(/data-context-id="([^"]+)"/g))contextIds.add(match[1]);for(const id of node.block_ids)blockIds.add(id);
  state=answerDecision(model,state,node.id,answer,state.updated_at);
 }
 assert.equal(nextDecision(model,state),null,'The simulation left a required decision unresolved.');
 const results=derivedResults(model,state),both=[...results].filter(([,result])=>result.presence==='Both').map(([id])=>id),resultPanels=[];
 for(const id of both){const html=renderResults(model,state,'review',true);referenceWords+=countReferences();assert(html.includes('data-active-comparison-value="'+id+'"'),'Comparison traversal and rendered active value differ.');resultPanels.push({value_id:id,default_visible_words:words(html)});state=saveComparison(model,state,id,'support',state.updated_at);}
 resultPanels.push({value_id:null,default_visible_words:words(renderResults(model,state,'review',true))});
 const resultWords=resultPanels.reduce((sum,panel)=>sum+panel.default_visible_words,0),activeWords=visited.reduce((sum,item)=>sum+item.default_visible_words,0),panelWords=activeWords+resultWords;
 assert(completion(model,state).complete,'The completed path still requires a judgment.');
 return {decisions:visited.length,causal_decisions:visited.filter(item=>item.kind==='causal').length,value_link_decisions:visited.filter(item=>item.kind==='value').length,overall_comparisons:both.length,total_judgments:visited.length+both.length,decisions_skipped:model.nodes.size-visited.length,active_decision_words:activeWords,result_panel_words:resultWords,required_panel_words:panelWords,value_reference_words_presented:referenceWords,presented_main_and_value_reference_words:panelWords+referenceWords,largest_decision_words:Math.max(...visited.map(item=>item.default_visible_words),0),distinct_contexts:contextIds.size,distinct_evidence_blocks:blockIds.size,value_results:Object.fromEntries([...results].map(([id,result])=>[id,result.presence])),result_panels:resultPanels,visited};
}

export function measurePaths(model,release){
 const targets=[...model.nodes.values()].filter(node=>node.kind==='causal'&&node.routes.every(route=>route.requires.length===0)).map(node=>node.id);
 const scenarios={all_yes:measurePath(model,release,{name:'all_yes'}),all_no:measurePath(model,release,{name:'all_no',choose:()=> 'No'})};
 for(const [index,target] of targets.entries())scenarios[target+'_no']=measurePath(model,release,{name:'root_'+index+'_no',choose:node=>node.id===target?'No':'Yes'});
 for(const result of Object.values(scenarios)){result.judgments_saved_vs_all_yes=scenarios.all_yes.total_judgments-result.total_judgments;result.panel_words_saved_vs_all_yes=scenarios.all_yes.required_panel_words-result.required_panel_words;result.main_and_reference_words_saved_vs_all_yes=scenarios.all_yes.presented_main_and_value_reference_words-result.presented_main_and_value_reference_words;}
 return {schema_version:1,release,method:{assignment:'One reviewer completes the whole bill in one session.',counting:'Count each default-visible occurrence in active decision panels, every sequential final-comparison panel and the completed overview, including claims, essential evidence, challenges, qualifications, premises, reminders and question controls. Exclude the fixed reference sidebar, answered trail, session/navigation chrome and closed source/original disclosures. Exact reference profiles at local value questions and full value definitions/profiles at final comparisons are counted from the rendered sidebar separately; local goals are already included in main content. Also report the full value definitions/profiles once for the bill.',counter:'Unicode letter/number words; internal apostrophes and hyphens retained.',comparisons:'All surviving Both values receive Pending solely to finish synthetic paths; these are not substantive reviewer records.',limits:'Presented text and response counts, not measured human reading, comprehension or time.'},value_reference_words_once:model.sourceIndex.source.values.reduce((sum,value)=>sum+words([value.name,...value.statements,value.reference].join(' ')),0),targets,scenarios,human_workload_tested:false};
}
