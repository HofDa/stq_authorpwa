# Workspace Audit

Date: 2026-05-15
Status: updated after the W2-W11 workspace decomposition series.
Scope: documentation and orientation. This file now combines the original audit findings with the current post-decomposition state so future agents do not treat completed W-series work as still pending.

## Orchestrator Summary

Role: `architecture-guardian`

Supporting perspectives to keep in view:
- `qa-auditor`: checked regression risk, test coverage, and verification surface.
- `mobile-studio`: checked mobile shell, map, drawer, gesture, and viewport risk.

Original root cause:
The largest workspace files grew by accumulating feature work at the presentation boundary. Several files now combine UI rendering, local UI state, derived data, map/gesture handling, schema patching, runtime previews, or persistence-facing image references. The current architecture still has useful boundaries, but the most active editor surfaces are large enough that future changes can cause unrelated regressions.

Series outcome:
The route workspace, map provider, CSS ownership, token bridge, bundle split points and regression coverage have been tightened. The remaining large surfaces are now better guarded by ownership rules, focused helper tests and component-level regression tests, but several UI files are still intentionally broad because further extraction would touch fragile mobile or RRR authoring behavior.

Current implementation strategy:
Keep future work incremental. Prefer pure helpers or render-only components first, preserve existing class names and data contracts, and add focused tests before moving state. Do not restart the old W2-W8 plan as if it were pending; use the post-W12 guidance below.

## Size Hotspots

The table below is the original audit snapshot, measured with `wc -l` over `src/**/*.ts`, `src/**/*.tsx`, and `src/**/*.css`. It is preserved for historical context and root-cause orientation.

Post-W12 line-count notes:
- `MapLibreAuthorMap.tsx` and `RouteWorkspace.tsx` were substantially reduced by focused helper/hook splits.
- `phone-preview.css`, `map-workspace.css`, and `rrr-module-editors.css` are now small order-preserving aggregators; their large style bodies live in focused files under `src/styles/workspace/` and `src/styles/rrr/`.
- Current remaining hotspots still worth treating carefully include `RrrInteractionEditor.tsx`, `RrrInteractionEditor.test.tsx`, `studio-shell.css`, `RrrMockPreview.tsx`, `PhoneMapMockup.tsx`, `MapPreviewWorkspace.tsx`, and `RrrFieldTest.tsx`.

| Rank | File | Original lines | Primary concern |
| --- | --- | ---: | --- |
| 1 | `src/components/rrr-author/RrrInteractionEditor.tsx` | 2545 | RRR author UI, module editors, validation, warnings, expert-mode persistence, summaries, and helpers in one file. |
| 2 | `src/styles/phone-preview.css` | 1189 | Phone mockup, device chrome, tour card, legacy studio lane styles, and map-specific overflow rules. |
| 3 | `src/components/rrr-author/RrrInteractionEditor.test.tsx` | 1115 | Broad coverage, but tightly coupled to one very large editor surface. |
| 4 | `src/styles/studio-shell.css` | 971 | Desktop shell, sidebar, RRR overlays, field-test/readiness chrome, and navigation chrome. |
| 5 | `src/export/tourExport.test.ts` | 939 | Large but acceptable contract test surface for exported JSON compatibility. |
| 6 | `src/components/map/MapLibreAuthorMap.tsx` | 907 | Map lifecycle, markers, routes, hit layers, manual pan, resize recovery, and token color resolution. |
| 7 | `src/components/rrr-author/RrrMockPreview.tsx` | 889 | Runtime preview UI and mock runtime state likely belong in smaller slices. |
| 8 | `src/components/studio/workspaces/RouteWorkspace.tsx` | 843 | Route editor UI, route geometry, snapping, pending state, persistence patching, and stats. |
| 9 | `src/components/studio/TourCardCanvas.tsx` | 792 | Tour overview preview, edit panels, drawer state, cover image references, and metadata patching. |
| 10 | `src/styles/studio-navigation.css` | 682 | Navigation, text body editor, cover panel, icon panel, stats panel, and route stats styles. |
| 11 | `src/rrr-core/modules/evaluateModule.ts` | 682 | Large core evaluator, but framework-independent and already covered by runtime tests. |
| 12 | `src/components/studio/workspaces/StationEditPanel.tsx` | 678 | Panel factory, station identity, image/icon panel, riddle settings, field-test metadata, and RRR editor bridge. |
| 13 | `src/styles/map-workspace.css` | 647 | Station sheet, mobile studio shell, edit chips, confirm dialog, right drawer, and mobile viewport rules. |
| 14 | `src/components/studio/workspaces/IntroPhonePreview.tsx` | 637 | Intro/outro preview, editable regions, drawer state, image flow, content list editing, and metadata patching. |
| 15 | `src/styles/rrr-module-editors.css` | 633 | RRR module editor, compass, GPS, hold-still, text-answer, and mobile editor styles. |
| 16 | `src/components/studio/workspaces/PhoneMapMockup.tsx` | 565 | Map shell, basemap controls, zoom controls, dock gestures, station dock, route arrows, and delete affordances. |
| 17 | `src/components/studio/workspaces/MapPreviewWorkspace.tsx` | 564 | Station selection, sheet lifecycle, delete mode, drawer state, station patching, map viewport center, and phone preview. |
| 18 | `src/i18n/editorLanguage.tsx` | 528 | Locale provider and a broad editor key registry. |
| 19 | `src/pages/RrrFieldTest.tsx` | 520 | Sensor permission flow, runtime bridge, report export, diagnostics, and page UI. |
| 20 | `src/stations/visuals.logic.ts` | 481 | Station visual generation logic; large but mostly pure and testable. |

