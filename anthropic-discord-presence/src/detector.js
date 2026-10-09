import { execFile } from 'node:child_process';
import { existsSync, readdirSync, statSync, openSync, fstatSync, readSync, closeSync } from 'node:fs';
import { join } from 'node:path';
import { homedir } from 'node:os';
import { IDLE_MS, modelLabel, projectLabel } from './presence.js';

// Newest Claude Code transcript as { file, mtimeMs }, or { file: '', mtimeMs: 0 }. Reads file metadata only.
export function latestClaudeCode(home = process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude')) {
  let latest = { file: '', mtimeMs: 0 };
  try {
    const projects = join(home, 'projects');
    for (const dir of readdirSync(projects, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue;
      for (const name of readdirSync(join(projects, dir.name))) {
        if (!name.endsWith('.jsonl')) continue;
        const file = join(projects, dir.name, name);
        try { const { mtimeMs } = statSync(file); if (mtimeMs > latest.mtimeMs) latest = { file, mtimeMs }; } catch { /* File rotated. */ }
      }
    }
  } catch { /* Claude Code not installed. */ }
  return latest;
}

const transcriptCache = new Map();
const MAX_CACHED_TRANSCRIPTS = 64;
const MAX_RECORD_BYTES = 8 * 1024 * 1024;
const EFFORTS = new Set(['minimal', 'low', 'medium', 'high', 'xhigh', 'max', 'ultra']);
const emptyInfo = () => ({ model: '', effort: '', cwd: '' });
const fileSignature = stat => `${stat.dev}:${stat.ino}:${stat.birthtimeMs}:${stat.size}:${stat.mtimeMs}:${stat.ctimeMs}`;

// Read complete records backward, including records larger than one read buffer. Fragments are
// joined only once per record, so large tool results cannot hide or corrupt earlier metadata.
function* reverseRecords(fd, size) {
  let position = size;
  let pieces = [];
  let recordBytes = 0;
  const add = piece => {
    recordBytes += piece.length;
    if (recordBytes > MAX_RECORD_BYTES) throw new Error('Transcript record exceeds the metadata read limit.');
    pieces.push(piece);
  };
  while (position > 0) {
    const chunk = Buffer.alloc(Math.min(position, 64 * 1024));
    position -= chunk.length;
    if (readSync(fd, chunk, 0, chunk.length, position) !== chunk.length) throw new Error('Transcript changed while reading.');
    let end = chunk.length;
    for (let i = chunk.length - 1; i >= 0; i--) {
      if (chunk[i] !== 10) continue;
      if (end > i + 1) add(chunk.subarray(i + 1, end));
      if (pieces.length) yield Buffer.concat(pieces.reverse()).toString('utf8');
      pieces = [];
      recordBytes = 0;
      end = i;
    }
    if (end) add(chunk.subarray(0, end));
  }
  if (pieces.length) yield Buffer.concat(pieces.reverse()).toString('utf8');
}

// Only metadata is cached, never conversation text. File identity and modification metadata
// invalidate the bounded cache on appends, truncation, replacement, or rewrites.
export function transcriptInfo(file) {
  let fd;
  try {
    fd = openSync(file, 'r');
    const stat = fstatSync(fd);
    const signature = fileSignature(stat);
    const cached = transcriptCache.get(file);
    if (cached?.signature === signature) {
      transcriptCache.delete(file);
      transcriptCache.set(file, cached);
      return { ...cached.info };
    }
    const info = emptyInfo();
    let modelFound = false;
    let cwdFound = false;
    for (const line of reverseRecords(fd, stat.size)) {
      let row;
      try { row = JSON.parse(line); } catch { continue; } // Ignore incomplete writes and malformed records.
      if (!row || typeof row !== 'object' || Array.isArray(row)) continue;
      if (!cwdFound && typeof row.cwd === 'string') {
        info.cwd = row.cwd.length <= 4096 ? row.cwd : '';
        cwdFound = true;
      }
      if (!modelFound && row.type === 'assistant' && row.message && typeof row.message === 'object'
        && row.message.model !== '<synthetic>') {
        const model = row.message.model;
        info.model = typeof model === 'string' && /^claude-[\w.\[\]-]{1,60}$/.test(model) ? model : '';
        const effort = row.perTurnEffort ?? row.effort;
        info.effort = info.model && EFFORTS.has(effort) ? effort : '';
        modelFound = true;
      }
      if (modelFound && cwdFound) break;
    }
    if (fileSignature(fstatSync(fd)) !== signature) return emptyInfo();
    transcriptCache.delete(file);
    transcriptCache.set(file, { signature, info });
    if (transcriptCache.size > MAX_CACHED_TRANSCRIPTS) transcriptCache.delete(transcriptCache.keys().next().value);
    return { ...info };
  } catch {
    transcriptCache.delete(file);
    return emptyInfo();
  } finally { if (fd !== undefined) closeSync(fd); }
}

export function transcriptModel(file) {
  return transcriptInfo(file).model;
}

// Project name = the folder the session works in (its last path part, never the full path).
// "No folder" sessions run in the desktop app's scratch workspace and the home folder isn't a project.
export function folderProject(cwd, home = homedir()) {
  const path = String(cwd ?? '').replace(/^\\\\\?\\/, '').replace(/[\\/]+$/, '');
  if (!path || /[\\/]Claude[\\/]scratch-workspaces[\\/]/i.test(path)) return '';
  if (path.toLowerCase() === home.replace(/[\\/]+$/, '').toLowerCase()) return '';
  return projectLabel(path.split(/[\\/]/).pop());
}

// The project to show for one session: its folder, but only if that folder still exists (a moved or
// deleted folder would show a name that no longer exists).
export function sessionProject(cwd) {
  return cwd && existsSync(cwd) ? folderProject(cwd) : '';
}

// Transcripts written in the last few minutes, newest first. Reads file metadata only.
export function recentClaudeCode(home = process.env.CLAUDE_CONFIG_DIR || join(homedir(), '.claude'), now = Date.now()) {
  const found = [];
  try {
    const projects = join(home, 'projects');
    for (const dir of readdirSync(projects, { withFileTypes: true })) {
      if (!dir.isDirectory()) continue;
      for (const name of readdirSync(join(projects, dir.name))) {
        if (!name.endsWith('.jsonl')) continue;
        const file = join(projects, dir.name, name);
        try { const { mtimeMs } = statSync(file); if (isRecent(mtimeMs, now)) found.push({ file, mtimeMs }); } catch { /* File rotated. */ }
      }
    }
  } catch { /* Claude Code not installed. */ }
  return found.sort((a, b) => b.mtimeMs - a.mtimeMs);
}

export function isRecent(mtimeMs, now = Date.now()) {
  const age = now - mtimeMs;
  return mtimeMs > 0 && age >= -5000 && age < IDLE_MS;
}

// True when the Claude desktop app is running (Windows only).
export function claudeDesktopRunning() {
  if (process.platform !== 'win32') return Promise.resolve(false);
  return new Promise(resolve => {
    execFile('tasklist', ['/FI', 'IMAGENAME eq claude.exe', '/FO', 'CSV', '/NH'], { windowsHide: true, timeout: 3000 },
      (error, stdout) => resolve(!error && /"claude\.exe"/i.test(stdout)));
  });
}

export async function detectClaude({ now = Date.now(), home, desktop = claudeDesktopRunning } = {}) {
  try {
    const recent = recentClaudeCode(home, now);
    if (recent.length) {
      const sessions = [];
      const seen = new Set();
      for (const { file } of recent) {
        const { model, effort, cwd } = transcriptInfo(file);
        const session = { project: sessionProject(cwd), model, effort };
        const key = JSON.stringify(session);
        if (!seen.has(key)) { seen.add(key); sessions.push(session); }
      }
      const { project, model, effort } = sessions[0];
      const projects = [...new Set(sessions.map(session => session.project).filter(Boolean))];
      return { active: true, model, effort, project, projects, sessions, message: `Recent ${modelLabel(model) || 'Claude Code'} activity detected.` };
    }
    // The desktop chat doesn't record its model, effort or folder locally, so this shows plain "Claude".
    if (await desktop()) return { active: true, model: '', effort: '', project: '', message: 'Claude desktop app is open (model not visible to this app).' };
    return { active: false, model: '', effort: '', project: '', message: 'Waiting for the Claude app or Claude Code.' };
  } catch {
    return { active: false, model: '', effort: '', project: '', message: 'Automatic detection unavailable. Manual mode still works.' };
  }
}
