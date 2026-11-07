import { build } from 'esbuild';
import { mkdir, copyFile, readFile, writeFile, stat } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import {validateContent} from './src/core.mjs';
const routes=[{route:'s1582-pilot',source:'content.json',review:'review/'}];
try{await stat(new URL('expansion/manifest.json',import.meta.url));routes.push({route:'other-bills',source:'expansion/content.json',review:'expansion/'});}catch(e){if(e.code!=='ENOENT')throw e;}
for(const {route,source,review} of routes){
const out = new URL(`../public/coding/${route}/`, import.meta.url);
const content = JSON.parse(await readFile(new URL(source, import.meta.url), 'utf8'));
validateContent(content);
if (content.draft && !process.argv.includes('--development')) throw new Error('Draft content cannot be published. Use --development only for local UI checks.');
await mkdir(out, {recursive:true});
for (const name of ['index.html','style.css','firebase-config.json']) {
  await readFile(new URL(name, import.meta.url));
  await copyFile(new URL(name, import.meta.url),new URL(name,out));
}
await copyFile(new URL(source,import.meta.url),new URL('content.json',out));
await mkdir(new URL('review/',out),{recursive:true});
const reviewFiles=route==='s1582-pilot'?['history_audit.json','main_review.json','mapping.json','checks.json','report.md','statutory_background.json','statutory_background_verification.json','uncontested_context.json','uncontested_context_verification.json','evidence_placement.json']:['history_audit.json','main_review.json','verification.json'];
for (const name of reviewFiles) {
  await copyFile(new URL(`${review}${name}`,import.meta.url),new URL(`review/${name}`,out));
}
await build({entryPoints:[new URL('src/app.jsx',import.meta.url).pathname],outfile:new URL('app.js',out).pathname,bundle:true,format:'esm',target:'es2022',minify:true,jsx:'automatic',jsxImportSource:'preact'});
let index = await readFile(new URL('index.html', import.meta.url), 'utf8');
if(route==='other-bills')index=index.replaceAll('S.1582 coding pilot','Other bills · argument coding');
for (const name of ['app.js', 'style.css']) {
  const reference = `./${name}`;
  if (index.split(`"${reference}"`).length !== 2) throw new Error(`Expected one ${name} reference in pilot/index.html.`);
  const hash = createHash('sha256').update(await readFile(new URL(name, out))).digest('hex').slice(0, 16);
  index = index.replace(`"${reference}"`, `"${reference}?v=${hash}"`);
}
await writeFile(new URL('index.html', out), index);
console.log(`Built coding app at public/coding/${route}/`);
}
