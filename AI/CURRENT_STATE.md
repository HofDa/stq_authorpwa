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
- Stale global CSS from removed assistant/storyline/native-card prototypes and legacy phone-map/station-sheet mockups has been cleaned up; current map dock/zoom and mobile shell styles remain token-based and selector-backed.
- Intro/start-page cover editing now uses the same `ImageAssetPanel` flow as the tour overview, including camera/upload, local blob storage and URL fallback against `tour.imagePath` / `tour.coverBlobId`.
- Tours can now be deleted from the editor tour overview. The action uses the shared feedback confirm dialog, deletes the Dexie draft plus associated blobs through storage, then redirects through `/tours` so the editor opens another draft or creates a fresh one.
- Vitest completes reliably after test isolation hardening: `RrrInteractionEditor` tests reset persisted expert-mode state, expert-warning assertions opt into expert mode explicitly, sensor adapter tests stop started adapters, and Dexie draft tests close the shared test DB after the suite.
- Heavy editor/runtime surfaces are code-split at route, view and action boundaries: tour redirect/editor, RRR runtime demo, RRR field-test routes, Studio desktop/mobile shells, individual Studio workspaces, the station-panel RRR interaction editor, QR scanner and ZIP export pipeline load lazily; `AuthorMap` lazy-loads the MapLibre implementation only when a map renders. Latest measured production build main JS chunk is ~275.40 kB uncompressed / 84.68 kB gzip, down from the previous W10 baseline of ~275.56 kB / 84.75 kB gzip and the older W9/W8 baseline of ~297.89 kB / 91.90 kB gzip. The Studio controller/workspace path now splits into a ~13.32 kB `useStudioController` chunk plus focused async workspace chunks instead of one ~99.18 kB workspace/controller chunk.
- Design token normalization is underway with `src/styles/tokens.css` as the canonical runtime token source. Tailwind now consumes CSS-variable-backed colors/radii through `src/theme/tokens.ts`, and shared chrome colors/shadows/radii in feedback, Studio sidebar, map route/current-position UI and error states have been moved onto tokens.
- W11 tightened the token bridge and remaining UI literals: Tailwind now exposes `surface` and `inverted` colors from CSS variables, shared foundation/app-shell classes use those tokens instead of `bg-white` / `text-white`, and remaining literal `white` values in riddle/map dock CSS were replaced with existing surface/inverted tokens. The only remaining hex literals in app source are station visual artwork palette values in `src/stations/visuals.logic.ts`, which are content colors rather than shared UI chrome.
- RRR public imports now have an explicit boundary: app, UI, schema and export code use `@/rrr` plus public subfacades (`@/rrr/types`, `@/rrr/runtime`, `@/rrr/preview`, `@/rrr/sensors`). `src/rrr-core`, `src/rrr-runtime`, `src/rrr-preview` and `src/rrr-sensors` are treated as internal implementation packages behind that facade.
- `RrrInteractionEditor` visible UI copy now comes through the editor-language locale layer instead of hardcoded German strings, with matching `de`, `en` and `it` keys for the editor-specific labels, hints, summaries and warnings.
- Route workspace geometry helpers have been extracted into `src/components/studio/workspaces/routeWorkspaceHelpers.ts` with focused tests. The extracted helpers are pure route-segment calculations/formatters only.
- Route workspace view chrome has been split into `src/components/studio/workspaces/RouteWorkspaceViews.tsx`. The new components render the route toolbar, edit-pill content and route stats only; map behavior and layout conditions remain in `RouteWorkspace.tsx`.
- Route workspace route-editing controller state now lives in `src/components/studio/workspaces/useWorkspaceRouteEditing.ts`, with hook tests covering segment selection fallback, pending edits, duplicate handling, save/clear/undo, and editable-off behavior. The hook stays workspace-local and does not touch runtime, sensor, schema or persistence boundaries.
- Workspace styling token normalization has been tightened for the phone preview/station sheet surfaces. Remaining workspace-facing color literals were replaced with existing CSS variables where there was a direct token match; layout, selector order and visual structure were left unchanged.
- Workspace regression coverage now includes `src/components/studio/workspaces/workspaceRegression.test.tsx`. The tests mock only the author-map boundary and cover route data/tool reachability, route save wiring, route edit toggling, segment selection, invalid-coordinate robustness, station sheet open/collapse/close, stale mobile selection suppression, delete confirmation and delete-mode cleanup, mobile station edit drawer open/close, plus phone map dock/zoom/basemap controls and dock drag click suppression through accessible controls.
- MapLibre provider internals have been split behind the existing `AuthorMap` boundary. `MapLibreAuthorMap.tsx` now wires focused hooks for instance/style lifecycle, resize recovery, station markers, route layers, route point markers, viewport/camera behavior, current position and manual pan. `AuthorMapProps` and workspace callers remain stable.
- Map provider regression coverage now includes `mapLibrePaintTokens`, `mapLibreUtils` and `useMapLibreMapClick` tests. Route hit-layer clicks are guarded so they are not forwarded as ordinary map clicks, and marker-edit/delete station id arrays are memoized at the workspace caller to avoid marker churn during unrelated sheet/drawer renders.
- Large global CSS files have been split by responsibility without changing selectors or JSX classes. `phone-preview.css`, `map-workspace.css` and `rrr-module-editors.css` are now order-preserving aggregators, with focused files under `src/styles/workspace/` and `src/styles/rrr/`; `src/styles/README.md` documents the global cascade order.
- The W10 bundle pass keeps the service-worker strategy unchanged. Production build now emits separate async chunks for Studio shell/controller, individual Studio workspaces, RRR interaction editor, RRR mock preview, QR scanner, tour export and MapLibre. The only remaining Vite chunk-size warning is the async MapLibre provider chunk.
- W12 refreshed the AI documentation after the W2-W11 decomposition series. `AI/WORKSPACE_AUDIT.md` and `AI/WORKSPACE_OWNERSHIP.md` are now post-W12 guardrails, not a pending W2-W8 task list.

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
- Tests that touch persisted browser state such as `localStorage` must clear or seed that state per test; otherwise shuffled or CI runs can inherit UI mode from earlier tests.
- MapLibre is now an async chunk behind `AuthorMap`; map fallback UI must stay nonblank and sized like the map container so lazy loading does not create layout jumps.
- MapLibre paint properties cannot rely on unresolved CSS custom properties; colors passed through the author-map boundary that use `var(...)` are resolved through `src/components/map/mapLibrePaintTokens.ts` before reaching MapLibre paint.
- New app/UI/schema/export code should not import `@/rrr-core`, `@/rrr-runtime`, `@/rrr-preview` or `@/rrr-sensors` directly. Add or extend a narrow public facade in `src/rrr` first, then import through that boundary; schema-level code can use `@/rrr/types` to avoid root-facade cycles.
- Workspace styling changes should stay token-substitution-only unless a PR explicitly scopes a visual redesign. CSS selector order and mobile pointer/viewport rules are active behavior.
- CSS split files preserve the old cascade by aggregator order. Do not reorder `phone-preview.css`, `phone-map-workspace.css`, `phone-map-dock.css`, `phone-station-sheet.css`, `phone-station-preview.css`, `station-pillbar-sheet.css`, `studio-navigation.css`, `workspace/route-tools.css` and `map-workspace.css` without visual/mobile regression checks.
- Workspace and MapLibre helper tests are component/helper-level guards, not full browser E2E coverage. Real MapLibre rendering, marker drag/delete, route point drag, basemap switching, manual mobile pan and viewport/keyboard behavior still need manual or browser-level checks.
- Lazy chunks are now part of the PWA contract. New split points should remain coarse route/view/action boundaries with visible fallbacks; do not split inside draft mutation, schema validation, active map gestures, route editing sessions, scanner ownership or export serialization internals without a dedicated stale-chunk/error-state review. Locale loading, route loading, Studio workspace loading and the root error boundary all render visible fallback UI instead of blank screens.

## Recommended next safe PRs

1. Mobile authoring real-device QA pass on the new chip + route-editor placement.
2. Targeted RRR editor/module slicing only when locale parity, condition fallback behavior and existing editor tests stay covered.
3. Optional MapPreview or PhoneMap extraction only with focused component tests and mobile/map smoke checks.
4. PWA/offline cache hardening before service-worker changes.
5. Schema stability check before any further riddle-module expansion.
