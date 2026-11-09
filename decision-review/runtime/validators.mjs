import {sourceField,plainText} from './source.mjs';

const check=(condition,message)=>{if(!condition)throw new Error(message);};
const nonempty=value=>typeof value==='string'&&value.trim().length>0;
const isRecord=value=>value!==null&&typeof value==='object'&&!Array.isArray(value)&&Object.getPrototypeOf(value)===Object.prototype;
function exact(record,keys,owner){check(isRecord(record)&&Object.keys(record).sort().join(',')===[...keys].sort().join(','),`Unexpected or missing fields in ${owner}.`);}

export const COPY_KEYS=['title','pilot_notice','reading_intro','reading_mode','review_mode','open_review','open_reading','navigation_label','chapter_label','previous','next','context_label','bill_context_label','bill_version_label','value_definitions_label','reference_profile_label','considerations_label','reasoning_link','shared_reasoning_label','source_label','source_record_label','source_field_label','gate_label','gate_intro','gate_question','gate_no_guide','yes','no','clear_gate','gate_affected_label','gate_revisit','available','partly_available','set_aside','set_aside_guide','remaining_routes','route_context_label','gate_reason','finals_title','finals_intro','final_presence_question','final_strength_question','strength_guide','final_notes_label','save_final','reconfirm_final','current','unanswered','incomplete','stale','stale_guide','stale_reason','completion','complete','public_final_guide','local_only','session_label','sessions_label','new_session','resume_session','saved','saving','memory_only','storage_failure','read_only','conflict','lock_unavailable','export_json','export_csv','import_json','import_success','import_error','input_error','load_error','download_error','history_label','event_gate','event_final','event_reconfirm','event_navigation','event_import','event_created','release_label','content_id_label','mapping_id_label','procedure_id_label','rendered_id_label','source_id_label','originals_title','originals_intro','originals_search','originals_count','current_reading_label','support_reading_label','response_reading_label','notes_label','scope_label','strength_evidence_label','earlier_label','earlier_notice','historical_id_label','no_results','glossary_label','close_glossary','skip_link','csv_value','csv_presence','csv_strength','csv_status','csv_notes','csv_stale_reasons','csv_session','csv_release','csv_basis','discard_drafts','shared_claim_label'];
export function validateCopy(copy,source){
 check(isRecord(copy),'Interface copy must be an object.');
 for(const key of COPY_KEYS)check(nonempty(copy[key]),`Missing interface copy: ${key}`);
 for(const [key,value] of Object.entries(copy))check(['presence_labels','strength_labels'].includes(key)?isRecord(value):nonempty(value),`Interface copy must be flat text: ${key}`);
 exact(copy.presence_labels,['Support','Oppose','Both','Neither'],'presence labels');
 for(const label of Object.keys(copy.presence_labels))check(copy.presence_labels[label]===label,`Presence label must remain exact: ${label}`);
 exact(copy.strength_labels,['support','oppose','pending'],'strength labels');
 for(const value of Object.values(copy.strength_labels))check(nonempty(value),'Missing strength label.');
 check(copy.yes==='Yes'&&copy.no==='No','Gate answers must remain Yes and No.');
 check(copy.earlier_notice===source.ui_copy.originalViewNotice,'Earlier-wording notice must remain exact.');
 for(const [key,required] of Object.entries({remaining_routes:['available','total'],originals_count:['count','total']}))for(const field of required)check(copy[key].includes('{'+field+'}'),`Missing interface placeholder {${field}}: ${key}`);
}

