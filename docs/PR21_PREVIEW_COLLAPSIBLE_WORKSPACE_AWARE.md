# PR-21 — Make Preview Collapsible and Workspace-Aware

## Ziel

Die Phone Preview soll nicht dauerhaft alles dominieren.  
Sie wird kontextabhängig:

```txt
Plan     → keine oder kleine Preview
Story    → Intro/Outro Preview
Stations → optional einklappbar
Route    → versteckt oder stark reduziert
Preview  → zentrale Hauptansicht
```

## Erwartete Dateien

```txt
src/components/studio/preview/PreviewPanel.tsx
src/components/studio/preview/PreviewToggle.tsx
src/components/studio/preview/previewTypes.ts
```

Möglicherweise geändert:

```txt
src/components/studio/Studio.tsx
src/components/studio/workspaces/PlanWorkspace.tsx
src/components/studio/workspaces/StoryWorkspace.tsx
src/components/studio/workspaces/StationsWorkspace.tsx
src/components/studio/workspaces/RouteWorkspace.tsx
src/components/studio/workspaces/PreviewWorkspace.tsx
```

## Implementer Prompt

```txt
You are the Implementer Agent.

Implement PR-21: Make Preview collapsible and workspace-aware.

Context:
The app currently shows a phone/tourist preview in a way that can dominate the UI, even when the user is working in Plan, Route or Stations. The preview is useful, but it must become contextual and collapsible.

Goal:
Create a reusable PreviewPanel that can be shown, hidden, collapsed or emphasized depending on the active workspace.

Rules:
- Keep this PR focused.
- Do not redesign all workspaces.
- Do not add dependencies.
- Do not call external APIs.
- Do not break existing preview rendering.
- Do not remove preview functionality.
- Preserve existing data flow.

Tasks:
1. Create or refactor a reusable PreviewPanel:
   src/components/studio/preview/PreviewPanel.tsx

2. Create a small PreviewToggle if needed:
   src/components/studio/preview/PreviewToggle.tsx

3. Add preview display modes:
   type PreviewDisplayMode =
     | 'hidden'
     | 'collapsed'
     | 'side'
     | 'main';

4. Apply preview behavior by workspace:
   - Plan: hidden or collapsed
   - Story: side preview for intro/outro if available
   - Stations: side preview, collapsible
   - Route: hidden or collapsed
   - Preview: main preview

5. Add a "Show preview" / "Hide preview" action where relevant.
   Keep labels short.

6. If preview is collapsed:
   Show a small tab or button:
   "Preview"

7. If preview is hidden:
   Do not reserve large empty space.

8. PreviewWorkspace should use main mode, where the phone preview is central.

9. Keep visual style consistent:
   - paper UI
   - burgundy accents
   - rounded cards
   - calm transitions if existing CSS supports it
   - no new animation library

10. Make layout responsive:
    - On small screens, preview should not appear as a cramped side panel.
    - Prefer full-width stacked preview or hidden/collapsed state.

Acceptance criteria:
- Preview no longer dominates Plan and Route.
- Stations can show/hide the preview.
- Story can show a small contextual preview.
- Preview tab shows a large central preview.
- Existing preview content still renders.
- No data loss.
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
Does Preview feel useful, not intrusive?
Is it hidden/collapsed where it is secondary?
Is it central in the Preview workspace?
Does mobile avoid cramped side panels?
Does the toggle wording feel clear?
```
