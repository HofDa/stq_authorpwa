# Decision Log

Use this file to prevent repeated architectural debates and agent drift.

## 2026-05-15 — Implement riddle-module visuals from the Claude Design handoff incrementally

Decision:
The visual riddle modules introduced by the Claude Design "SouthTyrolQuests Riddle Modules" handoff are implemented module-by-module behind the existing RRR mock-preview integration point. The compass dial lands first as a real, working component used by the runtime preview: `src/components/rrr-author/CompassDial.tsx` (presentational SVG dial), `src/components/rrr-author/CompassControl.tsx` (dial + live-heading control + slider fallback), `src/components/rrr-author/useLiveDeviceHeading.ts` (shared hook over the `@/rrr/sensors` adapter), and `src/styles/rrr/module-compass-dial.css` (token-based styling). `RrrMockPreview` mounts `CompassControl` for `compass_align` and `direction_hotcold` modules.

Reason:
The design is high-quality and consistent across modules, but rolling out all eight modules in one PR would be a broad rewrite. The mock preview is the right boundary because it already owns the simulated runtime inputs (`RrrMockInputs.headingDegrees`), so the visual integrates with the real evaluator rather than being a static mockup. The compass also has an existing sensor adapter (`createDeviceOrientationSensorAdapter`), letting the dial drive real heading data on supported devices.

Tradeoffs:
The dial uses CSS variables from `src/styles/tokens.css` (`--stq-primary`, `--stq-color-primary-rgb`, `--stq-color-border`, `--stq-text`, `--stq-text-mute`) rather than introducing the design's parallel `--stq-burgundy*` palette. This avoids token duplication but means the dial inherits the slightly different reddish-burgundy of the existing system. Remaining design palette tokens (success green, hint ocker, terracotta error, surface-2) are not introduced until a module needs them.

Followups:
Add the next module visuals (code, NFC, QR, suchbild, reihenfolge, wissen, slot) one at a time under the same shape: small presentational component + small CSS file + minimal mock-preview wiring.

Rejected alternatives:
Porting the entire design canvas (`stq-modules-a.jsx`/`stq-modules-b.jsx`) in one PR; introducing a parallel design-token system; building the compass as a pure visual decoration disconnected from the runtime evaluator inputs.

## 2026-05-10 — Add project-local AI memory

Decision:
Add an `AI/` folder with architecture, current state, known issues, workflow rules and reusable PR/session templates.

Reason:
The project is large enough that repeating context inside every coding-agent chat wastes context-window budget and increases drift.

Tradeoffs:
More files to maintain, but much cheaper than repeatedly re-explaining architecture, constraints and known pitfalls.

Rejected alternatives:
Keeping all project knowledge only in chat history.

Follow-up:
Keep `AI/CURRENT_STATE.md` updated after larger PRs.

## 2026-05-15 — Treat workspace audit docs as post-decomposition guardrails

Decision:
After the W2-W11 workspace decomposition series, `AI/WORKSPACE_AUDIT.md` and `AI/WORKSPACE_OWNERSHIP.md` describe current ownership, completed split work and future guardrails. They are not a pending W2-W8 implementation checklist.

Reason:
The original audit was useful, but leaving the old split plan in future tense would lead new agents to repeat completed work or optimize against stale file sizes. W12 keeps the historical findings while adding the current lazy-loading, CSS split, token, MapLibre and ownership state.

Tradeoffs:
The docs retain original audit measurements for context, so readers must distinguish historical line counts from current hotspots. This is preferable to deleting the audit history and losing the reasoning behind the decomposition.

Rejected alternatives:
Deleting the original audit snapshot; leaving the W2-W8 plan unchanged; combining more code refactors into the documentation update.

## 2026-05-15 — Keep zero-station mobile tours able to reach the map through the primary CTA

Decision:
The intro phone preview's primary CTA remains clickable even when the tour has no stations. In that zero-station path, the mobile shell clears stale selection, opens the map view, and enables map edit mode so the first-station controls are reachable.

Reason:
The primary button is the expected forward path from the tour preview. Disabling it for empty tours created a dead end before the map, where the first station is created.

Tradeoffs:
The CTA still uses the existing `studio.noStations` copy for empty tours, but it now behaves as an authoring navigation command instead of a disabled status. This avoids adding another map-pin entry point to the overview.

