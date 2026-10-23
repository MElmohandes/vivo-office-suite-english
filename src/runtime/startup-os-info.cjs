'use strict';

// The native hardware inventory can block for tens of seconds on some PCs.
// Keep its original result, but collect it outside Electron's main thread.
const { execFile } = require('node:child_process');
const fs = require('node:fs');
const path = require('node:path');
let pending;

function getOSInfo(options = {}) {
  if (pending) return pending;
  const executable = options.executable || process.execPath;
  const unpacked = process.resourcesPath && path.join(process.resourcesPath,
    'app.asar.unpacked', 'node_modules', 'electron-dragfile', 'index.js');
  const addon = options.addon || (unpacked && fs.existsSync(unpacked)
    ? unpacked : require.resolve('electron-dragfile'));
  pending = new Promise((resolve, reject) => {
    const script = 'const value=require(process.argv[1]).getOSInfo();'
      + 'const info=JSON.parse(value);'
      + 'if(!info || !info.os || typeof info.os.version!=="string")throw Error("Invalid OS information");'
      + 'process.stdout.write(JSON.stringify(info));';
    const child = execFile(executable, ['-e', script, addon], {
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
      windowsHide: true,
      timeout: 60000,
      maxBuffer: 1024 * 1024,
      encoding: 'utf8',
    }, (error, stdout) => {
      process.removeListener('exit', stop);
      if (error) { reject(error); return; }
      try {
        const info = JSON.parse(stdout);
        if (!info || !info.os || typeof info.os.version !== 'string') throw Error('Invalid OS information');
        resolve(JSON.stringify(info));
      } catch (error) { reject(error); }
    });
    const stop = () => child.kill();
    process.once('exit', stop);
  }).catch(error => { pending = undefined; throw error; });
  return pending;
}

module.exports = { getOSInfo };
