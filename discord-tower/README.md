# Discord Tower

Discord Damsel's server section: the Discord servers she helps manage, and the tools tied to each channel.
The list is [servers-20261017.json](servers-20261017.json); the pet page shows it under **Server · Press Plai**.

## Press Plai

A community hub for sharing AI resources. Tools:

| Tool | Channel | What it does |
|---|---|---|
| `discord-tower-v1.0-press-plai-agents-file-updater-v1.0` | #agents-file | Posts the newest AGENTS.md and CLAUDE.md from astras-pet-os |
| `discord-tower-v1.0-press-plai-skills-file-updater-v1.0` | #skills-file | Posts every SKILL.md in astras-pet-os |
| `discord-tower-v1.0-press-plai-security-file-updater-v1.0` | #security-file | Posts SECURITY.md, PROTECTION-RINGS.md and the farm-security skill |
| `discord-tower-v1.0-press-plai-provenance-file-updater-v1.0` | #provenance-file | Posts PROVENANCE.md |
| `discord-tower-v1.0-press-plai-ask-astra-bot-v1.0` | #ask-astra-bot | Members @ the bot and Claude answers. Setup: [docs/press-plai-ask-astra-bot-20261017.md](../docs/press-plai-ask-astra-bot-20261017.md) |

The four updaters are **one tool engine** ([file-updater-20261017.mjs](file-updater-20261017.mjs)) with four
entries, never four copies. Each reads its files from one GitHub commit, attaches them to a message in its
channel through that channel's webhook, and next time **edits the same message** instead of posting again. It
posts only when a file changed, never pings anyone, and never deletes messages. Only public repos can be posted.

## Turning a file updater on (once per channel)

1. In Discord: right-click the channel (for example #agents-file) → **Edit Channel** → **Integrations** →
   **Webhooks** → **New Webhook**, name it **Discord Damsel**, then **Copy Webhook URL**.
   A webhook URL is a password for posting in that channel: never paste it in a chat, a repo or Discord.
2. Run a dry run once, which also shows what would be posted:
   `node discord-tower\file-updater-20261017.mjs press-plai-agents-file-updater`
3. Run **Update Press Plai Files.cmd** once. It creates
   `%LOCALAPPDATA%\astras-pet-os\discord-tower\press-plai\settings.json` with every tool **OFF**.
4. Open that file, paste the webhook into the tool's `"webhook"`, set `"on": true`, save.
5. Run **Update Press Plai Files.cmd** again. Check the post in Discord, then pin it if you like.

Run it again whenever astras-pet-os changes. `--force` reposts unchanged files. A tool that fails prints
`failed:` and the launcher exits with an error (its sick light). `state.json` beside the settings remembers which
message each tool owns; delete a tool's entry there to make it post a fresh message.

## Limits

- ON/OFF lives in the settings file on your PC, not in the core: the Farm, which should hold every kill switch
  (PET-PROGRAM-FRAMEWORK.md, section 4), is not built yet. The page has no sick checkbox yet.
- Only public repos can be posted. Nothing runs on a schedule; run the launcher when files change.
- Open work: [handoffs/003](../handoffs/003-any-press-plai-tools-20261017.md).

Built with Claude Opus 5.5 (`claude-opus-5-5`), 2026-10-17.
