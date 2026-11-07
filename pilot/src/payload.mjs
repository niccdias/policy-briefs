// Larger frozen runs retain the same atomic, immutable Firestore save format.
// Only the payload string is compressed; existing plain JSON remains readable.
const prefix='gzip-base64-v1:';
export async function encodePayload(json){
 if(new TextEncoder().encode(json).length<500000)return json;
 const bytes=new Uint8Array(await new Response(new Blob([json]).stream().pipeThrough(new CompressionStream('gzip'))).arrayBuffer());
 let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
 return prefix+btoa(binary);
}
export async function decodeRecord(record){
 if(!record||!record.payload.startsWith(prefix))return record;
 try{
  const bytes=Uint8Array.from(atob(record.payload.slice(prefix.length)),c=>c.charCodeAt(0));
  const payload=await new Response(new Blob([bytes]).stream().pipeThrough(new DecompressionStream('gzip'))).text();
  JSON.parse(payload);return {...record,payload};
 }catch{throw new Error('This saved response could not be decompressed. Its server revision is preserved; contact the project owner.');}
}
