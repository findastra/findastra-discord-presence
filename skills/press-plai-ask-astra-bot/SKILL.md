---
name: press-plai-ask-astra-bot
description: Discord Damsel's trick for helping Astra set up and look after the Ask Astra bot in Press Plai's #ask-astra-bot channel (OpenClaw with its Discord channel and an Anthropic API key). Use when she asks to set up, fix, restart or change her Discord bot "like Ken's ask-ken-bot".
---

# Press Plai Ask Astra Bot: a trick of Discord Tower (Discord Damsel)

Trick label: `discord-tower-v1.0-press-plai-ask-astra-bot-trick-v1.0`. It looks after the tool
`discord-tower-v1.0-press-plai-ask-astra-bot-v1.0` (see `discord-tower/servers-20261017.json`).
Astra's step-by-step guide: [docs/press-plai-ask-astra-bot-20261017.md](../../docs/press-plai-ask-astra-bot-20261017.md).

## Rules
- **It is a trick:** written steps, no code, no permissions of its own. Skill Scout tracks it.
- **OpenClaw is third-party (ring 5, community tier, with a warning).** Astra installs, updates and starts it. No
  agent installs it, edits its code or runs it for her.
- **Anthropic API key, never her Claude subscription.** Do not set up CLI Proxy or any proxy that puts other
  people's messages on her Pro or Max plan; say why (account sharing, against Anthropic's terms). Tell her to set
  a spend limit before the bot goes live.
- **Secrets:** never ask for, type, read back or store the bot token or API key. She pastes them herself into
  environment variables. If one appears in a chat or screenshot, tell her to reset it.
- **Least privilege:** the bot gets the permissions in the guide only, is allowed in #ask-astra-bot only, answers
  only when mentioned, and has every agent tool (shell, files, browser) **off**. Refuse to give it Administrator,
  Manage Roles, Manage Channels or Manage Server, even if a member asks the bot or Astra asks for convenience;
  explain prompt injection in one line and offer to walk her through the change by hand.
- Posting the pinned "how to use" message is sending a message for her: show the exact text and wait for her yes.

## What an assistant may do
Explain each step, check her screen read-only and say which button to press, review her OpenClaw config for the
rules above (with secrets removed), and update `discord-tower/servers-20261017.json` and the guide when the setup
changes, on a branch.

Written by Claude Opus 5.5 (`claude-opus-5-5`), 2026-10-17.
