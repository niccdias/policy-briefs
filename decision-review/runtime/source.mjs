const invariant=(condition,message)=>{if(!condition)throw new Error(message);};

export function plainText(value){
 return value.replace(/<[^>]+>/g,' ').replace(/&(?:amp|lt|gt|quot|apos);|&#(?:x[0-9a-f]+|[0-9]+);?/gi,entity=>{
  const named={'&amp;':'&','&lt;':'<','&gt;':'>','&quot;':'"','&apos;':"'"};
  if(named[entity.toLowerCase()])return named[entity.toLowerCase()];
  const number=parseInt(entity.slice(entity[2].toLowerCase()==='x'?3:2).replace(/;$/,''),entity[2].toLowerCase()==='x'?16:10);
  invariant(number>0&&number<=0x10ffff&&!(number>=0xd800&&number<=0xdfff),'Invalid numeric source entity.');
  return String.fromCodePoint(number);
 }).replace(/\s+/g,' ').trim();
}

export function sourceField(source,id,field){
 if(field==='support_reading'||field==='response_reading'){
  const reading=source.readings[id]?.[field==='support_reading'?'support':'response'];
  invariant(typeof reading==='string',`Missing reading: ${id}.${field}`);
  return reading;
 }
 let value=[source.bill,...source.values,...source.claims,...source.arguments].find(record=>record.id===id);
 invariant(value,`Unknown source record: ${id}`);
 for(const key of field.replace(/\[(\d+)\]/g,'.$1').split('.')){
  invariant(value!==null&&typeof value==='object'&&/^[A-Za-z0-9_]+$/.test(key)&&!['__proto__','prototype','constructor'].includes(key)&&Object.hasOwn(value,key),`Unknown source field: ${id}.${field}`);
  value=value[key];
 }
 invariant(typeof value==='string',`Source reference must select text: ${id}.${field}`);
 return value;
}

