import fs from 'node:fs';import {spawnSync} from 'node:child_process';
const files=['core.js','app.js','merge.js','modern.js','toolkit.js','site.js','boot.js','ads-config.js','scripts/build.mjs','scripts/catalog.mjs'];let failed=false;
for(const file of files){const r=spawnSync(process.execPath,['--check',file],{encoding:'utf8'});if(r.status){console.error(r.stderr);failed=true;}}
if(process.argv.includes('--types')){
 // Runtime schema guards are used in this JavaScript application. This command
 // explicitly does not claim TypeScript type checking.
 console.log('JavaScript project: syntax and shared input/geometry guard checks. No TypeScript compiler configured.');
}
for(const file of ['core.js','modern.js','toolkit.js']){const s=fs.readFileSync(file,'utf8');if(/eval\s*\(/.test(s)){console.error('Unexpected eval in '+file);failed=true;}}
if(failed)process.exitCode=1;else console.log(`Checked ${files.length} owned JavaScript sources. No eval calls.`);