Rejected alternatives:
Adding a separate map-pin button to the tour overview; making the editable card itself navigate; creating the first station automatically.

## 2026-05-15 — Place tour-level edit actions on the cover image

Decision:
Tour overview edit mode renders copy and delete as stacked icon buttons over the top-right of the cover image. Tour cover, intro cover and station hero image editing are exposed through the shared floating camera button only; the image/placeholder surfaces themselves are not edit targets. Copy is exposed through `useStudioController` and delegates to the existing `duplicateDraft()` storage function before navigating to the copied draft.

Reason:
Copy/delete are tour-level actions, so placing them on the tour card cover keeps them in context without adding bottom-list clutter. The existing storage duplicate path already owns blob-id rewriting and draft-id/riddles-path updates, so reusing it preserves offline/local image ownership and schema contracts.

Tradeoffs:
The image edit affordance is now a dedicated button instead of the generic full-surface `Editable` wrapper. This adds a small amount of local markup, but avoids broad accidental hit areas and keeps copy/delete clicks from opening the image editor.

Rejected alternatives:
Keeping delete as a full-width bottom action; adding a new ad hoc cloning implementation in UI code; putting copy/delete into a separate global toolbar.

## 2026-05-15 — Show editable frames whenever edit mode is active

Decision:
Rendered `.stq-editable-region` wrappers show their dashed frame immediately instead of waiting for hover, active or selected state. Camera-only image edit areas use a passive `.stq-editable-image-frame` so the editable image area is visible while the camera button remains the only edit target.

Reason:
Mobile authors need to see all editable elements as soon as edit mode is on. Hidden frames made edit mode look incomplete and forced discovery by tapping or hovering, which is weak on touch screens.

Tradeoffs:
More visual chrome is visible during edit mode, but it is constrained to authoring-only rendered edit wrappers and passive image frames. Runtime/player rendering remains unchanged.

Rejected alternatives:
Making entire image surfaces clickable again; adding per-component bespoke frame styles; showing frames only after region selection.

## 2026-05-15 — Preserve mobile map pinch zoom with manual pan

Decision:
Keep the phone map's custom one-finger `manualDragPan` behavior, but make `useMapLibreManualPan` cancel/yield as soon as a second touch pointer is active. Multi-touch gestures are reserved for MapLibre's built-in `touchZoomRotate` handler, so pinch zoom works in normal map use and in edit modes.

Reason:
The phone map needs manual one-finger pan to keep authoring gestures stable inside the mocked mobile frame, but that custom pointer handler must not compete with MapLibre's pinch zoom recognizer.

Tradeoffs:
The hook now tracks active touch pointer ids. This is slightly more state in the provider-internal gesture hook, but it keeps the change behind the `AuthorMap` boundary and avoids changing workspace contracts.

Rejected alternatives:
Re-enabling MapLibre drag pan for the phone map; removing `touch-action` guards from the map shell; adding separate edit-mode gesture paths.

## 2026-05-10 — Mobile edit toggle as a shared floating chip — PARTIALLY SUPERSEDED 2026-05-11

The map view no longer uses the shared chip; see the 2026-05-11 `MapEditPill` decision. Overview, intro and outro still use the floating chip.

Decision:
All four mobile authoring surfaces (overview, intro, outro, map) used a single shared chip pattern at top-right (`.stq-mobile-studio__floating-edit-chip`) instead of per-surface bespoke placements. Intro/outro carry a `--below-header` modifier so the chip sits below the sticky phone header.

Reason:
Earlier iterations had three different placements (in-header pill, bottom FAB, header-actions slot) that drifted visually and made the affordance hard to find. Unifying on one chip gave consistent recognition and consolidated the CSS surface.

Tradeoffs:
The chip wrapper is `position: absolute` and must defend against the legacy `.stq-mobile-studio__workspace > div { width: 100%; height: 100% }` rule — fixed by `pointer-events: none` on the wrapper and `pointer-events: auto` on the inner button. See `src/styles/map-workspace.css`.

Rejected alternatives:
Restoring the bottom-right FAB pattern; per-surface bespoke chrome.

## 2026-05-10 — Independent station-card edit mode on mobile

Update 2026-05-15:
The station/riddle card edit toggle now renders in the same top-right shared major floating-button position as the other mobile edit toggles while a station sheet is visible. It still owns only station-card content edit mode; adjacent map actions can remain to its left when present.

