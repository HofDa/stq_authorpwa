# Known Issues and Pitfalls

## Active cautions

### AI workspace docs can drift from completed decomposition work

Symptoms:
Future agents may treat historical W2-W8 audit tasks or old line-count tables as current pending work.

Risk:
Completed lazy-loading, CSS split, token cleanup, route-workspace and MapLibre decomposition work could be repeated or refactored again without a fresh reason.

Mitigation:
Read `AI/CURRENT_STATE.md`, `AI/DECISIONS.md`, `AI/WORKSPACE_AUDIT.md` and `AI/WORKSPACE_OWNERSHIP.md` together. The W12 docs frame `WORKSPACE_AUDIT` as historical plus current orientation; use the post-W12 guidance sections for future PR scope.

### Map tiles are not fully offline-ready

Symptoms:
The PWA shell can work offline, but map tiles depend on online raster sources unless explicit offline tile support is added.

Risk:
Field use in weak-signal areas can appear broken if authors expect offline maps.

Mitigation:
Document offline limitations clearly and test map behavior in airplane mode before claiming offline map support.

### Lazy chunks can create stale PWA asset edges

Symptoms:
After a deployment, an already-open app shell can reference older hashed route/view/action chunks until the service worker refresh path reloads the page.

Risk:
More lazy split points reduce startup payload but increase the number of assets that must stay coherent across Workbox precache updates. A stale chunk can show a loading state for too long or fall into the root error boundary.

Mitigation:
Keep lazy loading at coarse route, view or user-action boundaries with visible fallbacks. Current coarse split points include routes, Studio shells, Studio workspaces, the map provider, QR scanner and export action. Do not split schema, storage, active map gestures, route editing sessions, scanner ownership or export serialization internals without a dedicated PWA stale-chunk review. Verify production preview reload/update behavior after bundle changes.

### Browser speech recognition is inconsistent

Symptoms:
Dictation behavior differs between Chrome, Safari, desktop and mobile browsers.

Risk:
Assistant/storyline input may work on one browser and fail on another.

Mitigation:
Keep speech recognition behind a shared hook and provide graceful fallback to manual input.

### RRR core can accidentally absorb browser logic

Symptoms:
Agents may place sensor, window, navigator or React logic into core runtime files.

Risk:
Boundary tests fail and runtime becomes harder to test.

Mitigation:
Keep browser APIs in `src/rrr-sensors/`, hooks or component adapters.

### RRR public imports can bypass the facade

Symptoms:
UI, schema or export code may import `@/rrr-core`, `@/rrr-runtime`, `@/rrr-preview` or `@/rrr-sensors` directly instead of using the public `src/rrr` facade.

Risk:
Implementation paths leak into app code, making the RRR/core boundary harder to reason about and easier to break during runtime changes.

Mitigation:
Use `@/rrr`, `@/rrr/types`, `@/rrr/runtime`, `@/rrr/preview` or `@/rrr/sensors` from app-facing code. `src/rrr/publicBoundary.test.ts` enforces this outside the internal RRR implementation directories.

### Mobile drawer and keyboard behavior can regress easily

Symptoms:
Right drawers, sheets, story input bars and map panels can break on small screens or when the keyboard opens.

Risk:
Authoring in the field becomes frustrating.

Mitigation:
Manual mobile viewport checks are required for UI work.

### Schema drift can break player compatibility

Symptoms:
Authoring export changes silently diverge from what the Flutter app expects.

Risk:
Tours export successfully but fail in the player.

Mitigation:
Update schema tests and document any contract change in `AI/DECISIONS.md`.

### Legacy `.stq-mobile-studio__workspace > div` rule sizes any direct child to 100% × 100%

Symptoms:
Adding a sibling `<div>` inside the mobile workspace section (e.g. an absolutely-positioned chip wrapper) makes the new div fill the viewport and intercept all pointer events — the underlying back button and station markers stop responding even though the chip itself is small.

Risk:
Easy to reintroduce when adding new floating chrome to the mobile shell.

Mitigation:
New floating wrappers should set `pointer-events: none` and re-enable `pointer-events: auto` on their interactive children. The chip wrapper also pins `width/height: auto !important` to neutralise the legacy rule. Long-term: scope the `> div` rule to a specific descendant rather than every direct child.

### CSS variable colors need resolution before MapLibre paint

Symptoms:
MapLibre style paint properties are not regular DOM CSS, so unresolved `var(--token)` color strings can fail or render unpredictably if passed directly to layers.

Risk:
Moving map route/selection colors onto design tokens can silently break route lines or selected-station circles.

