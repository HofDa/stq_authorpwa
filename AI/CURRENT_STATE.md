# Current State — SouthTyrolQuests Author PWA

## Stable baseline

- Vite + React + TypeScript app scaffold exists.
- Local draft storage is implemented through Dexie.
- Tour/riddle schema validation exists with Zod and tests.
- Tour list, tour editor, station editor and phone-frame preview exist.
- Map authoring uses MapLibre through the shared author-map boundary.
- ZIP export exists for tours, riddles JSON and local images.
- RRR core and runtime areas exist with boundary and evaluator tests.
- Field-mode assistant/storyline components exist from recent PR work.
- Mobile authoring shell (`src/components/studio/mobile/MobileStudioShell.tsx`) drives all four mobile surfaces (overview, intro, outro, map).

## Mobile authoring affordances (current placement)

- **Edit toggle**: a single shared chip pattern (`.stq-mobile-studio__floating-edit-chip`) appears top-right on overview, intro, outro and map. Intro/outro use the `--below-header` modifier so the chip sits below the sticky phone header instead of colliding with it.
- **Map view**: edit chip is suppressed while the station sheet is in the `expanded` state.
- **Map edit mode**: surfaces an add (+) and a delete (trash) station button in the right action group; both gated by `editMode && !routeEditMode`.
- **Route edit mode**: opened via the flag button. The right-edge button group (flag + 4 route tools) stretches and uses `justify-content: space-evenly` between its top anchor and the route-stats panel.
- **Station/riddle card**: an independent edit toggle lives inside the station sheet's sticky toolbar (`MapStationSheet.toolbarTrailing`). Decoupled from the map's marker-edit FAB. Resets when the sheet closes.
- **CSS tokens**: `src/styles/tokens.css` is the single canonical source for color, alpha overlay, shadow and geometry tokens. No one-off colors elsewhere.

## In progress / likely next areas

- Mobile authoring UX hardening.
- Field assistant workflow refinement.
- RRR authoring UI and runtime bridge improvements.
- Sensor smoothing and real field-test workflows.
- PWA/offline/cache hardening.
- JSON/schema stability checks before deeper riddle-module expansion.

## Current technical cautions

- Map tiles are not fully offline-ready.
- Schema changes can affect the Flutter player app.
- Browser speech recognition behavior varies strongly across browsers and devices.
- Mobile viewport, drawer and keyboard behavior need real-device checks.
- Sensor behavior must be tested on Android devices, not only desktop browsers.
- The `:has()` selector is used in `phone-map-workspace.css` for the route-editor button distribution. Requires Chrome ≥105 / Safari ≥15.4 / Firefox ≥121.

## Recommended next safe PRs

1. Mobile authoring real-device QA pass on the new chip + route-editor placement.
2. Continue RRR module authoring UI and runtime bridge work.
3. PWA/offline cache hardening before service-worker changes.
4. Schema stability check before any further riddle-module expansion.