Decision:
Mobile `MapPreviewWorkspace` owns its own `internalStationEditMode` state and renders a dedicated station-card edit toggle through the mobile map top-right pill slot while the station sheet is visible. The map's marker-edit chip and the station-card edit toggle are separate concerns. Desktop continues to use the externally controlled `editMode` prop unchanged.

Reason:
Before this change, mobile passed `editMode={false}` to the workspace, so `editableRegions` never appeared on mobile and the riddle card was effectively read-only. Authors couldn't enter content edit mode on mobile at all.

How it switches:
Internal-vs-prop is keyed off `layout`. When `layout === 'mobile'`, the workspace derives `effectiveEditMode` from internal state. When `layout === 'desktop'`, it uses the prop. No new sentinel API.

Tradeoffs:
Adds one piece of state local to the workspace. State resets to `false` whenever the sheet closes so reopening always starts in read mode.

## 2026-05-10 — Mobile workspace observes sheet state via callback

Decision:
`MapPreviewWorkspace` exposes an optional `onSheetStateChange` callback so callers can suppress overlapping affordances (today: the floating edit chip) while the sheet is `'expanded'`. Cleanup re-emits `'closed'` so unmount transitions (e.g. switching to `RouteWorkspace`) don't strand the parent in `'expanded'`.

Rejected alternatives:
Lifting the sheet state up to `MobileStudioShell` (wider refactor); a parent-controlled-component rewrite of the workspace.

## 2026-05-10 — Route-editor button distribution via :has() — SUPERSEDED 2026-05-11

Superseded by the `MapEditPill` redesign (see 2026-05-11). The `:has()` rule and `--route` modifier no longer drive layout; the route-edit content lives inside the new pill alongside the toggle.

Original decision: when the route editor was active, the right-edge action pill stretched between `15.4dvh` and `bottom: 140px` with `justify-content: space-evenly`, triggered by `:has(.stq-mobile-map-edit-actions--route)`.

## 2026-05-11 — Map edit pill replaces the top-right floating chip on the map view

Update 2026-05-15:
The map view now shares the same top-right major edit-toggle button and styling as overview, intro and outro. `MapEditPill` still owns the expanded map actions, but its main toggle no longer anchors to the zoom controls.

Decision:
On the mobile map view, `MapEditPill` (`src/components/studio/workspaces/MapEditPill.tsx`) owns the expanded edit actions but uses the same top-right `.stq-mobile-studio__major-edit-toggle` button styling and anchor as overview, intro and outro. When inactive it shows only the round edit toggle; when active the pill grows leftward to expose `[plus][trash][flag][toggle]` (marker view) or `[route-editor tools][flag][toggle]` plus a centered stats line below (route view).

Reason:
The previous design placed the FAB bottom-right above where zoom controls would be, which collided with the route-stats panel and required `:has()` gymnastics for route-edit layout. The next iteration anchored the map pill near zoom controls, but that left the primary edit affordance inconsistent with overview, intro and outro. Keeping `MapEditPill` for expanded map actions while moving its main toggle to the shared top-right button preserves the map action model and restores cross-surface recognition.

Tradeoffs:
The pill still has map-specific expanded content, but the primary edit toggle now uses the shared mobile authoring button. The shared top-right anchor must be re-checked against phone headers, map title chrome and small mobile viewports.

Rejected alternatives:
Keeping the top-right floating chip with conditional content; threading a `mapEditMode` prop directly into `PhoneMapMockup` (more plumbing for the same end state).

## 2026-05-11 — Hide the map pill while a station/riddle is being edited

Decision:
When the station sheet is in the `expanded` state, the `MapEditPill` is not rendered. Only station markers and the GPS marker remain on the map. The old on-map context toolbar (settings cog + map-pin buttons mounted via `mobileContextToolbar`) is removed entirely.

Reason:
The pill's edit actions are redundant while the station sheet is open showing per-region pencil affordances. Hiding the pill keeps the map readable and the editing context unambiguous. The two context-toolbar buttons duplicated `openStationPanel('station')` / `openStationPanel('marker')` already reachable from the sheet's editable-region pencils.

Tradeoffs:
Users cannot toggle edit-mode while the station sheet is fully expanded. They must collapse or close the sheet first. Acceptable because the station sheet has its own independent edit toggle (`MapStationSheet.toolbarTrailing`).

## 2026-05-11 — Clear selection when closing route-edit or edit-mode

