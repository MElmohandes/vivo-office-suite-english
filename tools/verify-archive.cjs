'use strict';
const fs = require('node:fs');
const {hash, readArchive, verifyPacked} = require('../src/patch.cjs');
const manifest = require('../patches/7.0.6.json');
try {
  if (process.argv.length !== 3) throw Error('Usage: node tools/verify-archive.cjs OUTPUT.asar');
  const bytes = fs.readFileSync(process.argv[2]);
  if (hash(bytes) !== manifest.targetSha256 || bytes.length !== manifest.targetSize) throw Error('Archive does not match release '+manifest.patchVersion);
  const {header, dataStart} = readArchive(bytes);
  console.log(JSON.stringify({sha256:hash(bytes), bytes:bytes.length, ...verifyPacked(bytes, header, dataStart)}, null, 2));
} catch (error) {console.error(error.message); process.exitCode = 1;}
