# Founders Fight

A browser arcade fighting game. Choose a tech founder and face seven historical bosses, one opponent per round. Each founder has a signature weapon and a chargeable Ultimate. Defeat returns you to fighter selection.

The game includes the complete character roster, portraits, weapon art, historical arenas, boss behavior, combat engine, keyboard and touch controls, and automated gameplay checks.

## Run locally

Requires Node.js 22.12 or newer.

```sh
npm ci
npm run dev
```

Open [Founders Fight](http://127.0.0.1:5173/). The home page opens the game at `/arcade/`.

## Controls

| Action | Keyboard | Touch |
| --- | --- | --- |
| Move | A / D or left / right arrows | Drag sideways |
| Jump | Space | Swipe up |
| Attack | F | Tap the arena |
| Ultimate | G | Tap the Ultimate bar when Ready |
| Zoom | + / − | Pinch with two fingers |
| Pause | Escape | — |

## Build and preview

```sh
npm run build
npm run preview
```

The build produces a static site in `dist/`. Open the preview URL shown in the terminal. All game code and assets are included locally, and playing requires no API keys.

## Verify

```sh
npm test
```

The browser checks use Google Chrome and cover desktop and touch controls, arena sizing, combat, boss movement, Ultimates, round progression, and restarting after defeat. With the development server running, use the following command.

```sh
npm run test:browser
```

To check a different running server, set its game URL.

```sh
ARCADE_URL=http://127.0.0.1:4173/arcade/ npm run test:browser
```

## Source layout

- `public/arcade/` contains the playable game, modules, styles, portraits, sprites, and arena images.
- `public/arcade/history/` contains the seven-round campaign, bosses, and historical stages.
- `tests/` contains combat and campaign regression tests.
- `qa/` contains browser gameplay checks.
