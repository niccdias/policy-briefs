// Records the decisions each published release showed, so a later release can carry its saved sessions.
// Usage: node record-session-history.mjs <label> <display-rule> <built-arguments-dir>
// <built-arguments-dir> holds <slug>/index.html from a deployed (or exactly rebuilt) release.
// Run it for the outgoing release before publishing a release whose content changed.
import {readFile,writeFile,readdir} from 'node:fs/promises';
import {join} from 'node:path';
import assert from 'node:assert/strict';
import {decisionFingerprints,DISPLAY_RULES} from './runtime/build.mjs';
import {validateRelease} from './runtime/model.mjs';

const [label,display,dir]=process.argv.slice(2);
assert(label&&DISPLAY_RULES[display]&&dir,'Usage: node record-session-history.mjs <label> <display-rule> <built-arguments-dir>');
const path=new URL('./session-history.json',import.meta.url);
let history;try{history=JSON.parse(await readFile(path,'utf8'));}catch(error){if(error.code!=='ENOENT')throw error;history={schema_version:1,bills:{}};}
assert.equal(history.schema_version,1);
for(const entry of (await readdir(dir,{withFileTypes:true})).filter(item=>item.isDirectory()).map(item=>item.name).sort()){
 const html=await readFile(join(dir,entry,'index.html'),'utf8'),match=html.match(/<script type="application\/json" id="pilot-data">([\s\S]*?)<\/script>/);
 assert(match,'No review payload in '+entry);const payload=JSON.parse(match[1]),release=payload.release;validateRelease(release);
 const list=history.bills[release.bill_id]??=[];
 if(list.some(item=>item.release.rendered_id===release.rendered_id)){console.log(JSON.stringify({bill:release.bill_id,rendered_id:release.rendered_id,status:'already recorded'}));continue;}
 list.push({recorded_from:label,display,release,fingerprints:decisionFingerprints(payload.decisions,payload.copy,display)});
 console.log(JSON.stringify({bill:release.bill_id,rendered_id:release.rendered_id,status:'recorded'}));
}
await writeFile(path,JSON.stringify(history,null,1)+'\n');