Decision:
Added an `actions.clearSelection()` action to `useStudioController` that sets `selectedId` to `null`. The mobile shell calls it when closing route-edit (flag → off) and when closing edit-mode entirely (pen toggle → off).

Reason:
Previously, the remounting `MapPreviewWorkspace` saw a stale `selectedId` from before route-edit began and the `selectedId` effect could pop the station sheet on remount even with the `isMountWithStaleSelection` guard. Explicitly clearing selection at the close boundary is a cheaper, more obvious invariant than relying on the mount-guard heuristic.

Tradeoffs:
Authors who had a station selected before entering edit mode lose that selection when they exit. Mild regression. Considered acceptable because edit mode is an explicit modal context — exiting it implies finishing the per-station work it gated.

Rejected alternatives:
Strengthening the mount-guard with a parent-tracked key/version; lifting selection into the shell.

## 2026-05-13 — Remove stale global CSS by selector evidence

Decision:
Removed unused global CSS for old assistant/storyline panels, native-card prototypes, legacy static map/route phone mockups, obsolete station bottom sheets, removed riddle settings cogs, and unused mobile topbar/floating-controls chrome.

Reason:
The selectors had no TS/TSX references and were still bundled into production CSS. Keeping them increased the styling surface and made future mobile-shell work harder to audit.

Tradeoffs:
Pure selector scans can miss dynamically composed class names, so cleanup was limited to class families with direct negative reference checks. Still-used phone map dock and zoom overrides were preserved even though they live in an old `station-pillbar-sheet.css` file.

Rejected alternatives:
Cleaning all heuristic-unused CSS in one broad sweep; moving/renaming still-used dock styles in the same PR.

## 2026-05-15 — Keep persisted UI preferences explicit in tests

Decision:
Tests for components that persist UI preferences, such as `RrrInteractionEditor` expert mode in `localStorage`, must reset the persisted key per test and explicitly opt into the mode they assert.

Reason:
The editor tests were order-dependent: tests that toggled expert mode left `stq-rrr-expert-mode=true`, causing later tests to see expert-only JSON/debug/warning text. Normal order could hide the coupling, while shuffled or CI runs exposed it.

Tradeoffs:
Adds a small amount of test ceremony, but keeps production behavior unchanged and makes test expectations independent of execution order.

Rejected alternatives:
Removing the production persistence behavior; globally clearing all storage for every test without documenting the component-specific state.

## 2026-05-15 — Code-split heavy authoring and map surfaces

Decision:
Tour redirect/editor, RRR runtime demo, and RRR field-test routes load through `React.lazy` route elements. The shared `AuthorMap` boundary now lazy-loads `MapLibreAuthorMap`, keeping MapLibre and its CSS out of the initial app chunk until a map is rendered.

Follow-up:
Studio workspace views are also lazy-loaded at the workspace boundary. Desktop `StudioWorkspaceRenderer` splits plan/story/outro/route/stations workspaces, and the mobile shell splits overview, intro/outro, map and route workspaces behind full-size loading fallbacks. The locale provider now renders a visible shell while locale chunks load, and the root error boundary uses CSS-backed fallback chrome for stale chunk failures.

Reason:
The production main JS chunk had grown to about 2,218.99 kB uncompressed, which is too heavy for a mobile-first PWA initial load. Route-level splitting and preserving the `AuthorMap` boundary reduced the measured main JS chunk to about 297.79 kB while keeping editor, runtime, schema, and map-provider boundaries intact.

Follow-up measurement:
After the workspace split, the measured main JS chunk is ~275.40 kB uncompressed / 84.68 kB gzip. The previous W10 baseline was ~275.56 kB / 84.75 kB gzip. The larger practical improvement is in the Studio path: the former ~99.18 kB `useStudioController` chunk is now ~13.32 kB, with `MapPreviewWorkspace`, `RouteWorkspace`, `TourCardCanvas`, `IntroPhonePreview`, `PlanWorkspace` and `StoryWorkspace` emitted as focused async chunks.

Tradeoffs:
The PWA precache now contains more generated chunk files, and the MapLibre async chunk remains large. Lazy fallbacks must stay visible and layout-stable so the app does not appear blank while chunks load.

Rejected alternatives:
Changing the routing system; splitting internal Studio subviews in the same PR; introducing manual Rollup chunk configuration before measuring the simpler lazy-boundary win.

