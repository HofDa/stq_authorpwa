# Decision Log

Use this file to prevent repeated architectural debates and agent drift.

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

Decision:
Mobile `MapPreviewWorkspace` owns its own `internalStationEditMode` state and renders a dedicated edit toggle inside `MapStationSheet.toolbarTrailing`. The map's marker-edit chip and the station-card edit toggle are separate concerns. Desktop continues to use the externally controlled `editMode` prop unchanged.

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

Decision:
On the mobile map view (and only on the mobile map view), the edit affordance moved from the shared `.stq-mobile-studio__floating-edit-chip` to a new round `MapEditPill` (`src/components/studio/workspaces/MapEditPill.tsx`) anchored to the left of the zoom controls. When inactive it shows only the round pen toggle; when active the pill grows leftward to expose `[plus][trash][flag][toggle]` (marker view) or `[route-editor tools][flag][toggle]` plus a centered stats line below (route view).

Reason:
The previous design placed the FAB bottom-right above where zoom-controls would be, which collided with the route-stats panel and required `:has()` gymnastics for route-edit layout. Co-locating the toggle with the zoom controls and using one pill that grows on demand keeps the affordance discoverable, eliminates collision with route stats, and reduces CSS surface (drops the `:has()` rule and the `--below-header` modifier on the map view).

Tradeoffs:
The pill's position uses fixed `right` / `bottom` offsets calibrated to the zoom-control geometry. If zoom controls change size or position, the pill's anchor must be re-checked.

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
