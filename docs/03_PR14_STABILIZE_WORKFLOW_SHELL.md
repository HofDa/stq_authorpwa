# PR-14 — Stabilize Workflow Shell

## Ziel

Die UI bekommt ein stabiles Workflow-Gerüst:

```txt
Plan | Story | Stations | Route | Preview
```

Jeder Tab rendert einen eigenen Workspace.

## Problem

Aktuell werden zu viele Dinge gleichzeitig angezeigt.  
Der aktive Tab sagt zwar „Plan“, aber die Hauptfläche zeigt Karte, Stationen, Preview und Timeline zugleich.

Das erschwert:

- UX-Klarheit
- spätere Agenten-Integration
- saubere Code-Struktur
- gezielte PRs

## Non-goals

Dieser PR soll nicht:

- das Plan-Dashboard vollständig bauen
- echte Agenten integrieren
- echte AI-API einbauen
- Route/Preview komplett neu designen
- Datenmodell stark ändern
- neue Dependencies einführen

## Zielstruktur

Neue Dateien:

```txt
src/components/studio/workflow/workflowTypes.ts
src/components/studio/workflow/WorkflowNav.tsx
src/components/studio/workspaces/PlanWorkspace.tsx
src/components/studio/workspaces/StoryWorkspace.tsx
src/components/studio/workspaces/StationsWorkspace.tsx
src/components/studio/workspaces/RouteWorkspace.tsx
src/components/studio/workspaces/PreviewWorkspace.tsx
```

## Typ

```ts
export type StudioWorkflowSection =
  | 'plan'
  | 'story'
  | 'stations'
  | 'route'
  | 'preview';
```

## WorkflowNav Props

```ts
type WorkflowNavProps = {
  activeSection: StudioWorkflowSection;
  onSectionChange: (section: StudioWorkflowSection) => void;
};
```

Optional später:

```ts
statusBySection?: Partial<Record<StudioWorkflowSection, WorkflowStatus>>;
```

Aber nicht in diesem PR überbauen.

## Workspace-Prinzip

In `Studio.tsx`:

```tsx
switch (activeSection) {
  case 'plan':
    return <PlanWorkspace ... />;
  case 'story':
    return <StoryWorkspace ... />;
  case 'stations':
    return <StationsWorkspace ... />;
  case 'route':
    return <RouteWorkspace ... />;
  case 'preview':
    return <PreviewWorkspace ... />;
}
```

Für PR-14 dürfen die Workspaces teilweise noch Wrapper oder ruhige Platzhalter sein.

Wichtig:

- StationsWorkspace bewahrt aktuelle Map/Stations-Funktion.
- Noch keine großen Inhalte migrieren, wenn es riskant wird.
- Ziel ist Shell und Struktur, nicht Enddesign.

---

# Implementer Prompt

```txt
You are the Implementer Agent.

Implement PR-14: Stabilize the workflow shell.

Rules:
- Keep the PR small and focused.
- Do not implement future PRs.
- Do not add real AI API calls.
- Do not redesign unrelated screens.
- Do not change the data model unless explicitly required.
- Do not add new dependencies.
- Prefer composition over rewriting.
- Preserve existing behavior.
- Keep TypeScript strict and readable.
- Avoid nested interactive elements such as button inside button.

Tasks:
1. Add:
   src/components/studio/workflow/workflowTypes.ts

   Export:
   export type StudioWorkflowSection = 'plan' | 'story' | 'stations' | 'route' | 'preview';

2. Extract or clean up:
   src/components/studio/workflow/WorkflowNav.tsx

   Props:
   - activeSection
   - onSectionChange

   It should render the existing top workflow nav:
   Plan, Stations, Story, Route, Preview.

3. Add workspace wrapper components:
   src/components/studio/workspaces/PlanWorkspace.tsx
   src/components/studio/workspaces/StoryWorkspace.tsx
   src/components/studio/workspaces/StationsWorkspace.tsx
   src/components/studio/workspaces/RouteWorkspace.tsx
   src/components/studio/workspaces/PreviewWorkspace.tsx

4. Update Studio.tsx:
   - Keep active workflow state.
   - Render exactly one workspace based on activeSection.
   - Preserve the current Stations/Map behavior inside StationsWorkspace.
   - For Plan/Story/Route/Preview, use visually calm placeholder panels if full content is not ready.

5. Keep existing styling language:
   - paper-like cards
   - burgundy accents
   - rounded corners
   - no visual explosion

Acceptance criteria:
- Clicking Plan renders PlanWorkspace.
- Clicking Stations renders existing station/map workspace.
- Clicking Story renders StoryWorkspace.
- Clicking Route renders RouteWorkspace.
- Clicking Preview renders PreviewWorkspace.
- Existing station map does not break.
- No nested button warnings.
- No TypeScript errors.
- No new dependencies.

Run:
npm run typecheck
npm run lint
npm test
npm run build

Return:
- changed files
- summary
- commands run
- failures or warnings
- follow-up recommendations
```

---

# Manual Test Checklist

```txt
[ ] App starts
[ ] Plan tab clickable
[ ] Stations tab clickable
[ ] Story tab clickable
[ ] Route tab clickable
[ ] Preview tab clickable
[ ] Active tab is visually clear
[ ] Stations map still loads
[ ] Station cards still show
[ ] New station still works
[ ] Language switch still works
[ ] Field mode button still exists
[ ] Export button still exists
[ ] Browser console has no nested button warning
```

## Regression Risks

- accidentally hiding map in Stations
- losing selected station state
- duplicated active tab state
- CSS leaking into placeholders
- importing workspaces in a circular way
