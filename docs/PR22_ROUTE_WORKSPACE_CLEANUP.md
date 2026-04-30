# PR-22 — Build Route Workspace Cleanup

## Ziel

`RouteWorkspace` wird ein echter Arbeitsbereich für Weg, Reihenfolge und räumliche Plausibilität.

Nicht mehr „irgendwo Karte“, sondern:

```txt
Route = große Karte + Reihenfolge + Segmente + Warnungen
```

## Erwartete Dateien

```txt
src/components/studio/workspaces/RouteWorkspace.tsx
src/components/studio/route/RouteSegmentList.tsx
src/components/studio/route/RouteChecklist.tsx
src/components/studio/route/routeUtils.ts
```

## Implementer Prompt

```txt
You are the Implementer Agent.

Implement PR-22: Build Route workspace cleanup.

Context:
The app has a Route workflow tab. This workspace should focus on route order, spatial flow, segment distances and route readiness.
The map should be important here, but the UI should not show station content editing or a dominant phone preview.

Goal:
Turn RouteWorkspace into a clear route review workspace.

Rules:
- Keep this PR focused.
- Do not add dependencies.
- Do not call external APIs.
- Do not implement complex routing engines.
- Do not change station IDs.
- Do not automatically reorder stations.
- Do not break MapLibre.
- Do not break Stations workspace.

Tasks:
1. Implement or refactor:
   src/components/studio/workspaces/RouteWorkspace.tsx

2. Add a large map area showing:
   - station markers
   - route line if already available
   - selected station if applicable

3. Add RouteChecklist:
   src/components/studio/route/RouteChecklist.tsx

   It should show local checks:
   - at least 2 stations
   - all stations have coordinates
   - start point exists
   - end point exists
   - station order exists
   - route not reviewed yet / reviewed placeholder

4. Add RouteSegmentList:
   src/components/studio/route/RouteSegmentList.tsx

   It should list station-to-station segments:
   - Station 1 → Station 2
   - approximate distance if coordinates are available
   - warning if distance is unusually long

5. Add routeUtils:
   src/components/studio/route/routeUtils.ts

   Include helper functions:
   - calculateApproxDistanceMeters()
   - getRouteSegments()
   - getLongSegmentWarnings()

   Use a simple haversine calculation.
   Do not add geospatial dependencies.

6. RouteWorkspace layout:
   Desktop:
   - left/sidebar: RouteChecklist
   - main: large map
   - bottom or side: RouteSegmentList

   Mobile:
   - checklist
   - map
   - segment list

7. Preview should be hidden or collapsed in Route workspace.

8. Add calm empty states:
   - "Add at least two stations to review the route."
   - "Some stations are missing coordinates."

9. Keep styling consistent:
   - paper cards
   - burgundy accents
   - rounded corners
   - quiet warnings

Acceptance criteria:
- Route tab shows a route-focused workspace.
- Route map is visible and usable.
- Segment list appears when at least two stations exist.
- Missing coordinates are handled gracefully.
- Long segment warnings appear locally.
- No automatic station reorder happens.
- Preview does not dominate the Route workspace.
- No new dependencies.
- No TypeScript errors.
- No nested button warnings.

Run:
npm run typecheck
npm run lint
npm test
npm run build

Return:
- changed files
- summary
- failures
- suggested next PR
```

## UX Review Checklist

```txt
Does Route feel like spatial review rather than station editing?
Is the map large enough here?
Are warnings useful and not alarmist?
Is automatic reordering avoided?
Does the segment list help understand walking flow?
```