## Affected Systems

- Authoring UI: RRR interaction authoring, tour overview, intro/outro preview, station panels.
- Studio shells: mobile view switching, edit-mode toggles, right drawer, phone mockup frame, map edit pill.
- Editor state: selected station, route segment state, sheet state, drawer state, delete mode, active edit panels.
- Schema/data: station and tour patching, `recordedRoute`, localized content blocks, author-only blob ids, modular interaction config.
- RRR: public facade imports, editor validation, warnings, mock preview, runtime bridge, sensor helper usage.
- Map/GPS: MapLibre author map, route drawing, route point drag, station marker drag/delete, viewport center, basemap switching.
- PWA/offline: route-level lazy chunks, MapLibre async chunk, service worker update behavior, offline map tile limitation.
- Design tokens: CSS variable tokens, MapLibre paint color resolution, Tailwind token bridge, global CSS ordering.

## Responsibility Mixing

### `RrrInteractionEditor.tsx`

Mixed responsibilities:
- top-level editor orchestration and add/remove/update module mutations
- schema validation via `RrrInteractionSchema.safeParse`
- warning display via `getRrrWarnings`
- condition editing
- every module-specific config editor
- fallback suggestion and summary formatting
- compass pointer math
- GPS radius recommendation display
- persisted expert-mode preference through `localStorage`
- mock runtime preview and JSON editor integration

Low-risk extraction:
- module summary formatters
- numeric/config normalization helpers
- module-specific editor components such as text answer, multi choice, timer, object found, and photo check
- condition editor component, after preserving its flat/nested condition fallback behavior

Risky extraction:
- fallback relation updates and condition repair, because they touch schema validity
- compass pointer behavior, because it combines pointer math and mobile interaction
- expert-mode persistence, because previous test flakiness came from `localStorage`

### `RouteWorkspace.tsx`

Mixed responsibilities:
- selected segment state
- pending route point state
- recorded route slicing
- station anchor snapping
- route polyline derivation
- map click and route click behavior
- route point drag behavior
- save, undo, clear, focus actions
- mobile and desktop route tool rendering
- route stats formatting

Low-risk extraction:
- pure route geometry helpers: `findSegmentSlice`, `getRecordedSegmentSlices`, `distanceMeters`, `normalizeSegmentForSave`, station-anchor helpers
- focused tests around route anchors, duplicate point filtering, invalid coordinates, and segment clearing

Risky extraction:
- map click routing and route layer click handling, because a route click can accidentally become a map click
- route edit state hook before helper tests exist
- CSS/tool placement before route behavior is isolated