Mitigation:
Resolve token colors inside the author-map boundary before assigning MapLibre paint properties. DOM marker styles can still use CSS variables directly. The helper in `src/components/map/mapLibrePaintTokens.ts` has focused tests and should remain provider-internal.

### MapLibre provider hooks must stay behind the author-map boundary

Symptoms:
Future map changes may import `useMapLibre*` hooks from workspaces or move route/station business rules into provider hooks.

Risk:
MapLibre implementation details would leak past `AuthorMap`, making workspace tests less meaningful and coupling draft mutation or sheet state to provider lifecycle.

Mitigation:
Only `AuthorMap.tsx` / `MapLibreAuthorMap.tsx` should compose MapLibre internals. Workspaces should keep passing typed `AuthorMapProps` callbacks and data. Provider hooks may translate MapLibre events, but must not patch drafts, open sheets/drawers, or own route edit mode.

### Route workspace helpers must stay deterministic

Symptoms:
Route geometry helpers can become a dumping ground for route editor state, React hooks, DOM events, or MapLibre-specific behavior.

Risk:
The route editor becomes harder to test and future mobile map changes can accidentally couple pure route calculations to UI or provider lifecycle.

Mitigation:
Keep `routeWorkspaceHelpers.ts` limited to stateless calculations over station/route data. Route editor state belongs in `RouteWorkspace.tsx` or a future focused hook; MapLibre behavior stays behind the author-map boundary.

### Route workspace view components must stay presentational

Symptoms:
Small view components such as `RouteWorkspaceViews.tsx` can slowly absorb route editor state, segment rules, map behavior or layout decisions.

Risk:
The route workspace becomes harder to reason about because behavior is split across render-only components and parent state.

Mitigation:
Keep route state, disabled-state calculation, layout conditions and map callbacks outside `RouteWorkspaceViews.tsx`. View components should render existing class names, labels and controls from props only.

### Route workspace controller hook must stay workspace-local

Symptoms:
`useWorkspaceRouteEditing.ts` can become a hidden global workspace store or start absorbing mobile drawer layout, map provider lifecycle, runtime/sensor logic, or persistence details.

Risk:
Route editing becomes coupled to unrelated app systems, making mobile gesture regressions and schema/runtime boundary leaks harder to spot.

Mitigation:
Keep the hook limited to route-segment controller state and derived map props for `RouteWorkspace`. Map provider behavior stays behind the author-map boundary, runtime/sensor code stays under the RRR facade, and draft persistence continues through the existing `onChange` contract.

### Workspace token normalization can accidentally become a redesign

Symptoms:
Replacing hardcoded colors can drift into changing palette semantics, selector order, shadows, spacing, or mobile affordance placement.

Risk:
Small token cleanup can cause visual breaks in the desktop Studio, mobile phone frame, station sheet, map pill or route-edit controls.

Mitigation:
Only replace literals with existing tokens when the semantic match is direct. Keep layout and selector order unchanged, and use a visual desktop/mobile smoke check for workspace styling PRs.

Note:
Generated station artwork palettes in `src/stations/visuals.logic.ts` intentionally keep literal colors because they define content/asset artwork, not shared UI chrome tokens.

### Split CSS aggregators are cascade contracts

Symptoms:
Future cleanup may inline split CSS files into `index.css`, alphabetize imports, or move route/map/sheet rules across aggregator boundaries.

Risk:
Mobile map controls, dock click suppression, station sheet overlays, right drawer hidden state, route-tool z-index, map overflow exceptions or RRR editor responsive rules can regress without TypeScript or unit-test failures.

Mitigation:
Keep `src/index.css` and aggregator files in their documented order. `phone-preview.css`, `map-workspace.css` and `rrr-module-editors.css` intentionally mirror former monolithic section order. `workspace/route-tools.css` must remain immediately after `studio-navigation.css` and before `map-workspace.css`.

### Workspace component tests do not replace real mobile/map smoke checks

Symptoms:
Component tests with a mocked `AuthorMap` can pass while real MapLibre route hit layers, station marker drag/delete, dock pointer capture, touch gestures, keyboard viewport behavior, or CSS placement regress in a browser.

Risk:
The test suite can provide false confidence for map-provider and mobile gesture behavior.

Mitigation:
Keep component tests focused on stable contracts and accessible behavior. The workspace regression suite now covers route edit toggling, stale selection suppression, delete-mode cleanup, phone map controls and dock drag click suppression with mocked browser/map boundaries, but manual/browser smoke checks are still required for mobile viewports, map edit mode, route edit mode, station sheet transitions, drawer gestures, real touch behavior and MapLibre rendering.

## Resolved issues

