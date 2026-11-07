import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {releaseMetadata} from './src/release.mjs';
export async function identifyRenderedRelease(content){
 const files=['src/app.jsx','src/core.mjs','src/evidence.mjs','src/storage.mjs','src/resume.mjs','src/payload.mjs','src/release.mjs','style.css','index.html','release/ui-copy.json','public-view.mjs','../quartz/styles/custom.scss'];
 const hash=createHash('sha256').update(JSON.stringify(content));
 for(const path of files)hash.update(path).update(await readFile(new URL(path,import.meta.url)));
 return {...releaseMetadata(content),rendered_id:`rendered-${hash.digest('hex').slice(0,20)}`};
}
