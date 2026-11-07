import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';
import {validateContent,invariant} from './src/core.mjs';

export function assembleAllBills(single,multi,sourceHashes){
 validateContent(single);validateContent(multi);
 invariant(!single.bills&&multi.bills.length===7,'Expected the frozen S.1582 and seven-bill releases.');
 const billId='119_S_1582',withBill=n=>({...structuredClone(n),bill_id:billId});
 const bill={...single.bill,id:billId,description:`${single.bill.description} The bill also sets rules for repaying users and requires approved issuers to follow lawful orders to block payments.`};
 const content={schema_version:1,draft:false,bills:[bill,...structuredClone(multi.bills)],values:[...single.values.map(withBill),...structuredClone(multi.values)],claims:[...single.claims.map(withBill),...structuredClone(multi.claims)],arguments:[...single.arguments.map(withBill),...structuredClone(multi.arguments)],catalog:[...single.catalog.map(withBill),...structuredClone(multi.catalog)],expected_counts:{active:single.arguments.length+multi.arguments.length,historical:single.catalog.length+multi.catalog.length},provenance:{source_versions:[single.version,multi.version],source_sha256:sourceHashes,content_change:'Combined frozen releases; no argument, response, dependency or evidence wording changed.'},workflow:{title:'Eight-bill argument coding',resume_sources:[{version:single.version,url:'./s1582-pilot/content.json',bill_ids:[billId],single_bill:true,sha256:sourceHashes[0]},{version:multi.version,url:'./other-bills/content.json',bill_ids:multi.bills.map(b=>b.id),single_bill:false,sha256:sourceHashes[1]}]},procedure:{revision:'eight-bills-20261107-v1',background:[...structuredClone(single.procedure.background),...structuredClone(multi.procedure.background)],retained_questions:[...structuredClone(single.procedure.retained_questions),...structuredClone(multi.procedure.retained_questions)],previous_revisions:[],selection_rule:multi.procedure.selection_rule},evidence_placement:{revision:'eight-bills-evidence-20261107-v1',nodes:{...structuredClone(single.evidence_placement.nodes),...structuredClone(multi.evidence_placement.nodes)}}};
 content.version=`eight-bills-20261107-${createHash('sha256').update(JSON.stringify(content)).digest('hex').slice(0,12)}`;
 content.procedure.base_content_version=content.version;
 validateContent(content);
 invariant(content.bills.length===8&&content.arguments.length===503&&content.catalog.length===567,'Combined coverage differs from the two frozen releases.');
 return content;
}

if(process.argv[1]===fileURLToPath(import.meta.url)){
 const bytes=await Promise.all(['content.json','expansion/content.json'].map(p=>readFile(new URL(p,import.meta.url))));
 const content=assembleAllBills(...bytes.map(b=>JSON.parse(b)),bytes.map(b=>createHash('sha256').update(b).digest('hex')));
 await writeFile(new URL('expansion/all-bills.json',import.meta.url),JSON.stringify(content,null,2)+'\n');
 console.log(`Assembled ${content.version}: 8 bills, ${content.arguments.length} arguments, ${content.procedure.retained_questions.length} shared questions.`);
}
