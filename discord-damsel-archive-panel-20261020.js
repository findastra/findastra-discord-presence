/* By Astra. OpenAI Codex (GPT-6), 2026-10-19.
 * Local archive review. No Discord API, credentials, uploads or deletion.
 * DCE 2.48 schema: DiscordChatExporter.Core/Exporting/JsonMessageWriter.cs.
 */
(function (root) {
  'use strict';
  const MAX_JSON = 128 * 1024 * 1024;
  const id = (value) => typeof value === 'string' && /^\d{1,22}$/.test(value);
  const stamp = (value) => typeof value === 'string' && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\d(?:\.\d{1,7})?(?:Z|[+-]\d\d:\d\d)$/.test(value) && Number.isFinite(Date.parse(value));
  const array = (value) => Array.isArray(value) ? value : [];

  function parseArchive(text) {
    const data = JSON.parse(text.replace(/^\uFEFF/, ''));
    if (!data || !id(data.channel?.id) || !Array.isArray(data.messages)) {
      throw new Error('Choose a DiscordChatExporter JSON file with a channel and messages.');
    }
    if (!Number.isSafeInteger(data.messageCount) || data.messageCount !== data.messages.length) {
      throw new Error('The recorded message count does not match this file. Check for an interrupted export.');
    }
    const seen = new Set();
    for (const message of data.messages) {
      if (!message || !id(message.id) || !id(message.author?.id) || typeof message.content !== 'string' || !stamp(message.timestamp)) {
        throw new Error('A message has missing or invalid text, IDs or timestamp. The file was not changed.');
      }
      if (message.timestampEdited != null && !stamp(message.timestampEdited)) throw new Error('A message has an invalid edit timestamp.');
      if (message.attachments != null && (!Array.isArray(message.attachments) || message.attachments.some((a) => !a || typeof a.url !== 'string' || typeof a.fileName !== 'string' || !Number.isSafeInteger(a.fileSizeBytes) || a.fileSizeBytes < 0))) {
        throw new Error('A message has an invalid attachment entry. Check the original export; the file was not changed.');
      }
      if (seen.has(message.id)) throw new Error('This file contains duplicate message IDs.');
      seen.add(message.id);
    }
    return data;
  }

  // Inspect references only. Never fetch an asset or interpret imported HTML.
  function mediaReferences(data) {
    const refs = new Map();
    function add(url, bytes) {
      if (typeof url !== 'string' || !url) return;
      const prior = refs.get(url);
      const sizes = prior?.sizes || new Set();
      if (Number.isSafeInteger(bytes) && bytes >= 0) sizes.add(bytes);
      refs.set(url, { url, sizes });
    }
    const stack = [{ value: data, kind: '' }];
    while (stack.length) {
      const { value, kind } = stack.pop();
      if (!value || typeof value !== 'object') continue;
      if (Array.isArray(value)) { for (const v of value) stack.push({ value: v, kind }); continue; }
      for (const key of ['avatarUrl', 'iconUrl', 'imageUrl', 'sourceUrl']) add(value[key]);
      if (['attachments', 'image', 'images', 'thumbnail', 'video'].includes(kind)) add(value.url, value.fileSizeBytes);
      for (const [key, v] of Object.entries(value)) if (v && typeof v === 'object') stack.push({ value: v, kind: key });
    }
    return [...refs.values()];
  }

  function relativeAsset(url) {
    if (/^https?:\/\//i.test(url)) return { kind: 'remote' };
    if (!url || /^[a-z][a-z0-9+.-]*:|^[\\/]/i.test(url)) return { kind: 'unsupported' };
    try {
      const parts = url.replaceAll('\\', '/').split('/').map(decodeURIComponent);
      if (parts.some((s) => s === '..' || /[\\/:\x00-\x1f?#]/.test(s))) return { kind: 'unsupported' };
      const path = parts.filter((s) => s && s !== '.').join('/');
      return path ? { kind: 'local', path } : { kind: 'unsupported' };
    } catch { return { kind: 'unsupported' }; }
  }

  function indexFolder(files) {
    const index = new Map();
    for (const file of files) {
      const path = file.webkitRelativePath || file.name;
      if (index.has(path)) throw new Error('Two selected files have the same path. Choose one archive folder.');
      index.set(path, file);
    }
    return index;
  }

  function checkMedia(refs, index, jsonPath) {
    const base = jsonPath.includes('/') ? jsonPath.slice(0, jsonPath.lastIndexOf('/') + 1) : '';
    return refs.map((ref) => {
      const parsed = relativeAsset(ref.url);
      if (parsed.kind !== 'local') return { url: ref.url, status: parsed.kind };
      const path = base + parsed.path;
      const file = index.get(path);
      let status = 'found';
      if (!file) status = 'missing';
      else if (file.size === 0) status = 'empty';
      else if (ref.sizes.size > 1 || (ref.sizes.size === 1 && !ref.sizes.has(file.size))) status = 'size-mismatch';
      return { url: ref.url, path, status, file };
    });
  }

  function dateSuffix(now = new Date()) {
    const parts = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Denver', year: 'numeric', month: '2-digit', day: '2-digit' }).formatToParts(now);
    const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
    return p.year + p.month + p.day;
  }

  function exportSettings(now) {
    const date = dateSuffix(now);
    return [
      'DiscordChatExporter: select the intended DM and all authors.',
      'Leave After, Before, Message filter and Partition limit blank.',
      `Save HTML (Dark) as conversation-${date}.html.`,
      `Save a second export as conversation-${date}.json with Format markdown OFF.`,
      'Enable Download assets and Reuse assets; keep assets in a media subfolder beside the exports.',
      'Keep Persist token OFF. Authenticate only in the exporter.',
      'Keep the original exports and media together. Do not edit text or timestamps.',
      'The JSON checker preserves timestamp strings exactly as exported; it cannot verify them against Discord.',
      'Compare both ends of the conversation with Discord and check videos before deleting anything.'
    ].join('\n');
  }

  function attachmentCopyName(name, messageId, index, now) {
    const match = name.match(/\.([a-z0-9]{1,10})$/i);
    const extension = match ? match[1].toLowerCase() : 'bin';
    const stem = (match ? name.slice(0, -match[0].length) : name).normalize('NFKD').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60) || 'file';
    return `attachment-${stem}-${messageId}-${index + 1}-${dateSuffix(now)}.${extension}`;
  }

  function mount(parent, options = {}) {
    const doc = parent.ownerDocument;
    if (parent.querySelector('[data-damsel-archive]')) return;
    let active = true, paused = false, generation = 0, archive = null, media = [], selectedIndex = new Map(), page = 0;
    let isReading = false, selectedPath = '', selectedTextOnly = false;
    let objectUrls = [];
    function el(tag, text, className, into) {
      const node = doc.createElement(tag);
      if (text !== undefined) node.textContent = text;
      if (className) node.className = className;
      if (into) into.append(node);
      return node;
    }
    function action(into, text, handler, className) {
      const b = el('button', text, className, into); b.type = 'button'; b.onclick = handler; return b;
    }
    function safeHref(value) {
      try {
        const parsed = new URL(String(value), root.location ? root.location.href : 'https://discord.com/');
        return (parsed.protocol === 'https:' || parsed.protocol === 'http:') ? parsed.href : 'about:blank';
      } catch {
        return 'about:blank';
      }
    }
    function link(into, text, href) {
      const a = el('a', text, '', into); a.href = safeHref(href); a.target = '_blank'; a.rel = 'noopener noreferrer'; return a;
    }
    function fileInput(into, label, folder) {
      const wrap = el('label', undefined, 'da-file-label', into);
      el('span', label, '', wrap);
      const input = el('input', undefined, '', wrap); input.type = 'file';
      if (folder) { input.multiple = true; input.setAttribute('webkitdirectory', ''); }
      else input.accept = '.json,application/json';
      return input;
    }
    const panel = el('details', undefined, 'panel da-panel', parent);
    panel.open = true; panel.setAttribute('data-damsel-archive', '');
    const summary = el('summary', undefined, '', panel);
    summary.title = 'Click the label to fold or unfold this tool panel';
    el('span', 'discord-damsel-dm-archive-tool-panel', 'legend', summary);
    const bar = el('div', undefined, 'da-toolbar', panel);
    const power = action(bar, '● Tool panel on', togglePower, 'da-light da-on');
    power.setAttribute('aria-pressed', 'true');
    power.title = 'Turns this local tool panel off and clears loaded files. Does not stop other programs.';
    const pause = action(bar, '● Ready', togglePause, 'da-light da-ready');
    pause.setAttribute('aria-pressed', 'false'); pause.title = 'Pause this tool panel’s controls for maintenance. Other programs are unaffected.';
    const status = el('p', 'Local review tool panel · exporter runs separately', 'da-muted', bar);
    status.setAttribute('role', 'status'); status.setAttribute('aria-live', 'polite');
    const box = el('fieldset', undefined, 'tool-box da-tool', panel);
    el('legend', 'discord-tower-v1.0-dm-archive-v0.1', '', box);
    el('h2', 'Save the conversation. Check the backup.', '', box);
    el('p', 'Keep messages, links and media together before cleanup.', 'da-muted', box);
    const steps = el('ol', undefined, 'da-steps', box);
    for (const label of ['Export', 'Check files', 'Review conversation']) el('li', label, '', steps);
    const setup = el('details', undefined, 'da-section', box); setup.open = true;
    el('summary', '1 · Export with DiscordChatExporter', '', setup);
    el('p', 'Open your installed DiscordChatExporter. Save the whole DM twice: HTML (Dark) for reading and JSON for checking. This tool panel cannot start the Windows app or authenticate to Discord.', 'da-muted', setup);
    const settings = el('pre', exportSettings(), 'da-settings', setup);
    const links = el('div', undefined, 'da-actions', setup);
    action(links, 'Copy export settings', async () => {
      try { await root.navigator.clipboard.writeText(settings.textContent); status.textContent = 'Export settings copied.'; }
      catch { status.textContent = 'Clipboard unavailable. Select and copy the settings above.'; }
    });
    link(links, 'Official exporter guide ↗', 'https://github.com/Tyrrrz/DiscordChatExporter/blob/2.48/.docs/Using-the-GUI.md');
    const check = el('section', undefined, 'da-section', box);
    el('h3', '2 · Check your saved files', '', check);
    el('p', 'Choose the folder containing your JSON export and its media subfolder. Files are read in this tab only. They are never uploaded or edited.', 'da-muted', check);
    const imports = el('div', undefined, 'da-imports', check);
    const folder = fileInput(imports, 'Choose archive folder (includes media)', true);
    const json = fileInput(imports, 'Or choose a JSON file (text check only)', false);
    const pickerLabel = el('label', undefined, 'da-file-label', check);
    el('span', 'Conversation export', '', pickerLabel);
    const picker = el('select', undefined, '', pickerLabel); picker.disabled = true;
    const retry = action(check, 'Check selected export again', () => loadFile(selectedPath, selectedTextOnly)); retry.disabled = true;
    const results = el('div', undefined, 'da-results', check);
    results.setAttribute('role', 'status'); results.setAttribute('aria-live', 'polite');
    const resultTitle = el('strong', 'No archive selected', '', results);
    const counts = el('p', 'Choose files to see message and media checks.', 'da-muted', results);
    const boundaries = el('p', '', 'da-boundaries', results);
    const findings = el('details', undefined, 'da-findings', check);
    el('summary', 'Media references needing attention', '', findings);
    const issueList = el('ul', undefined, '', findings);
    const disclosure = el('p', 'A file check cannot prove that Discord exported the entire history. Remote video links may point to content that was never downloaded. Check the first and last messages against Discord and play the saved videos.', 'da-notice', check);
    const review = el('details', undefined, 'da-section', box); review.open = true;
    el('summary', '3 · Review the conversation', '', review);
    el('p', 'This preview shows message text and timestamp strings exactly as they appear in the JSON. It shows attachments below each message. Use the exporter’s HTML for replies, reactions, embeds and other rich details.', 'da-muted', review);
    const searchLabel = el('label', undefined, 'da-file-label', review);
    el('span', 'Find text or an author', '', searchLabel);
    const search = el('input', undefined, '', searchLabel); search.type = 'search'; search.placeholder = 'Search the loaded conversation'; search.disabled = true;
    const nav = el('div', undefined, 'da-actions', review);
    const prev = action(nav, '← Previous', () => { page--; renderMessages(); });
    const position = el('span', 'No messages loaded', 'da-muted', nav);
    const next = action(nav, 'Next →', () => { page++; renderMessages(); });
    prev.disabled = next.disabled = true;
    const messages = el('div', undefined, 'da-messages', review);
    const cleanup = el('details', undefined, 'da-section da-cleanup', box);
    el('summary', 'After the backup: DM cleanup', '', cleanup);
    el('p', 'The backup is still unverified. This tool panel does not delete messages or mark an archive complete. Damsel’s DM cleanup guide is a separate workflow for your own messages.', '', cleanup);
    link(cleanup, 'Read Damsel’s cleanup guide ↗', 'https://github.com/findastra/findastra-discord-presence/blob/main/docs/dm-cleanup-20261010.md');

    function revoke() { for (const url of objectUrls) root.URL.revokeObjectURL(url); objectUrls = []; }
    function clearLoaded() {
      generation++; isReading = false; archive = null; media = []; page = 0; revoke(); messages.replaceChildren();
      search.value = ''; search.disabled = true; prev.disabled = next.disabled = true;
      resultTitle.textContent = 'No archive selected'; counts.textContent = 'Choose files to see message and media checks.';
      boundaries.textContent = ''; issueList.replaceChildren(); position.textContent = 'No messages loaded';
    }
    function togglePower() {
      active = !active; paused = false; clearLoaded(); selectedIndex = new Map(); selectedPath = ''; retry.disabled = true; picker.replaceChildren(); picker.disabled = true; folder.value = ''; json.value = '';
      power.textContent = active ? '● Tool panel on' : '● Tool panel off'; power.className = 'da-light ' + (active ? 'da-on' : 'da-off');
      power.setAttribute('aria-pressed', String(active)); pause.disabled = !active; refreshPause();
      status.textContent = active ? 'Local tool panel ready. Choose files to begin.' : 'Tool panel off. Loaded files cleared; other programs are unaffected.';
    }
    function refreshPause() {
      box.disabled = !active || paused;
      pause.textContent = paused ? '● Paused' : '● Ready'; pause.className = 'da-light ' + (paused ? 'da-paused' : 'da-ready');
      pause.setAttribute('aria-pressed', String(paused));
    }
    function togglePause() {
      paused = !paused;
      if (isReading) { clearLoaded(); resultTitle.textContent = 'Read paused'; counts.textContent = 'Resume the tool panel, then choose Check selected export again.'; }
      generation++; refreshPause();
      status.textContent = paused ? 'Tool panel controls paused. Other programs are unaffected.' : 'Tool panel controls ready. Use Check selected export again to retry an interrupted read.';
    }
    async function loadFile(path, textOnly) {
      clearLoaded(); const mine = generation;
      const file = selectedIndex.get(path);
      if (!active || paused || !file) return;
      selectedPath = path; selectedTextOnly = textOnly; retry.disabled = false; isReading = true;
      resultTitle.textContent = 'Reading archive…';
      try {
        if (file.size > MAX_JSON) throw new Error('This preview supports JSON files up to 128 MiB. Use the exporter’s HTML for a larger archive.');
        const text = await file.text();
        if (mine !== generation || !active || paused) return;
        const parsed = parseArchive(text);
        const checked = checkMedia(mediaReferences(parsed), textOnly ? new Map() : selectedIndex, path);
        archive = parsed; media = checked; isReading = false;
        const countsByStatus = checked.reduce((acc, item) => { acc[item.status] = (acc[item.status] || 0) + 1; return acc; }, {});
        const problem = checked.filter((item) => item.status !== 'found');
        resultTitle.textContent = 'File read · full history still unverified';
        counts.textContent = `${parsed.messageCount.toLocaleString()} messages · ${countsByStatus.found || 0} media files found · ${problem.length} ${problem.length === 1 ? 'reference needs' : 'references need'} attention${textOnly ? ' · folder not selected' : ''}`;
        const first = parsed.messages[0], last = parsed.messages.at(-1);
        boundaries.textContent = first ? `First in file: ${first.timestamp}\nLast in file: ${last.timestamp}` : 'This export contains no messages.';
        if (parsed.dateRange?.after || parsed.dateRange?.before) boundaries.textContent += '\nThis export has a date range. It is not an unrestricted history export.';
        if (!parsed.dateRange || !Object.hasOwn(parsed.dateRange, 'after') || !Object.hasOwn(parsed.dateRange, 'before')) boundaries.textContent += '\nDate-range metadata is missing; the export’s scope is unknown.';
        if (!problem.length) el('li', 'No unresolved media references in this JSON. File contents and the separate HTML export have not been verified.', '', issueList);
        for (const item of problem.slice(0, 100)) el('li', `${item.status}: ${item.url}`, '', issueList);
        if (problem.length > 100) el('li', `${problem.length - 100} more unresolved references.`, '', issueList);
        search.disabled = false; renderMessages();
        status.textContent = 'JSON read locally. Original files and timestamp strings were left unchanged.';
      } catch (error) {
        if (mine !== generation) return;
        clearLoaded(); resultTitle.textContent = 'Archive could not be checked'; counts.textContent = error.message;
        status.textContent = 'No archive loaded. Choose a valid export to try again.';
      }
    }
    folder.onchange = async () => {
      clearLoaded(); selectedPath = ''; retry.disabled = true; json.value = ''; picker.replaceChildren(); picker.disabled = true;
      try {
        selectedIndex = indexFolder([...folder.files]);
        const paths = [...selectedIndex.keys()].filter((path) => /\.json$/i.test(path)).sort();
        for (const path of paths) { const option = el('option', path, '', picker); option.value = path; }
        picker.disabled = !paths.length;
        if (!paths.length) { counts.textContent = 'No JSON exports found. Export JSON as well as HTML.'; return; }
        picker.value = paths[0]; await loadFile(paths[0], false);
      } catch (error) { selectedIndex = new Map(); counts.textContent = error.message; }
    };
    json.onchange = async () => {
      clearLoaded(); selectedPath = ''; retry.disabled = true; folder.value = ''; picker.replaceChildren(); picker.disabled = true;
      const file = json.files[0]; selectedIndex = new Map(); if (!file) return;
      const option = el('option', file.name, '', picker); option.value = file.name; picker.value = file.name;
      selectedIndex.set(file.name, file); await loadFile(file.name, true);
    };
    picker.onchange = () => loadFile(picker.value, false);
    search.oninput = () => { page = 0; renderMessages(); };
    function renderMessages() {
      revoke(); messages.replaceChildren(); if (!archive) return;
      const needle = search.value.toLocaleLowerCase();
      const filtered = archive.messages.filter((m) => [m.content, m.author.name, m.author.nickname].some((s) => typeof s === 'string' && s.toLocaleLowerCase().includes(needle)));
      const pages = Math.max(1, Math.ceil(filtered.length / 25)); page = Math.max(0, Math.min(page, pages - 1));
      prev.disabled = page === 0; next.disabled = page + 1 >= pages;
      position.textContent = `${filtered.length.toLocaleString()} ${filtered.length === 1 ? 'match' : 'matches'} · page ${page + 1} of ${pages}`;
      const assets = new Map(media.map((item) => [item.url, item]));
      for (const m of filtered.slice(page * 25, (page + 1) * 25)) {
        const row = el('article', undefined, 'da-message', messages);
        const head = el('div', undefined, 'da-message-head', row);
        el('strong', m.author.nickname || m.author.name || m.author.id, '', head);
        el('span', m.timestamp, 'da-timestamp', head);
        if (m.timestampEdited) el('span', `Edited: ${m.timestampEdited}`, 'da-timestamp', head);
        el('p', m.content, 'da-content', row);
        const meta = el('details', undefined, 'da-message-meta', row);
        el('summary', 'Message details', '', meta);
        el('p', `Message ID: ${m.id} · Author ID: ${m.author.id} · Type: ${m.type || 'not specified'}`, 'da-muted', meta);
        const guild = archive.guild?.id;
        const scope = archive.channel.type === 'DirectTextChat' || archive.channel.type === 'DirectGroupTextChat' ? '@me' : id(guild) ? guild : null;
        if (scope) link(meta, 'Open original message in Discord ↗', `https://discord.com/channels/${scope}/${archive.channel.id}/${m.id}`);
        for (const [attachmentIndex, attachment] of array(m.attachments).entries()) {
          const item = assets.get(attachment.url);
          const name = typeof attachment.fileName === 'string' ? attachment.fileName : 'Attachment';
          const tile = el('div', undefined, 'da-attachment', row);
          el('span', name, '', tile);
          if (item?.status === 'found') {
            const url = root.URL.createObjectURL(item.file); objectUrls.push(url);
            const a = link(tile, 'Save a copy', url); a.download = attachmentCopyName(name, m.id, attachmentIndex); a.removeAttribute('target');
            if (/\.(mp4|webm|ogg|mov)$/i.test(name)) {
              const video = el('video', undefined, '', tile); video.controls = true; video.preload = 'none'; video.src = url;
            } else if (/\.(png|jpe?g|gif|webp)$/i.test(name)) {
              const img = el('img', undefined, '', tile); img.alt = name; img.loading = 'lazy'; img.src = url;
            }
          } else el('span', item?.status || 'not checked', 'da-muted', tile);
        }
      }
      if (!filtered.length) el('p', 'No messages match this search.', 'da-muted', messages);
    }
    if (options.demo) {
      action(bar, 'Load fictional example', () => {
        if (!active || paused) return;
        const sample = { channel: { id: '101', type: 'DirectTextChat' }, dateRange: { after: null, before: null }, messageCount: 2, messages: [
          { id: '201', type: 'Default', author: { id: '301', nickname: 'Example sender' }, timestamp: '2026-10-19T09:15:00.000-06:00', content: 'A fictional message.\nLine breaks, links and timestamp strings stay as exported.\nhttps://example.com/', attachments: [] },
          { id: '202', type: 'Default', author: { id: '302', nickname: 'Example recipient' }, timestamp: '2026-10-19T09:16:00.000-06:00', content: 'Check saved videos and both ends of the conversation before cleanup.', attachments: [{ url: 'media/example-video.mp4', fileName: 'example-video.mp4', fileSizeBytes: 42 }] }
        ] };
        selectedIndex = new Map([['example.json', { name: 'example.json', size: 2048, text: async () => JSON.stringify(sample) }]]);
        picker.replaceChildren(); const option = el('option', 'example.json (fictional)', '', picker); option.value = 'example.json'; picker.value = 'example.json'; picker.disabled = true; folder.value = ''; json.value = ''; loadFile('example.json', true);
      }, 'da-demo');
    }
    return { panel, clear: clearLoaded };
  }

  const api = { parseArchive, mediaReferences, relativeAsset, indexFolder, checkMedia, dateSuffix, exportSettings, attachmentCopyName, mount };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  root.DiscordDamselArchivePanel = api;
})(typeof globalThis !== 'undefined' ? globalThis : window);
