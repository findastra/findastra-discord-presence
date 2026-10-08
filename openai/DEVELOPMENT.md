# Development record

## 2026-09-12–13

- Requested: share GPT-6 Astra use on the user's own Discord profile, with elapsed time and the exact spiral from the OpenAI launch page; explain and push development on GitHub.
- Built a dependency-free Node.js Windows IPC companion, session timer, automatic metadata detector, local controls, and public download/preview surface.
- User reported unstyled file preview and broken links. Replaced root-relative static references with relative paths, separated hosted preview behavior from the local API, and changed the design to the reference's black/navy background, white sans-serif type, large star-field 6 and minimal controls.
- User selected Ghost Protocol as the publishing reference. Its repository is a static GitHub Pages app. Chosen publication: GitHub Pages from `main:/docs`, with a distributable Windows ZIP. A Sites registration was started before this clarification; it remains unpublished and is not the production host.
- The galaxy is a still of the actual reference animation. Ambient CSS motion is an adaptation, not a claim to ship OpenAI's original animation code.
- No callable Claude connector or local Claude CLI was found in the available tools or common executable locations; no Claude session was invoked.
- All shared activity text is fixed. The automatic detector reads model/timestamp only and is approximate. No credentials or conversation content belong in this repository.

## Validation and publication

- Seven automated tests passed, including session timing, metadata filtering, frame decoding, and a mock named-pipe handshake/activity acknowledgement/clear. Static HTML, CSS and PNG returned HTTP 200 with expected content types.
- Initial code pushed to the public findastra/openai-discord-presence repository (2c282b6). GitHub Pages configured for main:/docs; source save confirmed by GitHub.
- The user's missing Discord presence was traced to a stopped local companion and an empty Application ID. Restarted the companion as a hidden background process. Discord desktop is running. Application creation is prepared, awaiting the user's approval of Discord Developer Terms and Policy.
- Local setup now opens automatically when no Application ID is configured. Start/Automatic lead to setup instead of appearing to start a session without an ID.
- The user completed application creation in Discord. Configured its public Application ID locally, uploaded and saved the requested artwork as astra_galaxy, and started a manual session. The running companion reports connected:true and published:true after Discord acknowledged SET_ACTIVITY; the local UI displays the live elapsed timer. Visibility on another person's profile view remains unverified and depends on Discord activity privacy settings.
- Public GitHub Pages app verified at https://findastra.github.io/openai-discord-presence/. The Windows ZIP download returned HTTP 200 with ZIP content type; the native ZIP reader enumerated all 14 intended files. Seven automated checks passed again after the setup guidance fix.

- Updated the Discord application icon to a star-swirl variant with a readable GPT-6 label, created from the existing reference artwork. Saved the source icon as public/astra-icon.png; the original website hero and presence artwork remain available.

- User confirmed live presence works, requested no text on the icon, and authorized displaying current project names on Discord. Restored the original text-free swirl as the application icon and source icon. Added opt-in project sharing from recent primary Astra workspace metadata, plus a fixed friendly-name override; only the folder basename enters the activity. Full paths and conversations are not sent. Project changes preserve the session timer.

- Added a reversible per-user Windows sign-in launcher and an Automatic-on-start preference. It runs the existing local companion hidden, opens no browser, and checks for an already-running companion. Enabled and exercised that launcher for the requesting user, with project sharing enabled. Friends must complete their own Discord connection setup, then run Enable Automatic Startup.cmd once.

- Verified the actual Windows startup launcher starts the companion without a browser window. The live API reports Automatic mode, project sharing enabled, the current folder name, and connected/published true after Discord acknowledgement. Verified the local UI displays the same project. All eight automated checks pass, including opt-in privacy, basename-only detection, stale-project clearing, and activity text limits.

## 2026-09-14
- Fixed project identity: resolve the current task's saved Codex project assignment and display name; never fall back to a folder basename. Confirmed the saved Mommy's World project uses the Mommy's 2 folder. Unknown projects remain generic unless a friendly-name override is provided.
- Run on Windows startup now installs/removes the per-user startup entry immediately. Eight tests pass.
- Claude companion remains pending clarification of Claude desktop, Code, or browser. Separate local companion processes can coexist, but Discord decides which activities appear; simultaneous display alongside all games and Spotify has not been verified.

## 2026-10-06
- The card names the exact model in use (e.g. "Using GPT-6 Astra", "Using GPT-5.6 Sol"); hovering the galaxy shows the raw model id. Automatic now shares for any model on the newest primary Codex task, not only `gpt-6-astra`. Switching models keeps the timer. Nine tests pass.
- Project sharing keeps showing the saved Codex project name (e.g. "Astra's Infinite Pole"), never the chat title.
- The local folder moved to `Documents\Projects\openai-discord-presence`, beside `anthropic-discord-presence`; the Windows startup entry was rewritten for the new path. Folder locations aren't stored in this repository.
- Claude Presence, the sibling app, lives at https://github.com/findastra/anthropic-discord-presence and shows the exact Claude model and the working folder as its project.
- Requested change: "Working on" now shows the folder the latest Codex chat works in (e.g. `Mommy's 2`), not the saved Codex project name. Chats in Codex's dated scratch folders fall back to the saved project name. Ten tests pass.
- Card title: Discord rejects "OpenAI" and "Anthropic" as registered application names (error 50277). The activity now sets its documented `name` field, so the bold title reads **OpenAI** (and **Anthropic** on Claude Presence) without renaming the application. User confirmed the Anthropic title live on their profile.

## 2026-10-07
- Renamed the repository to `openai-discord-presence` and the app to **OpenAI Presence** (sibling: `anthropic-discord-presence`, **Anthropic Presence**). It covers every OpenAI model, so the old GPT-6 Astra-only name no longer fit. The public page moved to https://findastra.github.io/openai-discord-presence/; GitHub Pages doesn't redirect the old address.
- Renamed with it: start file (`Start OpenAI Presence.cmd`), Windows startup entry (`OpenAI Presence.vbs`, which also removes the old `Astra Presence.vbs`), download ZIP (`openai-presence-windows.zip`) and the port setting (`OPENAI_PRESENCE_PORT`).
- Kept on purpose: names of the products the app detects (GPT-6 Astra, Codex), the Astra galaxy artwork and its Discord asset key `astra_galaxy` (Discord asset keys can't be renamed), and earlier entries in this log.