## 2026-05-15 — `tokens.css` is the canonical runtime design-token source

Decision:
Keep `src/styles/tokens.css` as the single runtime source for app chrome colors, alpha overlays, shadows, and common radii. `src/theme/tokens.ts` now points Tailwind tokens at CSS variable channels instead of carrying divergent hex values.

Reason:
The app had token drift: CSS variables, Tailwind config values, inline styles, map constants, and Studio chrome CSS each carried local color values. That made desktop/mobile theme consistency hard to audit. CSS variables work across CSS modules, global CSS, Tailwind utilities, and React inline style strings, so they are the safest shared surface.

Tradeoffs:
Some non-DOM consumers need special handling. MapLibre paint values receive resolved colors inside `MapLibreAuthorMap`; generated station artwork palettes remain literal because they are content/asset colors rather than shared UI chrome.

Rejected alternatives:
Moving all tokens into TypeScript; replacing every radius/shadow literal in one broad sweep; redesigning the palette or adding theme modes.

## 2026-05-15 — `src/rrr` is the public RRR import boundary

Decision:
App, UI, schema and export code import RRR APIs only through `src/rrr`: `@/rrr` for schema/authoring helpers, `@/rrr/types` for schema-only constants/types in lower-level schema modules, `@/rrr/runtime` for runtime bridge/session/evaluator APIs, `@/rrr/preview` for authoring preview helpers, and `@/rrr/sensors` for field-test sensor adapter APIs. `src/rrr-core`, `src/rrr-runtime`, `src/rrr-preview` and `src/rrr-sensors` remain internal implementation packages.

Reason:
The previous boundary was ambiguous because `@/rrr` re-exported `@/rrr-core` wholesale while some UI code imported runtime, preview and sensor implementation packages directly. A narrow facade keeps app-facing imports stable and lets core/runtime internals evolve without leaking implementation paths into UI. The schema layer uses `@/rrr/types` instead of the root barrel where needed so migration helpers can depend on schema validation without creating root-facade initialization cycles.

Tradeoffs:
The public layer now has a few small subfacades to maintain. Runtime and sensor internals still import each other directly where they own the implementation, which is intentional to avoid cycles and broad churn.

Rejected alternatives:
Moving runtime and sensor code into `src/rrr`; forcing runtime internals to import through the public facade; changing the JSON schema or runtime architecture in the same PR.

## 2026-05-15 — Keep route workspace helper extraction pure

Decision:
Extract only deterministic route-segment helpers from `RouteWorkspace.tsx` into `src/components/studio/workspaces/routeWorkspaceHelpers.ts`. The helper module owns station-anchor creation, segment normalization, segment slicing, near-station lookup, route distance calculation, and compact route distance formatting.

Reason:
`RouteWorkspace.tsx` mixed route geometry with route editor state and JSX. Moving pure helpers first reduces file complexity without changing UI behavior, map provider boundaries, schema contracts, hooks, CSS, or persistence.

Tradeoffs:
The helper remains workspace-local instead of becoming a broad `src/map` utility. This avoids creating a global utility bucket before there is a second caller, but route planning code and route workspace helpers remain separate for now.

Rejected alternatives:
Extracting route editor state/hooks in the same PR; moving JSX or route controls; changing `recordedRoute` shape; creating a broader map abstraction.

## 2026-05-15 — Keep route workspace view extraction presentational

Decision:
Extract `RouteWorkspaceViews.tsx` for the route toolbar buttons, mobile edit-pill route content, and route stats display. The components receive already-computed labels, disabled states, counts, handlers and React nodes as props, and preserve the existing class names and aria labels.

Reason:
`RouteWorkspace.tsx` still had large JSX blocks after pure helper extraction. Moving render-only chrome into local presentational components shortens the workspace file without moving route editor state, route math, map click behavior, schema data changes, CSS, or MapLibre provider details.

Tradeoffs:
The view file is intentionally route-specific instead of a generic workspace toolbar abstraction. This keeps props understandable and avoids creating a new shared UI layer before multiple workspaces need the same surface.

Rejected alternatives:
Extracting hooks/state in the same PR; changing `PhoneMapMockup` props; moving layout conditions into the view components; introducing new CSS or visual styling.

## 2026-05-15 — Keep route workspace controller extraction local

