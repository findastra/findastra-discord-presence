# Discord Damsel

Part of Astra's PetOS. Public credit: Astra.

**Before any work, read in full:** this repo's `AGENTS.md`, `CLAUDE.md`, every `SKILL.md` on every
branch (`git ls-remote --heads origin`), `handoffs/` and `pet.json`, then everything in the
"Before any work" list in [findastra/astras-pet-os AGENTS.md](https://github.com/findastra/astras-pet-os/blob/main/AGENTS.md),
including the ASTRA_PET_OS architecture. No skimming or partial reads. Say in your first reply which files you read.

Keep existing product behavior and source intact. The pet interface is findastra-discord-presence-20261008.html; metadata is pet.json. Never commit credentials, personal health or finance data, local settings, caches, or logs. Imported or user-entered text must be rendered as text, not HTML. State integration limits plainly. New filenames use lowercase words and a date immediately before the extension.

Pet interface and art integration: OpenAI Codex (GPT-6), 2026-10-08.

Desktop artwork and size sync: OpenAI Codex (GPT-6), 2026-10-11. Read https://raw.githubusercontent.com/findastra/astras-pet-os/main/desktop-art/discord-damsel/desktop-pet-20261011.json. No sparkles. Keep draft and approved design status explicit.

Discord Damsel given Mommy's Mommies' body-to-head ratio (longer gown) in desktop-art and pet-art by Claude Opus 5.5 (`claude-opus-5-5`), 2026-10-17, at Astra's request. Record: `findastra/astras-pet-os` docs/pet-art-redesign-20261017.md.

Pictures moved to the hub (one art source, Flash Audit A58, Astra 2026-10-18): every picture of Discord Damsel lives only in [findastra/astras-pet-os](https://github.com/findastra/astras-pet-os) (`art/frames/discord-damsel/`, `desktop-art/discord-damsel/`); this repo links to them and keeps no copy, so change a picture there, never here. By Claude Opus 5.5 (`claude-opus-5-5`), 2026-10-18.

Sticker Manager (`discord-tower-v1.0-sticker-manager-v1.0`, in `discord-damsel-servers-module`): a BetterDiscord plugin in `discord-tower/sticker-manager/` that lists every server Astra is in with its stickers and resets her favorite stickers to the ones she picks, by Claude Opus 5.5 (`claude-opus-5-5`), 2026-10-18, at Astra's request. It changes only the favorite stickers, after she confirms, through Discord's own settings saver; keep it free of its own network requests and of any token (`test/sticker-manager-20261018.test.mjs` checks). Handoff card 005.

CLI Proxy API manager (`discord-tower-v1.0-cli-proxy-api-v1.0`, in `discord-tower/cli-proxy-api/`): installs the verified CLI Proxy API release (third-party, router-for-me) from quarantine, keeps it on 127.0.0.1, and starts and stops it from a control page on 127.0.0.1:38763, by Claude Opus 5.5 (`claude-opus-5-5`), 2026-10-18, at Astra's request. Never sign the proxy in with Astra's Claude login: the manager refuses to start while one is in its folder; keep that check and the 127.0.0.1-only config (`test/cli-proxy-api-20261018.test.mjs`). A newer release goes through quarantine and Astra's OK before `release-20261018.json` changes. Handoff card 006.

Connection boxes for Token Toucan and Proxy Axolotl in `discord-damsel-L2-module` on her page (the planned read-only grants `toucan-reads-cli-proxy` and `axolotl-reads-cli-proxy`, astras-pet-os#101), and the README's Connections note, by Claude Opus 5.5 (`claude-opus-5-5`), 2026-10-19. Both switches start OFF; keep the boxes in step with the hub's `system-map.json` and the two pets' READMEs (`test/cli-proxy-connections-20261019.test.mjs`).

Panels, not modules (Astra, 2026-10-19; astras-pet-os#111): a bordered box on a page is a **panel**, because to a developer a module is a file of code. Her boxes are now `discord-damsel-servers-panel` (the Sticker Manager's, plugin 1.0.1, pet.json `panel`) and `discord-damsel-L2-panel` (`<details class="panel">` on her page), by Claude Opus 5.5 (`claude-opus-5-5`), 2026-10-19. The Sticker Manager and connection-box lines above keep the names they were written with. Webpack modules and `module.exports` in the plugin are real modules and keep the word. `test/sticker-manager-20261018.test.mjs` and `test/cli-proxy-connections-20261019.test.mjs` check the panel names.

The Sticker Manager on her page sits inside `discord-damsel-servers-panel`, as a tool box with its label in its top border, drawn the way the plugin draws them (`panelBox` and `.tool-box`; `test/damsel-page-panels-20261019.test.mjs`), by Claude Opus 5.5 (`claude-opus-5-5`), 2026-10-19, after Astra said the panels on the Sticker Manager looked off. On a phone the label stays on one line.

CLI Proxy API pinned to v8.0.34 (`release-20261019.json`, replacing `release-20261018.json`) on Astra's OK, 2026-10-19, after checking the download against the release's `checksums.txt` and GitHub's own digest, by Claude Opus 5.5 (`claude-opus-5-5`). The manager's Stop, OFF and Claude guard now reach any copy it installed under `program\` (`ownCopy`), so a copy of an earlier pin that is still running stays stoppable; Start runs only the pinned release. Handoff card 007.

Sticker Manager 1.0.2, by Claude Opus 5.5 (`claude-opus-5-5`), 2026-10-19, after the first test inside Astra's Discord (BetterDiscord v1.14.3, card 005): **Put back** also works when the list saved before the last reset was empty (`Core.backup`: an empty saved list is a copy, nothing saved is not), with its own confirmation; **Reset** still needs at least one pick; a failed save keeps the copy from before. The confirmation's lines go to `BdApi.UI.showConfirmationModal` as React elements, one paragraph each, because BetterDiscord 1.14 turns each string into Discord's inline markdown with nothing between them (`confirmContent`). `test/sticker-manager-20261018.test.mjs` drives the real panel with a pretend page; the harness has `?zero`.

Tool panels (Astra, 2026-10-19: "I do want all of it to say tool panel instead of just panel"; astras-pet-os#129, card 047 task 7): her boxes are `discord-damsel-servers-tool-panel` (the Sticker Manager's, in the plugin's `PANEL`, pet.json `panel` and her page) and `discord-damsel-L2-tool-panel`, and their fold hint says tool panel, in plugin 1.0.3 (1.0.2 with the new label), by Claude Opus 5.5 (`claude-opus-5-5`), 2026-10-19. The lines above keep the names they were written with. Code names stay (`panelBox`, `.panel`, `ddsm-panel`, `class Panel`, `getSettingsPanel`, pet.json's `panel` key), and so do BetterDiscord's "settings panel" and the companion's control panel. Her page saves connection switches by connection, never by a box's name, and the plugin saves nothing by it, so nothing saved is lost.

DM archive review added by OpenAI Codex (GPT-6), 2026-10-20: the native page `discord-damsel-archive-review-20261020.html` opens from `discord-damsel-dm-archive-tool-panel`. JSON and media are user-selected and local only. Keep original content and timestamp strings; never fetch imported URLs or add Discord credentials to the page. Tests: `test/discord-damsel-archive-test-20261020.cjs`. No export or deletion has been performed by this source change.
