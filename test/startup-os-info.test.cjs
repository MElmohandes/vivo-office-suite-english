const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { EventEmitter } = require('node:events');
const source = fs.readFileSync(path.join(__dirname, '../src/runtime/startup-os-info.cjs'), 'utf8');
function fixture(responses) {
  const calls = [];
  const processStub = Object.assign(new EventEmitter(), { execPath: 'electron.exe', env: { PRESERVED: 'yes' } });
  const stubRequire = name => name === 'node:child_process' ? {
    execFile(executable, args, options, callback) {
      const child = { kills: 0, kill() { this.kills++; } };
      calls.push({ executable, args, options, child });
      const response = responses.shift();
      if (response) setImmediate(() => callback(response.error, response.stdout));
      return child;
    },
  } : require(name);
  const module = { exports: {} };
  vm.runInNewContext('(function(require,module,process){' + source + '\n})', {})(stubRequire, module, processStub);
  return { getOSInfo: module.exports.getOSInfo, calls, process: processStub };
}
const options = { executable: 'electron.exe', addon: 'native-addon.js' };
const info = { os: { version: '10.0.26300', type: 11 }, hardware: { model: 'test', graphics: 'test' } };
test('one child serves concurrent queries and preserves the complete native result', async () => {
  const f = fixture([{ stdout: JSON.stringify(info) }]);
  const first = f.getOSInfo(options), second = f.getOSInfo(options);
  assert.equal(first, second);
  assert.deepEqual(JSON.parse(await first), info);
  assert.equal(f.calls.length, 1);
  assert.equal(f.calls[0].options.env.PRESERVED, 'yes');
  assert.equal(f.calls[0].options.env.ELECTRON_RUN_AS_NODE, '1');
  assert.equal(f.calls[0].options.windowsHide, true);
  assert.equal(f.calls[0].options.timeout, 60000);
  assert.equal(f.process.listenerCount('exit'), 0);
});
test('invalid output is rejected and a subsequent query can retry', async () => {
  const f = fixture([{ stdout: '{"os":{}}' }, { stdout: JSON.stringify(info) }]);
  await assert.rejects(f.getOSInfo(options), /Invalid OS information/);
  assert.deepEqual(JSON.parse(await f.getOSInfo(options)), info);
  assert.equal(f.calls.length, 2);
  assert.equal(f.process.listenerCount('exit'), 0);
});
test('child failures propagate and release exit handlers', async () => {
  const f = fixture([{ error: new Error('native query failed') }]);
  await assert.rejects(f.getOSInfo(options), /native query failed/);
  assert.equal(f.process.listenerCount('exit'), 0);
});
test('the child is stopped if the parent exits during hardware collection', () => {
  const f = fixture([]);
  f.getOSInfo(options);
  f.process.emit('exit');
  assert.equal(f.calls[0].child.kills, 1);
});

