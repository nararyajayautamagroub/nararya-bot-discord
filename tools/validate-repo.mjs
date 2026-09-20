import fs from 'node:fs';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const required=[
  'package.json',
  'VERSION.md',
  '.env.example',
  'src/index.js',
  'src/deploy-commands.js',
  'src/jkt48/adapters.js',
  'src/jkt48/sources.js',
  'src/jkt48/live-monitor.js',
  'src/jkt48/feed-service.js',
  'src/ticket-bot/index.js',
  'website/jkt48/index.html',
  'website/jkt48/style.css',
  'website/jkt48/app.js'
];

const errors=[];
const warnings=[];

for(const file of required){
  if(!fs.existsSync(path.join(root,file)))errors.push('Missing required file: '+file);
}

const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
const versionDoc=fs.readFileSync(path.join(root,'VERSION.md'),'utf8').match(/Current version:\s*([^\s]+)/i)?.[1];
if(!versionDoc)errors.push('VERSION.md does not declare Current version');
else if(versionDoc!==pkg.version)errors.push('Version mismatch: package.json='+pkg.version+' VERSION.md='+versionDoc);

const sourceRoots=['src','test','website'];
const jsFiles=[];
function walk(dir){
  for(const entry of fs.readdirSync(path.join(root,dir),{withFileTypes:true})){
    const rel=path.join(dir,entry.name);
    if(entry.isDirectory())walk(rel);
    else if(entry.isFile()&&entry.name.endsWith('.js'))jsFiles.push(rel);
  }
}
for(const dir of sourceRoots)if(fs.existsSync(path.join(root,dir)))walk(dir);

const importPattern=/from\s+['"]([^'"]+)['"]|import\s*\(\s*['"]([^'"]+)['"]\s*\)/g;
for(const rel of jsFiles){
  const text=fs.readFileSync(path.join(root,rel),'utf8');
  for(const match of text.matchAll(importPattern)){
    const spec=match[1]||match[2];
    if(!spec?.startsWith('.'))continue;
    const base=path.resolve(root,path.dirname(rel),spec);
    const candidates=[base,base+'.js',path.join(base,'index.js')];
    if(!candidates.some(fs.existsSync))errors.push(rel+' imports missing module '+spec);
  }
  if(/DISCORD_TOKEN\s*=\s*['"][^$]/.test(text)||/BOT_TOKEN\s*=\s*['"][^$]/.test(text))
    errors.push('Possible hard-coded token in '+rel);
}

for(const name of ['DISCORD_TOKEN','CLIENT_ID','GUILD_ID']){
  const env=fs.readFileSync(path.join(root,'.env.example'),'utf8');
  if(!new RegExp('^'+name+'=', 'm').test(env))warnings.push('.env.example is missing '+name);
}

const docs=fs.readdirSync(path.join(root,'docs')).filter(x=>x.endsWith('.md'));
if(!docs.length)warnings.push('No docs/*.md files found');

if(warnings.length)for(const warning of warnings)console.warn('[validate warning] '+warning);
if(errors.length){
  for(const error of errors)console.error('[validate error] '+error);
  process.exit(1);
}
console.log('[validate] OK: '+jsFiles.length+' JavaScript files checked, '+required.length+' required paths verified.');
