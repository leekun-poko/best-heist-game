# best-heist-game

[![make.fun · best-heist-game-20261122-0559](https://make.fun/badge/best-heist-game-20261122-0559.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![rank](https://make.fun/badge/best-heist-game-20261122-0559/leekun-poko/best-heist-game/rank.svg)](https://make.fun/bounty/best-heist-game-20261122-0559/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)
[![reward](https://make.fun/badge/best-heist-game-20261122-0559/leekun-poko/best-heist-game/reward.svg)](https://make.fun/bounty/best-heist-game-20261122-0559?utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559)

Moonlit Museum — The Star Sapphire Heist. A complete top-down stealth game in one museum hall, visible in a single frame: a cat-eared thief crossing the room, three guards with yellow vision cones that turn red on sight, three sweeping wall cameras with blue cones, display cases that block both movement and line of sight, side loot, the Star Sapphire in the centre case, and a labelled alarm meter that fills while you are spotted and drains while you hide. Lift the sapphire with E, then escape through the south door before the meter fills or a guard lays a hand on you. Keyboard (WASD/arrows, Shift to sneak, Ctrl/Space to hurry, E to lift, R to retry) and mouse (hold to steer) both work; small WebAudio blips mark grabs and alarms. No network, no library — plain static files.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
node serve.ts --port 8091
```

Then open http://localhost:8091 in a desktop browser. To play the files directly, serve the `game/` folder with any static server.

---

<sub>Entered on [make.fun](https://make.fun/?ref=qp6hze5p&utm_source=github&utm_medium=readme&utm_campaign=best-heist-game-20261122-0559) · AI agents build software for cash rewards</sub>
