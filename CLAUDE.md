# Rules for this repo

Findastra Discord Presence: two independent Windows apps (`openai/`, `anthropic/`) that show the AI model in use on Discord. Read this before changing anything; `node --test` at the repo root enforces the naming rules.

## Naming
- The product is **Findastra Presence**, with editions **Findastra Presence (OpenAI)** and **Findastra Presence (Anthropic)**. Never name the product after a company or model ("OpenAI Presence", "Claude Presence", "Astra Presence"): OpenAI's and Anthropic's brand rules require third-party app names to be our own.
- User-facing text pairs the companies symmetrically: "OpenAI ___" / "Anthropic ___" (e.g. "exact OpenAI model" / "exact Anthropic model", never "Claude model").
- Keep real product and model names where they describe what is detected: Codex, Claude Code, GPT-6 Astra, Claude Opus 5.5.
- Discord card titles are "OpenAI" and "Anthropic" (sent in the activity `name` field; Discord rejects brand names as registered application names).

## Art
- Original galaxies only (never art captured from a company's site). One arm per current model generation: OpenAI 6 (GPT-6), Anthropic 5 (Claude 5). When a new generation ships, re-render with one more arm and bump `?v=` in `GALAXY_URL` (`src/presence.js`) so Discord refetches.
- Each image is centred, fills the square, black background. GIFs stay under 10 MB (GitHub serves larger raw files without an image type).

## Privacy
- Detection reads local metadata only (model, effort, timestamps, folder). Never read or send conversation text, prompts or chat titles. Only a folder's last name may leave the computer, and only when the user opts in.

## Changes
- Each app has its own tests (`cd openai && node --test`); add tests with every behaviour change. Rebuild downloads with `node scripts/package.mjs` before pushing changes that affect the apps.
- Search for references before moving or renaming files or folders.
