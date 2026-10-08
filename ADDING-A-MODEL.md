# Adding another AI

Each app in this repo is self-contained: one folder, one download, one Discord card. To add another AI (for example Gemini or GitHub Copilot), copy an existing app and change the parts below. Use `anthropic-discord-presence/` as the template if the AI writes session files to disk (like Claude Code), or `openai-discord-presence/` if it keeps a local database (like Codex).

The example below adds **Gemini** as `google-discord-presence`. Name it after the company, following the same pattern.

## 1. Copy the folder

```sh
cp -r anthropic-discord-presence google-discord-presence
```

Rename the start file to `Start Google Discord Presence.cmd` and replace every "Anthropic Discord Presence" / `anthropic-discord-presence` inside the new folder with the new name. Delete `.local/` if it was copied.

## 2. Give it its own Discord application

1. Create an application in the [Discord Developer Portal](https://discord.com/developers/applications). Any name works; Discord blocks some brand names, and that doesn't matter because the app sets the card title itself.
2. Copy its **Application ID** (public, not a secret) into `BUILT_IN_CLIENT_ID` in `src/presence.js`.

Each AI needs its own application: Discord shows one card per application.

## 3. Teach it to recognise the AI (`src/detector.js`)

Write a `detect…()` function that returns:

```js
{ active, model, effort, project, projects, message }
```

- `active`: true if the AI was used in the last 5 minutes (`IDLE_MS`).
- `model`: the exact model id, e.g. `gemini-3-pro`. `effort`: its thinking level if the AI records one, else `''`.
- `project` / `projects`: the folder name(s) of recent sessions, only when the user turned on project sharing. Use the existing `folderProject()` rules: last folder name only, never a full path, and never a folder that no longer exists.
- `message`: a short status for the controls page.

Read **metadata only**: timestamps, model ids, folder paths. Never read prompts, replies or chat titles, and never send anything except the card to Discord.

## 4. Set the card text (`src/presence.js`)

- `name:` in `activity()` is the card's bold title. Use the company: `'Google'`.
- `modelLabel()` turns model ids into friendly names (`gemini-3-pro` → `Gemini 3 Pro`).
- The fallback name shown when the model is unknown (e.g. `'Gemini'`).

## 5. Port, startup entry and art

- **Port:** pick the next free one (OpenAI uses 38761, Anthropic 38762) in `src/server.js` and `src/launch.js`.
- **Startup file name:** in `src/windows-startup.js` and `scripts/startup.js`, so it doesn't replace another app's startup entry.
- **Art:** an original galaxy with **one arm per model generation**, centred and filling a square on black. Save it as `public/galaxy.png`, `public/galaxy.gif` and `public/galaxy-card.gif` (under 10 MB), and point `GALAXY_URL` at the new folder.

## 6. Test, package, list it

1. Add tests next to the existing ones in `test/` for the detector and labels, then run `node --test` from the repo root. It also runs the naming rules.
2. Add the folder to the app list in `scripts/package.mjs`, then run `node scripts/package.mjs` to build `downloads/google-discord-presence.zip`.
3. Add a column for it to the table in the main [README](README.md) and to the test list in `test/naming.test.js`.
