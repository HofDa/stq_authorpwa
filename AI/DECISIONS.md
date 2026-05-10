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

## 2026-05-10 — Mobile edit toggle as a shared floating chip

Decision:
All four mobile authoring surfaces (overview, intro, outro, map) use a single shared chip pattern at top-right (`.stq-mobile-studio__floating-edit-chip`) instead of per-surface bespoke placements. Intro/outro carry a `--below-header` modifier so the chip sits below the sticky phone header.

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

## 2026-05-10 — Route-editor button distribution via :has()

Decision:
When the route editor is active, the right-edge action pill stretches between its top anchor (`15.4dvh`) and `bottom: 140px`, with `justify-content: space-evenly`. Triggered by a `--route` modifier on the toolbar wrapper, picked up via `:has(.stq-mobile-map-edit-actions--route)` on the parent edit pill.

Reason:
Default tight-stack of 5 buttons read as cramped chrome. Stretching distributes them along the visible right edge, matching iOS-style sidebar tools.

Browser support:
`:has()` requires Chrome ≥105 / Safari ≥15.4 / Firefox ≥121 (all 2023+). If older browsers must be supported, swap to a JSX-set parent class.

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
