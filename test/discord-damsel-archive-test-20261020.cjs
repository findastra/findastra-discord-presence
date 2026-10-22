// By Astra. OpenAI Codex (GPT-6), 2026-10-19. Run: node --test this-file.cjs
const test = require('node:test');
const assert = require('node:assert/strict');
// Compile the classic browser script explicitly so this suite also works in the
// target repository's type=module package without treating the script as ESM.
const browserModule = { exports: {} };
new Function('module', require('node:fs').readFileSync(require.resolve('../discord-damsel-archive-panel-20261020.js'), 'utf8'))(browserModule);
const api = browserModule.exports;
function fixture() {
  return { channel: { id: '123456789012345678', type: 'DirectTextChat' }, dateRange: { after: null, before: null }, messageCount: 1, messages: [
    { id: '234567890123456789', timestamp: '2026-10-19T09:15:00.1234567-06:00', timestampEdited: null,
      author: { id: '345678901234567890', name: 'Fictional sender' }, content: '<script>evil()</script>\n  🐈 & exact spacing\r\nhttps://example.com/?a=1&b=2',
      attachments: [{ url: 'media/a%20video.mp4', fileName: 'a video.mp4', fileSizeBytes: 4 }] }
  ] };
}
test('preserves Unicode, whitespace, links, IDs and timestamp strings without mutation', () => {
  const data = fixture(); const original = JSON.stringify(data); const loaded = api.parseArchive('\uFEFF' + original);
  assert.equal(JSON.stringify(loaded), original); assert.equal(loaded.messages[0].timestamp, data.messages[0].timestamp);
  assert.equal(loaded.messages[0].content, data.messages[0].content); assert.equal(loaded.messages[0].id, data.messages[0].id);
});
test('rejects count mismatches, duplicate IDs, numeric snowflakes, missing text and corrupt dates', () => {
  for (const mutate of [d => d.messageCount++, d => { d.messages.push(d.messages[0]); d.messageCount = 2; },
    d => d.channel.id = Number(d.channel.id), d => d.messages[0].id = Number(d.messages[0].id),
    d => delete d.messages[0].content, d => d.messages[0].timestamp = 'yesterday', d => d.messages[0].timestampEdited = 'broken']) {
    const data = fixture(); mutate(data); assert.throws(() => api.parseArchive(JSON.stringify(data)));
  }
  assert.throws(() => api.parseArchive('{"messages":['));
});
test('finds nested downloaded media including forwarded, reaction and embed assets', () => {
  const data = fixture(); data.guild = { iconUrl: 'media/server.png' };
  data.messages[0].forwardedMessage = { embeds: [{ image: { url: 'media/image.png', canonicalUrl: 'https://example.com/original' },
    video: { url: 'https://example.com/video.mp4' }, url: 'https://example.com/page' }], stickers: [{ sourceUrl: 'media/sticker.webp' }] };
  data.messages[0].reactions = [{ emoji: { imageUrl: 'media/emoji.png' }, users: [{ avatarUrl: 'media/avatar.png' }] }];
  const urls = api.mediaReferences(data).map(x => x.url);
  assert.equal(urls.length, 7); assert.ok(urls.includes('media/avatar.png')); assert.ok(urls.includes('media/sticker.webp'));
  assert.ok(!urls.includes('https://example.com/page')); assert.ok(!urls.includes('https://example.com/original'));
});
test('rejects traversal, absolute paths, executable URLs, encoded separators and malformed escapes', () => {
  for (const value of ['../video.mp4', 'media/../../video.mp4', '%2e%2e/video.mp4', 'media%2f..%2fx', 'C:\\private\\x.mp4', '/x.mp4', '//example.com/x', 'javascript:alert(1)', 'data:image/png;base64,x', 'media/%00x', 'media/x%3fy', 'media/%qq']) {
    assert.equal(api.relativeAsset(value).kind, 'unsupported', value);
  }
  assert.deepEqual(api.relativeAsset('./media/a%20video.mp4'), { kind: 'local', path: 'media/a video.mp4' });
  assert.equal(api.relativeAsset('https://cdn.example.com/video.mp4').kind, 'remote');
});
test('resolves against the selected JSON folder, never by a matching basename elsewhere', () => {
  const refs = api.mediaReferences(fixture());
  const file = { webkitRelativePath: 'archive/media/a video.mp4', name: 'a video.mp4', size: 4 };
  assert.equal(api.checkMedia(refs, api.indexFolder([file]), 'archive/conversation.json')[0].status, 'found');
  assert.equal(api.checkMedia(refs, api.indexFolder([file]), 'archive/other/conversation.json')[0].status, 'missing');
  assert.equal(api.checkMedia(refs, api.indexFolder([{ ...file, size: 3 }]), 'archive/conversation.json')[0].status, 'size-mismatch');
  assert.equal(api.checkMedia(refs, api.indexFolder([{ ...file, size: 0 }]), 'archive/conversation.json')[0].status, 'empty');
  assert.throws(() => api.indexFolder([file, file]), /same path/);
});
test('does not count remote URLs or conflicting file lengths as verified local media', () => {
  const data = fixture(); data.messages[0].attachments.push({ url: 'media/a%20video.mp4', fileSizeBytes: 5 }, { url: 'https://example.com/x.mp4' });
  const index = api.indexFolder([{ webkitRelativePath: 'archive/media/a video.mp4', size: 4 }]);
  assert.deepEqual(api.checkMedia(api.mediaReferences(data), index, 'archive/chat.json').map(x => x.status).sort(), ['remote', 'size-mismatch']);
});
test('filenames use the Denver calendar date across the UTC boundary', () => {
  assert.equal(api.dateSuffix(new Date('2026-10-20T01:00:00Z')), '20261019');
  assert.match(api.exportSettings(new Date('2026-10-20T01:00:00Z')), /conversation-20261019\.json/);
  assert.match(api.exportSettings(), /Format markdown OFF/);
});
test('attachment copies have safe, dated names while the source filename stays untouched', () => {
  const original = 'My Video.MP4';
  assert.equal(api.attachmentCopyName(original, '123', 0, new Date('2026-10-20T01:00:00Z')), 'attachment-my-video-123-1-20261019.mp4');
  assert.equal(original, 'My Video.MP4');
  for (const name of ['CON.exe', '../x.html', '😻.PNG', 'NOEXT']) assert.match(api.attachmentCopyName(name, '123', 1), /^[a-z0-9-]+-\d{8}\.[a-z0-9]+$/);
});
test('rejects malformed attachment entries before any page can render them', () => {
  for (const attachments of [[null], ['x'], [{}], [{ url: 'x', fileName: 'x', fileSizeBytes: -1 }], {}]) {
    const data = fixture(); data.messages[0].attachments = attachments; assert.throws(() => api.parseArchive(JSON.stringify(data)), /attachment entry/);
  }
});

