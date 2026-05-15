# Workspace Ownership Map

Date: 2026-05-15
Status: post-W12 ownership map.
Scope: documentation only. Use this as the current guardrail after the W2-W11 decomposition, lazy-loading, CSS split and token cleanup work.

## Purpose

This document defines who owns workspace state and side effects after the workspace decomposition series.

Use it as a guardrail for future workspace, map, RRR authoring, CSS and PWA work:
- keep state in the owning controller or hook
- keep view components presentational
- keep MapLibre provider behavior behind the author-map boundary
- keep RRR authoring behind the public RRR facade
- keep draft mutations flowing through the existing `onChange` / draft patch callbacks
- keep lazy loading at route/view/action boundaries with visible fallbacks
- keep CSS token cleanup semantic and avoid palette redesigns

## System Boundaries

### Studio Shells

Owners:
- `src/components/studio/useStudioController.ts`
- `src/components/studio/DesktopStudioShell.tsx`
- `src/components/studio/mobile/MobileStudioShell.tsx`
- `src/components/studio/StudioWorkspaceRenderer.tsx`

Responsibilities:
- global selected station id
- active workflow section
- draft-level actions such as add, delete, reorder, export, delete tour
- desktop/mobile shell composition
- mobile edit-mode toggles
- routing between overview, intro, outro, map and route views

Must not own:
- MapLibre internals
- route segment geometry rules
- station sheet internals
- RRR runtime execution

### Workspace Controllers and Hooks

Owners:
- `MapPreviewWorkspace.tsx` for station-sheet, drawer and map-preview local state
- `useWorkspaceRouteEditing.ts` for route segment editing state
- future focused hooks only when their ownership is explicitly documented

Responsibilities:
- local workspace state
- derived data for view components
- conversion from UI/map events to draft patch callbacks
- reset/cleanup rules for the workspace they own

Must not own:
- global app navigation
- direct storage persistence
- raw sensor/browser runtime access
- MapLibre lifecycle
- unrelated workspace state

### View Components

Examples:
- `RouteWorkspaceViews.tsx`
- `MapEditPill.tsx`
- `MapStationSheet.tsx`
- `RightEditDrawer.tsx`
- future toolbar, dock, empty-state or panel-header components

Responsibilities:
- render props
- expose accessible controls
- emit callbacks supplied by owning controller/shell
- preserve design tokens and class names where relevant

Must not own:
- draft mutation
- hidden global state
- persistence
- sensor/runtime access
- cross-workspace state changes

### Map Boundary

Owners:
- `AuthorMap.tsx`
- `MapLibreAuthorMap.tsx`
- provider-internal `useMapLibre*` hooks under `src/components/map/`
- `mapTypes.ts`
- `mapLibreUtils.ts`
- `mapLibrePaintTokens.ts`

Responsibilities:
- sanitize author-map props
- MapLibre lifecycle and cleanup
- markers, route layers, route hit layers and provider event translation
- viewport center reporting
- station/route-point drag event reporting
- CSS variable resolution before MapLibre paint properties

Must not own:
- selected station business meaning
- station sheet state
- route edit mode
- draft patching
- unrelated workspace state

### RRR Boundary

Owners:
- `src/rrr` public facade and subfacades
- `src/rrr-core`
- `src/rrr-runtime`
- `src/rrr-preview`
- `src/rrr-sensors`
- RRR authoring UI only as an adapter to facade APIs

Responsibilities:
- interaction schema helpers
- authoring validation and warnings through public facade APIs
- runtime evaluation and preview
- sensor adapters behind runtime/sensor boundaries

Must not own:
- Workspace shell state
- station sheet/drawer state
- export schema mutation outside the public facade
- direct coupling from runtime/core to React UI

## Ownership Rules

