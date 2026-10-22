# Handoffs

Task cards for whichever assistant picks them up. Format and rules:
[skills/handoff/SKILL.md in astras-pet-os](https://github.com/findastra/astras-pet-os/blob/main/skills/handoff/SKILL.md).
Every card has a `## What I did` section that lists explicitly what was changed, where, and what is not done.

| Card | For | Status |
| --- | --- | --- |
| [009: DM archive review](009-any-dm-archive-review-20261020.md) | any | open: source prepared; adoption and live verification pending |
| [001: Merge the three lines of Damsel work](001-any-merge-damsel-work-20261017.md) | any (Codex first) | open; on branch `claude/rescue-damsel-unsaved-20261017` |
| [002: Wrap-up of the Claude presence chat (art recipe, image bridge, open items)](002-any-claude-presence-chat-wrapup-20261017.md) | any | open, waits on Astra: merges, restart the apps |
| [005: Sticker Manager: first test inside Discord](005-any-sticker-manager-20261018.md) | any | open: first test done 2026-10-19 (reset worked, put back of an empty list did not); 1.0.3 (#27) in her plugins folder since 2026-10-19 23:07; BetterDiscord kept through Discord 1.0.9263 and 1.0.9264; waits only on Astra's Put back test inside Discord |
| [006: CLI Proxy API manager: install and first Start](006-any-cli-proxy-api-20261018.md) | any | done 2026-10-19: installed and running on 127.0.0.1 only; the console password is Astra's |
| [007: CLI Proxy API v8.0.34: Stop, install, Start](007-any-cli-proxy-api-v8.0.34-20261019.md) | any | open, paused 2026-10-20, waits on Astra: install v8.0.34 with her console password, Start (nothing runs since the restart) |
| [008: BetterDiscord recovery tool: see installer v2](008-codex-betterdiscord-installer-v2-check-20261019.md) | codex | open: the tool in PRs #10, #11, #12 says "Repair needed" while BetterDiscord v1.14.3 works |

**Next free number: 010.** A number is used once across `main` and every branch. 003 and 004 are on
`claude/ask-astra-bot-20261017` (PRs #7 and #8); 005 is the Sticker Manager card, 006 the CLI Proxy API card (2026-10-18),
007 the CLI Proxy API v8.0.34 card and 008 the BetterDiscord recovery card for Codex (2026-10-19).
