# Orrery

Orrery is a browser puzzle game about building a celestial machine. Place rises, sets, arms, tracks, wheels, and transforming sigils on a hex field, then write looping instruction tapes to carry motes into the required constellations. Complete a challenge by delivering six of every product without collisions. Campaign has eight challenges; Extras has ten.

## Install and run

```sh
npm ci
npm run dev
```

Open the URL Vite prints. To build the self-contained static site, run `npm run build` and serve `dist/` at the root or under a sub-path. All art, particle systems, and audio are committed under `assets/`; the build bundles those files and requires no asset-generation tools.

## Controls

Drag a part from the left tray onto a hex. Click a placed part to select it, then use **E/Q** to rotate, **W/S** to adjust an arm's length, or **X** to delete. Click an arm's tape cell and use **G** grab, **V** drop, **A/D** rotate, **Z/C** pivot, **W/S** extend or retract, and **T/B** advance or recede. **Delete** blanks a cell and **Backspace** erases the preceding cell. **U/I** undo or redo an edit.

**Space** starts or pauses a run, **N** steps one cycle, **,/.** change speed, **Esc** returns from a run or screen, and **M** mutes audio. The arrow keys and **Enter** navigate menus. The backtick key opens the engine's debug overlay.

## Checks

`npm run typecheck`, `npm run lint`, `npm run format`, and `npm test` verify the source. The showcase in `showcase/` contains a recorded browser playthrough and screenshots from the running game.
