# Findastra Presence (OpenAI)

Shows the exact OpenAI model you're using in Codex on your Discord profile, with your project, an elapsed timer and a swirling galaxy.

![Swirling six-arm galaxy](public/galaxy-card.gif)

**[⬇ Download for Windows](https://github.com/findastra/findastra-discord-presence/raw/main/downloads/findastra-presence-openai.zip)** · Part of [Findastra Discord Presence](../README.md)

## Start it

1. Install [Node.js 24 or later](https://nodejs.org/en/download) if you don't have it.
2. Unzip the download anywhere you like.
3. Double-click **Start Findastra Presence.cmd**. Your browser opens the controls.
4. Click **Automatic**. Keep Discord desktop open, with activity sharing on in Discord's settings.
5. Optional: double-click **Enable Automatic Startup.cmd** once so it starts with Windows.

No Discord setup is needed: the app comes with its own Discord application built in.

## What your card shows

- **Title:** OpenAI
- **Line 1:** the exact model and effort level, for example *Using GPT-6 Astra on Ultra* or *Using GPT-5.6 Sol on Low*. Hovering the galaxy shows the raw id (`gpt-6-astra`).
- **Line 2:** *Working on [project]* if you turn on **Show my project on Discord**, otherwise *Exploring ideas*. The project is the folder your newest Codex chat works in (never the chat title or a full path). Chats without a real folder, or whose folder was renamed or deleted, use the chat's saved Codex project name instead. When several projects are active, the card shows each for 15 seconds in turn.
- **Timer:** how long you've been working this session. Switching models keeps it running.

## Modes

- **Automatic:** shares while your newest Codex chat was updated in the last 5 minutes, then hides. It reads Codex's local task list, not your screen, so long silent thinking can exceed the window.
- **Start session (manual):** shares until you click Stop sharing or Quit app.
- **Off:** disconnects immediately.

Closing the browser tab leaves the app running; **Quit app** stops it. To stop it starting with Windows, untick **Run on Windows startup** in the controls, or run `node scripts/startup.js --remove`.

## Privacy

- Runs only on your computer (`127.0.0.1`), checks every request comes from its own page, and sends no telemetry.
- Automatic mode opens Codex's newest `~/.codex/state_N.sqlite` **read-only** and reads only each task's model, effort level, update time and folder. It never reads prompts, chat titles or transcripts.
- Discord receives only: the model name and effort level, the start time, the art link and, if you opt in, your project's folder name.
- Settings live in `.local/config.json`, which never leaves your computer.

## Using your own Discord application (optional)

Create an application with any name in the [Discord Developer Portal](https://discord.com/developers/applications) (Discord blocks some brand names, which doesn't matter: the card title is set by the app). Paste its Application ID under **Connect to Discord** in the controls. No art upload is needed.

## Development

```sh
node --test          # 14 tests
node src/server.js   # controls at http://127.0.0.1:38761/
```

`OPENAI_PRESENCE_PORT` changes the port when running the server directly. No dependencies. History is in [DEVELOPMENT.md](DEVELOPMENT.md).

This independent app is not made, endorsed or sponsored by OpenAI or Discord. "OpenAI", "Codex" and model names are OpenAI's trademarks and appear only to say which product you're using. The galaxy art is original.
