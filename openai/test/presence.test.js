import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { GALAXY_URL, Presence, isRecentTask, modelLabel, effortLabel, activity, validateConfig } from '../src/presence.js';
import { detectAstra, folderProject } from '../src/detector.js';
import { frame, Decoder, DiscordRPC } from '../src/rpc.js';
import net from 'node:net';
import { randomUUID } from 'node:crypto';

test('manual timer persists through updates and resets only after stop or mode change', () => {
  const p = new Presence();
  assert.equal(p.update(true, 10000), null);
  p.setMode('manual'); assert.equal(p.update(false, 10000), 10);
  p.setMode('manual'); assert.equal(p.update(false, 30000), 10);
  p.setMode('off'); assert.equal(p.update(true, 40000), null);
  p.setMode('manual'); assert.equal(p.update(false, 50000), 50);
  assert.throws(() => p.setMode('anything'));
});
test('automatic stops on idle and resumes with a fresh timer', () => {
  const p = new Presence(); p.setMode('auto');
  assert.equal(p.update(true, 10000), 10);
  assert.equal(p.update(false, 20000), null);
  assert.equal(p.update(true, 30000), 30);
});
test('any model counts when its timestamp is valid and recent', () => {
  const now = 1_000_000;
  assert.equal(isRecentTask({ model: 'gpt-6-astra', updated_at: 999 }, now), true);
  assert.equal(isRecentTask({ model: 'gpt-5.6-sol', updated_at: 999 }, now), true);
  for (const row of [null, { model: '', updated_at: 999 },
    { model: 'gpt-6-astra', updated_at: 700 }, { model: 'gpt-6-astra', updated_at: 1100 },
    { model: 'gpt-6-astra', updated_at: 'invalid' }]) assert.equal(isRecentTask(row, now), false);
});
test('exact model ids become friendly names, and the raw id shows on hover', () => {
  assert.equal(modelLabel('gpt-6-astra'), 'GPT-6 Astra');
  assert.equal(modelLabel('gpt-5.6-sol'), 'GPT-5.6 Sol');
  assert.equal(modelLabel('gpt-6-luna'), 'GPT-6 Luna');
  assert.equal(modelLabel('gpt-4o'), 'GPT-4o');
  assert.equal(modelLabel('o3-pro'), 'o3-pro');
  assert.equal(modelLabel(''), '');
  const card = activity(17, 'astra_galaxy', '', 'gpt-5.6-sol');
  assert.equal(card.details, 'Using GPT-5.6 Sol');
  assert.equal(card.assets.large_text, 'gpt-5.6-sol');
  assert.equal(card.assets.large_image, 'astra_galaxy');
});
test('payload contains only fixed public fields and elapsed timestamp', () => {
  assert.equal(activity(null), null);
  assert.deepEqual(activity(17), { type: 0, name: 'OpenAI', details: 'Using GPT-6 Astra', state: 'Exploring ideas',
    timestamps: { start: 17 }, assets: { large_image: GALAXY_URL, large_text: 'GPT-6 Astra' } });
  assert.throws(() => validateConfig({ clientId: 'not-a-token' }));
  assert.throws(() => validateConfig({ clientId: '123456789012345678', image: 'http://example.com/image' }));
});
test('project name is the chat folder, never a path, Codex scratch folder or home folder', () => {
  const home = 'C:\\Users\\me';
  assert.equal(folderProject("\\\\?\\C:\\Users\\me\\Documents\\ChatGPT\\Mommy's 2", home), "Mommy's 2");
  assert.equal(folderProject('C:\\Users\\me\\Documents\\Projects\\paper-girl\\', home), 'paper-girl');
  assert.equal(folderProject('\\\\?\\C:\\Users\\me\\Documents\\Codex\\2026-10-03\\lau', home), '');
  // Codex's own folders are not projects: the plain Codex folder and ChatGPT-project folders named by an internal id.
  assert.equal(folderProject('\\\\?\\C:\\Users\\me\\Documents\\Codex', home), '');
  assert.equal(folderProject('\\\\?\\C:\\Users\\me\\.codex\\.chatgpt-projects\\g-p-6ac5a16085448191b30cc823b9c0e81f', home), '');
  assert.equal(folderProject('D:\\Games\\Codex Mod', home), 'Codex Mod');
  assert.equal(folderProject('C:\\Users\\me', home), '');
  assert.equal(folderProject(null, home), '');
});
test('read-only detector excludes subagents and follows the newest primary task model', () => {
  const dir = mkdtempSync(join(tmpdir(), 'astra-detect-'));
  try {
    const db = new DatabaseSync(join(dir, 'state_5.sqlite'));
    db.exec('CREATE TABLE threads(model TEXT, updated_at INTEGER, archived INTEGER, source TEXT, agent_path TEXT, cwd TEXT, id TEXT, project_id TEXT)');
    const add = db.prepare('INSERT INTO threads(model, updated_at, archived, source, agent_path) VALUES (?, ?, ?, ?, ?)');
    add.run('gpt-6-astra', 999, 0, 'vscode', null);
    add.run('codex-auto-review', 1000, 0, '{"subagent":{}}', null);
    assert.equal(detectAstra(dir, 1_000_000).active, true);
    const folder = join(dir, "Mommy's Basis of Design"); mkdirSync(folder);
    db.prepare('UPDATE threads SET cwd = ? WHERE model = ?').run(folder, 'gpt-6-astra');
    assert.equal(detectAstra(dir, 1_000_000).project, '');
    db.exec("UPDATE threads SET id = 'task', project_id = 'project' WHERE model = 'gpt-6-astra'"); writeFileSync(join(dir, '.codex-global-state.json'), JSON.stringify({'local-projects': {project: {name: "Saved Project"}}}));
    assert.equal(detectAstra(dir, 1_000_000, true).project, "Mommy's Basis of Design");
    db.prepare('UPDATE threads SET cwd = ? WHERE model = ?').run('\\\\?\\C:\\Users\\private\\Documents\\Codex\\2026-10-03\\lau', 'gpt-6-astra');
    assert.equal(detectAstra(dir, 1_000_000, true).project, 'Saved Project');
    // A folder that was renamed or deleted must not show its old name: fall back to the saved Codex project.
    db.prepare('UPDATE threads SET cwd = ? WHERE model = ?').run(join(dir, "Mommy's 2"), 'gpt-6-astra');
    assert.equal(detectAstra(dir, 1_000_000, true).project, 'Saved Project');
    assert.deepEqual(detectAstra(dir, 1_000_000, true).projects, ['Saved Project']);
    assert.equal(detectAstra(dir, 2_000_000, true).project, '');
    assert.equal(detectAstra(dir, 1_000_000).model, 'gpt-6-astra');
    add.run('gpt-5.6-sol', 1001, 0, 'vscode', null);
    assert.equal(detectAstra(dir, 1_002_000).model, 'gpt-5.6-sol');
    assert.equal(detectAstra(dir, 2_000_000).model, '');
    db.close();
    assert.equal(detectAstra(join(dir, 'missing')).active, false);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('detector reads the effort level when Codex records it, and works without it', () => {
  const dir = mkdtempSync(join(tmpdir(), 'astra-effort-'));
  try {
    const db = new DatabaseSync(join(dir, 'state_5.sqlite'));
    db.exec('CREATE TABLE threads(model TEXT, updated_at INTEGER, archived INTEGER, source TEXT, agent_path TEXT, reasoning_effort TEXT)');
    db.prepare("INSERT INTO threads VALUES ('gpt-6-astra', 999, 0, 'vscode', NULL, 'ultra')").run();
    assert.equal(detectAstra(dir, 1_000_000).effort, 'ultra');
    assert.equal(detectAstra(dir, 2_000_000).effort, '');
    db.close();
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('the card names the effort level next to a known model', () => {
  assert.equal(activity(17, 'astra_galaxy', '', 'gpt-6-astra', 'ultra').details, 'Using GPT-6 Astra on Ultra');
  assert.equal(activity(17, 'astra_galaxy', '', 'gpt-5.6-sol', 'low').details, 'Using GPT-5.6 Sol on Low');
  assert.equal(activity(17, 'astra_galaxy', '', 'gpt-6-astra', '').details, 'Using GPT-6 Astra');
  assert.equal(activity(17, 'astra_galaxy', '', '', 'high').details, 'Using GPT-6 Astra');
  assert.equal(effortLabel('xhigh'), 'Extra High');
  assert.equal(effortLabel('<b>high</b>'), '');
});
test('project sharing is opt-in and project payload is bounded plain text', () => {
  assert.equal(validateConfig({ clientId: '123456789012345678' }).shareProject, false);
  const cfg = validateConfig({ clientId: '123456789012345678', shareProject: true, projectName: '  My\nProject  ' });
  assert.equal(cfg.projectName, 'My Project');
  assert.equal(activity(17, 'astra_galaxy', "Mommy's Basis of Design").state, "Working on Mommy's Basis of Design");
  assert.ok(activity(17, 'astra_galaxy', 'x'.repeat(200)).state.length <= 128);
});
test('IPC framing handles fragmented and combined packets, plus bounded sizes', () => {
  const decoder = new Decoder(); const packet = frame(1, { evt: 'READY' });
  assert.deepEqual(decoder.push(packet.subarray(0, 5)), []);
  assert.equal(decoder.push(Buffer.concat([packet.subarray(5), frame(3, 'ping')])).length, 2);
  const header = Buffer.alloc(8); header.writeUInt32LE(2 * 1024 * 1024, 4);
  assert.throws(() => new Decoder().push(header), /Oversized/);
});
test('real named-pipe mock verifies handshake, ping/pong, activity ACK, and clearing', async () => {
  const pipe = process.platform === 'win32' ? `\\\\.\\pipe\\astra-test-${randomUUID()}` : join(tmpdir(), `astra-${randomUUID()}.sock`);
  const packets = []; const sockets = new Set();
  const server = net.createServer(socket => {
    sockets.add(socket); socket.on('close', () => sockets.delete(socket));
    const decoder = new Decoder();
    socket.on('data', chunk => {
      for (const { op, body } of decoder.push(chunk)) {
        if (op === 0) {
          packets.push(JSON.parse(body)); socket.write(frame(1, { evt: 'READY' })); socket.write(frame(3, 'alive'));
        } else if (op === 1) {
          const p = JSON.parse(body); packets.push(p); socket.write(frame(1, { cmd: p.cmd, nonce: p.nonce, data: {} }));
        } else if (op === 4) packets.push({ pong: body.toString() });
      }
    });
  });
  await new Promise(resolve => server.listen(pipe, resolve));
  const rpc = new DiscordRPC();
  try {
    await rpc.openPipe(pipe, '123456789012345678');
    await rpc.setActivity(activity(123)); await rpc.setActivity(null);
    assert.equal(packets[0].client_id, '123456789012345678');
    assert.ok(packets.some(p => p.pong));
    assert.deepEqual(packets.filter(p => p.cmd === 'SET_ACTIVITY').map(p => p.args.activity), [activity(123), null]);
  } finally { rpc.disconnect(); sockets.forEach(s => s.destroy()); await new Promise(resolve => server.close(resolve)); }
});
test('every recently active Codex chat folder is listed for rotation, newest first', () => {
  const dir = mkdtempSync(join(tmpdir(), 'astra-rotate-'));
  try {
    const db = new DatabaseSync(join(dir, 'state_5.sqlite'));
    db.exec('CREATE TABLE threads(model TEXT, updated_at INTEGER, archived INTEGER, source TEXT, agent_path TEXT, cwd TEXT, id TEXT, project_id TEXT)');
    const add = db.prepare('INSERT INTO threads(model, updated_at, archived, source, agent_path, cwd) VALUES (?, ?, 0, ?, NULL, ?)');
    mkdirSync(join(dir, 'paper-girl')); mkdirSync(join(dir, "Mommy's World"));
    add.run('gpt-6-astra', 990, 'vscode', join(dir, 'paper-girl'));
    add.run('gpt-6-astra', 999, 'vscode', join(dir, "Mommy's World"));
    add.run('gpt-6-astra', 100, 'vscode', 'C:\Users\me\Documents\Projects\stale');
    db.close();
    assert.deepEqual(detectAstra(dir, 1_000_000, true).projects, ["Mommy's World", 'paper-girl']);
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('card art defaults to the hosted galaxy and accepts asset keys or https links only', () => {
  assert.equal(validateConfig({ clientId: '123456789012345678' }).image, GALAXY_URL);
  assert.equal(validateConfig({ clientId: '123456789012345678', image: 'astra_galaxy' }).image, 'astra_galaxy');
  assert.throws(() => validateConfig({ clientId: '123456789012345678', image: 'http://insecure.example/x.png' }));
  assert.throws(() => validateConfig({ clientId: '123456789012345678', image: 'javascript:alert(1)' }));
});
