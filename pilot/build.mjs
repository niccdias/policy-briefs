import { build } from 'esbuild';
import { mkdir, copyFile, readFile } from 'node:fs/promises';
const out = new URL('../public/coding/s1582-pilot/', import.meta.url);
const content = JSON.parse(await readFile(new URL('content.json', import.meta.url), 'utf8'));
if (content.draft && !process.argv.includes('--development')) throw new Error('Draft content cannot be published. Use --development only for local UI checks.');
await mkdir(out, {recursive:true});
for (const name of ['index.html','style.css','content.json','firebase-config.json']) {
  await readFile(new URL(name, import.meta.url));
  await copyFile(new URL(name, import.meta.url),new URL(name,out));
}
await mkdir(new URL('review/',out),{recursive:true});
for (const name of ['history_audit.json','main_review.json','mapping.json','checks.json','report.md','statutory_background.json','statutory_background_verification.json']) {
  await copyFile(new URL(`review/${name}`,import.meta.url),new URL(`review/${name}`,out));
}
await build({entryPoints:[new URL('src/app.jsx',import.meta.url).pathname],outfile:new URL('app.js',out).pathname,bundle:true,format:'esm',target:'es2022',minify:true,jsx:'automatic',jsxImportSource:'preact'});
console.log('Built separate pilot at public/coding/s1582-pilot/');
