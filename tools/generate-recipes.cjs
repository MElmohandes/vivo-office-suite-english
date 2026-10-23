'use strict';
// Maintainer tool: derive byte-copy recipes from two locally owned archives.
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const hash = b => crypto.createHash('sha256').update(b).digest('hex');
function archive(file) {
  const bytes = fs.readFileSync(file);
  const header = JSON.parse(bytes.subarray(16, 16 + bytes.readUInt32LE(12)));
  const start = 8 + bytes.readUInt32LE(4);
  const files = new Map();
  function walk(dir, prefix = '') {
    for (const [name, entry] of Object.entries(dir.files || {})) {
      const key = prefix + name;
      if (entry.files) walk(entry, key + '/');
      else if (!entry.link && !entry.unpacked) files.set(key, bytes.subarray(start + Number(entry.offset), start + Number(entry.offset) + entry.size));
    }
  }
  walk(header);
  return {bytes, files};
}
function delta(before, after) {
  const block = 32, index = new Map(), ops = [];
  for (let i = 0; i + block <= before.length; i += block) {
    const key = before.toString('latin1', i, i + block);
    if (!index.has(key)) index.set(key, i);
  }
  let at = 0, pending = 0;
  while (at + block <= after.length) {
    const old = index.get(after.toString('latin1', at, at + block));
    if (old === undefined) { at++; continue; }
    let length = block;
    while (old + length < before.length && at + length < after.length && before[old + length] === after[at + length]) length++;
    if (at > pending) ops.push(after.subarray(pending, at).toString('base64'));
    ops.push([old, length]);
    at += length;
    pending = at;
  }
  if (pending < after.length) ops.push(after.subarray(pending).toString('base64'));
  const rebuilt = Buffer.concat(ops.map(op => typeof op === 'string' ? Buffer.from(op, 'base64') : before.subarray(op[0], op[0] + op[1])));
  if (!rebuilt.equals(after)) throw Error('Recipe round-trip failed');
  return ops;
}
const [source, target, destination] = process.argv.slice(2);
if (!source || !target || !destination) throw Error('Usage: node tools/generate-recipes.cjs ORIGINAL.asar TESTED.asar OUTPUT.json');
const original = archive(source), final = archive(target), files = [];
for (const [name, bytes] of final.files) {
  const before = original.files.get(name);
  if (before && before.equals(bytes)) continue;
  files.push({path:name, beforeSha256:before ? hash(before) : null, afterSha256:hash(bytes), size:bytes.length, ops:delta(before || Buffer.alloc(0), bytes)});
}
const result = {format:1, appVersion:'7.0.6', patchVersion:'1.0.0', sourceSha256:hash(original.bytes), targetSha256:hash(final.bytes), targetSize:final.bytes.length, files};
fs.mkdirSync(path.dirname(destination), {recursive:true});
fs.writeFileSync(destination, JSON.stringify(result, null, 2) + '\n');
console.log(JSON.stringify({changedFiles:files.length, recipeBytes:fs.statSync(destination).size, sourceSha256:result.sourceSha256, targetSha256:result.targetSha256}));
