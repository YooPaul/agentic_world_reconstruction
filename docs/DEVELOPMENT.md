# Development notes

## Starting point

Cloned https://git.patch.gg/blendi/painted-valley.git at
`e523a37e6c86df433a960a46702b09776e73a0e2`. The upstream history, licenses,
character rig, animation clips, movement controller and renderer are retained.
The original README is preserved as PAINTED_VALLEY_UPSTREAM.md in this directory.

## Work completed

### First playable character and meadow

Replaced the visible hat-and-cloak wanderer with locally generated meshes attached
to its animated skeleton. The prototype has a dark bob, graphic eyes, a pale
cardigan, navy skirt with pale trim, dark socks and shoes, and a red backpack.
The original hidden skinned meshes remain available to the animation system.
Walking, sprinting, jumping, idle movement and camera switching reuse the existing
systems. The skirt and bag have subtle sway.

Restyled the meadow with softer shared greens, shorter grass, reduced bloom and
a lighter paint finish. Medium quality is now the default and pixel ratio is
capped at 1.25 to constrain rendering load on the target Mac.

### Rural neighborhood

Added eight nearby houses and a walkable lane at the starting location. Generated
props include concrete drainage channels, mailboxes, garden planting, outdoor
units, utility poles, insulators and sagging cables. Six flooded rice plots have
raised banks and rows of seedlings. Static prop geometry is merged by material.

The settlement uses a level terrain terrace shared by the rendered ground and
Rapier heightfield. Houses have solid box colliders. Meadow grass and random trees
are excluded from the lane, house footprints and planted fields.

Changed the distant settlement from the original tower-and-church skyline to low
houses, muted tiled roofs, timber and sliding-door details. Removed the visible
windmill and changed distant farmland to rectangular paddy divisions.

### Shoulder correction

Removed the separate spherical shoulder joints. Each cardigan sleeve is now one
continuous mesh, updated from shoulder, elbow and wrist positions after animation.
The fabric shoulder sits below the high joint on the inherited rig. Its surface
and normals update as the arm moves, avoiding the two round shoulder protrusions.

### Local verification tools

The screenshot runner now selects D3D11 only on Windows. Scripted key changes also
set key-press edges, so Space exercises the real jump input. Captures log height,
grounded state, speed and movement mode. Browser errors result in a nonzero exit.

## Source map

| File | Responsibility |
| --- | --- |
| src/valley/main.js | Startup, rendering defaults, physics and scene wiring |
| src/valley/wanderer.js | Prototype character, cel materials, dynamic sleeves |
| src/valley/rural.js | Nearby houses, lane, paddies, props and house collider descriptions |
| src/valley/world.js | Terrain terrace, spawn location and grass exclusion |
| src/valley/village.js | Shared building geometry, roof palette and facade shaders |
| src/valley/floor.js | Distant rectangular fields and painted ground |
| src/valley/farwoods.js | Far scenery and buildings; original windmill is no longer added |
| src/valley/trees.js | Tree generation with a neighborhood exclusion |
| src/lib/glsl.js | Shared meadow colors |
| index.html | Title, loading screen and control hints |
| tools/walk.mjs | Scripted browser captures and runtime checks |

## Validation performed

- Production build and `git diff --check` passed after the latest sleeve change.
- Browser captures loaded without reported JavaScript or shader errors.
- Sustained walking reached approximately 1.5 m/s and sprinting 7 m/s.
- Jump check left the ground, rose about 0.72 m at the sampled frame, then landed
  at the starting height with grounded state restored.
- Walking toward a house stopped at its front collider, outside the building.
- Character reviewed from front and side and during walking and running after
  the shoulder correction.

These checks are smoke tests, not comprehensive collision or performance testing.
No sustained frame-rate benchmark has been recorded. Example captures are written
to ignored `shots/` subdirectories and are reproducible with COMMANDS.md.

## Current limitations and next work

The character is a deliberately rough blockout. Facial expression, blinking,
articulated hands, hair physics and finished clothing deformation are not yet
implemented. The skirt is rigid with subtle sway and can intersect the legs.
House interiors are absent. Only houses have new dedicated prop colliders; garden
walls, poles and smaller props are visual geometry. Paddy water is a painted
surface over ground, without swimming or water simulation. The lane still uses
the inherited grass footstep sounds. Optional ambient recordings are not included.

The inherited production bundle triggers Vite's large-chunk advisory; it builds
successfully. Future work can add detail, improve the character, tune audio and
measure browser performance on the target Mac.