Decision:
Extract route segment selection, pending route-point editing, save/clear/undo handlers, route marker derivation, route overlays, focus-fit data and route distance derivation into `src/components/studio/workspaces/useWorkspaceRouteEditing.ts`.

Reason:
After pure helpers and presentational view chrome were separated, `RouteWorkspace.tsx` still mixed controller state with map/layout composition. A workspace-local hook shortens the parent while keeping all route-editing behavior behind the same `PhoneMapMockup` props and draft `onChange` contract.

Tradeoffs:
The hook returns a fairly broad controller object because it preserves the current map interaction surface without introducing a global workspace store or additional abstractions. It remains route-specific until another workspace has the same state shape.

Rejected alternatives:
Moving map layout/mobile drawer behavior into the hook; introducing a shared workspace controller layer; touching runtime/sensor code; changing `recordedRoute` schema semantics; splitting multiple hooks in the same PR.

## 2026-05-15 — Normalize workspace styling through existing tokens only

Decision:
Workspace styling normalization replaces direct local color literals with existing `--stq-*` variables when the semantic match is clear. This pass keeps selector order, layout dimensions, responsive behavior, component structure and visual hierarchy unchanged.

Follow-up:
The W11 token cleanup extends the Tailwind bridge with `surface` and `inverted` colors backed by `tokens.css`, then replaces shared `bg-white` / `text-white` and remaining literal `white` CSS values in app chrome, riddle map actions and phone dock affordances. The remaining source-level hex literals are station visual artwork palette values and stay outside shared UI token cleanup.

Reason:
After workspace helper/view/controller splits, styling can be normalized without mixing architecture changes into the same diff. Using existing tokens reduces local theme forks while preserving the current desktop and mobile Studio look.

Tradeoffs:
Some CSS remains intentionally tokenized through legacy aliases such as `--stq-white` and alpha tokens. This avoids introducing a new naming pass or broad CSS migration in a styling-only PR.

Rejected alternatives:
Creating new tokens for every nearby color; splitting CSS files in the same PR; changing palette values; redesigning the map pill, phone frame, station sheet or desktop Studio chrome.

## 2026-05-15 — Test workspace behavior through accessible component flows

Decision:
Add workspace regression tests at the component boundary in `src/components/studio/workspaces/workspaceRegression.test.tsx`. The suite mocks `AuthorMap` and blob URL resolution, then drives `RouteWorkspace`, `MapPreviewWorkspace` and focused `PhoneMapMockup` behavior through accessible controls and visible text rather than class names, snapshots or MapLibre DOM internals.

Reason:
The workspace has accumulated fragile mobile/map interactions, but full E2E or pixel tests would be expensive and brittle for this PR. Mocking the map provider keeps MapLibre lifecycle out of the test while still verifying Studio composition, sheet/drawer behavior, stale-selection suppression, route toolbar/edit-mode behavior, route save wiring, phone dock controls and the dock drag click-suppression contract.

Tradeoffs:
The tests do not prove real MapLibre pointer/touch behavior, viewport sizing or CSS layout. The dock drag suppression check uses DOM pointer-event mocks and guards the component contract, not real-device physics. Manual/browser smoke checks remain required for map rendering, touch gestures and responsive placement.

Rejected alternatives:
Snapshot-testing the phone mockup; mounting MapLibre in unit tests; asserting CSS classes or icon glyphs; adding broad E2E infrastructure in the same PR.

## 2026-05-15 — Split MapLibre provider internals behind `AuthorMap`

Decision:
Keep `AuthorMap` and `AuthorMapProps` as the public map boundary, but split `MapLibreAuthorMap.tsx` into provider-internal hooks and helpers under `src/components/map/`: instance/style lifecycle, resize recovery, station markers, route layers, route point markers, selection/current-position rendering, viewport/camera behavior, map click translation and manual pan.

Reason:
`MapLibreAuthorMap.tsx` had accumulated MapLibre lifecycle, markers, route hit layers, drag handling, camera effects and token color resolution in one file. Splitting by provider-owned behavior reduces the file size and makes cleanup ownership explicit without changing workspace callers, schema contracts, runtime boundaries, PWA lazy loading or visual map design.

Tradeoffs:
There are more small provider-internal files to maintain. The split intentionally does not introduce a generic map abstraction or move route/station business logic out of the existing workspaces. Real browser/mobile smoke checks are still required because unit tests do not mount MapLibre itself.

