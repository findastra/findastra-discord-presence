import { mkdirSync, readFileSync, writeFileSync, unlinkSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { validateConfig } from '../src/presence.js';

if (process.platform !== 'win32' || !process.env.APPDATA) throw new Error('Windows startup is available on Windows only.');
const root = fileURLToPath(new URL('../', import.meta.url));
const startup = join(process.env.APPDATA, 'Microsoft', 'Windows', 'Start Menu', 'Programs', 'Startup');
const target = join(startup, 'Findastra Presence (Anthropic).vbs');
// Remove the launcher from before the rename so the app never starts twice.
for (const legacy of ["Anthropic Presence.vbs", "Claude Presence.vbs"]) { try { unlinkSync(join(startup, legacy)); } catch (error) { if (error.code !== 'ENOENT') throw error; } }
if (process.argv.includes('--remove')) {
  try { unlinkSync(target); } catch (error) { if (error.code !== 'ENOENT') throw error; }
  console.log('Findastra Presence (Anthropic) will no longer launch at Windows sign-in.');
} else {
  // Use the exact installed Node and app paths, with VBScript string escaping.
  const command = `"${process.execPath}" "${join(root, 'src', 'launch.js')}" --background`;
  const script = `' Findastra Presence (Anthropic): starts this user's local companion with no window.\r\nSet shell = CreateObject("WScript.Shell")\r\nshell.Run "${command.replaceAll('"', '""')}", 0, False\r\n`;
  const configPath = join(root, '.local', 'config.json');
  const config = validateConfig(JSON.parse(readFileSync(configPath, 'utf8')));
  config.automaticOnStart = true;
  mkdirSync(startup, { recursive: true });
  writeFileSync(target, script);
  writeFileSync(configPath, JSON.stringify(config, null, 2) + '\n');
  console.log('Findastra Presence (Anthropic) will start quietly in Automatic mode at Windows sign-in. Keep this app folder in place.');
}
