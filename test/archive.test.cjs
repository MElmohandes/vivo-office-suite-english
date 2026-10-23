'use strict';
const {test} = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const {spawnSync} = require('node:child_process');
const {hash, readArchive, applyRecipe, verifyPacked, build} = require('../src/patch.cjs');
function fixture() {
  const data = Buffer.from('original'), blockSize = 4;
  const header = {files:{dist:{files:{electron:{files:{'test.js':{size:data.length,offset:'0',integrity:{algorithm:'SHA256',hash:hash(data),blockSize,blocks:[hash(data.subarray(0,4)),hash(data.subarray(4))]}}}}}},'external.node':{size:42,unpacked:true}}};
  const json = Buffer.from(JSON.stringify(header)), size = Math.ceil((8 + json.length) / 4) * 4;
  const prefix = Buffer.alloc(8), pickle = Buffer.alloc(size);
  prefix.writeUInt32LE(4); prefix.writeUInt32LE(size,4);
  pickle.writeUInt32LE(size-4); pickle.writeUInt32LE(json.length,4); json.copy(pickle,8);
  return Buffer.concat([prefix,pickle,data]);
}
test('byte recipes preserve binary copy offsets and verify the reconstructed hash', () => {
  const before = Buffer.from([0,255,1,2]), after = Buffer.from([255,1,65]);
  const recipe = {path:'example', beforeSha256:hash(before), afterSha256:hash(after),size:3,ops:[[1,2],'QQ==']};
  assert.deepEqual(applyRecipe(before,recipe),after);
  assert.throws(() => applyRecipe(before,{...recipe,ops:[[3,2]]}),/Invalid copy/);
  assert.throws(() => applyRecipe(before,{...recipe,afterSha256:'bad'}),/verification failed/);
  assert.throws(() => applyRecipe(Buffer.from('wrong'),recipe),/hash mismatch/);
});
test('synthetic ASAR integrity checks preserve external references and catch block corruption', () => {
  const bytes = fixture(), {header,dataStart} = readArchive(bytes);
  assert.deepEqual(verifyPacked(bytes,header,dataStart),{packed:1,unpacked:1});
  const entry = header.files.dist.files.electron.files['test.js'];
  entry.integrity.blocks[0] = 'bad';
  assert.throws(() => verifyPacked(bytes,header,dataStart),/block integrity/);
});
test('archive parser and builder reject incompatible or corrupt input before output', () => {
  assert.throws(() => readArchive(Buffer.alloc(0)),/Invalid ASAR/);
  const bytes = fixture();
  assert.throws(() => build(bytes,{format:1,appVersion:'7.0.6',sourceSha256:'wrong'}),/Unsupported input/);
  assert.throws(() => build(bytes,{format:2,appVersion:'7.0.6'}),/Unsupported patch/);
});
test('maintainer recipe generation round-trips a synthetic archive and rejects tampered target', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'vivo-patch-test-'));
  try {
    const original = fixture();
    const source = path.join(dir,'source.asar'), target = path.join(dir,'target.asar'), manifestPath = path.join(dir,'recipe.json');
    fs.writeFileSync(source,original); fs.writeFileSync(target,original);
    const result = spawnSync(process.execPath,[path.resolve(__dirname,'../tools/generate-recipes.cjs'),source,target,manifestPath],{encoding:'utf8'});
    assert.equal(result.status,0,result.stderr);
    const manifest = JSON.parse(fs.readFileSync(manifestPath,'utf8'));
    const rebuilt = build(original,manifest);
    assert.deepEqual(rebuilt.output,original);
    assert.deepEqual(rebuilt.verified,{packed:1,unpacked:1});
    assert.throws(() => build(original,{...manifest,targetSha256:'wrong'}),/does not match/);
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
test('CLI refuses to overwrite an existing output file', () => {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(),'vivo-patch-cli-'));
  try {
    const output = path.join(dir,'keep.asar');
    fs.writeFileSync(output,'keep');
    const result = spawnSync(process.execPath,[path.resolve(__dirname,'../src/patch.cjs'),'missing-source.asar',output],{encoding:'utf8'});
    assert.notEqual(result.status,0);
    assert.match(result.stderr,/never overwritten/);
    assert.equal(fs.readFileSync(output,'utf8'),'keep');
  } finally {fs.rmSync(dir,{recursive:true,force:true});}
});