Additional guard:
Route hit-layer clicks are now checked before forwarding a normal map click so route segment selection cannot also append a route point. CSS variable paint resolution moved to `mapLibrePaintTokens.ts` with tests, and station drag cleanup now has an explicit disposer.

Rejected alternatives:
Changing the `AuthorMapProps` contract; introducing a second map provider abstraction; adding offline tile support; moving route editing business rules into MapLibre hooks; mounting full MapLibre in unit tests.

## 2026-05-15 — Split global CSS through order-preserving aggregators

Decision:
Split large global CSS files by responsibility while preserving the existing `src/index.css` cascade. `phone-preview.css`, `map-workspace.css` and `rrr-module-editors.css` now remain as small aggregators that import focused files under `src/styles/workspace/` and `src/styles/rrr/`. Route-tool styles moved from the tail of `studio-navigation.css` into `src/styles/workspace/route-tools.css` and are imported immediately after `studio-navigation.css`.

Reason:
The largest CSS files mixed phone preview, mobile shell, map sheet, drawer, route tool and RRR module editor responsibilities. A mechanical file split makes ownership easier to audit while avoiding visual redesign, selector renames, JSX class changes, token cleanup or CSS module migration.

Tradeoffs:
The cascade is still global and order-sensitive. Aggregators add one level of indirection, but they keep old cascade slots intact. Manual browser/mobile checks remain necessary because happy-dom tests do not prove real CSS layout, pointer behavior, viewport units or z-index layering.

Order guard:
Keep the map/workspace chain in this order unless a PR explicitly scopes visual verification: `phone-preview.css` → `phone-map-workspace.css` → `phone-map-dock.css` → `phone-station-sheet.css` / `phone-station-preview.css` → `station-pillbar-sheet.css` → `studio-navigation.css` → `workspace/route-tools.css` → `map-workspace.css`.

Rejected alternatives:
Importing every split file directly from `index.css`; renaming active legacy CSS files in the same PR; removing seemingly unused selectors; moving to CSS Modules or Tailwind utilities; combining the split with token cleanup.

## 2026-05-15 — Reduce initial bundle through coarse lazy boundaries

Decision:
Keep the existing PWA and route architecture, but move heavy authoring surfaces behind route/view/action lazy boundaries. Studio now lazy-loads desktop/mobile shells, station riddle settings lazy-load the RRR interaction editor, QR scanning lazy-loads the scanner dependency only when a QR module is active, and ZIP export lazy-loads the export pipeline on click. The editor language provider now imports locale constants from `schema/locales` instead of the full schema barrel.

Reason:
The app already had route-level lazy loading and a MapLibre boundary, but the initial shell still pulled broad schema code and the editor route eagerly loaded desktop/mobile Studio surfaces plus export and RRR authoring dependencies. Coarse UI/action boundaries reduce startup and editor-route payload without changing draft schemas, caller props, runtime evaluation, map internals, PWA strategy or storage contracts.

Measured result:
Production `index` JS changed from ~297.89 kB / 91.90 kB gzip to ~275.56 kB / 84.75 kB gzip. `TourEditorPage` changed from ~281.71 kB / 78.80 kB gzip to ~6.36 kB / 2.62 kB gzip, with Studio shell/controller, RRR editor, QR scanner and export pipeline emitted as async chunks. The remaining chunk-size warning is the existing async MapLibre provider chunk.

Tradeoffs:
There are more hashed chunks in the PWA precache, increasing stale-chunk surface area after deployments. Fallbacks must stay visible and layout-stable, and manual preview/offline smoke checks remain required.

Rejected alternatives:
Splitting inside MapLibre lifecycle hooks, route-edit gesture handling, RRR runtime evaluators, schema/storage code, export serializer internals, or changing the service-worker/runtime caching strategy in the same PR.

## Existing architectural decisions to preserve

### Authoring PWA exports to Flutter player

Decision:
The PWA is the authoring tool. The Flutter app remains the player. Exported JSON should remain compatible.

Implication:
Schema changes are treated like API changes.

### RRR core remains framework-independent

Decision:
RRR core logic must not depend on React or browser APIs.

Implication:
Browser/sensor/platform logic belongs in adapters such as `src/rrr-sensors/`, hooks, or UI-specific boundaries.

### MapLibre behind author-map boundary

Decision:
MapLibre is the map provider through shared map boundaries.

Implication:
Provider-specific implementation details should not leak broadly into unrelated components.