| State or action | Owner | Allowed writers | Allowed readers | Notes |
| --- | --- | --- | --- | --- |
| `selectedStationId` / `selectedId` | `useStudioController` | `actions.selectStation`, `actions.selectStationOnly`, `actions.clearSelection`, station deletion cleanup | Studio shells, `StudioWorkspaceRenderer`, map/route workspaces as props | Workspaces may request selection through callbacks, but must not create a second global selected-station source. |
| Station sheet open/close state | `MapPreviewWorkspace` | `MapPreviewWorkspace` selection effects, sheet handle callbacks, close/back callbacks, delete-mode cleanup | `MapPreviewWorkspace`, `MobileStudioShell` only via `onSheetStateChange` | Shells can observe sheet state to hide overlapping chrome; they should not directly drive the sheet except by changing selection/edit mode inputs. |
| Right edit drawer open/close state | `MapPreviewWorkspace` for station editing; `RightEditDrawer` for gesture transitions via callback | `MapPreviewWorkspace`, `RightEditDrawer` through `onStateChange` / `onClose` | `RightEditDrawer`, `MapPreviewWorkspace` | Drawer state is local to the station editing flow. Do not lift it into global Studio state without a specific PR decision. |
| Delete mode | `MapPreviewWorkspace` | `MapPreviewWorkspace` add/delete pill handlers and `showDeleteStationFab` cleanup effect | `MapPreviewWorkspace`, `PhoneMapMockup` as delete affordance props | Delete mode closes station sheet, active panel and right drawer. Map provider only reports delete clicks. |
| Pending delete confirmation | `MapPreviewWorkspace` | `MapPreviewWorkspace` via delete marker/station click and confirm/cancel buttons | Confirm dialog rendered by `MapPreviewWorkspace` | `onDeleteStation` comes from shell/controller; confirmation ownership remains local. |
| Route edit mode | `MobileStudioShell` on mobile; always-on route editing in desktop route workspace renderer | `MobileStudioShell.toggleRouteEditMode`, `MobileStudioShell.toggleMapEditMode` | `MobileStudioShell`, `RouteWorkspace` via `editable` / pill props | Closing route edit must clear stale selected station through `actions.clearSelection()`. |
| Route segment selection | `useWorkspaceRouteEditing` | `setSelectedSegmentFromId`, route arrow callbacks, route click translation in `RouteWorkspace` | `RouteWorkspace`, `RouteWorkspaceViews` via props | This is not the global selected station id. It selects the origin station for a route segment only. |
| Route pending points | `useWorkspaceRouteEditing` | map click, station click, route point drag, undo, clear, save handlers inside the hook | `RouteWorkspace` and `PhoneMapMockup` via derived props | Keep route point state out of view components and shell state. |
| Draft patching | Parent editor/page through `onChange`; workspace controllers trigger it | `useStudioController`, `MapPreviewWorkspace`, `useWorkspaceRouteEditing`, `TourCardCanvas`, `IntroPhonePreview`, `StationEditPanel` via supplied callbacks | Any workspace receiving `draft` props | Draft mutation must be expressed as `onChange(patch)` or `onChange(prev => next)`. No direct Dexie writes from workspace UI. |
| Viewport center | `PhoneMapMockup` / `AuthorMap` report; `MapPreviewWorkspace` stores for add-station | `AuthorMap` / `MapLibreAuthorMap` through `onViewportCenterChange`; `MapPreviewWorkspace` stores value | `MapPreviewWorkspace.addStationAtViewportCenter` | Map provider owns measuring/reporting. Workspace owns what to do with the reported center. |
| MapLibre-specific events | `MapLibreAuthorMap` | MapLibre event handlers only | `AuthorMap` consumers through typed callbacks | Provider events must be translated to `AuthorMapProps` callbacks before they reach workspaces. |
| Basemap, zoom controls and map tool menu | `PhoneMapMockup` | `PhoneMapMockup` local state and buttons | `AuthorMap` via props | Keep basemap UI local unless multiple map shells need a shared controller. |
| Dock pointer-drag state | `PhoneMapMockup` | `PhoneMapMockup` dock pointer handlers | `PhoneMapMockup` only | This is touch behavior, not global workspace state. Preserve click suppression semantics when extracting. |
| Sidebar width | `DesktopStudioShell` | `DesktopStudioShell` pointer resize and localStorage persistence | `DesktopStudioShell` only | This is shell chrome preference, not workspace state. |
| Locale/editor language | `useStudioController` and editor language provider | `actions.changeLanguage`, editor language provider | shells and workspaces via props/context | Do not introduce per-workspace locale forks. |
| RRR expert mode / RRR author UI preferences | RRR authoring UI | RRR authoring components and tests that reset state | RRR authoring UI | Do not let generic workspace view components touch RRR localStorage keys. |

