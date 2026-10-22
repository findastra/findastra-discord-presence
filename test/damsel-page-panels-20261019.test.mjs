// Panels on Discord Damsel's page (PET-PROGRAM-FRAMEWORK.md, section 3): each is a <details class="panel"> with its
// label in the top border, and the Sticker Manager's tool box sits inside discord-damsel-servers-tool-panel with its label
// in its own border, the way the plugin draws it. Astra, 2026-10-19: the panels on the Sticker Manager "look off". Tool panels since the same day
// (Astra: "I do want all of it to say tool panel instead of just panel").
// Claude Opus 5.5 (claude-opus-5-5), 2026-10-19.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const page = readFileSync(join(root, 'findastra-discord-presence-20261008.html'), 'utf8');
const start = page.indexOf('<script>window.APP_CONFIG=');
const script = page.slice(start + '<script>'.length, page.indexOf('</script>', start));

class El {
  constructor(tag) { this.tagName = tag.toUpperCase(); this.children = []; this.attrs = {}; this.style = {}; this.textContent = ''; this.className = ''; }
  append(...kids) { this.children.push(...kids); }
  replaceChildren(...kids) { this.children = kids; }
  setAttribute(name, value) { this.attrs[name] = String(value); }
  getAttribute(name) { return this.attrs[name] ?? null; }
  set innerHTML(_) { throw new Error('the page must put text on screen with textContent, never innerHTML'); }
}
const all = (el) => [el, ...el.children.flatMap(all)];
const text = (el) => el.textContent + el.children.map(text).join('');

function openPage() {
  const header = new El('header'), main = new El('main'), feedback = new El('p');
  const store = new Map();
  const document = { createElement: (tag) => new El(tag), querySelector: (s) => ({ main, header, '#feedback': feedback })[s] };
  const localStorage = { getItem: (k) => store.get(k) ?? null, setItem: (k, v) => store.set(k, v) };
  new Function('window', 'document', 'localStorage', 'fetch', script)({ confirm: () => false }, document, localStorage, () => Promise.reject(new Error('no network')));
  const panels = main.children.filter((e) => e.tagName === 'DETAILS');
  return { main, panels };
}

test('every panel is a details.panel that starts open, with only its label in the summary', () => {
  const { panels } = openPage();
  assert.deepEqual(panels.map((p) => text(p.children[0])), ['discord-damsel-servers-tool-panel', 'discord-damsel-L2-tool-panel', 'discord-damsel-dm-archive-tool-panel']);
  for (const p of panels) {
    assert.equal(p.className, 'panel');
    assert.equal(p.open, true);
    const [summary] = p.children;
    assert.equal(summary.tagName, 'SUMMARY');
    assert.equal(summary.title, 'Click the label to fold or unfold this tool panel');
    assert.deepEqual(summary.children.map((c) => c.className), ['legend']);
  }
});

test('the Sticker Manager\'s tool box sits inside the servers panel, its label in its border', () => {
  const { main, panels } = openPage();
  const servers = panels[0];
  const box = servers.children.find((e) => e.tagName === 'FIELDSET');
  assert.ok(box, 'a tool box inside the servers panel');
  assert.equal(box.className, 'tool-box');
  assert.equal(box.children[0].tagName, 'LEGEND');
  assert.equal(box.children[0].textContent, 'discord-tower-v1.0-sticker-manager-v1.0');
  const links = all(box).filter((e) => e.tagName === 'A').map((a) => a.textContent);
  assert.deepEqual(links, ['How to install and use it', 'Plugin file', 'Try it with pretend servers']);
  assert.ok(all(box).some((e) => e.tagName === 'IMG' && /sticker-manager-20261018\.png$/.test(e.src)));
  // No second copy as a plain card, and it says plainly that the server list stays inside Discord.
  assert.equal(main.children.filter((e) => e.className === 'card' && text(e.children[0]) === 'discord-tower-v1.0-sticker-manager-v1.0').length, 0);
  assert.match(text(servers), /shows only inside Discord/);
});

test('the panel and tool box styles put the labels in the border', () => {
  const css = page.match(/<style>([\s\S]*?)<\/style>/)[1];
  assert.match(css, /\.panel>summary\{position:absolute;top:-\.8em/);
  assert.match(css, /\.tool-box\{border:1px solid/);
  assert.match(css, /\.tool-box legend\{/);
});

test('archive launcher opens the separate viewer and its OFF control disables navigation', () => {
  const {panels}=openPage();
  const archive=panels[2], elements=all(archive);
  const open=elements.find(e=>e.tagName==='A');
  const power=elements.find(e=>e.tagName==='BUTTON' && e.textContent==='ON');
  const health=elements.find(e=>e.tagName==='BUTTON' && e.textContent==='Working');
  assert.equal(open.href,'discord-damsel-archive-review-20261020.html');
  power.onclick();
  let prevented=false;
  open.onclick({preventDefault(){prevented=true;}});
  assert.equal(prevented,true);
  assert.equal(open.getAttribute('aria-disabled'),'true');
  power.onclick();
  assert.equal(open.href,'discord-damsel-archive-review-20261020.html');
  health.onclick();
  assert.match(text(archive),/Marked for maintenance in this tab/);
});
