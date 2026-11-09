import {plainText} from './source.mjs';

const escape=value=>String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
const fill=(value,fields)=>value.replace(/\{([a-z_]+)\}/g,(match,key)=>Object.hasOwn(fields,key)?String(fields[key]):match);
function originalRecord(model,record){
 const c=model.copy,current=model.sourceIndex.source.readings[record.id];if(!current)throw new Error(`Missing original reading: ${record.id}`);
 const scope=(record.scope_html??'')+(record.background_html??'');
 return `<details class="original-record" id="original-${escape(record.id)}" data-source-record-id="${escape(record.id)}"><summary>${escape(record.title)}</summary><p class="historical-id">${escape(c.historical_id_label)}: ${escape(record.id)}</p>${scope?`<section><h3>${escape(c.scope_label)}</h3>${scope}</section>`:''}<h3>${escape(c.current_reading_label)}</h3><h4>${escape(c.support_reading_label)}</h4>${current.support}<h4>${escape(c.response_reading_label)}</h4>${current.response}${record.notes_html?`<h4>${escape(c.notes_label)}</h4>${record.notes_html}`:''}${current.strength?.length?`<h4>${escape(c.strength_evidence_label)}</h4>${current.strength.map(item=>item.html).join('')}`:''}${record.original?`<details class="earlier-reading"><summary>${escape(c.earlier_label)}</summary><p class="guide">${escape(c.earlier_notice)}</p>${record.original.pro_html}${record.original.con_html}${record.original.notes_html}</details>`:''}</details>`;
}
export function renderOriginals(model,query=''){
 const c=model.copy,records=[...model.sourceIndex.source.claims,...model.sourceIndex.source.arguments],needle=query.trim().toLocaleLowerCase();
 const matches=records.filter(record=>!needle||plainText(JSON.stringify([record,model.sourceIndex.source.readings[record.id]])).toLocaleLowerCase().includes(needle));
 return `<article id="originals"><h1 tabindex="-1">${escape(c.originals_title)}</h1><p>${escape(c.originals_intro)}</p><label for="source-search">${escape(c.originals_search)}</label><input id="source-search" type="search" value="${escape(query)}" autocomplete="off"><p id="source-count" role="status">${escape(fill(c.originals_count,{count:matches.length,total:records.length}))}</p><div id="original-records">${matches.length?matches.map(record=>originalRecord(model,record)).join(''):`<p>${escape(c.no_results)}</p>`}</div></article>`;
}
