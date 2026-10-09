import test from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, rmSync, writeFileSync, appendFileSync, renameSync, statSync, mkdirSync, utimesSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { GALAXY_URL, Presence, activity, validateConfig, modelLabel, effortLabel, selectSession } from '../src/presence.js';
import { detectClaude, isRecent, transcriptModel, transcriptInfo, folderProject } from '../src/detector.js';
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
test('recent Claude Code activity window', () => {
  const now = 1_000_000;
  assert.equal(isRecent(now - 1000, now), true);
  for (const t of [0, now - 6 * 60 * 1000, now + 60_000]) assert.equal(isRecent(t, now), false);
});
test('payload contains only fixed public fields and elapsed timestamp', () => {
  assert.equal(activity(null), null);
  assert.deepEqual(activity(17), { type: 0, name: 'Anthropic', details: 'Using Claude', state: 'Exploring ideas',
    timestamps: { start: 17 }, assets: { large_image: GALAXY_URL, large_text: 'Claude' } });
  assert.throws(() => validateConfig({ clientId: 'not-a-token' }));
  assert.throws(() => validateConfig({ clientId: '123456789012345678', image: 'http://example.com/image' }));
});
test('exact model ids become friendly names, and the raw id shows on hover', () => {
  assert.equal(modelLabel('claude-opus-5-5'), 'Claude Opus 5.5');
  assert.equal(modelLabel('claude-fable-5-1'), 'Claude Fable 5.1');
  assert.equal(modelLabel('claude-haiku-4-5-20251001'), 'Claude Haiku 4.5');
  assert.equal(modelLabel('claude-opus-4-1[1m]'), 'Claude Opus 4.1 (1M)');
  assert.equal(modelLabel('claude-3-5-sonnet-20241022'), 'Claude 3.5 Sonnet');
  assert.equal(modelLabel('something-new'), 'something-new');
  const card = activity(17, 'claude_bloom', '', 'claude-opus-5-5');
  assert.equal(card.details, 'Using Claude Opus 5.5');
  assert.equal(card.assets.large_text, 'claude-opus-5-5');
  assert.equal(card.assets.large_image, 'claude_bloom');
});
test('detector reads Claude Code transcript times and falls back to the desktop app', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'claude-detect-'));
  try {
    const never = async () => false;
    assert.equal((await detectClaude({ home: dir, desktop: never })).active, false);
    mkdirSync(join(dir, 'projects', 'p1'), { recursive: true });
    const file = join(dir, 'projects', 'p1', 'session-20261008.jsonl'); writeFileSync(file, '{}');
    assert.equal((await detectClaude({ home: dir, desktop: never })).active, true);
    const old = new Date(Date.now() - 10 * 60 * 1000); utimesSync(file, old, old);
    assert.equal((await detectClaude({ home: dir, desktop: never })).active, false);
    assert.equal((await detectClaude({ home: dir, desktop: async () => true })).active, true);
    assert.equal((await detectClaude({ home: dir, desktop: async () => { throw new Error('x'); } })).active, false);
    writeFileSync(file, '{"type":"assistant","message":{"model":"claude-sonnet-5-5","content":"secret"}}\n{"type":"assistant","message":{"model":"<synthetic>"}}\n{"type":"assistant","message":{"model":"claude-opus-5-5"}}\n');
    const found = await detectClaude({ home: dir, desktop: never });
    assert.equal(found.model, 'claude-opus-5-5');
    assert.equal(transcriptModel(join(dir, 'missing-20261008.jsonl')), '');
    const folder = join(dir, 'paper-girl'); mkdirSync(folder);
    writeFileSync(file, JSON.stringify({ type: 'assistant', cwd: folder, message: { model: 'claude-opus-5-5' } }) + '\n');
    assert.equal((await detectClaude({ home: dir, desktop: never })).project, 'paper-girl');
    // A folder that was moved or deleted must not show its old name.
    writeFileSync(file, JSON.stringify({ type: 'assistant', cwd: join(dir, 'claude-discord-presence'), message: { model: 'claude-opus-5-5' } }) + '\n');
    assert.equal((await detectClaude({ home: dir, desktop: never })).project, '');
    writeFileSync(file, JSON.stringify({ type: 'assistant', cwd: folder, message: { model: 'claude-opus-5-5' } }) + '\n');
    assert.equal((await detectClaude({ home: dir, desktop: never })).effort, '');
    writeFileSync(file, '{"type":"assistant","effort":"medium","message":{"model":"claude-opus-5-5"}}\n{"type":"assistant","effort":"high","perTurnEffort":"high","message":{"model":"claude-opus-5-5"}}\n');
    assert.equal((await detectClaude({ home: dir, desktop: never })).effort, 'high');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});
