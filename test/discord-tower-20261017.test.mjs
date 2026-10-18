// Guards Discord Tower: the server list, the shared file updater and the Servers section of the pet page.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadServers, pickTools, buildMessages, postMessages, runTool, attachmentName, MAX_FILES_PER_MESSAGE } from '../discord-tower/file-updater-20261017.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const servers = loadServers();
const press = servers.find((s) => s.id === 'press-plai');
const HOOK = 'https://discord.com/api/webhooks/123/abc-DEF_1';

test('Press Plai has one tool per file channel plus the ask-astra-bot', () => {
  const shorts = press.tools.map((t) => t.short);
  assert.deepEqual(shorts, ['press-plai-agents-file-updater', 'press-plai-skills-file-updater', 'press-plai-security-file-updater', 'press-plai-provenance-file-updater', 'press-plai-ask-astra-bot']);
  for (const t of press.tools) {
    assert.equal(t.id, `discord-tower-v1.0-${t.short}-v1.0`, 'tool boxes use <pet-program>-v<version>-<tool>-v<tool version>');
    assert.ok(t.short.startsWith(`press-plai-${t.channel}`), `${t.short} is named for its channel`);
  }
});

test('the server list never holds secrets or Discord IDs', () => {
  const text = readFileSync(join(root, 'discord-tower/servers-20261017.json'), 'utf8');
  assert.doesNotMatch(text, /discord(app)?\.com\/api\/webhooks/);
  assert.doesNotMatch(text, /\b\d{17,20}\b/, 'no snowflake IDs');
  assert.doesNotMatch(text, /sk-ant-|token"\s*:/i);
});

test('the pet page lists exactly the tools in the server list', () => {
  const html = readFileSync(join(root, 'findastra-discord-presence-20261008.html'), 'utf8');
  const embedded = JSON.parse(html.match(/window\.DISCORD_TOWER_SERVERS=(\[.*?\]);/s)[1]);
  assert.deepEqual(embedded, servers.map((s) => ({ id: s.id, name: s.name, job: s.job, tools: s.tools.map((t) => ({ id: t.id, short: t.short, channel: t.channel, kind: t.kind, job: t.job })) })));
});

test('pickTools finds a tool by short name or full id, and rejects unknown names', () => {
  assert.equal(pickTools('press-plai-agents-file-updater').length, 1);
  assert.equal(pickTools('discord-tower-v1.0-press-plai-provenance-file-updater-v1.0')[0].tool.channel, 'provenance-file');
  assert.equal(pickTools('all').length, 4, 'the chat bot is not a file updater');
  assert.throws(() => pickTools('nope'), /No file-updater tool/);
});

const fakeFile = (path, i = 0) => ({ repo: 'findastra/astras-pet-os', path, sha: 'abcdef1234567', name: attachmentName(path), url: `https://github.com/x/${path}`, content: Buffer.from('# ' + path + i) });

test('messages carry at most 10 files and never ping anyone', () => {
  const files = Array.from({ length: 23 }, (_, i) => fakeFile(`skills/s${i}/SKILL.md`, i));
  const messages = buildMessages(press.tools[1], files, new Date('2026-10-17T12:00:00Z'));
  assert.deepEqual(messages.map((m) => m.files.length), [10, 10, 3]);
  assert.ok(messages.every((m) => m.content.length <= 2000 && m.files.length <= MAX_FILES_PER_MESSAGE));
  assert.match(messages[0].content, /part 1 of 3/);
  assert.equal(files[0].name, 'skills--s0--SKILL.md');
});

function fakeDiscord() {
  const calls = [];
  let next = 1;
  const fetchFn = async (url, init) => {
    const payload = JSON.parse(init.body?.get('payload_json') ?? '{}');
    calls.push({ url, method: init.method, payload });
    if (init.method === 'PATCH' && url.endsWith('/gone')) return new Response('', { status: 404 });
    return Response.json({ id: init.method === 'POST' ? `m${next++}` : url.split('/').pop() });
  };
  return { calls, fetchFn };
}

test('postMessages edits earlier messages, reposts deleted ones and blanks leftovers', async () => {
  const { calls, fetchFn } = fakeDiscord();
  const msgs = buildMessages(press.tools[0], [fakeFile('AGENTS.md')]);
  assert.deepEqual(await postMessages(HOOK, msgs, ['old1', 'old2'], fetchFn), ['old1']);
  assert.deepEqual(calls.map((c) => c.method), ['PATCH', 'PATCH']);
  assert.match(calls[1].payload.content, /Moved/);
  assert.deepEqual(calls[0].payload.allowed_mentions, { parse: [] });
  const again = fakeDiscord();
  assert.deepEqual(await postMessages(HOOK, msgs, ['gone'], again.fetchFn), ['m1']);
  assert.ok(again.calls[1].url.endsWith('?wait=true'));
  await assert.rejects(postMessages('https://example.com/hook', msgs, [], fetchFn), /not a Discord webhook/);
});

function fakeWorld() {
  const discord = fakeDiscord();
  const fetchFn = async (url, init) => {
    if (url.includes('api.github.com') && url.includes('/commits/')) return Response.json({ sha: 'abcdef1234567' });
    if (url.includes('raw.githubusercontent.com')) return new Response('# file');
    return discord.fetchFn(url, init);
  };
  return { fetchFn, calls: discord.calls };
}

test('runTool only posts when the tool is ON with a webhook, and skips unchanged files', async () => {
  const LOCALAPPDATA = mkdtempSync(join(tmpdir(), 'tower-'));
  const env = { LOCALAPPDATA };
  const pair = pickTools('press-plai-provenance-file-updater')[0];
  const world = fakeWorld();
  const quiet = () => {};
  assert.equal((await runTool(pair, { fetchFn: world.fetchFn, env, log: quiet })).status, 'dry-run');
  assert.equal((await runTool(pair, { post: true, fetchFn: world.fetchFn, env, log: quiet })).status, 'off');
  const dir = join(LOCALAPPDATA, 'astras-pet-os', 'discord-tower', 'press-plai');
  const settings = JSON.parse(readFileSync(join(dir, 'settings.json'), 'utf8'));
  assert.deepEqual(Object.keys(settings.tools).length, 4, 'settings start with every updater OFF');
  assert.equal(settings.schema, 1, 'data files carry a schema version');
  settings.tools['press-plai-provenance-file-updater'] = { on: true, webhook: '' };
  writeFileSync(join(dir, 'settings.json'), JSON.stringify(settings));
  assert.equal((await runTool(pair, { post: true, fetchFn: world.fetchFn, env, log: quiet })).status, 'no-webhook');
  settings.tools['press-plai-provenance-file-updater'].webhook = HOOK;
  writeFileSync(join(dir, 'settings.json'), JSON.stringify(settings));
  const logs = [];
  assert.equal((await runTool(pair, { post: true, fetchFn: world.fetchFn, env, log: (l) => logs.push(l) })).status, 'posted');
  assert.ok(!logs.join('\n').includes('abc-DEF_1'), 'the webhook never appears in the output');
  assert.equal(JSON.parse(readFileSync(join(dir, 'state.json'), 'utf8')).schema, 1);
  assert.equal((await runTool(pair, { post: true, fetchFn: world.fetchFn, env, log: quiet })).status, 'unchanged');
  assert.equal((await runTool(pair, { post: true, force: true, fetchFn: world.fetchFn, env, log: quiet })).status, 'posted');
  assert.equal(world.calls.filter((c) => c.method === 'POST').length, 1, 'the forced run edited the same message');
});
