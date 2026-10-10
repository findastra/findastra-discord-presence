# Anthropic Discord Presence

A free Windows companion for sharing Claude activity on Discord, with locally detected model information, an elapsed timer and an animated galaxy.

**[Download for Windows](https://github.com/findastra/findastra-discord-presence/raw/main/downloads/anthropic-discord-presence.zip)**

## Start it

1. Install [Node.js 24 or later](https://nodejs.org/en/download) if needed. No npm install is required.
2. Extract the download and double-click **Start Anthropic Discord Presence.cmd**.
3. Keep Discord desktop open with activity sharing enabled. Choose **Automatic** for Claude Code, or **Start session** for regular Claude desktop chat.
4. Optional: turn on **Run on Windows startup**, or double-click **Enable Automatic Startup.cmd**. Keep the extracted folder in place.
5. Optional: in Settings, turn on **Always on** to share whenever the app is running. Together with Windows startup, the card is up all day without clicking anything.

The Discord application ID and hosted image are included. No API key, bot token, account connection or art upload is needed. Settings and custom applications are optional.

## System tray

On Windows the companion puts a galaxy icon in the system tray (by the clock; it may sit under the ^ arrow). Right-click it for **Start session**, **Automatic**, **Stop sharing**, **Open control panel** and **Quit app**, or double-click to open the control panel. The icon disappears when the app quits. It uses Windows PowerShell, which is built into Windows.

## What Discord shows

The profile card contains the detected model and effort when available, an optional project name, and a session timer. Discord can use the registered application name in other surfaces, such as voice-channel activity labels.

Both companions can run together, but Discord may display only one activity at a time. A successful local RPC acknowledgement means Discord accepted the update; it does not prove every card is visible. Check the full profile and Discord’s activity privacy settings.

Automatic requires Claude Code conversation activity recorded within the last five minutes, including desktop Code sessions when supported local metadata is available. An open Claude app or a recently touched transcript file does not count. Model and effort labels come from parsed session metadata.

Regular Claude desktop chat has no reliable automatic detector here. Use **Start session** when you begin and **Stop sharing** when you finish; unavailable model metadata is labeled **Using Claude**.

**Always on** starts a session every time the app launches, including at Windows sign-in, and turning it on starts one immediately. Use it for Claude on the web, desktop chat and cloud sessions, which leave nothing on this computer to detect. The card shows **Using Claude**, or the exact model and effort while Claude Code on this computer reports them. **Stop sharing** pauses it until the next launch. It is off by default.

**Start session** stays active until **Stop sharing** or **Quit app**. The timer measures this companion’s continuous active session, not model computation time. Closing the browser tab leaves the companion running.

## Project sharing

Project sharing is off by default. Turn on **Show my project on Discord** to publish a folder name, or enter a fixed project label. Full paths and chat titles are never published. When several recent sessions rotate, each project keeps its own model and effort. With a fixed label or sharing disabled, the newest session supplies the model and effort. Sessions without a usable project show **Exploring ideas**.

## Updating and startup

Before starting an updated or relocated copy, choose **Quit app** in the old control panel. The launcher checks the running installation and source build; it reports a conflict instead of silently opening an older copy. If the folder moved, enable startup from the new copy again.

To disable startup, clear **Run on Windows startup** or run `node scripts/startup.js --remove`. This also disables Automatic on the next launch. The startup installer creates default settings for a fresh download and validates configuration before replacing an existing launcher.

## Optional custom application

Create an application in the [Discord Developer Portal](https://discord.com/developers/applications), then replace the Application ID in Settings. The image field accepts an uploaded asset key or a public HTTPS image URL. Uploaded assets are static; external URLs support animated images. The default uses a hosted GIF.

## Privacy

The detector scans complete Claude Code JSONL records backwards to extract conversation timestamps, model, effort and working-directory fields, including when an individual record exceeds 64 KB. Conversation text is discarded and never published or retained in the metadata cache.

The control server binds only to `127.0.0.1`, checks Host and Origin for changes, and sends no telemetry. Discord receives activity text, a timestamp, an image URL and an optional project label. Settings remain in the Git-ignored `.local/config.json`. The local status endpoint includes installation/build identity so the launcher can detect old running copies; that identity is not sent to Discord.

## Development

```sh
node --test
node src/server.js
```

The controls use `http://127.0.0.1:38762/`. `ANTHROPIC_PRESENCE_PORT` changes the port only when running the server directly. `node scripts/package.mjs` at the repository root rebuilds both Windows ZIPs. The local control panel requires the companion server.

The galaxy artwork is original. This independent project is not affiliated with Anthropic or Discord. Product and model names identify the software being used.
