import { spawn } from 'node:child_process';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { resolve } from 'node:path';
import { SOURCE_IDENTITY } from './source-identity-20261008.js';
const url = 'http://127.0.0.1:38761/';
const app = 'openai-discord-presence';

export async function launch({ fetcher = fetch, spawnProcess = spawn, identity = SOURCE_IDENTITY,
  background = process.argv.includes('--background'), sleep = ms => new Promise(r => setTimeout(r, ms)) } = {}) {
  async function status() {
    let response;
    try { response = await fetcher(url + 'api/status', { signal: AbortSignal.timeout(600) }); }
    catch { return false; }
    let data;
    try { data = await response.json(); } catch { data = null; }
    if (response.ok === false || data?.app !== app || data.identity?.installationPath !== identity.installationPath || data.identity?.buildId !== identity.buildId) {
      throw new Error('Another or older presence installation is running at ' + url + '. Open its control panel, choose Quit app, then launch this copy again. No running app was stopped.');
    }
    return true;
  }
  if (!(await status())) {
    const child = spawnProcess(process.execPath, [fileURLToPath(new URL('./server.js', import.meta.url))], { detached: true, windowsHide: true, stdio: 'ignore' });
    let spawnError;
    child.on('error', error => { spawnError = error; });
    child.unref();
    for (let i = 0; i < 30; i++) {
      if (spawnError) throw new Error('Could not start OpenAI Discord Presence: ' + spawnError.message);
      if (await status()) break;
      await sleep(200);
    }
  }
  if (!(await status())) throw new Error('Could not start OpenAI Discord Presence. Run node src/server.js for details.');
  if (!background) spawnProcess('rundll32.exe', ['url.dll,FileProtocolHandler', url], { detached: true, windowsHide: true, stdio: 'ignore' }).unref();
}
if (process.argv[1] && pathToFileURL(resolve(process.argv[1])).href === import.meta.url) {
  try { await launch(); } catch (error) { console.error(error.message); process.exitCode = 1; }
}
