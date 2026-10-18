// Discord Tower's file updater: one engine shared by every "<server>-<channel>-updater" tool in servers-20261017.json.
// It fetches the newest copy of each file from GitHub and keeps it posted in its Discord channel through that
// channel's webhook, editing the same message(s) instead of posting new ones. No dependencies; Node 24.
//
//   node discord-tower/file-updater-20261017.mjs <tool|all>            dry run: shows what would be posted
//   node discord-tower/file-updater-20261017.mjs <tool|all> --post     posts (tool must be ON with a webhook)
//   add --force to post even when nothing changed
//
// Webhook URLs and ON/OFF live only on Astra's PC: %LOCALAPPDATA%\astras-pet-os\discord-tower\<server>\settings.json
import { readFileSync, writeFileSync, mkdirSync, existsSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const SERVERS_FILE = fileURLToPath(new URL('./servers-20261017.json', import.meta.url));
export const MAX_FILES_PER_MESSAGE = 10;      // Discord's attachment limit per message
const MAX_CONTENT = 2000;                      // Discord's message length limit
const WEBHOOK = /^https:\/\/(?:canary\.|ptb\.)?(?:discord|discordapp)\.com\/api\/webhooks\/\d+\/[\w-]+$/;

export function loadServers(file = SERVERS_FILE) { return JSON.parse(readFileSync(file, 'utf8')).servers; }

// Every file-updater tool, each paired with its server.
export function updaterTools(servers = loadServers()) {
  return servers.flatMap((server) => server.tools.filter((t) => t.kind === 'file-updater').map((tool) => ({ server, tool })));
}

export function pickTools(name, servers = loadServers()) {
  const all = updaterTools(servers);
  if (name === 'all') return all;
  const found = all.filter(({ tool }) => tool.short === name || tool.id === name);
  if (!found.length) throw new Error(`No file-updater tool called "${name}". Known: ${all.map(({ tool }) => tool.short).join(', ')}`);
  return found;
}

export function localDir(serverId, env = process.env) {
  const base = env.LOCALAPPDATA || join(env.HOME || env.USERPROFILE || '.', '.local', 'share');
  return join(base, 'astras-pet-os', 'discord-tower', serverId);
}

const readJson = (file, fallback) => { try { return JSON.parse(readFileSync(file, 'utf8')); } catch { return fallback; } };

export const SCHEMA = 1;   // data files carry their schema version (PET-PROGRAM-FRAMEWORK.md, section 6)
export function readSettings(dir) { return readJson(join(dir, 'settings.json'), { schema: SCHEMA, tools: {} }); }
export function readState(dir) { return readJson(join(dir, 'state.json'), { schema: SCHEMA }); }
function writeState(dir, state) { mkdirSync(dir, { recursive: true }); writeFileSync(join(dir, 'state.json'), JSON.stringify({ ...state, schema: SCHEMA }, null, 2) + '\n'); }

// A blank settings file with every tool OFF, so Astra only has to paste webhooks and switch tools ON.
export function ensureSettings(dir, tools) {
  const file = join(dir, 'settings.json');
  const settings = readSettings(dir);
  let changed = !existsSync(file) || settings.schema !== SCHEMA;
  settings.schema = SCHEMA;
  for (const { tool } of tools) if (!settings.tools[tool.short]) { settings.tools[tool.short] = { on: false, webhook: '' }; changed = true; }
  if (changed) { mkdirSync(dir, { recursive: true }); writeFileSync(file, JSON.stringify(settings, null, 2) + '\n'); }
  return settings;
}

export const attachmentName = (path) => path.replaceAll('/', '--');

async function getJson(fetchFn, url) {
  const res = await fetchFn(url, { headers: { accept: 'application/vnd.github+json', 'user-agent': 'discord-tower-file-updater' } });
  if (!res.ok) throw new Error(`GitHub answered ${res.status} for ${url}`);
  return res.json();
}

// The files a tool posts, all read from one commit so a post never mixes versions.
export async function collectFiles(tool, fetchFn = fetch) {
  const files = [];
  for (const source of tool.sources) {
    const commit = await getJson(fetchFn, `https://api.github.com/repos/${source.repo}/commits/main`);
    let paths = source.paths || [];
    if (source.match) {
      const tree = await getJson(fetchFn, `https://api.github.com/repos/${source.repo}/git/trees/${commit.sha}?recursive=1`);
      const re = new RegExp(source.match);
      paths = tree.tree.filter((e) => e.type === 'blob' && re.test(e.path)).map((e) => e.path).sort();
    }
    for (const path of paths) {
      const res = await fetchFn(`https://raw.githubusercontent.com/${source.repo}/${commit.sha}/${path}`);
      if (!res.ok) throw new Error(`Could not read ${source.repo}/${path} (${res.status}). Fix the path in servers-20261017.json.`);
      files.push({ repo: source.repo, path, sha: commit.sha, name: attachmentName(path),
        url: `https://github.com/${source.repo}/blob/main/${path}`, content: Buffer.from(await res.arrayBuffer()) });
    }
  }
  if (!files.length) throw new Error(`${tool.short} found no files to post.`);
  return files;
}

export function digest(files) {
  const h = createHash('sha256');
  for (const f of files) h.update(f.repo + '\0' + f.path + '\0').update(f.content).update('\0');
  return h.digest('hex');
}

// Messages to post: up to 10 files each, with a short text that links every file to GitHub.
export function buildMessages(tool, files, now = new Date()) {
  const day = now.toISOString().slice(0, 10);
  const messages = [];
  for (let i = 0; i < files.length; i += MAX_FILES_PER_MESSAGE) {
    const group = files.slice(i, i + MAX_FILES_PER_MESSAGE);
    const part = files.length > MAX_FILES_PER_MESSAGE ? ` (part ${messages.length + 1} of ${Math.ceil(files.length / MAX_FILES_PER_MESSAGE)})` : '';
    const lines = [`**Latest files${part}** · updated ${day} by Discord Damsel`];
    for (const f of group) lines.push(`- [${f.path}](<${f.url}>) · ${f.repo} @ \`${f.sha.slice(0, 7)}\``);
    let content = lines.join('\n');
    if (content.length > MAX_CONTENT) content = content.slice(0, MAX_CONTENT - 1) + '…';
    messages.push({ content, files: group });
  }
  return messages;
}

function form(message) {
  const body = new FormData();
  body.append('payload_json', JSON.stringify({
    content: message.content,
    allowed_mentions: { parse: [] },   // never ping anyone
    attachments: message.files.map((f, i) => ({ id: i, filename: f.name })),
  }));
  message.files.forEach((f, i) => body.append(`files[${i}]`, new Blob([f.content], { type: 'text/markdown' }), f.name));
  return body;
}

async function webhookCall(fetchFn, method, url, message) {
  for (let attempt = 0; attempt < 3; attempt++) {
    const res = await fetchFn(url, { method, body: message ? form(message) : undefined });
    if (res.status === 429) { const wait = Number((await res.json().catch(() => ({}))).retry_after || 2); await new Promise((r) => setTimeout(r, Math.min(wait, 30) * 1000)); continue; }
    return res;
  }
  throw new Error('Discord kept rate-limiting the webhook. Try again later.');
}

// Edit the tool's earlier messages in place; post new ones only when there are none (or they were deleted).
export async function postMessages(webhook, messages, oldIds = [], fetchFn = fetch) {
  if (!WEBHOOK.test(webhook)) throw new Error('The webhook in settings.json is not a Discord webhook URL.');
  const ids = [];
  for (const [i, message] of messages.entries()) {
    let res = oldIds[i] ? await webhookCall(fetchFn, 'PATCH', `${webhook}/messages/${oldIds[i]}`, message) : null;
    if (!res || res.status === 404) res = await webhookCall(fetchFn, 'POST', `${webhook}?wait=true`, message);
    if (!res.ok) throw new Error(`Discord answered ${res.status} (${(await res.text()).slice(0, 200)})`);
    ids.push((await res.json()).id);
  }
  // Fewer messages than last time: blank the leftovers instead of deleting them.
  for (const id of oldIds.slice(messages.length)) await webhookCall(fetchFn, 'PATCH', `${webhook}/messages/${id}`, { content: '*(Moved into the message above.)*', files: [] });
  return ids;
}

export async function runTool({ server, tool }, { post = false, force = false, fetchFn = fetch, env = process.env, log = console.log, now = new Date() } = {}) {
  const dir = localDir(server.id, env);
  const settings = post ? ensureSettings(dir, updaterTools([server])) : readSettings(dir);
  const mine = settings.tools[tool.short] || { on: false, webhook: '' };
  const state = readState(dir);
  const files = await collectFiles(tool, fetchFn);
  const hash = digest(files);
  const messages = buildMessages(tool, files, now);
  const unchanged = state[tool.short]?.digest === hash;
  log(`${tool.id} → #${tool.channel}: ${files.length} file(s) in ${messages.length} message(s)${unchanged ? ', unchanged since the last post' : ''}`);
  for (const f of files) log(`  ${f.repo}/${f.path} @ ${f.sha.slice(0, 7)} (${f.content.length} bytes)`);
  if (!post) { log('  Dry run: nothing posted. Add --post to post.'); return { status: 'dry-run', files, messages }; }
  if (!mine.on) { log(`  OFF: switch it ON in ${join(dir, 'settings.json')}`); return { status: 'off', files, messages }; }
  if (!mine.webhook) { log(`  No webhook yet: paste #${tool.channel}'s webhook URL into ${join(dir, 'settings.json')}`); return { status: 'no-webhook', files, messages }; }
  if (unchanged && !force) { log('  Nothing new to post.'); return { status: 'unchanged', files, messages }; }
  const ids = await postMessages(mine.webhook, messages, state[tool.short]?.messages || [], fetchFn);
  state[tool.short] = { digest: hash, sha: files[0].sha, messages: ids, updated: now.toISOString() };
  writeState(dir, state);
  log(`  Posted to #${tool.channel}.`);
  return { status: 'posted', files, messages, ids };
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  const [name, ...flags] = process.argv.slice(2);
  if (!name) { console.log('Usage: node discord-tower/file-updater-20261017.mjs <tool|all> [--post] [--force]'); process.exit(1); }
  let failed = false;
  for (const pair of pickTools(name)) {
    try { await runTool(pair, { post: flags.includes('--post'), force: flags.includes('--force') }); }
    catch (e) { failed = true; console.error(`  ${pair.tool.short} failed: ${e.message}`); }   // sick light: the tool failed
  }
  process.exit(failed ? 1 : 0);
}
