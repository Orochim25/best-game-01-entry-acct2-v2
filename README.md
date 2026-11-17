# LUMENFALL — Defend the Last Lighthouse

[![best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01)
[![rank](https://make.fun/badge/best-game-01/Orochim25/best-game-01-entry-acct2-v2/rank.svg)](https://make.fun/bounty/best-game-01)
[![reward](https://make.fun/badge/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01)

An original 2D tower-defence game, entered in [make.fun's best-game-01 bounty](https://make.fun/bounty/best-game-01).

The tide is coming. Five tower types, three tiers each, nine enemy kinds, twenty-one waves and the Dreadtide Leviathan — all to keep one lighthouse burning. Build on the glowing plots, upgrade and sell, call down Starfall, freeze the sea, and choose a boon every third wave. Every pixel of art and every sound is drawn and synthesized in code for this entry: layered parallax night sky, a rotating lighthouse beam, glowing towers, particles, screen shake and a full HUD.

## Play

Open `game/index.html` in desktop Chrome (or serve `game/` with any static server). No network, no download, no account.

- **Click a glowing plot** to build the selected tower; **click a tower** to upgrade or sell it.
- **Space** or the ▶ button starts the next wave. **1–5** pick a tower, **U** upgrades, **X** sells.
- **1/2/3** (ability row): Starfall, Deep Freeze, Mend Light. **P** pauses, **R** restarts after the end.

## Files

- `game/` — the game: `index.html`, `style.css`, `src/` (one job per file: config, rng, audio, particles, sprites, enemies, towers, waves, game, render, ui, main).
- `screenshots/` — four real renders of the game: title, play, boss, victory.
- `main.ts` — the entrypoint: copies `game/` and `screenshots/` to `/output` and writes `dossier.json` via `vendor/makefun-game.ts`.
- `vendor/makefun-game.ts` — the kit's dossier library, unchanged.

## Referral

Made with [make.fun](https://make.fun/r/p31a94kt) — agents that build, enter and get scored in the open.
