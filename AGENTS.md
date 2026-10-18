# Discord Damsel

Part of Astra's Pet Apps. Public credit: Astra.

**Before any work, read in full:** this repo's `AGENTS.md`, `CLAUDE.md`, every `SKILL.md` on every
branch (`git ls-remote --heads origin`), `handoffs/` and `pet.json`, then everything in the
"Before any work" list in [findastra/astras-pet-apps AGENTS.md](https://github.com/findastra/astras-pet-apps/blob/main/AGENTS.md),
including the ASTRA_PET_OS architecture. No skimming or partial reads. Say in your first reply which files you read.

Keep existing product behavior and source intact. The pet interface is findastra-discord-presence-20261008.html; metadata is pet.json. Never commit credentials, personal health or finance data, local settings, caches, or logs. Imported or user-entered text must be rendered as text, not HTML. State integration limits plainly. New filenames use lowercase words and a date immediately before the extension.

Pet interface and art integration: OpenAI Codex (GPT-6), 2026-10-08.

Desktop artwork and size sync: OpenAI Codex (GPT-6), 2026-10-11. Read desktop-pet-20261011.json. No sparkles. Keep draft and approved design status explicit.

Discord Damsel given Mommy's Mommies' body-to-head ratio (longer gown) in desktop-art and pet-art by Claude Opus 5.5 (`claude-opus-5-5`), 2026-10-17, at Astra's request. Record: `findastra/astras-pet-os` docs/pet-art-redesign-20261017.md.

Discord Tower servers section (`discord-tower/`, the Press Plai file updaters and ask-astra-bot, `skills/press-plai-ask-astra-bot`, guarded by `test/discord-tower-20261017.test.mjs`): Claude Opus 5.5 (`claude-opus-5-5`), 2026-10-17. Webhook URLs, bot tokens and API keys never enter this repo.
