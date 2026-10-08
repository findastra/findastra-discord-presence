const $ = id => document.getElementById(id);
const hosted = document.body.hasAttribute('data-hosted') || location.protocol === 'file:';
let state;
let initialized = false;
let ended = false;
const motionButton = $('motion');
motionButton.addEventListener('click', () => {
  const paused = document.querySelector('.galaxy').classList.toggle('paused');
  motionButton.setAttribute('aria-pressed', String(paused));
  motionButton.setAttribute('aria-label', paused ? 'Resume galaxy motion' : 'Pause galaxy motion');
  motionButton.textContent = paused ? '▷' : 'Ⅱ';
});

async function request(path, body) {
  const response = await fetch(path, body === undefined ? {} : {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  const data = await response.json();
  if (!response.ok) throw new Error(data.error || 'Could not update the app.');
  return data;
}

function drawTimer() {
  if (!state?.startedAt) { $('timer').textContent = 'Ready when you are'; return; }
  const elapsed = Math.max(0, Math.floor(Date.now() / 1000) - state.startedAt);
  const h = String(Math.floor(elapsed / 3600)).padStart(2, '0');
  const m = String(Math.floor(elapsed / 60) % 60).padStart(2, '0');
  const s = String(elapsed % 60).padStart(2, '0');
  $('timer').textContent = `${h}:${m}:${s} elapsed`;
}

async function refresh() {
  if (ended || hosted) return;
  try {
    state = await request('/api/status');
    if (!initialized) {
      $('clientId').value = state.config.clientId;
      $('image').value = state.config.image;
      $('share-project').checked = state.config.shareProject;
      $('project-name').value = state.config.projectName || '';
      $('automatic-start').checked = state.startupEnabled;
      $('setup').open = !state.config.clientId;
      initialized = true;
    }
    $('status').textContent = state.message;
    $('project-preview').textContent = state.project ? `Working on ${state.project}` : 'Exploring ideas';
    $('model-preview').textContent = `Using ${state.modelLabel}${state.effortLabel ? ` on ${state.effortLabel}` : ''}`;
    $('dot').className = state.published ? 'live' : '';
    $('badge').textContent = state.published ? 'SHARING' : state.mode === 'off' ? 'OFF' : 'WAITING';
    $('auto').setAttribute('aria-pressed', String(state.mode === 'auto'));
    $('manual').textContent = state.mode === 'manual' ? 'Session started' : 'Start session';
    $('mode-note').textContent = state.mode === 'auto'
      ? 'Automatic uses the latest Codex task and names its exact model. Hides after 5 minutes without activity; it does not track window focus.'
      : 'Manual sessions stay on until you stop them or quit this app.';
    drawTimer();
  } catch {
    $('status').textContent = 'The local companion is offline. Open Start Findastra Presence (OpenAI) again.';
    $('dot').className = '';
    $('badge').textContent = 'OFFLINE';
    state = null;
    drawTimer();
  }
}

for (const mode of ['manual', 'off', 'auto']) {
  $(mode).addEventListener('click', async () => {
    if (hosted) {
      state = { startedAt: mode === 'manual' ? (state?.startedAt || Math.floor(Date.now() / 1000)) : null };
      drawTimer();
      return;
    }
    if (mode !== 'off' && !state?.config.clientId) {
      $('setup').open = true;
      $('clientId').focus();
      $('status').textContent = 'Finish the one-time Discord setup below, then start your session.';
      return;
    }
    $(mode).disabled = true;
    try { await request('/api/mode', { mode }); await refresh(); }
    catch (error) { $('status').textContent = error.message; }
    finally { $(mode).disabled = false; }
  });
}
$('settings').addEventListener('submit', async event => {
  event.preventDefault();
  try {
    await request('/api/config', { clientId: $('clientId').value, image: $('image').value,
      shareProject: $('share-project').checked, projectName: $('project-name').value,
      automaticOnStart: state.config.automaticOnStart });
    $('save-status').textContent = 'Saved. Choose Start session or Automatically detect Codex.';
    await refresh();
  } catch (error) { $('save-status').textContent = error.message; }
});
$('quit').addEventListener('click', async () => {
  try {
    await request('/api/quit', {});
    ended = true;
    state = null;
    $('status').textContent = 'App closed. Sharing has stopped. You can close this tab.';
    $('badge').textContent = 'OFF';
    $('dot').className = '';
    drawTimer();
    document.querySelectorAll('button').forEach(button => { button.disabled = true; });
  } catch (error) { $('status').textContent = error.message; }
});
$('automatic-start').addEventListener('change', async () => {
  try {
    await request('/api/startup', { enabled: $('automatic-start').checked });
    await refresh();
    $('save-status').textContent = $('automatic-start').checked ? 'Will run quietly when you sign into Windows.' : 'Windows startup disabled.';
  } catch (error) {
    $('automatic-start').checked = ! $('automatic-start').checked;
    $('save-status').textContent = error.message;
  }
});
if (hosted) {
  document.body.classList.add('hosted');
  $('download').hidden = false;
  $('settings').hidden = true;
  $('quit').hidden = true;
  $('badge').textContent = 'FREE COMPANION';
  $('manual').textContent = 'Preview timer';
  $('off').textContent = 'Reset preview';
  $('mode-note').textContent = 'Try the timer here. Download the companion to share it on Discord.';
  $('status').textContent = 'Discord presence needs the companion running on your Windows computer.';
  if (location.protocol === 'file:') {
    $('download').querySelector('a').href = 'https://github.com/findastra/findastra-discord-presence/raw/main/downloads/findastra-presence-openai.zip';
  }
} else void refresh();
setInterval(refresh, 2000);
setInterval(drawTimer, 1000);