## Components That May Own State

Allowed state owners:
- `useStudioController`: global Studio editor state and draft-level actions.
- `DesktopStudioShell`: desktop-only shell preferences such as sidebar width.
- `MobileStudioShell`: mobile view/edit-mode state and transitions.
- `MapPreviewWorkspace`: local station sheet, station edit mode, selected editable region, right drawer, viewport center, delete mode and confirmation.
- `useWorkspaceRouteEditing`: route segment controller state and route-derived map props.
- `PhoneMapMockup`: map shell UI state such as basemap, layers menu, zoom control dispatch and dock drag behavior.
- `MapStationSheet`: sheet gesture-local drag offset and handle semantics.
- `RightEditDrawer`: drawer gesture-local swipe tracking and focus behavior.
- `MapLibreAuthorMap`: provider lifecycle state, marker/layer handles, camera state and event cleanup.
- RRR authoring components: only their own authoring UI state, through public RRR facade contracts.

State ownership rules:
- A hook may own state only for the workspace/controller it names.
- A presentational component may own transient gesture/focus state when the state is intrinsic to the component interaction.
- A component may not own a second copy of state that already has a documented owner.
- If a future extraction creates a new hook, add it to this file or an adjacent decision before moving more state into it.

## Components That Should Only Render

Render-only or mostly render-only components:
- `RouteWorkspaceViews.tsx`
- `MapEditPill.tsx`
- extracted toolbar, empty state, legend, stats, panel header or overlay components
- future `PhoneMapDock`, `PhoneMapZoomControls`, `PhoneMapLayersMenu` components if extracted from `PhoneMapMockup`
- future station sheet header/body view components

Rules for render-only components:
- receive already-computed labels, booleans, counts and handlers as props
- render accessible controls and invoke callbacks
- do not inspect or mutate `TourDraft` directly unless explicitly documented as a workspace view that renders draft data
- do not call `onChange` directly unless the component is explicitly an editor form/panel
- do not read `localStorage`, `sessionStorage`, `window`, `navigator`, sensors or MapLibre APIs
- do not import runtime/core implementation packages

## Allowed Data Flows

### Workspace Shell to Controller to Views

```text
Workspace Shell
→ Workspace Controller Hook / Workspace Component
→ View Components
```

Examples:
- `MobileStudioShell` sets mobile edit and route-edit modes, then passes `editable`, `mapEditMode` and callbacks into `RouteWorkspace` or `MapPreviewWorkspace`.
- `RouteWorkspace` calls `useWorkspaceRouteEditing`, computes labels, and passes props into `RouteWorkspaceViews` and `PhoneMapMockup`.
- `MapPreviewWorkspace` owns sheet/drawer/delete state and passes render props to `MapStationSheet`, `RightEditDrawer`, `PhoneMapMockup` and `RiddleScreen`.

### Controller to Draft Patch Callback

```text
Workspace Controller Hook / Workspace Component
→ onChange patch callback
→ parent editor state / persistence layer
```

Examples:
- `useStudioController.addStation` calls `onChange(prev => next)` and then selects the new station.
- `MapPreviewWorkspace.patchStation` maps station updates through `onChange`.
- `useWorkspaceRouteEditing.saveSegment` writes `recordedRoute` through `onChange(prev => next)`.

### Map Event to Controller to Draft Patch Callback

```text
MapLibre event
→ MapLibreAuthorMap
→ AuthorMap callback
→ PhoneMapMockup
→ Workspace Controller
→ onChange patch callback
```

Examples:
- station drag reports `onStationCoordinateChange`, then `MapPreviewWorkspace` patches station coordinates.
- viewport move reports `onViewportCenterChange`, then `MapPreviewWorkspace` stores the center for add-station.
- map click reports `onMapClick`, then `useWorkspaceRouteEditing` appends a route point.
- route point drag reports `onRoutePointCoordinateChange`, then `useWorkspaceRouteEditing` updates pending route points.

### RRR Author UI to RRR Facade to Core