class Element {
  constructor(tag, doc) { this.tagName = tag; this.ownerDocument = doc; this.children = []; this.attrs = {}; this.value = ''; this.textContent = ''; this.disabled = false; }
  append(node) { this.children.push(node); }
  replaceChildren(...nodes) { this.children = nodes; }
  setAttribute(k, v) { this.attrs[k] = v; }
  removeAttribute(k) { delete this.attrs[k]; }
  querySelector(selector) { return walk(this).find(n => selector === '[data-damsel-archive]' && Object.hasOwn(n.attrs, 'data-damsel-archive')); }
  set innerHTML(_) { throw new Error('Imported content must never become HTML'); }
}
function walk(n) { return n.children.flatMap(c => [c, ...walk(c)]); }
function page() {
  const doc = { createElement: tag => new Element(tag, doc) }; const main = new Element('main', doc);
  api.mount(main, { demo: true }); return main;
}
const byText = (main, text) => walk(main).find(n => n.textContent === text);
const textOf = n => n.textContent + n.children.map(textOf).join('\n');
const settle = () => new Promise(resolve => setImmediate(resolve));
test('panel has a border label, a tool fieldset and an idempotent mount', () => {
  const main = page(); api.mount(main); assert.equal(main.children.length, 1);
  const panel = main.children[0]; assert.equal(panel.tagName, 'details'); assert.equal(panel.open, true);
  assert.equal(panel.children[0].tagName, 'summary'); assert.ok(byText(main, 'discord-damsel-dm-archive-tool-panel'));
  assert.equal(byText(main, 'discord-tower-v1.0-dm-archive-v0.1').tagName, 'legend');
});
test('local import displays original text safely, and switching off clears it', async () => {
  const main = page(); const file = walk(main).find(n => n.tagName === 'input' && n.accept);
  const data = fixture(); file.files = [{ name: 'example.json', size: 2048, text: async () => JSON.stringify(data) }];
  await file.onchange();
  assert.ok(byText(main, data.messages[0].content)); assert.ok(byText(main, data.messages[0].timestamp));
  assert.match(textOf(main), /full history still unverified/); assert.match(textOf(main), /1 reference needs attention/);
  byText(main, '● Tool panel on').onclick();
  assert.ok(!byText(main, data.messages[0].content)); assert.ok(byText(main, 'No archive selected'));
  assert.ok(walk(main).find(n => n.tagName === 'fieldset').disabled);
});
test('a completed asynchronous read cannot repopulate an off panel', async () => {
  const main = page(); const file = walk(main).find(n => n.tagName === 'input' && n.accept);
  let resolve; file.files = [{ name: 'example.json', size: 2048, text: () => new Promise(r => { resolve = r; }) }];
  const pending = file.onchange(); byText(main, '● Tool panel on').onclick(); resolve(JSON.stringify(fixture())); await pending;
  assert.ok(!byText(main, fixture().messages[0].content)); assert.ok(byText(main, 'No archive selected'));
});
test('a paused read clears busy state and can retry the same selected file', async () => {
  const main = page(); const file = walk(main).find(n => n.tagName === 'input' && n.accept);
  let resolve; let first = true;
  file.files = [{ name: 'example.json', size: 2048, text: () => {
    if (first) { first = false; return new Promise(r => { resolve = r; }); }
    return Promise.resolve(JSON.stringify(fixture()));
  } }];
  const pending = file.onchange(); byText(main, '● Ready').onclick(); resolve(JSON.stringify(fixture())); await pending;
  assert.ok(!byText(main, 'Reading archive…')); assert.ok(byText(main, 'Read paused'));
  byText(main, '● Paused').onclick(); await byText(main, 'Check selected export again').onclick();
  assert.ok(byText(main, fixture().messages[0].content));
});
test('a later import wins over a slower earlier import', async () => {
  const main = page(); const file = walk(main).find(n => n.tagName === 'input' && n.accept);
  let resolve; file.files = [{ name: 'old.json', size: 2048, text: () => new Promise(r => { resolve = r; }) }];
  const old = file.onchange(); const newer = fixture(); newer.messages[0].content = 'Newer file';
  file.files = [{ name: 'new.json', size: 2048, text: async () => JSON.stringify(newer) }]; await file.onchange();
  resolve(JSON.stringify(fixture())); await old; assert.ok(byText(main, 'Newer file')); assert.ok(!byText(main, fixture().messages[0].content));
});
test('fictional demo reports its missing video and never claims a complete backup', async () => {
  const main = page(); byText(main, 'Load fictional example').onclick(); await settle();
  assert.match(textOf(main), /missing: media\/example-video\.mp4/); assert.match(textOf(main), /full history still unverified/);
  assert.ok(!walk(main).some(n => n.tagName === 'button' && /delete|start cleanup/i.test(n.textContent)));
});
