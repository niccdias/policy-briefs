import {createHash} from 'node:crypto';
import {readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
// Mandatory inspections are supplied separately; the sample never substitutes for them.
export function retainedSample(content,mandatoryIds=[]){
 const excluded=new Set(mandatoryIds),release=content.release?.content_id??content.version;
 return content.values.flatMap(value=>['support','oppose'].map(direction=>{
  const candidates=content.arguments.filter(a=>a.value_id===value.id&&a.direction===direction&&!excluded.has(a.id)).map(a=>a.id).sort();
  const seed=[release,value.bill_id??content.bill?.bill,value.id,direction].join('|'),hash=createHash('sha256').update(seed).digest('hex');
  return {bill_id:value.bill_id??content.bill?.bill,value_id:value.id,direction,release_id:release,seed,hash,candidates,index:candidates.length?Number(BigInt('0x'+hash)%BigInt(candidates.length)):null,argument_id:candidates.length?candidates[Number(BigInt('0x'+hash)%BigInt(candidates.length))]:null};
 }));
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const [source,mandatory,output]=process.argv.slice(2);if(!output)throw new Error('Usage: node retained-sample.mjs CONTENT.json MANDATORY_IDS.json OUTPUT.json');
 const content=JSON.parse(await readFile(source)),ids=JSON.parse(await readFile(mandatory));
 await writeFile(output,JSON.stringify(retainedSample(content,ids),null,2)+'\n',{flag:'wx'});
}