### `MapPreviewWorkspace.tsx`

Mixed responsibilities:
- station sheet lifecycle
- mobile-only station edit mode
- stale-selection suppression
- delete mode and confirmation
- right drawer state
- selected station and localized section derivation
- station/tour patching callbacks
- image blob URL resolution
- rendered `RiddleScreen` preview inside a map sheet
- map viewport center capture for add-station behavior

Low-risk extraction:
- station section derivation
- station patch helpers if kept local to workspace types
- delete confirmation view, if behavior stays identical

Risky extraction:
- stale-selection guard and sheet close behavior
- interaction between delete mode, sheet state, and drawer state
- mobile/desktop edit-mode branching

### `PhoneMapMockup.tsx`

Mixed responsibilities:
- device map shell
- `AuthorMap` prop assembly
- basemap menu
- zoom control dispatch
- dock horizontal drag gesture
- station dock rendering
- segment arrow controls
- route stats and overlay placement hooks
- station delete affordances

Low-risk extraction:
- station/segment dock component after preserving pointer suppression
- basemap menu component
- zoom control component

Risky extraction:
- dock drag gesture, because pointer capture suppresses accidental station/segment clicks
- action placement shared by desktop and mobile

### `MapLibreAuthorMap.tsx`

Mixed responsibilities:
- MapLibre instance lifecycle
- resize recovery
- style switching
- station DOM markers
- marker delete buttons
- station drag
- route point markers and drag
- route layers and hit layers
- selected station circle
- current position marker
- viewport fitting and current-position camera
- manual pan gesture handling
- CSS token color resolution for MapLibre paint

Low-risk extraction:
- small pure utilities only if not already in `mapLibreUtils.ts`
- token color resolution tests if behavior changes

Risky extraction:
- marker, route, and lifecycle hooks before cleanup ownership is explicit
- manual pan handling, because it uses global pointer/touch listeners
- route hit-layer click handling, because propagation affects route editing

### CSS Files

High-risk CSS clusters:
- `src/styles/map-workspace.css`: station sheet, mobile shell, floating chips, confirm dialog, right drawer.
- `src/styles/phone-map-workspace.css`: map canvas touch behavior, map edit pill, title pill, layers menu.
- `src/styles/phone-preview.css`: device mockup, phone frame, map overflow exceptions, tour card preview.
- `src/styles/studio-navigation.css`: text/body editors, cover panel, station icon panel, route stats.
- `src/styles/rrr-module-editors.css`: module-specific RRR controls.

CSS split risk:
Move CSS later than component/helper extraction. Selector order and legacy workspace sizing rules are active behavior, especially `.stq-mobile-studio__workspace > div`.

## Edge Cases To Preserve

- RRR editor must keep empty authoring interactions schema-valid.
- Removing an RRR module must repair condition references.
- Nested/future condition trees must not crash the flat condition editor.
- Expert mode must remain test-isolated and tolerate unavailable `localStorage`.
- GPS, compass, camera, and QR authoring controls must not access raw browser sensors from editor UI.
- Map edit off must close route edit and clear stale station selection.
- Entering station delete mode must close station sheet and right drawer.
- Dragging a station marker must not also select it.
- Dragging the station dock must not activate station or segment buttons.
- Route segment save must preserve station anchors and avoid near-duplicate route points.
- Route clear must delete only the selected segment while keeping adjacent anchor lookup stable.
- Stations with missing or placeholder coordinates must not crash route or map fitting.
- Add station at viewport center must tolerate a null center before the first `moveend`.
- Intro/outro editing of a non-current draft intentionally no-ops `onChange`.
- Map fallback UI must stay nonblank and layout-stable while the async MapLibre chunk loads.
- Map tiles are not fully offline-ready; future PWA checks must not claim offline map support.
- CSS custom properties must be resolved before they are passed to MapLibre paint properties.

## Likely Regressions