```text
RRR Author UI
→ public RRR facade (`@/rrr`, `@/rrr/types`, `@/rrr/runtime`, `@/rrr/preview`, `@/rrr/sensors`)
→ schema/runtime/core implementation
```

Examples:
- RRR module editors use schema helpers and warnings through public facade imports.
- Runtime previews use preview/runtime facade APIs.
- Sensor-related authoring flows use sensor facades/adapters, not raw browser sensor APIs in visual components.

## Forbidden Shortcuts

Do not introduce these flows:

```text
View Component → direct draft mutation
View Component → direct localStorage/sessionStorage access
View Component → direct sensor/browser runtime access
Map child component → unrelated workspace state mutation
RRR module editor → export schema mutation outside RRR facade
MapLibreAuthorMap → draft patch callback
MapLibreAuthorMap → station sheet / drawer state
RouteWorkspaceViews → route edit state mutation beyond provided callbacks
MapStationSheet → selectedStationId mutation
RightEditDrawer → global Studio section mutation
RRR runtime/core → React component or Studio workspace import
```

Specific examples to reject:
- A toolbar button importing storage and writing drafts directly.
- A presentational route stats component calling `onChange`.
- `MapLibreAuthorMap` deciding whether a station sheet should open.
- `MapPreviewWorkspace` importing `@/rrr-core` or raw browser sensor APIs.
- An RRR module editor changing exported JSON shape without going through schema/facade decisions.
- A map dock component clearing `selectedId` directly instead of using a shell/controller callback.

## Post-W12 Extraction Guidance

### Route Workspaces

Current state:
- pure route helpers in `routeWorkspaceHelpers.ts`
- route view chrome in `RouteWorkspaceViews.tsx`
- route controller state in `useWorkspaceRouteEditing.ts`
- component-level regression tests for route data/tool reachability and save wiring

Future safe moves:
- extract route legends/stats only as presentational components
- extract additional route hooks only when they own a single coherent state group and do not duplicate `useWorkspaceRouteEditing`
- keep route map click and route layer click behavior tested after each extraction

Risks:
- route click can accidentally also become map click
- segment selection can be confused with global selected station id
- pending route points can become stale after station reorder/delete
- MapLibre paint tokens must still resolve before reaching paint properties

### Map Preview Workspace

Current owner:
- `MapPreviewWorkspace` owns station sheet, local station edit mode, active panel, selected editable region, right drawer state, delete mode, pending delete id and viewport center.

Future safe moves:
- extract a focused `useMapPreviewStationState` only if it preserves stale-selection and delete-mode cleanup invariants
- extract delete confirmation view as render-only
- extract station section derivation as pure helper if needed

Risks:
- stale `selectedId` can reopen a station sheet when returning from route edit
- delete mode must close sheet and drawer
- mobile station edit mode differs intentionally from desktop `editMode`
- right drawer state must not become global unless a broader shell redesign is explicitly scoped

### Phone Map Mockup

Current owner:
- `PhoneMapMockup` owns basemap menu state, zoom control dispatch and dock drag behavior.

Future safe moves:
- extract dock, zoom controls and basemap menu as local components
- keep pointer capture/click suppression behavior intact
- preserve accessible names for controls

Risks:
- dock drag can steal station/segment button clicks
- zoom and layers controls are shared by map and route workspaces
- layout/placement changes can break mobile map pill geometry

### MapLibre Internals

Current owner:
- `MapLibreAuthorMap` composes provider-internal hooks.
- `useMapLibreInstance` owns map creation, style readiness, basemap style switching and teardown.
- `useMapLibreStationMarkers` owns station DOM markers, delete affordances and station drag cleanup.
- `useMapLibreRouteLayers` owns route sources/layers, hit layers, endpoint markers and route click translation.
- `useMapLibreRoutePointMarkers` owns draggable route-point markers.
- `useMapLibreViewport` owns viewport center reporting, fit/pan/fly camera behavior and zoom/recenter control actions.
- `useMapLibreManualPan` owns custom mobile pointer pan and listener cleanup.
- `useMapLibreCurrentPosition`, `useMapLibreSelectionLayer` and `useMapLibreResizeRecovery` own their named provider effects.

