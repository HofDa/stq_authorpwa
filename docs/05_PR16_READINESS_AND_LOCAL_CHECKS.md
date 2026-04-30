# PR-16 — Shared Readiness / Local Checks Model

## Ziel

Lokale Qualitätschecks zentralisieren.

Diese Checks sind die Grundlage für:

- Plan Dashboard
- linke Sidebar
- Export Readiness
- spätere Agenten
- QA/Preview
- Translation completeness

## Warum?

Agenten sollen später nicht frei herumraten.  
Sie sollen strukturierte lokale Befunde nutzen können:

```txt
Station 3 has no success message.
Italian intro is missing.
Route has not been reviewed.
```

Das funktioniert auch ohne AI-API und spart Kosten.

## Non-goals

Dieser PR soll nicht:

- echte AI integrieren
- Texte automatisch generieren
- Exportlogik komplett umbauen
- UI groß redesignen
- neue Dependencies hinzufügen

## Neue Dateien

```txt
src/components/studio/readiness/readinessTypes.ts
src/components/studio/readiness/stationReadiness.ts
src/components/studio/readiness/tourReadiness.ts
src/components/studio/readiness/exportReadiness.ts
```

## Typen

```ts
import type { StudioWorkflowSection } from '../workflow/workflowTypes';

export type ReadinessStatus = 'ready' | 'draft' | 'missing' | 'problem';

export type LocalCheckSeverity = 'info' | 'warning' | 'error';

export type LocalCheck = {
  id: string;
  label: string;
  status: ReadinessStatus;
  severity?: LocalCheckSeverity;
  message?: string;
  target?: {
    section: StudioWorkflowSection;
    stationId?: string;
    field?: string;
  };
};
```

## Station Readiness

Beispiele:

```txt
station has title
station has GPS
station has photo
station has story
station has riddle
station has success message
```

Funktion:

```ts
export function getStationReadiness(station: Station): LocalCheck[] {
  // ...
}
```

Oder, wenn Typen anders heißen, bestehende Typen verwenden.

## Tour Readiness

Beispiele:

```txt
tour has title
tour has at least one station
tour has intro
tour has outro
languages complete enough
```

Funktion:

```ts
export function getTourReadiness(draft: TourDraft): LocalCheck[] {
  // ...
}
```

## Export Readiness

Beispiele:

```txt
all stations have GPS
all stations have success messages
intro/outro exists
route reviewed
required languages complete
```

Funktion:

```ts
export function getExportReadiness(draft: TourDraft): LocalCheck[] {
  // ...
}
```

## Status Aggregation

Optional:

```ts
export function getWorstStatus(checks: LocalCheck[]): ReadinessStatus {
  if (checks.some((check) => check.status === 'problem')) return 'problem';
  if (checks.some((check) => check.status === 'missing')) return 'missing';
  if (checks.some((check) => check.status === 'draft')) return 'draft';
  return 'ready';
}
```

---

# Implementer Prompt

```txt
You are the Implementer Agent.

Implement PR-16: Add shared readiness/local-check model.

Context:
The UI is being refactored into workflow workspaces:
Plan → Story → Stations → Route → Preview.
We need shared local checks that can be used by dashboards, sidebars, export readiness and later assistant/agent integration.

Rules:
- Keep the PR small and focused.
- Do not add real AI API calls.
- Do not add new dependencies.
- Do not redesign unrelated screens.
- Do not change the data model unless absolutely required.
- Use existing app model types.
- Keep TypeScript strict and readable.
- Preserve existing behavior.

Tasks:
1. Add:
   src/components/studio/readiness/readinessTypes.ts
   src/components/studio/readiness/stationReadiness.ts
   src/components/studio/readiness/tourReadiness.ts
   src/components/studio/readiness/exportReadiness.ts

2. Define:
   ReadinessStatus = 'ready' | 'draft' | 'missing' | 'problem'
   LocalCheckSeverity = 'info' | 'warning' | 'error'
   LocalCheck with optional target:
   - section
   - stationId
   - field

3. Implement station checks:
   - title present
   - GPS present
   - photo/media present if available in model
   - story present
   - riddle present
   - success message present

4. Implement tour checks:
   - tour title present
   - at least one station
   - intro present if model supports it
   - outro present if model supports it
   - languages presence if model supports it

5. Implement export checks:
   - aggregate critical tour and station blockers
   - return LocalCheck[]

6. Update PlanWorkspace to use these shared functions instead of local duplicated blocker logic, if PlanWorkspace exists from PR-15.
   If this becomes too big, only export functions and leave UI integration for PR-17.

Acceptance criteria:
- Local checks are reusable and typed.
- No duplicated ad-hoc blocker logic where easy to replace.
- Missing fields are handled safely.
- No TypeScript errors.
- No UI regression.
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
[ ] Plan dashboard still works
[ ] Stations still work
[ ] Empty station does not crash checks
[ ] Station with missing GPS produces a check
[ ] Station with missing success text produces a check
[ ] Tour without title produces a check
[ ] Typecheck passes
[ ] No console errors
```

## Why this matters for agents

Später kann ein Agent auf Checks reagieren:

```txt
I found 5 issues:
- Station 2 has no success message
- Station 4 has no GPS
- The Italian outro is missing

Should I suggest fixes?
```

Das ist viel besser als ein Chatbot, der blind rät.