- Mobile map touch conflicts between map pan, route point placement, dock drag, station sheet, and right drawer.
- Mobile viewport regressions when browser chrome or keyboard changes `vh/svh/dvh` behavior.
- Surprise station sheet openings from stale `selectedId`.
- Route editor stale overlays if memo dependencies or segment state are changed incorrectly.
- Broken route/station click behavior if MapLibre route hit layers and global map click listeners are split incorrectly.
- Token regressions where DOM CSS variables work but MapLibre paint values do not.
- PWA stale chunk or blank fallback behavior after route/map lazy splitting.
- Schema/export drift if RRR module config helpers are moved without preserving passthrough fields.
- Locale drift across `de`, `en`, and `it` for the large editor key surface.

## Completed W-Series Summary

- W2 route geometry helpers: completed in `routeWorkspaceHelpers.ts` with focused tests.
- W3 route editor state hook: completed in `useWorkspaceRouteEditing.ts` with state-transition tests.
- W4 RRR editor module/localization pass: RRR authoring copy moved into editor-language locales; further component slicing remains optional and should be scoped separately.
- W5 map preview station state: not extracted into a separate hook; ownership remains documented in `MapPreviewWorkspace` because the station sheet/delete/drawer invariants are fragile.
- W6 phone map mockup controls: not split into separate components; `PhoneMapMockup` remains the owner of basemap, zoom and dock drag state.
- W7 MapLibre internals: completed behind `AuthorMap` with provider-internal hooks and MapLibre helper tests.
- W8 CSS file split: completed through order-preserving aggregators under `src/styles/workspace/` and `src/styles/rrr/`.
- W9/W11 token cleanup: completed incrementally; `tokens.css` is the canonical runtime token source and Tailwind consumes CSS-variable-backed tokens.
- W10 bundle/lazy loading: completed at route, shell, workspace, map-provider and action boundaries; MapLibre remains the only async chunk-size warning.

## Post-W12 Safe PR Guidance

Good next PRs:
- RRR module editor component slicing, one module family at a time, with `RrrInteractionEditor` tests kept close.
- Map preview station state extraction only if it preserves stale-selection, delete-mode and drawer cleanup behavior and adds tests first.
- Phone map dock/control extraction only as render or gesture-local components with pointer-capture tests preserved.
- PWA/stale-chunk hardening without changing the service-worker strategy unless that is the explicit PR scope.
- Real-device/mobile smoke QA for map edit, route edit, station sheet, drawer and keyboard behavior.

Avoid:
- Treating the original W2-W8 split plan as pending work.
- Renaming CSS aggregators or reordering global CSS imports without visual/mobile verification.
- Moving draft mutation into view components.
- Passing unresolved CSS variables directly into MapLibre paint properties.
- Combining schema/runtime changes with UI decomposition.

## Verification Recommendations

For documentation-only PRs:
- Inspect changed Markdown files.
- No build, lint, typecheck or UI test is required unless production files changed in the same PR.

For future code PRs:
- `npm run typecheck`
- `npm run lint`
- `npm test`
- `npx vitest run src/rrr/publicBoundary.test.ts src/rrr-core/boundary.test.ts src/rrr-core/schemaConsistency.test.ts src/schema/schema.test.ts`
- `npx vitest run src/components/rrr-author/RrrInteractionEditor.test.tsx src/components/rrr-author/RrrTemplatePicker.test.tsx`
- `npx vitest run src/map/routePlanning.test.ts src/export/tourExport.test.ts src/export/validateDraftForPublishing.test.ts`
- `npx vitest run src/rrr-runtime src/rrr-preview src/rrr-sensors src/rrr`
- `npm run build`

Manual checks for UI-affecting split PRs:
- mobile map view at small and tall mobile viewport sizes
- station sheet collapsed/expanded/closed transitions
- map edit mode, route edit mode, and station delete mode
- route point add, drag, undo, save, and clear
- dock drag versus station/segment tap
- intro/outro/overview edit drawers with keyboard open
- RRR module authoring in all supported locales
- MapLibre fallback while lazy chunk loads
- PWA reload/update and offline shell behavior

## Non-Goals Confirmed

- No component refactor in this W12 documentation pass.
- No styling refactor in this W12 documentation pass.
- No schema change.
- No runtime change.
- No new hooks in this W12 documentation pass.
- No persistence change.
- No direct sensor access from UI.
- No broad cleanup.
