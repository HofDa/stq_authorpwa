# PR-23 — Build Full Preview Workspace

## Ziel

`PreviewWorkspace` wird der echte Testmodus.  
Hier sieht man die Tour so, wie Spieler:innen sie später erleben.

## Erwartete Dateien

```txt
src/components/studio/workspaces/PreviewWorkspace.tsx
src/components/studio/preview/PreviewStage.tsx
src/components/studio/preview/PreviewControls.tsx
src/components/studio/preview/PreviewReadinessPanel.tsx
```

## Implementer Prompt

```txt
You are the Implementer Agent.

Implement PR-23: Build full Preview workspace.

Context:
The Preview workflow tab should become the main place where the author tests the tour from the player's perspective.
The phone preview should be central here, not a small side panel.

Goal:
Create a real PreviewWorkspace with a large player-style preview, language controls, station selector, test controls and readiness feedback.

Rules:
- Keep this PR focused.
- Do not add dependencies.
- Do not call external APIs.
- Do not implement real game logic if not already available.
- Do not change export logic.
- Do not break existing preview rendering.
- Do not break other workspaces.

Tasks:
1. Implement or complete:
   src/components/studio/workspaces/PreviewWorkspace.tsx

2. Add PreviewStage:
   src/components/studio/preview/PreviewStage.tsx

   It should render the phone/player preview in a central, larger layout.

3. Add PreviewControls:
   src/components/studio/preview/PreviewControls.tsx

   Controls should include:
   - language selector if languages exist
   - preview target:
     - Intro
     - Station
     - Success
     - Outro
   - station selector for station preview
   - basic "simulate solved" toggle if existing logic supports it
     Otherwise show disabled placeholder.

4. Add PreviewReadinessPanel:
   src/components/studio/preview/PreviewReadinessPanel.tsx

   It should show:
   - missing intro
   - missing outro
   - missing station title
   - missing GPS
   - missing riddle
   - missing success message
   - incomplete languages if detectable

5. PreviewWorkspace layout:
   Desktop:
   - center: large phone preview
   - side: controls + readiness
   Mobile:
   - controls
   - preview
   - readiness

6. Add graceful empty states:
   - no stations
   - missing selected station
   - missing language content
   - no intro/outro

7. Keep visual style consistent:
   - premium but calm
   - paper cards
   - burgundy accents
   - strong central preview

8. Do not introduce AI suggestions yet.
   This PR is about the preview experience only.

Acceptance criteria:
- Preview tab shows a large central player-style preview.
- User can select intro/station/success/outro preview states.
- User can select station to preview.
- Missing content is reported clearly.
- Other workspaces are unchanged.
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
Does Preview feel like the player perspective?
Is the phone/player preview central?
Can the user test Intro, Station, Success and Outro?
Are missing-content warnings clear?
Is this useful for client demos?
```
