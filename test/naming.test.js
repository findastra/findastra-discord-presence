// Guards the naming rules in CLAUDE.md across all user-facing text.
import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { join } from 'node:path';

const root = fileURLToPath(new URL('../', import.meta.url));
const files = ['README.md', 'CLAUDE.md', ...['openai', 'anthropic'].flatMap(app =>
  ['README.md', 'public/index.html', 'public/app.js', 'src/server.js', 'src/launch.js', 'scripts/startup.js', 'src/windows-startup.js', 'package.json'].map(f => `${app}/${f}`))];
const forbidden = [
  [/\b(OpenAI|Anthropic|Claude|Astra) Presence\b/, 'product named after a company or model; use "Findastra Presence (OpenAI)" / "(Anthropic)"'],
  [/\bClaude model\b/i, 'pair the companies: "Anthropic model"'],
  [/\b(openai|anthropic|claude|astra)-discord-presence\b/, 'old repository name'],
  [/findastra\.github\.io\/(openai|anthropic|astra|claude)/, 'old public page'],
];

test('user-facing text follows the naming rules', () => {
  const problems = [];
  for (const file of files) {
    const lines = readFileSync(join(root, file), 'utf8').split('\n');
    lines.forEach((line, i) => {
      for (const [pattern, why] of forbidden) {
        // Allowed on purpose: CLAUDE.md quoting the rules, and the list of old launcher files to delete.
        if (file === 'CLAUDE.md' && /Never name the product|pairs the companies/.test(line)) continue;
        if (line.includes('for (const legacy of')) continue;
        if (pattern.test(line)) problems.push(`${file}:${i + 1}: ${why}\n    ${line.trim().slice(0, 120)}`);
      }
    });
  }
  assert.deepEqual(problems, [], '\n' + problems.join('\n'));
});

test('both editions use the matching product names and card titles', () => {
  for (const [app, title] of [['openai', 'OpenAI'], ['anthropic', 'Anthropic']]) {
    assert.match(readFileSync(join(root, app, 'README.md'), 'utf8'), new RegExp(`^# Findastra Presence \\(${title}\\)`));
    assert.match(readFileSync(join(root, app, 'src/presence.js'), 'utf8'), new RegExp(`name: '${title}'`));
  }
});