### 2026-05-15 — Mobile map manual pan blocked pinch zoom

Files: `src/components/map/useMapLibreManualPan.ts`.
Cause: the phone map uses a custom one-finger pan handler while MapLibre's drag pan is disabled. The handler kept treating the first finger as an active pan even when a second touch joined, competing with MapLibre's touch zoom recognizer.
Fix: `useMapLibreManualPan` now tracks active touch pointer ids and yields/cancels manual pan when more than one touch pointer is active, preserving MapLibre pinch zoom in normal and edit modes. Covered by `useMapLibreManualPan.test.tsx`.

### 2026-05-15 — Mobile edit toggle styling and placement drifted by surface

Files: `src/components/studio/mobile/MobileStudioShell.tsx`, `src/components/studio/workspaces/MapEditPill.tsx`, `src/components/studio/workspaces/MapPreviewWorkspace.tsx`, `src/styles/workspace/mobile-shell.css`, `src/styles/phone-map-workspace.css`.
Cause: overview/intro/outro used a small translucent floating chip while the map edit pill anchored next to zoom controls and the station/riddle card edit toggle lived inside the sheet toolbar, so the primary edit affordance looked and behaved differently across mobile surfaces.
Fix: overview, intro, outro, map and station/riddle card edit toggles now share the larger token-styled `.stq-mobile-studio__major-edit-toggle` and the same top-right floating anchor. `MapEditPill` keeps ownership of expanded map actions, and the station-card toggle remains independent while preserving adjacent map actions when present. Covered by `workspaceRegression.test.tsx`.

### 2026-05-15 — Edit mode hid most editable frames until hover or selection

Files: `src/styles/editable-overlay.css`, `src/components/studio/TourCardCanvas.tsx`, `src/components/studio/workspaces/IntroPhonePreview.tsx`, `src/renderer/RiddleScreen.tsx`.
Cause: editable-region outlines were transparent by default and only appeared on hover, active or selected state. Camera-only image edit areas also had no passive frame after the full-surface edit target was removed.
Fix: rendered editable-region wrappers now show dashed frames immediately in edit mode, and camera-only image areas get passive dashed frames while keeping the camera button as the only edit target. Covered by `workspaceRegression.test.tsx`.

### 2026-05-15 — Tour overview edit actions were detached from the cover context

Files: `src/components/studio/TourCardCanvas.tsx`, `src/components/studio/useStudioController.ts`, `src/storage/drafts.ts`.
Cause: delete lived as a full-width bottom action in overview edit mode, while the existing draft duplication storage path was not exposed in the Studio controller. Cover editing was only available through a generic editable region without a clear camera affordance.
Fix: tour-level copy/delete actions now render as cover-image overlay icon buttons. Copy calls the existing `duplicateDraft()` implementation, delete keeps the shared confirm flow, and tour overview, intro cover and station image editing are sensitive only on the floating camera button rather than the full image surface. Covered by `workspaceRegression.test.tsx` and existing `duplicateDraft` storage tests.

### 2026-05-15 — Zero-station tours could not reach the map from mobile overview edit mode

Files: `src/components/studio/mobile/MobileStudioShell.tsx`, `src/components/studio/workspaces/IntroPhonePreview.tsx`.
Cause: the intro primary CTA was disabled when there was no first station, but the map is the place where authors create the first station.
Fix: the no-stations primary CTA now stays clickable and calls the existing start handler. The mobile shell opens the map, turns on map edit mode, and clears stale selection for zero-station tours. Covered by `workspaceRegression.test.tsx`.

### 2026-05-15 — Route hit-layer clicks could also be treated as map clicks

Files: `src/components/map/useMapLibreMapClick.ts`, `src/components/map/useMapLibreRouteLayers.ts`, `src/components/map/mapLibreUtils.ts`.
Cause: `RouteWorkspace` passes both `onRouteClick` and `onMapClick` while editing routes. The previous MapLibre layer click handler called `preventDefault`, but the global map click handler did not check whether the pointer was over a route hit layer.
Fix: map click translation now queries active route hit layers and suppresses ordinary `onMapClick` forwarding when a route hit is present. Route layer clicks still call the typed `onRouteClick` callback. Covered by `useMapLibreMapClick.test.tsx`.

### 2026-05-15 — Active station drag cleanup was implicit

Files: `src/components/map/mapLibreUtils.ts`, `src/components/map/useMapLibreStationMarkers.ts`.
Cause: live station dragging attached window listeners during active drags and relied on pointer/touch end events to remove them.
Fix: `attachLiveStationMarkerDrag` now returns a disposer. The station marker hook calls it during marker cleanup, so unmounts or marker-mode changes during an active drag also remove global listeners.

