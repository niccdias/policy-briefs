import {readFile,writeFile} from 'node:fs/promises';
import {validateContent,validateState,recordMappingDisposition,effective,valueResult,csvExport} from './src/core.mjs';
import {releaseMetadata,recordedRelease} from './src/release.mjs';
import {fileURLToPath} from 'node:url';
export function reviewMappingNotes(content,exported,dispositions){
 validateContent(content);let state=validateState(content,structuredClone(exported.state));
 for(const row of dispositions)state=recordMappingDisposition(content,state,row);
 const concerns=Object.entries(state.nodeNotes).filter(([id,note])=>note.trim()&&(content.claims.some(c=>c.id===id)||['derived','unresolved'].includes(effective(content,state,id).origin)||state.completed[id]?.origin==='derived'||state.mappingDispositions?.[id]));
 return {...exported,release:releaseMetadata(content),recorded_release:recordedRelease(state),state,mapping_review:{concerns:concerns.map(([id,note])=>({id,note,disposition:state.mappingDispositions?.[id]??null})),values:content.values.map(v=>({id:v.id,...valueResult(content,state,v.id)})),unreviewed:concerns.filter(([id,note])=>state.mappingDispositions?.[id]?.reviewed_note!==note).map(([id])=>id)}};
}
if(process.argv[1]===fileURLToPath(import.meta.url)){
 const [contentFile,exportFile,dispositionFile,outputFile]=process.argv.slice(2);
 if(!outputFile)throw new Error('Usage: node pilot/coordinator.mjs CONTENT.json PRIVATE_EXPORT.json DISPOSITIONS.json PRIVATE_OUTPUT.json');
 const [content,exported,dispositions]=await Promise.all([contentFile,exportFile,dispositionFile].map(async p=>JSON.parse(await readFile(p,'utf8'))));
 const result=reviewMappingNotes(content,exported,dispositions);
 await writeFile(outputFile,JSON.stringify(result,null,2)+'\n',{flag:'wx',mode:0o600});
 await writeFile(outputFile.replace(/\.json$/,'')+'.csv',csvExport(content,result.state),{flag:'wx',mode:0o600});
}
