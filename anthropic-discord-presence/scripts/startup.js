import { setStartup } from '../src/windows-startup.js';
const enabled = !process.argv.includes('--remove');
const config = setStartup(enabled);
console.log(!enabled
  ? 'Anthropic Discord Presence will no longer launch at Windows sign-in.'
  : config.alwaysOn
    ? 'Anthropic Discord Presence will start quietly at Windows sign-in and share right away (Always on). Keep this app folder in place.'
    : 'Anthropic Discord Presence will start quietly in Automatic mode at Windows sign-in. Keep this app folder in place.');
