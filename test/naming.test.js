// Guards the naming rules in CLAUDE.md across all user-facing text.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
// Every app in the repo: [folder, company as written on the card].
const apps = [['openai-discord-presence', 'OpenAI'], ['anthropic-discord-presence', 'Anthropic']];
const files = ['README.md', 'CLAUDE.md', 'ADDING-A-MODEL.md', ...apps.flatMap(([app]) =>
  ['README.md', 'public/index.html', 'public/app.js', 'src/server.js', 'src/launch.js', 'scripts/startup.js', 'src/windows-startup.js', 'package.json'].map(f => `${app}/${f}`))];
const forbidden = [
  [/\b(OpenAI|Anthropic|Claude|Astra) Presence\b/, 'app titles are "<Company> Discord Presence"'],
  [/Findastra Presence/, 'the repo is Findastra Discord Presence; the apps are "<Company> Discord Presence"'],
  [/\bClaude model\b/i, 'pair the companies: "Anthropic model"'],
  [/findastra\.github\.io\/(openai|anthropic|astra|claude)/, 'old public page'],
];

test('user-facing text follows the naming rules', () => {
  const problems = [];
  for (const file of files) {
    const lines = readFileSync(join(root, file), 'utf8').split('\n');
    lines.forEach((line, i) => {
      // Allowed on purpose: CLAUDE.md quoting a rule, and the list of old launcher files to delete.
      if (file === 'CLAUDE.md' && line.includes('pairs the companies')) return;
      if (line.includes('for (const legacy of') || line.includes('const legacyNames =')) return;
      for (const [pattern, why] of forbidden) if (pattern.test(line)) problems.push(`${file}:${i + 1}: ${why}\n    ${line.trim().slice(0, 120)}`);
    });
  }
  assert.deepEqual(problems, [], '\n' + problems.join('\n'));
});

test('each app uses its folder name for its title, start file and card title', () => {
  for (const [app, company] of apps) {
    const title = `${company} Discord Presence`;
    assert.match(readFileSync(join(root, app, 'README.md'), 'utf8'), new RegExp(`^# ${title}\\n`));
    assert.match(readFileSync(join(root, app, 'src/presence.js'), 'utf8'), new RegExp(`name: '${company}'`));
    readFileSync(join(root, app, `Start ${title}.cmd`));   // throws if the start file is missing
    assert.match(readFileSync(join(root, 'scripts/package.mjs'), 'utf8'), new RegExp(`'${app}'`));
  }
});
