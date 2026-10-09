import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { launch } from '../src/launch.js';
import { SOURCE_IDENTITY } from '../src/source-identity-20261008.js';
import { setStartup, startupEnabled } from '../src/windows-startup.js';
import { BUILT_IN_CLIENT_ID, GALAXY_URL } from '../src/presence.js';

const app = JSON.parse(readFileSync(new URL('../package.json', import.meta.url), 'utf8')).name;
const company = app.startsWith('openai') ? 'OpenAI' : 'Anthropic';
const legacy = app.startsWith('openai') ? 'Astra Presence.vbs' : 'Claude Presence.vbs';
const error = code => Object.assign(new Error(code), { code });
function memory(options = {}) {
  const files = new Map(), events = [];
  const settings = { appRoot: 'C:/presence-audit', appdata: 'C:/audit-appdata', platform: 'win32', execPath: 'C:/node/node.exe' };
  const configPath = join(settings.appRoot, '.local', 'config.json');
  const startupDir = join(settings.appdata, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
  const legacyPath = join(startupDir, legacy);
  const io = {
    readFileSync(path) { if (!files.has(path)) throw error('ENOENT'); return files.get(path); },
    mkdirSync() {},
    writeFileSync(path, data, flags) {
      if (options.collision) { files.set(path, 'another writer'); throw error('EEXIST'); }
      if (options.failWrite) throw error('EACCES');
      if (flags?.flag === 'wx' && files.has(path)) throw error('EEXIST');
      files.set(path, data); events.push(['write', path]);
    },
    renameSync(from, to) {
      if (options.failLauncher && to.endsWith('.vbs')) throw error('EACCES');
      files.set(to, io.readFileSync(from)); files.delete(from); events.push(['rename', to]);
    },
    unlinkSync(path) {
      if (options.failLegacyCleanup && path === legacyPath) throw error('EACCES');
      if (!files.delete(path)) throw error('ENOENT'); events.push(['remove', path]);
    },
  };
  return { files, events, configPath, startupDir, legacyPath, options: { ...settings, io } };
}

test('fresh startup initializes defaults before migrating the legacy launcher', () => {
  const m = memory(); m.files.set(m.legacyPath, 'previous launcher');
  const config = setStartup(true, m.options);
  assert.equal(config.clientId, BUILT_IN_CLIENT_ID);
  assert.equal(config.image, GALAXY_URL);
  assert.equal(config.automaticOnStart, true);
  assert.equal(JSON.parse(m.files.get(m.configPath)).automaticOnStart, true);
  assert.equal(startupEnabled(m.options), true);
  assert.equal(m.files.has(m.legacyPath), false);
  const configWritten = m.events.findIndex(([action, path]) => action === 'rename' && path === m.configPath);
  const oldRemoved = m.events.findIndex(([action, path]) => action === 'remove' && path === m.legacyPath);
  assert.ok(configWritten >= 0 && oldRemoved > configWritten);
  assert.ok([...m.files.keys()].every(path => !path.endsWith('.tmp')));
});
test('failed configuration write preserves the old startup entry', () => {
  const m = memory({ failWrite: true }); m.files.set(m.legacyPath, 'previous launcher');
  assert.throws(() => setStartup(true, m.options), { code: 'EACCES' });
  assert.equal(m.files.get(m.legacyPath), 'previous launcher');
  assert.deepEqual(m.events, []);
});
test('failed launcher replacement restores config and preserves old launchers', () => {
  const m = memory({ failLauncher: true });
  const previous = JSON.stringify({ clientId: BUILT_IN_CLIENT_ID, image: GALAXY_URL, automaticOnStart: false, shareProject: true });
  m.files.set(m.configPath, previous); m.files.set(m.legacyPath, 'previous launcher');
  assert.throws(() => setStartup(true, m.options), { code: 'EACCES' });
  assert.equal(m.files.get(m.configPath), previous);
  assert.equal(m.files.get(m.legacyPath), 'previous launcher');
  assert.ok([...m.files.keys()].every(path => !path.endsWith('.tmp')));
});
test('exclusive temporary-file collision never removes another writer file', () => {
  const m = memory({ collision: true }); m.files.set(m.legacyPath, 'previous launcher');
  assert.throws(() => setStartup(true, m.options), { code: 'EEXIST' });
  assert.equal(m.files.get(m.legacyPath), 'previous launcher');
  assert.ok([...m.files.entries()].some(([path, data]) => path.endsWith('.tmp') && data === 'another writer'));
  assert.deepEqual(m.events, []);
});
test('legacy cleanup failure rolls back the new config and launcher', () => {
  const m = memory({ failLegacyCleanup: true });
  const previous = JSON.stringify({ clientId: BUILT_IN_CLIENT_ID, image: GALAXY_URL, automaticOnStart: false });
  m.files.set(m.configPath, previous); m.files.set(m.legacyPath, 'previous launcher');
  const before = [...m.files.entries()];
  assert.throws(() => setStartup(true, m.options), { code: 'EACCES' });
  assert.deepEqual([...m.files.entries()].sort(), before.sort());
  assert.equal(startupEnabled(m.options), false);
});
test('failed disable restores the previously active launcher and config', () => {
  const failure = {}, m = memory(failure); setStartup(true, m.options);
  m.files.set(m.legacyPath, 'legacy launcher');
  const before = [...m.files.entries()];
  failure.failLegacyCleanup = true;
  assert.throws(() => setStartup(false, m.options), { code: 'EACCES' });
  assert.deepEqual([...m.files.entries()].sort(), before.sort());
  assert.equal(startupEnabled(m.options), true);
});
test('disabling startup clears persisted automatic mode and all known launchers', () => {
  const m = memory(); setStartup(true, m.options); m.files.set(m.legacyPath, 'legacy');
  const config = setStartup(false, m.options);
  assert.equal(config.automaticOnStart, false);
  assert.equal(JSON.parse(m.files.get(m.configPath)).automaticOnStart, false);
  assert.equal(startupEnabled(m.options), false);
  assert.ok([...m.files.keys()].every(path => !path.endsWith('.vbs')));
});
test('invalid saved config cannot remove a working startup entry', () => {
  const m = memory(); m.files.set(m.configPath, '{invalid'); m.files.set(m.legacyPath, 'previous launcher');
  assert.throws(() => setStartup(true, m.options), SyntaxError);
  assert.equal(m.files.get(m.legacyPath), 'previous launcher');
  assert.deepEqual(m.events, []);
});
test('launcher rejects a stale or different installation without spawning anything', async () => {
  const variants = [undefined, { ...SOURCE_IDENTITY, buildId: 'old' }, { ...SOURCE_IDENTITY, installationPath: 'C:/other' }];
  for (const identity of variants) {
    let spawns = 0;
    await assert.rejects(launch({ fetcher: async () => ({ ok: true, json: async () => ({ app, identity }) }), spawnProcess: () => { spawns++; }, background: true }), /Quit app/);
    assert.equal(spawns, 0);
  }
});
test('launcher reuses matching running build and only opens browser when requested', async () => {
  const calls = [];
  const fetcher = async () => ({ ok: true, json: async () => ({ app, identity: SOURCE_IDENTITY }) });
  const spawnProcess = (...args) => { calls.push(args); return { unref() {} }; };
  await launch({ fetcher, spawnProcess, background: true }); assert.equal(calls.length, 0);
  await launch({ fetcher, spawnProcess, background: false });
  assert.equal(calls.length, 1); assert.equal(calls[0][0], 'rundll32.exe');
});
test('launcher starts absent companion once and waits for matching identity', async () => {
  let reads = 0; const calls = [];
  const fetcher = async () => { if (reads++ === 0) throw error('ECONNREFUSED'); return { ok: true, json: async () => ({ app, identity: SOURCE_IDENTITY }) }; };
  const spawnProcess = (...args) => { calls.push(args); return { on() {}, unref() {} }; };
  await launch({ fetcher, spawnProcess, background: true, sleep: async () => {} });
  assert.equal(calls.length, 1);
  assert.match(calls[0][1][0], /server\.js$/);
  assert.equal(SOURCE_IDENTITY.buildId.length, 64);
});
