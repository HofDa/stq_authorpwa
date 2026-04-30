# PR-20 — Split Stations into Map/Edit Modes

## Ziel

Der `StationsWorkspace` wird entschlackt.  
Stationen bekommen zwei klare Arbeitsmodi:

```txt
Map  → räumliches Arbeiten
Edit → Inhalte bearbeiten
```

Das reduziert visuelle Überladung massiv.

## Erwartete Dateien

```txt
src/components/studio/workspaces/StationsWorkspace.tsx
src/components/studio/workspaces/StationMapMode.tsx
src/components/studio/workspaces/StationEditMode.tsx
src/components/studio/workspaces/stationWorkspaceTypes.ts
```

## Implementer Prompt

```txt
You are the Implementer Agent.

Implement PR-20: Split Stations into Map/Edit modes.

Context:
The Stations workspace currently contains many things at once: map, station list, timeline, preview, editing actions and status. This is visually overloaded.
The goal is to split the Stations workspace into two internal modes:
- Map
- Edit

Goal:
Make StationsWorkspace easier to use by introducing a local mode switch:
Map | Edit

Rules:
- Keep this PR focused.
- Do not redesign the whole app.
- Do not add dependencies.
- Do not call AI APIs.
- Preserve existing map behavior.
- Preserve station selection behavior.
- Preserve existing station timeline behavior where possible.
- Do not change station IDs.
- Do not change export logic.
- Do not implement drag/drop in this PR.

Tasks:
1. Update StationsWorkspace so it has an internal mode state:
   type StationWorkspaceMode = 'map' | 'edit';

2. Add a small segmented control or pill switch:
   Map | Edit

3. Create StationMapMode:
   src/components/studio/workspaces/StationMapMode.tsx

   It should contain:
   - large map
   - station markers
   - add station action
   - selected station summary
   - station timeline if currently needed for spatial work
   - map-related controls

4. Create StationEditMode:
   src/components/studio/workspaces/StationEditMode.tsx

   It should contain:
   - selected station editor area
   - title/status summary
   - story/riddle/hints/success fields if already available
   - AssistantSlot placeholder if already available
   - optional compact phone preview if already available

5. If no station is selected in Edit mode:
   Show a calm empty state:
   "Select a station to edit its content."

6. The Map mode should be the default mode.

7. The Edit mode should not show a huge map.
   A small coordinate summary is enough.

8. The Map mode should not show a huge text editor.
   Keep text editing secondary there.

9. Keep the existing visual style:
   - cards
   - rounded corners
   - burgundy accents
   - soft background
   - no visual explosion

10. Make it responsive:
    - Desktop: Map/Edit switch at the top of the Stations workspace
    - Mobile: switch remains accessible, content stacks cleanly

Acceptance criteria:
- Stations workspace has Map and Edit modes.
- Map mode keeps the existing map usable.
- Edit mode focuses on station content, not the map.
- Selected station remains stable when switching modes.
- No station data is lost when switching modes.
- Existing add/select station behavior still works.
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
Is Stations less visually overloaded?
Does Map mode clearly focus on spatial work?
Does Edit mode clearly focus on content work?
Does the selected station survive mode switching?
Is there a calm empty state when no station is selected?
```