export function sourceValidators(source,glossary){
 const terms=new Set();
 check(Array.isArray(glossary),'Glossary must be an array.');
 for(const entry of glossary){exact(entry,['term','definition'],'glossary entry');check(nonempty(entry.term)&&nonempty(entry.definition)&&!terms.has(entry.term),`Invalid or duplicate glossary term: ${entry.term}`);terms.add(entry.term);}
 const decode=value=>value.replace(/&(?:amp|lt|gt|quot|apos|nbsp);|&#(?:x[0-9a-f]+|[0-9]+);?/gi,entity=>{
  const named={'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'",'&nbsp;':'\u00a0'};
  if(Object.hasOwn(named,entity.toLowerCase()))return named[entity.toLowerCase()];
  const hex=entity[2].toLowerCase()==='x',number=parseInt(entity.slice(hex?3:2),hex?16:10);
  check(number>0&&number<=0x10ffff&&!(number>=0xd800&&number<=0xdfff),'Invalid numeric HTML entity.');return String.fromCodePoint(number);
 });
 const tags=/<\/?([a-z][a-z0-9]*)\b((?:[^<>"']|"[^"]*"|'[^']*')*)>/gi;
 function attributes(raw,owner){
  const result=new Map(),pattern=/\s+([a-z][a-z0-9:-]*)\s*=\s*(?:"([^"]*)"|'([^']*)')/giy;let position=0;
  while(raw.slice(position).trim()){
   pattern.lastIndex=position;const match=pattern.exec(raw);check(match,`Malformed or unquoted HTML attribute: ${owner}`);
   const name=match[1].toLowerCase();check(!result.has(name),`Duplicate HTML attribute ${name}: ${owner}`);result.set(name,decode(match[2]??match[3]));position=pattern.lastIndex;
  }return result;
 }
 const citations=new Set();
 function collect(value){
  if(typeof value==='string')for(const match of value.matchAll(tags)){
   if(match[1].toLowerCase()!=='a'||match[0].startsWith('</'))continue;
   const attrs=attributes(match[2],'frozen citation');if(attrs.has('href')&&attrs.has('title'))citations.add(JSON.stringify([attrs.get('href'),attrs.get('title')]));
  }else if(Array.isArray(value))value.forEach(collect);else if(value&&typeof value==='object')Object.values(value).forEach(collect);
 }collect(source);
 const safeTags=new Set(['p','ul','ol','li','strong','em','b','i','span','a','br','blockquote','cite','small','sup','sub','h3','h4','h5','dl','dt','dd']);
 function html(value,owner){
  check(typeof value==='string'&&nonempty(plainText(value)),`Missing HTML text: ${owner}`);const stack=[];let position=0;
  for(const match of value.matchAll(tags)){
   check(!value.slice(position,match.index).includes('<'),`Malformed HTML: ${owner}`);position=match.index+match[0].length;
   const tag=match[1].toLowerCase(),closing=match[0].startsWith('</'),selfClosing=/\/\s*>$/.test(match[0]);check(safeTags.has(tag),`Unsafe HTML tag ${tag}: ${owner}`);
   if(closing){check(!match[2].trim()&&stack.pop()===tag,`Unbalanced HTML tag ${tag}: ${owner}`);continue;}
   check(!selfClosing||tag==='br',`Only br may be self-closing: ${owner}`);
   const attrs=attributes(selfClosing?match[2].replace(/\/\s*$/,''):match[2],owner);
   for(const name of attrs.keys())check(tag==='a'?name==='href'||name==='title':tag==='span'&&name==='data-term',`Unsafe HTML attribute ${name}: ${owner}`);
   if(tag==='a')check(!stack.includes('a')&&attrs.has('href')&&attrs.has('title')&&/^https?:\/\/[^\s]+$/i.test(attrs.get('href'))&&citations.has(JSON.stringify([attrs.get('href'),attrs.get('title')])),`Citation href/title differs from the frozen source: ${owner}`);
   if(attrs.has('data-term'))check(terms.has(attrs.get('data-term')),`Unknown glossary term ${attrs.get('data-term')}: ${owner}`);
   if(tag!=='br')stack.push(tag);
  }
  check(!value.slice(position).includes('<')&&!stack.length,`Malformed or unclosed HTML: ${owner}`);
 }
 function references(refs,owner){
  check(Array.isArray(refs)&&refs.length,`Missing source references: ${owner}`);
  for(const ref of refs){exact(ref,['id','field','quote'],`source reference in ${owner}`);check(nonempty(ref.id)&&nonempty(ref.field)&&nonempty(ref.quote),`Incomplete source reference: ${owner}`);const quote=plainText(ref.quote);check(quote&&plainText(sourceField(source,ref.id,ref.field)).includes(quote),`Source quotation does not match ${ref.id}.${ref.field}: ${owner}`);}
 }
 return {html,references};
}

