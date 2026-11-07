import copy from '../release/ui-copy.json' with {type:'json'};
export const unknownLegacy='unknown_legacy';
export function releaseMetadata(content){
 const r=content.release??{};
 return {content_id:r.content_id??content.version,procedure_id:r.procedure_id??content.procedure?.revision??unknownLegacy,mapping_id:r.mapping_id??unknownLegacy,rendered_id:r.rendered_id??unknownLegacy};
}
export function recordedRelease(state){return state.release??{content_id:state.version,procedure_id:state.procedureRevision??unknownLegacy,mapping_id:unknownLegacy,rendered_id:unknownLegacy};}
export function assertLoadedRelease(content,loaded){
 if(!loaded)return;
 for(const key of ['content_id','procedure_id','mapping_id','rendered_id'])if(releaseMetadata(content)[key]!==loaded[key])throw new Error(copy.releaseMismatchMessage.replace('${key}',copy.releaseDetailKeyLabels[key.replace(/_id$/,'')]??key));
}
export function semanticRevision(content,id){return content.release?.node_revisions?.[id];}