test('the card names the effort level next to a known model', () => {
  assert.equal(activity(17, 'claude_bloom', '', 'claude-opus-5-5', 'high').details, 'Using Claude Opus 5.5 on High');
  assert.equal(activity(17, 'claude_bloom', '', 'claude-opus-5-5', 'xhigh').details, 'Using Claude Opus 5.5 on Extra High');
  assert.equal(activity(17, 'claude_bloom', '', 'claude-opus-5-5', '').details, 'Using Claude Opus 5.5');
  assert.equal(activity(17, 'claude_bloom', '', '', 'high').details, 'Using Claude');
  assert.equal(effortLabel('max'), 'Max');
  assert.equal(effortLabel('turbo'), 'Turbo');
  assert.equal(effortLabel('<b>high</b>'), '');
});
test('project name is the working folder, never a path, scratch workspace or home folder', () => {
  const home = 'C:\\Users\\me';
  assert.equal(folderProject("C:\\Users\\me\\Documents\\ChatGPT\\Mommy's Discord\\Astra-Infinite-Pole", home), 'Astra-Infinite-Pole');
  assert.equal(folderProject('\\\\?\\C:\\Users\\me\\Documents\\Projects\\paper-girl\\', home), 'paper-girl');
  assert.equal(folderProject('C:\\Users\\me\\AppData\\Roaming\\Claude\\scratch-workspaces\\a\\b\\scratch-2026-10-07-dfb082', home), '');
  assert.equal(folderProject('C:\\Users\\me', home), '');
  assert.equal(folderProject('', home), '');
});
test('project sharing is opt-in and project payload is bounded plain text', () => {
  assert.equal(validateConfig({ clientId: '123456789012345678' }).shareProject, false);
  const cfg = validateConfig({ clientId: '123456789012345678', shareProject: true, projectName: '  My\nProject  ' });
  assert.equal(cfg.projectName, 'My Project');
  assert.equal(activity(17, 'claude_bloom', "Mommy's Basis of Design").state, "Working on Mommy's Basis of Design");
  assert.ok(activity(17, 'claude_bloom', 'x'.repeat(200)).state.length <= 128);
});
test('IPC framing handles fragmented and combined packets, plus bounded sizes', () => {
  const decoder = new Decoder(); const packet = frame(1, { evt: 'READY' });
  assert.deepEqual(decoder.push(packet.subarray(0, 5)), []);
  assert.equal(decoder.push(Buffer.concat([packet.subarray(5), frame(3, 'ping')])).length, 2);
  const header = Buffer.alloc(8); header.writeUInt32LE(2 * 1024 * 1024, 4);
  assert.throws(() => new Decoder().push(header), /Oversized/);
});
test('real named-pipe mock verifies handshake, ping/pong, activity ACK, and clearing', async () => {
  const pipe = process.platform === 'win32' ? `\\\\.\\pipe\\claude-test-${randomUUID()}` : join(tmpdir(), `claude-${randomUUID()}.sock`);
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
test('every recently active Claude Code folder is listed for rotation, newest first', async () => {
  const dir = mkdtempSync(join(tmpdir(), 'claude-rotate-'));
  try {
    mkdirSync(join(dir, 'projects', 'a'), { recursive: true }); mkdirSync(join(dir, 'projects', 'b'), { recursive: true });
    const older = join(dir, 'projects', 'a', 'older-20261008.jsonl'), newer = join(dir, 'projects', 'b', 'newer-20261008.jsonl');
    mkdirSync(join(dir, 'paper-girl')); mkdirSync(join(dir, 'fuzzbois'));
    writeFileSync(older, JSON.stringify({ type: 'assistant', cwd: join(dir, 'paper-girl'), effort: 'low', message: { model: 'claude-haiku-4-5' } }) + '\n');
    writeFileSync(newer, JSON.stringify({ type: 'assistant', cwd: join(dir, 'fuzzbois'), effort: 'high', message: { model: 'claude-opus-5-5' } }) + '\n');
    const minuteAgo = new Date(Date.now() - 60_000); utimesSync(older, minuteAgo, minuteAgo);
    const found = await detectClaude({ home: dir, desktop: async () => false });
    assert.deepEqual(found.projects, ['fuzzbois', 'paper-girl']);
    assert.deepEqual(found.sessions, [
      { project: 'fuzzbois', model: 'claude-opus-5-5', effort: 'high' },
      { project: 'paper-girl', model: 'claude-haiku-4-5', effort: 'low' },
    ]);
    const selected = selectSession(found, { shareProject: true }, 15000);
    const card = activity(17, undefined, selected.project, selected.model, selected.effort);
    assert.equal(card.details, 'Using Claude Haiku 4.5 on Low');
    assert.equal(card.state, 'Working on paper-girl');
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('complete transcript records preserve model across large replies and tool results without trusting nested fields', () => {
  const dir = mkdtempSync(join(tmpdir(), 'claude-records-'));
  const file = join(dir, 'large-session-20261008.jsonl');
  try {
    const reply = { type: 'assistant', cwd: dir, effort: 'high', message: { model: 'claude-opus-5-5', content: [
      { type: 'text', text: 'large reply '.repeat(20000) },
      { type: 'tool_use', input: { cwd: 'C:/wrong-project', model: 'claude-haiku-4-5', effort: 'low' } },
    ] } };
    writeFileSync(file, JSON.stringify(reply) + '\n');
    const expected = { model: 'claude-opus-5-5', effort: 'high', cwd: dir };
    assert.deepEqual(transcriptInfo(file), expected);
    appendFileSync(file, JSON.stringify({ type: 'user', cwd: dir, message: { model: 'claude-haiku-4-5', content: [
      { type: 'tool_result', content: 'large result '.repeat(150000), model: 'claude-haiku-4-5', effort: 'low', cwd: 'C:/wrong-project' },
    ] } }) + '\n');
    assert.deepEqual(transcriptInfo(file), expected);
    appendFileSync(file, '{"type":"assistant","message":{"model":"claude-haiku-4-5"');
    assert.deepEqual(transcriptInfo(file), expected);
    appendFileSync(file, '},"cwd":"","effort":"low","perTurnEffort":"high"}\n');
    assert.deepEqual(transcriptInfo(file), { model: 'claude-haiku-4-5', effort: 'high', cwd: '' });
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('transcript metadata cache invalidates on truncation and file replacement', () => {
  const dir = mkdtempSync(join(tmpdir(), 'claude-cache-'));
  const file = join(dir, 'session-20261008.jsonl');
  const replacement = join(dir, 'replacement-20261008.jsonl');
  try {
    const record = model => JSON.stringify({ type: 'assistant', cwd: dir, effort: 'high', message: { model } }) + '\n';
    writeFileSync(file, record('claude-opus-5-5'));
    const first = transcriptInfo(file);
    first.model = 'caller mutation';
    assert.equal(transcriptInfo(file).model, 'claude-opus-5-5');
    const before = statSync(file);
    writeFileSync(replacement, record('claude-opus-4-1'));
    utimesSync(replacement, before.atime, before.mtime);
    renameSync(replacement, file);
    assert.equal(transcriptInfo(file).model, 'claude-opus-4-1');
    writeFileSync(file, '{"type":"user","cwd":""}\n');
    assert.deepEqual(transcriptInfo(file), { model: '', effort: '', cwd: '' });
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('an oversized transcript record fails safely until newer complete metadata is available', () => {
  const dir = mkdtempSync(join(tmpdir(), 'claude-bounded-'));
  const file = join(dir, 'session-20261008.jsonl');
  try {
    const reply = JSON.stringify({ type: 'assistant', cwd: dir, effort: 'high', message: { model: 'claude-opus-5-5' } }) + '\n';
    writeFileSync(file, reply);
    appendFileSync(file, JSON.stringify({ type: 'user', cwd: dir, message: { content: 'x'.repeat(9 * 1024 * 1024) } }) + '\n');
    assert.deepEqual(transcriptInfo(file), { model: '', effort: '', cwd: '' });
    appendFileSync(file, reply);
    assert.deepEqual(transcriptInfo(file), { model: 'claude-opus-5-5', effort: 'high', cwd: dir });
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('unknown assistant metadata stays generic and cannot reuse an earlier effort', () => {
  const dir = mkdtempSync(join(tmpdir(), 'claude-unknown-'));
  const file = join(dir, 'session-20261008.jsonl');
  try {
    writeFileSync(file, JSON.stringify({ type: 'assistant', cwd: dir, effort: 'high', message: { model: 'claude-opus-5-5' } }) + '\n');
    appendFileSync(file, JSON.stringify({ type: 'assistant', cwd: dir, effort: 'low', message: { model: '<synthetic>' } }) + '\n');
    assert.equal(transcriptInfo(file).model, 'claude-opus-5-5');
    appendFileSync(file, JSON.stringify({ type: 'assistant', cwd: dir, effort: 'high', message: { model: 'unrecognized-provider' } }) + '\n');
    assert.deepEqual(transcriptInfo(file), { model: '', effort: '', cwd: dir });
    appendFileSync(file, JSON.stringify({ type: 'assistant', cwd: dir, effort: 'made-up', message: { model: 'claude-haiku-4-5' } }) + '\n');
    assert.deepEqual(transcriptInfo(file), { model: 'claude-haiku-4-5', effort: '', cwd: dir });
  } finally { rmSync(dir, { recursive: true, force: true }); }
});

test('session selection respects project privacy, fixed labels, and the current session model', () => {
  const sessions = [
    { project: 'project-a', model: 'claude-opus-5-5', effort: 'high' },
    { project: 'project-b', model: 'claude-haiku-4-5', effort: 'low' },
  ];
  assert.deepEqual(selectSession({ sessions }, { shareProject: true }, 0), sessions[0]);
  assert.deepEqual(selectSession({ sessions }, { shareProject: true }, 15000), sessions[1]);
  assert.deepEqual(selectSession({ sessions }, { shareProject: false, projectName: 'private' }, 15000), { ...sessions[0], project: '' });
  assert.deepEqual(selectSession({ sessions }, { shareProject: true, projectName: 'Fixed project' }, 15000), { ...sessions[0], project: 'Fixed project' });
  assert.deepEqual(selectSession({}, {}, 15000), { project: '', model: '', effort: '' });
});
test('card art defaults to the hosted galaxy and accepts asset keys or https links only', () => {
  assert.equal(validateConfig({ clientId: '123456789012345678' }).image, GALAXY_URL);
  assert.equal(validateConfig({ clientId: '123456789012345678', image: 'claude_bloom' }).image, 'claude_bloom');
  assert.throws(() => validateConfig({ clientId: '123456789012345678', image: 'http://insecure.example/x.png' }));
  assert.throws(() => validateConfig({ clientId: '123456789012345678', image: 'javascript:alert(1)' }));
});
