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

// Exact model id of the latest reply (e.g. 'claude-opus-5-5'), its effort level (e.g. 'high') and the
// session's working folder. Scans only the last 64 KB of the transcript and keeps only the "model",
// "effort" and "cwd" values; conversation text is discarded, never stored or sent.
export function transcriptInfo(file) {
  let fd;
  try {
    fd = openSync(file, 'r');
    const size = fstatSync(fd).size;
    const tail = Buffer.alloc(Math.min(size, 64 * 1024));
    readSync(fd, tail, 0, tail.length, size - tail.length);
    const text = tail.toString('utf8');
    const ids = [...text.matchAll(/"model"\s*:\s*"(claude-[\w.\[\]-]{1,60})"/g)];
    const efforts = [...text.matchAll(/"effort"\s*:\s*"([a-z-]{1,20})"/g)];
    const dirs = [...text.matchAll(/"cwd"\s*:\s*"((?:[^"\\]|\\.){1,1024})"/g)];
    let cwd = '';
    try { cwd = dirs.length ? JSON.parse(`"${dirs.at(-1)[1]}"`) : ''; } catch { /* Malformed line. */ }
    return { model: ids.at(-1)?.[1] ?? '', effort: efforts.at(-1)?.[1] ?? '', cwd };
  } catch { return { model: '', effort: '', cwd: '' }; } finally { if (fd !== undefined) closeSync(fd); }
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
    const latest = latestClaudeCode(home);
    if (isRecent(latest.mtimeMs, now)) {
      const { model, effort, cwd } = transcriptInfo(latest.file);
      const projects = [...new Set(recentClaudeCode(home, now).map(f => sessionProject(transcriptInfo(f.file).cwd)).filter(Boolean))];
      return { active: true, model, effort, project: sessionProject(cwd), projects, message: `Recent ${modelLabel(model) || 'Claude Code'} activity detected.` };
    }
    // The desktop chat doesn't record its model, effort or folder locally, so this shows plain "Claude".
    if (await desktop()) return { active: true, model: '', effort: '', project: '', message: 'Claude desktop app is open (model not visible to this app).' };
    return { active: false, model: '', effort: '', project: '', message: 'Waiting for the Claude app or Claude Code.' };
  } catch {
    return { active: false, model: '', effort: '', project: '', message: 'Automatic detection unavailable. Manual mode still works.' };
  }
}
