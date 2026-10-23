'use strict';
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
function readArchive(bytes) {
  if (bytes.length < 16) throw Error('Invalid ASAR header');
  const headerSize = bytes.readUInt32LE(4), jsonLength = bytes.readUInt32LE(12);
  if (headerSize > 50_000_000 || jsonLength > headerSize - 8 || 8 + headerSize > bytes.length) throw Error('Invalid ASAR header');
  return {header:JSON.parse(bytes.subarray(16, 16 + jsonLength).toString('utf8')), dataStart:8 + headerSize};
}
function entryAt(header, filename, create = false) {
  const parts = filename.split('/');
  if (parts.some(p => !p || p === '.' || p === '..' || ['__proto__','prototype','constructor'].includes(p))) throw Error('Invalid archive path');
  let dir = header;
  for (const part of parts.slice(0, -1)) {
    if (!dir.files?.[part]?.files) throw Error('Missing archive directory: ' + filename);
    dir = dir.files[part];
  }
  const name = parts.at(-1);
  if (!dir.files[name] && create) dir.files[name] = {};
  return dir.files[name];
}
function applyRecipe(before, recipe) {
  if (recipe.beforeSha256 !== null && hash(before) !== recipe.beforeSha256) throw Error('File hash mismatch: ' + recipe.path);
  const bytes = Buffer.concat(recipe.ops.map(op => {
    if (typeof op === 'string') return Buffer.from(op, 'base64');
    if (!Array.isArray(op) || op.length !== 2 || !op.every(Number.isSafeInteger) || op[0] < 0 || op[1] < 0 || op[0] + op[1] > before.length) throw Error('Invalid copy operation');
    return before.subarray(op[0], op[0] + op[1]);
  }));
  if (bytes.length !== recipe.size || hash(bytes) !== recipe.afterSha256) throw Error('Patched file verification failed: ' + recipe.path);
  return bytes;
}
function verifyPacked(bytes, header, start) {
  let packed = 0, unpacked = 0;
  function walk(dir) {
    for (const entry of Object.values(dir.files || {})) {
      if (entry.files) { walk(entry); continue; }
      if (entry.unpacked) { unpacked++; continue; }
      if (entry.link) continue;
      const data = bytes.subarray(start + Number(entry.offset), start + Number(entry.offset) + entry.size);
      if (data.length !== entry.size || entry.integrity?.algorithm !== 'SHA256' || hash(data) !== entry.integrity.hash) throw Error('Packed file integrity failure');
      const blockSize = entry.integrity.blockSize;
      if (!Number.isSafeInteger(blockSize) || blockSize <= 0) throw Error('Invalid integrity block size');
      const blocks = [];
      for (let at = 0; at < data.length; at += blockSize) blocks.push(hash(data.subarray(at, at + blockSize)));
      if (JSON.stringify(blocks) !== JSON.stringify(entry.integrity.blocks)) throw Error('Packed block integrity failure');
      packed++;
    }
  }
  walk(header);
  return {packed, unpacked};
}
function build(source, manifest) {
  if (manifest.format !== 1 || manifest.appVersion !== '7.0.6') throw Error('Unsupported patch manifest');
  if (hash(source) !== manifest.sourceSha256) throw Error('Unsupported input archive. This patch requires the original tested vivo Office Suite 7.0.6 archive. See docs/INSTALLATION.md.');
  const {header, dataStart} = readArchive(source), data = source.subarray(dataStart), appended = [];
  let next = data.length;
  for (const recipe of manifest.files) {
    const existing = entryAt(header, recipe.path);
    if (recipe.beforeSha256 === null && existing) throw Error('Addition already exists: ' + recipe.path);
    if (recipe.beforeSha256 !== null && (!existing || existing.unpacked || existing.link)) throw Error('Missing packed source: ' + recipe.path);
    const before = existing ? source.subarray(dataStart + Number(existing.offset), dataStart + Number(existing.offset) + existing.size) : Buffer.alloc(0);
    const bytes = applyRecipe(before, recipe);
    const entry = entryAt(header, recipe.path, true), blockSize = entry.integrity?.blockSize || 4 * 1024 * 1024, blocks = [];
    for (let at = 0; at < bytes.length; at += blockSize) blocks.push(hash(bytes.subarray(at, at + blockSize)));
    entry.size = bytes.length;
    entry.offset = String(next);
    entry.integrity = {algorithm:'SHA256', hash:hash(bytes), blockSize, blocks};
    appended.push(bytes);
    next += bytes.length;
  }
  const json = Buffer.from(JSON.stringify(header)), headerSize = Math.ceil((8 + json.length) / 4) * 4;
  const prefix = Buffer.alloc(8), pickle = Buffer.alloc(headerSize);
  prefix.writeUInt32LE(4); prefix.writeUInt32LE(headerSize, 4);
  pickle.writeUInt32LE(headerSize - 4); pickle.writeUInt32LE(json.length, 4); json.copy(pickle, 8);
  const output = Buffer.concat([prefix, pickle, data, ...appended]);
  if (output.length !== manifest.targetSize || hash(output) !== manifest.targetSha256) throw Error('Output does not match the tested release');
  const verified = verifyPacked(output, header, 8 + headerSize);
  return {output, verified};
}
if (require.main === module) {
  try {
    const args = process.argv.slice(2);
    if (args.length !== 2) throw Error('Usage: node src/patch.cjs ORIGINAL.asar OUTPUT.asar');
    const [input, output] = args.map(p => path.resolve(p));
    if (input === output || fs.existsSync(output)) throw Error('Choose a new output file; existing files are never overwritten');
    const manifest = require('../patches/7.0.6.json');
    const result = build(fs.readFileSync(input), manifest);
    fs.writeFileSync(output, result.output, {flag:'wx'});
    console.log(JSON.stringify({output, sha256:manifest.targetSha256, bytes:result.output.length, verified:result.verified}, null, 2));
  } catch (error) { console.error(error.message); process.exitCode = 1; }
}
module.exports = {hash, readArchive, applyRecipe, verifyPacked, build};