Future safe moves:
- keep `AuthorMapProps` stable
- add tests for provider helpers when behavior changes
- keep new MapLibre files provider-internal; do not import them from workspaces

Risks:
- route hit layer propagation can break route editing
- manual pan and marker drag use global listeners
- async MapLibre chunk fallback must stay nonblank and sized
- map tiles remain online-only unless explicit offline support is added

### RRR Authoring

Current owner:
- RRR authoring UI owns editor presentation.
- RRR facade/core/runtime own validation and runtime behavior.
- Locale copy for the authoring editor is owned by `src/i18n/editorLanguage.tsx` plus the `de` / `en` / `it` locale files.
- Station-panel RRR editing lazy-loads through `LazyRrrInteractionEditor`.

Future safe moves:
- split module-specific editors as prop-driven UI
- move pure normalization/summary helpers with tests
- keep imports through public facade paths
- preserve locale key parity across `de`, `en` and `it`

Risks:
- localStorage-backed expert mode can make tests order-dependent
- condition repair touches schema validity
- module config shape affects export/player compatibility

### CSS and Tokens

Current owner:
- CSS remains global and selector-order sensitive, with `src/index.css` as the only global entrypoint.
- `src/styles/phone-preview.css`, `src/styles/map-workspace.css` and `src/styles/rrr-module-editors.css` are order-preserving aggregators.
- `src/styles/workspace/*` owns split workspace/phone/map shell CSS slices.
- `src/styles/rrr/*` owns split RRR module editor CSS slices.
- `tokens.css` is the canonical token source.
- `src/theme/tokens.ts` bridges CSS variables into Tailwind; `surface` and `inverted` are available for shared app chrome.

Future safe moves:
- substitute direct color literals only when token match is semantic and obvious
- preserve import order and legacy workspace sizing behavior
- rename legacy files such as `station-pillbar-sheet.css` only in a separate visual-verification PR
- leave generated station artwork palette literals in `src/stations/visuals.logic.ts` alone unless an asset/art direction PR scopes them explicitly

Risks:
- `.stq-mobile-studio__workspace > div` can intercept pointer events
- mobile viewport units and fixed drawers can regress with browser chrome/keyboard
- CSS variables passed to MapLibre paint must be resolved at the map boundary
- route tools, station sheet, drawer and map dock rules rely on documented cascade order

### Lazy Loading and PWA Chunks

Current owner:
- Route lazy loading lives in `src/app/LazyRouteElement.tsx`.
- Studio shell and workspace lazy loading lives in `src/components/studio/Studio.tsx`, `StudioWorkspaceRenderer.tsx` and `mobile/MobileStudioShell.tsx`.
- Map provider lazy loading lives at `AuthorMap`.
- QR scanner and ZIP export are action/runtime lazy chunks.

Future safe moves:
- keep split points coarse and user-visible
- keep fallback UI nonblank and layout-stable
- review stale chunk behavior before adding more lazy boundaries

Risks:
- Workbox precache now includes more hashed assets
- old open tabs can reference stale chunks until the service-worker refresh path reloads
- async MapLibre remains a large chunk by design

## Verification Expectations

For documentation-only PRs:
- manually inspect `AI/WORKSPACE_OWNERSHIP.md`
- confirm no production files changed
- no lint/typecheck/build is required because this is documentation-only

For later code PRs:
- run focused tests for the touched system first
- run relevant adjacent tests for the touched system
- run `npm run typecheck`
- run `npm run lint`
- run `npm run build`
- run `npm test` for shared workspace, RRR, map, schema or export changes
- perform mobile/browser smoke checks for map, sheet, drawer, route edit, dock behavior, lazy fallbacks and PWA reload behavior when relevant

## Manual Review Checklist

Before changing a workspace file, answer:
- Which documented owner currently controls this state?
- Is this change moving state, rendering, or only pure derivation?
- Does the data still flow through `onChange` for draft patches?
- Does any view component gain hidden state or side effects?
- Does any map child mutate unrelated workspace state?
- Does any RRR editor bypass the public RRR facade?
- Are mobile sheet/drawer/delete/route-edit cleanup invariants preserved?
- Are existing regression tests sufficient, or does this need a focused new test?
