# Commands

Run these commands from the project root (`painted-valley/`).

## Setup and development

```sh
node --version
npm --version
git lfs pull
npm ci
npm run dev
```

Development URL: http://127.0.0.1:5384/. Stop with Ctrl+C. If strict port 5384 is
already in use, stop the existing server before starting another.

## Build and preview

```sh
npm run build
npm run serve
```

Production preview: http://127.0.0.1:5383/. Stop with Ctrl+C. The build creates
`dist/`, copies required assets and notices, and writes a sound manifest listing
only available recordings. Refresh the browser after rebuilding.

## Verification on macOS

The capture tool uses `playwright-core`, which does not install a browser.
These examples use an existing Google Chrome installation. Set CHROME to another
Chromium executable if yours is installed elsewhere. Build first. The runner
starts and stops its own temporary local server; `npm run serve` is not required.

Front and side views, walking and sprinting:

```sh
npm run build
CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  node tools/walk.mjs --size 1280x800 --query 'quality=medium' \
  --out shots/shoulders \
  --script 'wait 30; look 180 5; zoom 2.4; wait 40; shot front; look -75 5; wait 30; shot side; keys KeyW,AltLeft; wait 200; shot walking; keys KeyW,ShiftLeft; wait 160; shot running'
```

Jump and landing:

```sh
CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  node tools/walk.mjs --size 1280x800 --query 'quality=medium' \
  --out shots/jump \
  --script 'wait 30; shot grounded; keys Space; wait 12; shot jump; keys none; wait 120; shot landed'
```

Neighborhood and rice plots:

```sh
CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  node tools/walk.mjs --size 1280x800 --query 'quality=medium' \
  --out shots/rural \
  --script 'wait 30; shot entry; at 122 0 37; wait 30; look -85 10; zoom 5; wait 30; shot paddies'
```

House collision check (inspect the final position against the house footprint):

```sh
CHROME='/Applications/Google Chrome.app/Contents/MacOS/Google Chrome' \
  node tools/walk.mjs --size 1280x800 --query 'quality=medium' \
  --out shots/collision \
  --script 'at 48 0 0; js tg.follow.yaw=-0.927295; wait 30; keys KeyW,AltLeft; wait 600; shot collision; keys none; wait 30'
```

`wait` counts simulated frames at 60 Hz, not seconds. `at` uses valley coordinates
(u, v) in metres and an optional character yaw in degrees. `look` rotates the camera
in degrees. The runner logs sampled state; browser errors fail the process, while
visual correctness and sampled movement values still need inspection.

## Before committing

```sh
git diff --check
npm run build
git status --short
```

`node_modules/`, `dist/`, generated captures, logs and `.env` are ignored. Models
and image assets use Git LFS, so keep LFS installed when cloning and pushing.
