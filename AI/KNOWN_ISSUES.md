# Known Issues and Pitfalls

## Active cautions

### Map tiles are not fully offline-ready

Symptoms:
The PWA shell can work offline, but map tiles depend on online raster sources unless explicit offline tile support is added.

Risk:
Field use in weak-signal areas can appear broken if authors expect offline maps.

Mitigation:
Document offline limitations clearly and test map behavior in airplane mode before claiming offline map support.

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

## Resolved issues

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
