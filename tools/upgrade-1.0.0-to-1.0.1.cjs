'use strict';
const fs=require('node:fs'),path=require('node:path');
const {hash,readArchive,applyRecipe,verifyPacked}=require('../src/patch.cjs');
function upgrade(base,manifest){
 if(manifest.format!==1||manifest.fromVersion!=='1.0.0'||manifest.toVersion!=='1.0.1'||hash(base)!==manifest.baseSha256)throw Error('This upgrade requires the exact English 1.0.0 archive.');
 const {header,dataStart}=readArchive(base),originalLength=manifest.originalDataLength;
 if(!Number.isSafeInteger(originalLength)||originalLength<0||dataStart+originalLength>base.length)throw Error('Invalid original data length');
 const appended=[];let offset=originalLength;
 for(const recipe of manifest.files){
  if(!/^dist\/electron\/[A-Za-z0-9._/-]+$/.test(recipe.path)||recipe.path.split('/').some(x=>x==='..'))throw Error('Invalid upgrade member');
  let entry=header;for(const part of recipe.path.split('/')){entry=entry.files?.[part];if(!entry)throw Error('Missing upgrade member');}
  if(entry.unpacked||entry.link)throw Error('Unsupported upgrade member');
  const before=base.subarray(dataStart+Number(entry.offset),dataStart+Number(entry.offset)+entry.size);
  if(hash(before)!==recipe.beforeSha256)throw Error('Upgrade input member mismatch');
  const bytes=recipe.ops?applyRecipe(before,recipe):before;
  if(bytes.length!==recipe.size||hash(bytes)!==recipe.afterSha256)throw Error('Upgrade output member mismatch');
  entry.size=bytes.length;entry.offset=String(offset);
  if(recipe.ops){const blockSize=entry.integrity.blockSize,blocks=[];for(let at=0;at<bytes.length;at+=blockSize)blocks.push(hash(bytes.subarray(at,at+blockSize)));entry.integrity={algorithm:'SHA256',hash:hash(bytes),blockSize,blocks};}
  appended.push(bytes);offset+=bytes.length;
 }
 const json=Buffer.from(JSON.stringify(header)),headerSize=Math.ceil((8+json.length)/4)*4,prefix=Buffer.alloc(8),pickle=Buffer.alloc(headerSize);
 prefix.writeUInt32LE(4);prefix.writeUInt32LE(headerSize,4);pickle.writeUInt32LE(headerSize-4);pickle.writeUInt32LE(json.length,4);json.copy(pickle,8);
 const output=Buffer.concat([prefix,pickle,base.subarray(dataStart,dataStart+originalLength),...appended]);
 if(output.length!==manifest.targetSize||hash(output)!==manifest.targetSha256)throw Error('Upgrade does not match the fixed release');
 const verified=verifyPacked(output,header,8+headerSize);return{output,verified};
}
if(require.main===module){try{const[input,output]=process.argv.slice(2);if(!input||!output)throw Error('Usage: node tools/upgrade-1.0.0-to-1.0.1.cjs OLD-ENGLISH.asar OUTPUT.asar');if(fs.existsSync(output))throw Error('Output exists; choose a new name');const manifest=require('../patches/upgrade-1.0.0-to-1.0.1.json');const result=upgrade(fs.readFileSync(input),manifest);fs.writeFileSync(output,result.output,{flag:'wx'});console.log(JSON.stringify({sha256:manifest.targetSha256,bytes:result.output.length,verified:result.verified}));}catch(error){console.error(error.message);process.exitCode=1;}}
module.exports={upgrade};