### 2026-05-15 — Vitest editor tests inherited persisted expert mode

Files: `src/components/rrr-author/RrrInteractionEditor.test.tsx`, `src/rrr-sensors/*.test.ts`, `src/storage/drafts.test.ts`.
Cause: `RrrInteractionEditor` persists expert mode in `localStorage`; tests that toggled it on did not reset the key, so later tests could unexpectedly render expert-only JSON/debug/warning text. Additional cleanup gaps left started sensor adapters and the shared Dexie test DB open longer than necessary.
Fix: reset `stq-rrr-expert-mode` in the editor test `beforeEach`/`afterEach`, make expert-warning assertions toggle expert mode explicitly, stop started sensor adapters in tests, and close the Dexie test DB in `afterAll`. Verified with normal Vitest, shuffled Vitest, and Vitest's hanging-process reporter.

### 2026-05-13 — Stale global CSS stayed bundled after UI replacements

Files: `src/index.css`, `src/styles/*.css`.
Cause: old assistant/storyline/native-card prototypes and legacy phone-map/station-sheet mockups were removed or superseded, but their global CSS imports and selectors remained.
Fix: removed unused imports/files and selector blocks after confirming no TS/TSX references. Preserved still-used phone map dock/zoom overrides.

### 2026-05-10 — Map back button and station tap blocked by edit chip wrapper

Files: `src/styles/map-workspace.css`.
Cause: the legacy `.stq-mobile-studio__workspace > div { width: 100%; height: 100% }` rule sized the new floating-edit-chip wrapper to fill the viewport, blocking pointer events on the underlying map.
Fix: `pointer-events: none` on the chip wrapper, `pointer-events: auto` on its children, plus `width/height: auto !important` to override the legacy rule. Commit `3b91082`.

### 2026-05-10 — Closing route-edit auto-opened the station card

Files: `src/components/studio/workspaces/MapPreviewWorkspace.tsx`.
Cause: when the user pressed the flag button to leave route-edit, the shell unmounted `RouteWorkspace` and remounted `MapPreviewWorkspace` with the still-set `selectedId`. The workspace's selection effect interpreted any non-null `selectedId` as a signal to expand the sheet, including on initial mount.
Fix: track whether the effect has already received at least one selection update; suppress the expand on mount when there's a stale selection. Gated to `layout === 'mobile'` so desktop's expand-on-cross-section-arrival behavior is untouched. Commit `5df907b`. Reinforced 2026-05-11 with an explicit `actions.clearSelection()` call when closing route-edit or edit-mode, so the remounting workspace sees `selectedId === null` and the mount-guard heuristic is no longer load-bearing.

### 2026-05-10 — Mobile map could not enter station-content edit mode

Files: `src/components/studio/workspaces/MapPreviewWorkspace.tsx`, `MapStationSheet.tsx`, `mobile/MobileStudioShell.tsx`.
Cause: mobile passed `editMode={false}` so `editableRegions` never appeared. The bottom FAB only toggled marker-edit (drag/delete pins).
Fix: workspace now owns `internalStationEditMode` when `layout === 'mobile'`, surfaced via a toggle inside `MapStationSheet.toolbarTrailing`. Resets when the sheet closes. Commit `1ae1207`.

### 2026-05-10 — Production build broken on `refractor` branch

Files: `StudioStationNav.tsx`, `StudioHeader.tsx`, `DesktopStudioShell.tsx`, `RouteWorkspace.tsx`.
Cause: three TS6133 unused-binding errors (`onAddStation` prop chain through three layers, `selectedRouteSegment` useMemo, `snapToStation` helper).
Fix: removed the dead code consistently across the layers. Commit `fbca996`.

### 2026-05-10 — Four `react-hooks/refs` lint errors in `MapLibreAuthorMap` and `MapPreviewWorkspace`

Files: `src/components/map/MapLibreAuthorMap.tsx`, `src/components/studio/workspaces/MapPreviewWorkspace.tsx`.
Cause: callback-mirroring refs were assigned inline during render (`onSelectStationRef.current = onSelectStation`, `deleteModeRef.current = deleteMode`, etc.), violating React's "no ref writes during render" rule.
Fix: switched to the project's existing `useLatest` hook (`src/hooks/useLatest.ts`) which performs the assignment inside `useEffect`. Three sites in `MapLibreAuthorMap` and one in `MapPreviewWorkspace`. Added the now-stable refs to two `useEffect` dep arrays to satisfy `exhaustive-deps` honestly. Lint went from 4 errors + 1 warning to 0 errors + 1 unrelated warning.
