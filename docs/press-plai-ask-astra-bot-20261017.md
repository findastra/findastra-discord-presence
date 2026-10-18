# Press Plai Ask Astra Bot

Tool: `discord-tower-v1.0-press-plai-ask-astra-bot-v1.0` (Discord Tower, pet: Discord Damsel). Channel: **#ask-astra-bot**.
Assistants follow [skills/press-plai-ask-astra-bot/SKILL.md](../skills/press-plai-ask-astra-bot/SKILL.md).

Members @ the bot in #ask-astra-bot and Claude answers, the same way #ask-ken-bot works. Ken's bot is
**OpenClaw** (an open-source agent) with its **Discord channel**, signed in through CLI Proxy to his Codex plan.

## The one difference from Ken's setup: use an Anthropic API key, not your Claude Max plan

A Claude subscription (Pro or Max) is for you personally. Routing it through a proxy so other people's
questions run on it is account sharing and goes against Anthropic's terms; the account can be suspended
(Claude already warned about this in #ask-ken-bot). For a bot other people use, the supported way is an
**Anthropic API key**, billed per use: OpenClaw talks to Anthropic directly, so **CLI Proxy is not needed**.

- Make the key at console.anthropic.com → **API Keys**, name it `press-plai-ask-astra-bot`.
- Set a **monthly spend limit** first (Console → **Billing** → **Limits**). A public bot can be spammed.
- Keep the key in an environment variable on your PC, never in a chat, a repo or Discord. Add its name
  (not the key) to API Fairy.
- A smaller model (Claude Sonnet 5.5 or Haiku 5.5) answers most community questions for far less than Opus.

## Setup (about 20 minutes, Astra does each step)

1. **Discord app.** discord.com/developers/applications → **New Application** → name it **Ask Astra** →
   **Bot** → **Reset Token** and copy it (a password: same rules as the API key). Under **Privileged Gateway
   Intents** turn on **Message Content Intent**. Leave **Presence** off.
2. **Invite it with the smallest permissions.** **OAuth2** → **URL Generator** → scopes `bot` and
   `applications.commands`; permissions **View Channels**, **Send Messages**, **Send Messages in Threads**,
   **Read Message History**, **Embed Links**, **Attach Files**. Never **Administrator**, **Manage Roles**,
   **Manage Channels** or **Manage Server**: anyone in the channel can ask the bot to use what it has, and
   prompt injection is real. (Change server permissions yourself, not through a bot.)
3. **Keep it in one channel.** In Press Plai: **Server Settings** → **Integrations** → **Ask Astra** →
   **Channels**: allow only **#ask-astra-bot**. Then in the channel's permissions, the bot can view and send.
4. **Install OpenClaw** from its official site (docs.openclaw.ai, github.com/openclaw/openclaw) only. It is a
   third-party program (ring 5, community tier): you install it, no agent does.
5. **Configure it** (check the key names in the current OpenClaw docs; they change between versions):
   - model provider **Anthropic**, key read from the environment variable;
   - Discord channel **enabled**, bot token from an environment variable (`DISCORD_BOT_TOKEN`);
   - **reply only when mentioned**, and only in #ask-astra-bot (OpenClaw's channel allowlist);
   - **chat only: turn off shell, file, browser and every other tool** for this bot. People you don't know
     will be typing into it; with tools on, a message could make it run commands on your PC.
   - a short system prompt: who it is (Ask Astra for Press Plai, a hub for sharing AI resources), that it
     never shares keys, files from your PC or anyone's personal details.
6. **Start the gateway** (`openclaw gateway`) and test: in #ask-astra-bot type `@Ask Astra hello`.
7. Pin a message in #ask-astra-bot like Ken's: "Just @ the bot to use it. It runs on Astra's Anthropic API
   key, please don't go crazy lol."
8. **Run it on startup only if you want it always on.** It answers only while your PC and the gateway are on.

## What is not done

- Nothing is installed or running yet; there is no bot token or API key anywhere.
- OpenClaw's config file format was not checked against an installed copy, so step 5 names the settings
  rather than giving a file to paste.
- Discord Damsel's page shows this tool; it does not start or stop the bot.

Written by Claude Opus 5.5 (`claude-opus-5-5`), 2026-10-17.
