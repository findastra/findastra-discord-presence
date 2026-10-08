import { existsSync, mkdirSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
function target() {
  if (process.platform !== 'win32' || !process.env.APPDATA) throw new Error('Windows startup requires Windows.');
  return join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
}
export function startupEnabled() {
  try { return existsSync(join(target(), 'Findastra Presence (OpenAI).vbs')); } catch { return false; }
}
export function setStartup(enabled) {
  const dir = target(); const path = join(dir, 'Findastra Presence (OpenAI).vbs');
  // Remove the launcher from before the rename so the app never starts twice.
  for (const legacy of ["OpenAI Presence.vbs", "Astra Presence.vbs"]) { try { unlinkSync(join(dir, legacy)); } catch (error) { if (error.code !== 'ENOENT') throw error; } }
  if (!enabled) {
    try { unlinkSync(path); } catch (error) { if (error.code !== 'ENOENT') throw error; }
    return;
  }
  const command = `"${process.execPath}" "${join(root, 'src', 'launch.js')}" --background`;
  mkdirSync(dir, { recursive: true });
  writeFileSync(path, `Set shell = CreateObject("WScript.Shell")\r\nshell.Run "${command.replaceAll('"', '""')}", 0, False\r\n`);
}
