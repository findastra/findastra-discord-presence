import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const url = 'http://127.0.0.1:38761/';
async function alive() {
  try { const r = await fetch(url + 'api/status', { signal: AbortSignal.timeout(600) });
    const data = await r.json(); return data.app === 'openai-discord-presence';
  } catch { return false; }
}
if (!(await alive())) {
  const child = spawn(process.execPath, [fileURLToPath(new URL('./server.js', import.meta.url))], {
    detached: true, windowsHide: true, stdio: 'ignore',
  });
  child.on('error', () => { console.error('Could not start OpenAI Discord Presence. Run node src/server.js for details.'); });
  child.unref();
  for (let i = 0; i < 30 && !(await alive()); i++) await new Promise(r => setTimeout(r, 200));
}
if (await alive()) {
  if (!process.argv.includes('--background')) spawn('rundll32.exe', ['url.dll,FileProtocolHandler', url], { detached: true, windowsHide: true, stdio: 'ignore' }).unref();
} else { console.error('Could not start. Port 38761 may be in use. Run node src/server.js for details.'); process.exitCode = 1; }
