import * as fs from 'node:fs';
import { randomUUID } from 'node:crypto';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { BUILT_IN_CLIENT_ID, GALAXY_URL, validateConfig } from './presence.js';
const root = fileURLToPath(new URL('../', import.meta.url));
const launcherName = 'Anthropic Discord Presence.vbs';
const legacyNames = ['Claude Presence.vbs', 'Anthropic Presence.vbs'];
function options(value = {}) { return { io: fs, appRoot: root, platform: process.platform, appdata: process.env.APPDATA, execPath: process.execPath, ...value }; }
function target(value) {
  if (value.platform !== 'win32' || !value.appdata) throw new Error('Windows startup requires Windows.');
  return join(value.appdata, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
}
function remove(io, path) { try { io.unlinkSync(path); } catch (error) { if (error.code !== 'ENOENT') throw error; } }
function atomicWrite(io, path, data, label) {
  const parts = new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Denver', year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23' }).formatToParts(new Date());
  const field = name => parts.find(part => part.type === name).value;
  const temporary = join(dirname(path), label + '-' + randomUUID() + '-' + field('year') + field('month') + field('day') + '-' + field('hour') + field('minute') + field('second') + '.tmp');
  io.mkdirSync(dirname(path), { recursive: true });
  let created = false;
  try {
    io.writeFileSync(temporary, data, { flag: 'wx', mode: 0o600 });
    created = true;
    io.renameSync(temporary, path);
  } finally { if (created) remove(io, temporary); }
}
export function startupEnabled(value) {
  const opts = options(value);
  try { return opts.io.readFileSync(join(target(opts), launcherName), 'utf8').includes(join(opts.appRoot, 'src', 'launch.js')); } catch { return false; }
}
export function setStartup(enabled, value) {
  if (typeof enabled !== 'boolean') throw new Error('Choose whether to run on startup.');
  const opts = options(value), { io } = opts;
  const dir = target(opts), path = join(dir, launcherName), configPath = join(opts.appRoot, '.local', 'config.json');
  let previous;
  try { previous = io.readFileSync(configPath, 'utf8'); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  const config = validateConfig(previous === undefined ? { clientId: BUILT_IN_CLIENT_ID, image: GALAXY_URL } : JSON.parse(previous));
  config.automaticOnStart = enabled;
  const legacyPaths = [...new Set(legacyNames.filter(name => name !== launcherName).map(name => join(dir, name)))];
  const snapshots = new Map([[configPath, previous]]);
  // Snapshot only this app's fixed, known launcher names before making any change.
  for (const entry of [path, ...legacyPaths]) {
    try { snapshots.set(entry, io.readFileSync(entry, 'utf8')); }
    catch (error) { if (error.code !== 'ENOENT') throw error; snapshots.set(entry, undefined); }
  }
  const changed = [];
  try {
    // Persist valid configuration before replacing or removing any existing launcher.
    atomicWrite(io, configPath, JSON.stringify(config, null, 2) + '\n', 'anthropic-discord-presence-config');
    changed.push(configPath);
    if (enabled) {
      const command = '"' + opts.execPath + '" "' + join(opts.appRoot, 'src', 'launch.js') + '" --background';
      const script = 'Set shell = CreateObject("WScript.Shell")\r\nshell.Run "' + command.replaceAll('"', '""') + '", 0, False\r\n';
      atomicWrite(io, path, script, 'anthropic-discord-presence-startup');
    } else remove(io, path);
    changed.push(path);
    // A valid replacement exists before migration removes older launchers.
    for (const legacyPath of legacyPaths) {
      remove(io, legacyPath);
      changed.push(legacyPath);
    }
  } catch (error) {
    const failures = [];
    for (const entry of changed.reverse()) {
      try {
        const old = snapshots.get(entry);
        if (old === undefined) remove(io, entry);
        else atomicWrite(io, entry, old, 'anthropic-discord-presence-rollback');
      } catch (rollbackError) { failures.push(rollbackError); }
    }
    if (failures.length) throw new AggregateError([error, ...failures], 'Startup update failed and some previous files could not be restored.');
    throw error;
  }
  return config;
}
