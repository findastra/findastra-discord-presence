# Findastra Discord Presence

*By Astra.* The home (Discord Tower) of **Discord Damsel**, one of [Astra's PetOS](https://github.com/findastra/astras-pet-os) pets.

Share AI activity on your Discord profile: the model and effort level when local metadata exposes them, an optional project name, an elapsed timer, and a swirling galaxy.

Two small Windows apps, one for each company's models. Both can run together, but Discord may display only one card even when it accepts both activities. Each card was verified individually on Discord desktop; simultaneous display is not guaranteed.

| | |
|:---:|:---:|
| ![OpenAI galaxy](openai-discord-presence/public/galaxy-card.gif) | ![Anthropic galaxy](anthropic-discord-presence/public/galaxy-card.gif) |
| **OpenAI Discord Presence** | **Anthropic Discord Presence** |
| Automatic for **Codex** | Automatic for **Claude Code**; manual or **Always on** for Claude on the web, desktop chat and cloud sessions |
| **[⬇ Download for Windows](https://github.com/findastra/findastra-discord-presence/raw/main/downloads/openai-discord-presence.zip)** | **[⬇ Download for Windows](https://github.com/findastra/findastra-discord-presence/raw/main/downloads/anthropic-discord-presence.zip)** |

## Start it (about 2 minutes)

1. Install [Node.js 24 or later](https://nodejs.org/en/download) if you don't have it.
2. Download and unzip the app(s) you want.
3. Double-click **Start OpenAI Discord Presence.cmd** (or **Start Anthropic Discord Presence.cmd**) in the unzipped folder. Your browser opens its controls.
4. Click **Automatic** for Codex or Claude Code. For regular Claude desktop chat, use **Start session** and **Stop sharing**, or turn on **Always on** in Settings. Keep Discord desktop open with activity sharing enabled.
5. Optional: double-click **Enable Automatic Startup.cmd** once so it starts with Windows.

When updating, quit the running companion from its control panel before opening the new copy. The launcher checks the installation and build so an older process cannot silently stand in for the update. If you move the folder, enable startup again from the new location.

No account, API key or Discord setup needed. Everything runs on your own computer; nothing is sent anywhere except the card itself to your own Discord app. Details: [OpenAI app](openai-discord-presence/README.md) · [Anthropic app](anthropic-discord-presence/README.md).

## What the card shows

> **OpenAI**
> Using GPT-6 Astra on Ultra
> Working on paper-girl
> 00:42 elapsed

The title is the company; the line under it is the detected model and effort level when available. Your project is opt-in: a chat or session you renamed shows that name (Codex rename, or `/rename` in Claude Code), otherwise the folder you're working in. A chat started from another chat in the Claude desktop app shows the top-level chat's name, as the app's sidebar lists it. Renames show within a few seconds. With several projects active, every one takes a turn on the card, one every 6 seconds, each paired with its own model and effort; the control panel lists them all.

Codex and Claude Code expose model metadata. Anthropic Automatic requires Claude Code conversation activity recorded in the last five minutes, including desktop Code sessions with supported local metadata. An open app or a touched transcript file does not count. Regular Claude desktop chat, Claude on the web and cloud sessions have no reliable automatic detector here; use manual **Start session** and **Stop sharing**, or turn on **Always on** in the Anthropic app's Settings to share whenever it runs. Missing model metadata is labeled **Using Claude** or **Using OpenAI**. Detection does not track foreground focus, and an accepted Discord activity is not proof that the profile displays it.

## The galaxies

Each galaxy has **one arm per model generation**: 6 for OpenAI (GPT-6) and 5 for Anthropic (Claude 5). When a new generation ships, its galaxy grows an arm. The animation follows real galaxy physics: stars near the core orbit several times faster than the rim, the arms trail, and stars brighten as they pass through an arm. How the art is made, with every prompt and command: [docs/galaxy-art-20261017.md](docs/galaxy-art-20261017.md); the tools are in [image-bridge/](image-bridge/README.md).

## Adding another AI

Want a card for Gemini, Copilot or another model? Each app is a self-contained folder, so a new one is a copy of an existing app with its detection, labels, Discord application and galaxy changed. Step-by-step guide: **[ADDING-A-MODEL.md](ADDING-A-MODEL.md)**.

## Limits

- Windows only, with Node.js 24 or later and Discord desktop open.
- Discord accepts both cards, but may show only one of them on your profile; check your profile to see what friends see.
- Automatic needs local metadata: Codex for OpenAI, Claude Code for Anthropic. Claude desktop chat, Claude on the web and cloud sessions need **Start session** or **Always on**.
- Model, effort and project come from local metadata and can be missing; the card then says **Using OpenAI** or **Using Claude**.
- Detection does not follow which window is in front, and long silent thinking can exceed the five-minute window.
- New galaxy art costs money to generate and needs Astra's approval ([docs/galaxy-art-20261017.md](docs/galaxy-art-20261017.md)).

## For developers

```sh
node --test                     # every app's tests plus the naming rules
node scripts/package.mjs        # rebuilds the downloads in downloads/
```

No dependencies; Node.js 24 only. Rules for contributors (and AI assistants) are in [CLAUDE.md](CLAUDE.md).

This is an independent project, not made, endorsed or sponsored by OpenAI, Anthropic or Discord. Their names and model names are their trademarks and appear only to say which product you're using. The code is MIT-licensed; the galaxy art is original.



## Discord Damsel

Discord Damsel is the pet for this repo. Her pet program (Discord Tower, #13 in
[Astra's PetOS](https://github.com/findastra/astras-pet-os)) runs these tools:

| Tool | Version | What it does |
|---|---|---|
| `discord-tower-v1.0-openai-discord-presence-v0.2` | 0.2.0 | Codex: the OpenAI model and effort, and every active chat by its own name, folder or Codex project |
| `discord-tower-v1.0-anthropic-discord-presence-v0.2` | 0.2.0 | Claude Code: the Anthropic model and effort, and every active session by its `/rename` name or folder |
| `discord-tower-v1.0-sticker-manager-v1.0` | 1.0.3 | In her servers tool panel: every server you are in, each opening to its stickers; pick stickers and reset your favorite stickers to them ([how](discord-tower/sticker-manager/README.md)) |
| `discord-tower-v1.0-cli-proxy-api-v1.0` | 1.0.0 | Looks after CLI Proxy API (third-party): installs the verified release, keeps it on this PC, starts and stops it from its controls page ([how](discord-tower/cli-proxy-api/README.md)) |

**Start both tools in Automatic:** double-click [start-discord-damsel-20261014.cmd](start-discord-damsel-20261014.cmd). It first updates this folder from GitHub (only on `main`, only with no local changes, fast-forward only), then starts OpenAI and Anthropic Discord Presence in the background, asks any older copy of either app to quit, switches both to Automatic and opens her page. Keep this folder as the only copy on the PC: `%USERPROFILE%\Documents\Pet Programs\findastra-discord-presence` (`Documents\Projects` until it is renamed). Double-clicking Discord Damsel on the desktop does the same once the desktop pets are rebuilt (astras-pet-os card 014).

Her app is [findastra-discord-presence-20261008.html](findastra-discord-presence-20261008.html): open it in a browser, or
double-click Discord Damsel on the desktop. It links each tool's control page and keeps a setup checklist. Metadata
and the tool list are in [pet.json](pet.json); desktop art is in [desktop-pet-20261011.json](desktop-pet-20261011.json)
(draft).

### Limits

- Her app does not start the tools or change Discord by itself. Start each tool with its `Start … Discord Presence.cmd`.
- Both tools can run together, but Discord decides which card your profile shows; check the profile itself.
- A chat renamed in Codex shows only if Codex saves the name in its local database (`threads.name`, which current
  Codex source has). Not yet confirmed with the Codex desktop app on a live PC. A project renamed in Codex shows only
  for chats that have no folder of their own.

Pet interface and art: OpenAI Codex (GPT-6), 2026-10-08 and 2026-10-11. Chat and session names, the 6-second shuffle
and this summary: Claude Opus 5.5 (`claude-opus-5-5`), 2026-10-14. Sub-chats named by their top-level chat:
Claude Opus 5.5 (`claude-opus-5-5`), 2026-10-18.

### Trick: DM cleanup (`discord-tower-v1.0-dm-cleanup-trick-v1.0`)

Discord Damsel can walk you through deleting all of your own messages in a Discord DM with
Undiscord, a third-party browser add-on. How to use it: **[docs/dm-cleanup-20261010.md](docs/dm-cleanup-20261010.md)**.
Assistants read [skills/dm-cleanup/SKILL.md](skills/dm-cleanup/SKILL.md). Only your messages are deleted, deletion is
permanent, automating a personal account is against Discord's rules, and you approve exactly what goes before you
click Delete (astras-pet-os farm-security, section 10). Added with Claude Opus 5.5, 2026-10-10; updated 2026-10-17.

### Tool: Sticker Manager (`discord-tower-v1.0-sticker-manager-v1.0`), in her servers tool panel

Discord Damsel's servers tool panel (`discord-damsel-servers-tool-panel`) lists every server you are in; click one to see all
of its stickers and click it again to close it. Inside it, the Sticker Manager lets you pick stickers from any server
and reset your favorite stickers to exactly those, with an undo. It runs inside Discord desktop as a BetterDiscord
plugin. Install and use: **[discord-tower/sticker-manager/README.md](discord-tower/sticker-manager/README.md)**.
It changes only your favorite stickers, after you confirm, through Discord's own settings saver; it makes no requests
of its own and never touches your token. BetterDiscord is third-party, and client mods are against Discord's Terms of
Service. First tested inside Discord on 2026-10-19 (BetterDiscord v1.14.3, plugin 1.0.1): it read 91 servers and
1315 stickers and reset her favorites to two picks. 1.0.2 fixes putting back an empty list and the confirmation's
sentences running together, both found in that test (card 005). Added with Claude Opus 5.5, 2026-10-18, at Astra's
request.

### Tool: CLI Proxy API manager (`discord-tower-v1.0-cli-proxy-api-v1.0`)

Astra gave CLI Proxy API (a third-party local API proxy by router-for-me) to Discord Damsel to look after on 2026-10-18.
The manager installs only the verified v8.0.34 from quarantine, writes a config that keeps it on 127.0.0.1 with plugins
and network discovery off, and starts and stops it from a control page on this PC (`http://127.0.0.1:38763/`). It
refuses to start while a Claude sign-in is in the proxy's folder: never sign it in with your Claude login. A Discord bot
other people use runs on an API key with a spend limit. Install and use:
**[discord-tower/cli-proxy-api/README.md](discord-tower/cli-proxy-api/README.md)**. First run 2026-10-19: v8.0.33 runs
on this PC only, with no sign-ins (card 006). v8.0.34 is checked in quarantine and pinned; moving up is Stop, install,
Start (card 007). Added with Claude Opus 5.5, 2026-10-18, at Astra's request.

### Connections

Each pet Discord Damsel talks to has a connection box in her L2 tool panel (`discord-damsel-L2-tool-panel`) on
[her page](findastra-discord-presence-20261008.html) ([Pet Program Framework](https://github.com/findastra/astras-pet-os/blob/main/PET-PROGRAM-FRAMEWORK.md),
section 3). Both below are **planned, not connected**, and their ON/OFF starts OFF.

| Pet | Pet program | She sends | She receives | Grant |
|---|---|---|---|---|
| Token Toucan (private repo) | `token-canopy-v1.0` (#52) | What her CLI Proxy API manager reports: which models the proxy used and how many tokens each took. Not reported yet: her tool writes the proxy's config with usage statistics off | Nothing | `toucan-reads-cli-proxy` |
| Proxy Axolotl (private repo) | `proxy-lake-v1.0` (#64) | Her tool's safety check before every start (this PC only; remote console, network discovery and plugins off) and whether the proxy answers | A finding, when the proxy could be reached from beyond this PC | `axolotl-reads-cli-proxy` |

CLI Proxy API has one owner: her tool `discord-tower-v1.0-cli-proxy-api-v1.0`. Both grants are read only, through that
tool, and planned in the hub's `system-map.json` ([astras-pet-os#101](https://github.com/findastra/astras-pet-os/pull/101)):
Iron Gates issues them and Astra approves them. Neither pet gets a copy of the tool or the proxy's settings file, keys or
sign-ins; Start, Stop and settings stay hers. Added with Claude Opus 5.5, 2026-10-19.

## Desktop pet update - 2026-10-11
VR headset resting above visible face; controller in hand. Presence project label corrected to Astra's PetOS. Desktop artwork status: draft. Manifest: [desktop-pet-20261011.json (in the hub)](https://raw.githubusercontent.com/findastra/astras-pet-os/main/desktop-art/discord-damsel/desktop-pet-20261011.json). The native companion renders this art; existing browser interface behavior is unchanged. Generated character artwork uses OpenAI image generation; source sheets and derived frames are included where applicable. Public credit: Astra. Integrated by OpenAI Codex (GPT-6).

## Limits

What is not done, plainly. From the hub's [intelligence levels](https://github.com/findastra/astras-pet-os/blob/main/INTELLIGENCE-LEVELS.md) (checked 2026-10-17):

- **Program (L1/L2):** ✅ **Made by Astra:** *Presence Tower*: [OpenAI Discord Presence](https://github.com/findastra/findastra-discord-presence/tree/main/openai-discord-presence) and [Anthropic Discord Presence](https://github.com/findastra/findastra-discord-presence/tree/main/anthropic-discord-presence) tray apps, the [Sticker Manager](discord-tower/sticker-manager/README.md) BetterDiscord plugin and the [CLI Proxy API manager](discord-tower/cli-proxy-api/README.md); **Made by others:** Discord, BetterDiscord, CLI Proxy API
- **Runtime (L2):** ✅ **Does:** both presence apps start at sign-in and show live Codex and Claude Code activity on Discord. No inbox
- **Agentic harness (L3):** — not built yet

### Native program: DM archive review

Open **[DM archive review](discord-damsel-archive-review-20261020.html)** from Damsel's
`discord-damsel-dm-archive-tool-panel`. Export HTML (Dark), JSON and downloaded assets with
DiscordChatExporter separately, then choose the export folder in the viewer. Search and pagination keep
long conversations manageable. Original message text and timestamp strings are displayed unchanged.

The viewer checks JSON counts, duplicate IDs and local media presence, nonzero size and recorded sizes.
It reports remote references and missing assets; it cannot prove the export contains the entire Discord history
or verify media contents. Select files only from a private folder outside this repository. No uploads,
Discord credentials, automated export or deletion are implemented. Turning the viewer off clears its loaded
files; the launcher switches affect only that launcher tab. The example is fictional.

Source and integration: OpenAI Codex (GPT-6), 2026-10-20. By Astra.
