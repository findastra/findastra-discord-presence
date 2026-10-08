# Rules for this repo

Findastra Discord Presence holds one Windows app per AI company: `openai-discord-presence/` and `anthropic-discord-presence/`, each its own download. More can be added (see [ADDING-A-MODEL.md](ADDING-A-MODEL.md)). Read this before changing anything; `node --test` at the repo root runs every app's tests plus the naming rules.

## High-level decisions
- Before naming, structuring or publishing anything, look at the owner's other repos on github.com/findastra and follow their conventions (lowercase-hyphen repo and folder names; README title is the same words in Title Case).

## Naming
- Each app is named `<company>-discord-presence`, titled "<Company> Discord Presence" (e.g. OpenAI Discord Presence, Anthropic Discord Presence). Its folder, download ZIP, unzip folder and start file use that name.
- User-facing text pairs the companies symmetrically: "OpenAI ___" / "Anthropic ___" (e.g. "exact OpenAI model" / "exact Anthropic model", never "Claude model").
- Keep real product and model names where they describe what is detected: Codex, Claude Code, GPT-6 Astra, Claude Opus 5.5.
- Discord card titles are the company: "OpenAI", "Anthropic" (sent in the activity `name` field; Discord rejects brand names as registered application names).

## Art
- Original galaxies only (never art captured from a company's site). One arm per current model generation: OpenAI 6 (GPT-6), Anthropic 5 (Claude 5). When a new generation ships, re-render with one more arm and bump `?v=` in `GALAXY_URL` (`src/presence.js`) so Discord refetches.
- Each image is centred, fills the square, black background. GIFs stay under 10 MB (GitHub serves larger raw files without an image type).

## Privacy
- Detection reads local metadata only (model, effort, timestamps, folder). Never read or send conversation text, prompts or chat titles. Only a folder's last name may leave the computer, and only when the user opts in.

## Changes
- Add tests with every behaviour change (`cd openai-discord-presence && node --test`). Rebuild downloads with `node scripts/package.mjs` before pushing changes that affect an app.
- Search for references before moving or renaming files or folders.
