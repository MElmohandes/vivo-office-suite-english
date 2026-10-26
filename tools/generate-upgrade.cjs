'use strict';
const fs=require('node:fs'),path=require('node:path');
const {archive,delta,hash}=require('./generate-recipes.cjs');
const {readArchive}=require('../src/patch.cjs');
const [basePath,targetPath,originalPath,output]=process.argv.slice(2);
if(!output)throw Error('Usage: node tools/generate-upgrade.cjs BASE.asar TARGET.asar ORIGINAL.asar OUTPUT.json');
const base=archive(basePath),target=archive(targetPath),prefix=Buffer.alloc(16);
const fd=fs.openSync(originalPath,'r');fs.readSync(fd,prefix,0,16,0);const originalDataLength=fs.fstatSync(fd).size-8-prefix.readUInt32LE(4);fs.closeSync(fd);
if(hash(base.bytes)!=='c68629d20a5ef81eccdb5f46c37422f7d38d9b1a2518c73158ef5ae190a3e9cc')throw Error('Use the preserved public 1.0.0 archive, not the current installed archive');
const {header}=readArchive(target.bytes),files=[];
function walk(dir,pre=''){for(const[name,e]of Object.entries(dir.files||{})){const rel=pre+name;if(e.files){walk(e,rel+'/');continue;}if(e.unpacked||e.link||Number(e.offset)<originalDataLength)continue;const before=base.files.get(rel),after=target.files.get(rel);if(!before||!after)throw Error('Missing upgrade member '+rel);const item={path:rel,beforeSha256:hash(before),afterSha256:hash(after),size:after.length};if(!before.equals(after))item.ops=delta(before,after);files.push(item);}}
walk(header);
const manifest={format:1,fromVersion:'1.0.0',toVersion:'1.0.1',appVersion:'7.0.6',baseSha256:hash(base.bytes),targetSha256:hash(target.bytes),targetSize:target.bytes.length,originalDataLength,files};
fs.mkdirSync(path.dirname(output),{recursive:true});fs.writeFileSync(output,JSON.stringify(manifest,null,2)+'\n');console.log(JSON.stringify({files:files.length,changed:files.filter(x=>x.ops).length,bytes:fs.statSync(output).size}));
