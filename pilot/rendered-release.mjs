import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {releaseMetadata} from './src/release.mjs';
export const renderedFiles=['src/app.jsx','src/review.mjs','src/issues.mjs','src/issue-review.mjs','src/issue-ui.jsx','assemble-issues.mjs','issues/issue-map.json','issues/ui-copy.json','issues/REVIEW.md','release/review-copy.json','src/core.mjs','src/evidence.mjs','src/storage.mjs','src/resume.mjs','src/payload.mjs','src/release.mjs','style.css','index.html','release/ui-copy.json','public-view.mjs','release/amendments/corpus-20261110/apply-amendment.mjs','release/amendments/corpus-20261110/write-amendment.mjs','release/amendments/corpus-20261110/record-attributions.json','release/amendments/corpus-20261110/link-replacements.json','publication-gate.mjs','rendered-release.mjs','build.mjs','../.github/workflows/deploy.yml','../quartz/styles/custom.scss'];
export async function identifyRenderedRelease(content){
 const hash=createHash('sha256').update(JSON.stringify(content));
 for(const path of renderedFiles)hash.update(path).update(await readFile(new URL(path,import.meta.url)));
 return {...releaseMetadata(content),rendered_id:`rendered-${hash.digest('hex').slice(0,20)}`};
}
