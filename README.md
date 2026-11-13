# Satoyama Walk

A playable, anime-inspired rural Japanese neighborhood built with Three.js and
Rapier, adapted from [Painted Valley by blendi](https://patch.gg/blendi/painted-valley).

Explore a narrow village lane, tiled-roof houses, flooded rice plots and an open
mountain landscape with a simple animated character. This is an early prototype:
buildings have no interiors and the character is a procedural blockout.

## Run locally

Run commands from this directory (`painted-valley/`), which contains `package.json`.
Use a recent Node.js release supported by Vite 8; development was verified with
Node.js 22.22.0 and npm 10.9.4. Git LFS is required when cloning the model and texture
assets. After cloning, run `git lfs pull` if those files are still pointer files.

```sh
npm ci
npm run dev
```

Open **http://127.0.0.1:5384/**. The development server reloads source changes.
Press Ctrl+C in its terminal to stop it.

To build and serve the production version instead:

```sh
npm run build
npm run serve
```

Open **http://127.0.0.1:5383/**. Rebuild after source changes, then refresh the
browser. The server serves files from `dist/`; restarting it is unnecessary after
a rebuild. Both servers bind only to the local machine.

## Controls

| Control | Action |
| --- | --- |
| Click the scene | Capture the mouse and begin |
| WASD | Move |
| Alt | Walk slowly |
| Shift | Sprint |
| Space | Jump |
| Mouse / wheel | Look / zoom |
| V | Switch first and third person |
| T | Cycle time of day |
| 1–4 | Select a lighting preset |
| P | Toggle the paint finish |
| Esc | Release the mouse |

The target machine is an Apple M3 Pro with 36 GB RAM. Medium quality is the default,
with device pixel ratio capped at 1.25. This is a starting configuration, not a
frame-rate guarantee. Use `?quality=low` for a lighter rendering load or
`?quality=high` for more detail. A WebGL2-capable browser is required.

## Project notes

- [Work completed, source map and limitations](docs/DEVELOPMENT.md)
- [Commands and browser verification](docs/COMMANDS.md)
- [Original Painted Valley README](docs/PAINTED_VALLEY_UPSTREAM.md)
- [Original license and asset provenance](LICENCE-NOTES.md)
- [Optional missing ambient recordings](MISSING_ASSETS.md)

Code is MIT; original art assets are CC0 as described in the upstream notices.
Preserve LICENSE and the asset notices when redistributing. The anime references
supplied during development are not bundled in this repository.
