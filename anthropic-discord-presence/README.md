# Anthropic Discord Presence

Shows the exact Anthropic model you're using in Claude Code on your Discord profile, with your project, an elapsed timer and a swirling galaxy.

![Swirling five-arm galaxy](public/galaxy-card.gif)

**[⬇ Download for Windows](https://github.com/findastra/findastra-discord-presence/raw/main/downloads/anthropic-discord-presence.zip)** · Part of [Findastra Discord Presence](../README.md)

## Start it

1. Install [Node.js 24 or later](https://nodejs.org/en/download) if you don't have it.
2. Unzip the download anywhere you like.
3. Double-click **Start Anthropic Discord Presence.cmd**. Your browser opens the controls.
4. Click **Automatic**. Keep Discord desktop open, with activity sharing on in Discord's settings.
5. Optional: double-click **Enable Automatic Startup.cmd** once so it starts with Windows.

No Discord setup is needed: the app comes with its own Discord application built in.

## What your card shows

- **Title:** Anthropic
- **Line 1:** the exact model and effort level, for example *Using Claude Opus 5.5 on High*. Hovering the galaxy shows the raw id (`claude-opus-5-5`). The Claude desktop chat doesn't save its model on your computer, so it shows plain *Using Claude*.
- **Line 2:** *Working on [project]* if you turn on **Show my project on Discord**, otherwise *Exploring ideas*. The project is the folder your newest Claude Code session works in (never the chat title or a full path). Sessions with no folder, or whose folder was moved or deleted, show *Exploring ideas*. When several projects are active, the card shows each for 15 seconds in turn.
- **Timer:** how long you've been working this session. Switching models keeps it running.

## Modes

- **Automatic:** shares while the Claude desktop app is open, or while Claude Code wrote to a session in the last 5 minutes.
- **Start session (manual):** shares until you click Stop sharing or Quit app.
- **Off:** disconnects immediately.

Closing the browser tab leaves the app running; **Quit app** stops it. To stop it starting with Windows, untick **Run on Windows startup** in the controls, or run `node scripts/startup.js --remove`.

## Privacy

- Runs only on your computer (`127.0.0.1`), checks every request comes from its own page, and sends no telemetry.
- To find the model, effort level and project, it reads only the last 64 KB of the newest Claude Code session file and keeps only the `model`, `effort` and `cwd` values (and of the folder, only its last name). Everything else, including your conversation, is discarded and never stored or sent.
- Discord receives only: the model name and effort level, the start time, the art link and, if you opt in, your project's folder name.
- Settings live in `.local/config.json`, which never leaves your computer.

## Using your own Discord application (optional)

Create an application with any name in the [Discord Developer Portal](https://discord.com/developers/applications) (Discord blocks some brand names, which doesn't matter: the card title is set by the app). Paste its Application ID under **Connect to Discord** in the controls. No art upload is needed.

## Development

```sh
node --test          # 13 tests
node src/server.js   # controls at http://127.0.0.1:38762/
```

`ANTHROPIC_PRESENCE_PORT` changes the port when running the server directly. No dependencies.

This independent app is not made, endorsed or sponsored by Anthropic or Discord. "Anthropic", "Claude" and model names are Anthropic's trademarks and appear only to say which product you're using. The galaxy art is original.
