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

- **Edit toggle (overview, intro, outro)**: floating chip pattern (`.stq-mobile-studio__floating-edit-chip`) in the bottom-right corner of each phone preview. Intro/outro previews preserve their own back-navigation via the in-frame header.
- **Edit toggle (map)**: a round `MapEditPill` (`src/components/studio/workspaces/MapEditPill.tsx`) anchored to the left of the zoom controls. When inactive it shows only the round pen toggle; when active the pill grows leftward to expose action buttons. Replaces the previous bottom-right FAB on the map view only.
- **Map view edit content**: when expanded, the pill contains (left → right) `[plus] [trash] [flag] [pen toggle]`. The plus/trash buttons drive add/delete-station modes; the flag button toggles route-edit mode.
- **Route view edit content**: when expanded, the pill contains a top row `[route-editor tools] [flag] [pen toggle]` and a bottom row centered under the buttons with compact route stats (distance + point count). Stats are absolutely positioned at the pill bottom; the button row stays vertically centered against the toggle.
- **Hide-while-editing**: the map pill is suppressed when the station sheet is in the `expanded` state — only station markers and the GPS marker remain on the map. The previous on-map context toolbar (settings cog + map-pin buttons) has been removed as redundant; per-element pencils inside the open station sheet are the entry point into the station/marker panels.
- **Selection cleanup**: closing route-edit (flag → off) or closing edit mode entirely (pen toggle → off) calls `actions.clearSelection()` so the remounted `MapPreviewWorkspace` doesn't auto-pop a stale station card.
- **Station/riddle card**: an independent edit toggle lives inside the station sheet's sticky toolbar (`MapStationSheet.toolbarTrailing`). Decoupled from the map pill. Resets when the sheet closes.
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
- The map pill (`MapEditPill`) is positioned absolutely relative to the phone-mockup workspace using fixed offsets calibrated to the zoom-control geometry (`right: calc(18px + 28px + 10px); bottom: 121px`). Changes to zoom-control size or position must be re-checked against the pill's anchor.

## Recommended next safe PRs

1. Mobile authoring real-device QA pass on the new chip + route-editor placement.
2. Continue RRR module authoring UI and runtime bridge work.
3. PWA/offline cache hardening before service-worker changes.
4. Schema stability check before any further riddle-module expansion.
