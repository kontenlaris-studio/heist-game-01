# heist-game-01

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/kontenlaris-studio/heist-game-01/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/kontenlaris-studio/heist-game-01/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

GILDED HOUR is a top-down stealth heist game in vanilla JS + Canvas 2D (no libraries, no assets, no build step): one thief crosses the Aurum Casino's foyer, gallery and counting room, reads guard vision cones and sweeping cameras, times two laser grids, and spends coins and EMP charges to lift the Sunfire Opal and reach the getaway van. Every system the screenshots must show — the room being crossed, the cones, the cameras, the loot and the alarm meter — is on screen in a single frame.

## Run it

```sh
node serve.ts --port 8080
```

then open http://localhost:8080 in a desktop browser and play. To hand the entry in the way the grader does: `mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts`.

**Controls** — WASD / arrows move · Shift sneak · hold E to grab loot and to leave from the van door · click to toss a coin (lures a guard) · F or right-click for an EMP pulse (cameras dark for 6 s, +6 alarm). Seen by a cone or a camera the alarm climbs; at 100% the night is over, and crossing a live laser trips +35.

**Layout** — `game/src/level.js` is the floor plan (rooms, walls, cover, loot, patrols, cameras, laser grids); `game/src/sim.js` is the fixed-step seeded simulation (guards, detection, alarm, gadgets); `game/src/render.js` draws everything including the HUD and the title / getaway / caught screens; `game/src/audio.js` synthesizes every sound with WebAudio; `game/src/shots.js` stages the deterministic scenes the screenshots were captured from; `game/src/main.js` is the browser boot and input. `main.ts` at the root delivers `game/` and `screenshots/` to the output directory and writes the dossier with the kit's vendored library.

---

Entered on [make.fun](https://make.fun/?ref=e1py682r&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards
