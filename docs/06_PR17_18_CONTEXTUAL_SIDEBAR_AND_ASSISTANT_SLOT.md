# PR-17 und PR-18 — Contextual Sidebar + AssistantSlot

Dieses File beschreibt zwei aufeinanderfolgende PRs.

---

# PR-17 — Add Contextual Left Sidebar

## Ziel

Die linke Sidebar passt sich dem aktiven Workspace an.

Aktuell wirkt die Sidebar wie eine Mischung aus Tourstatus und Stationsstatus.  
Besser:

```txt
Plan      → Tour readiness
Story     → Story checklist
Stations  → Selected station checklist
Route     → Route checklist
Preview   → Export readiness
```

## Non-goals

- keine AI-API
- keine Vorschlagslogik
- keine großen Workspace-Umbauten
- keine neuen Dependencies

## Neue/Geänderte Dateien

```txt
src/components/studio/sidebar/StudioSidebar.tsx
src/components/studio/sidebar/PlanSidebar.tsx
src/components/studio/sidebar/StorySidebar.tsx
src/components/studio/sidebar/StationsSidebar.tsx
src/components/studio/sidebar/RouteSidebar.tsx
src/components/studio/sidebar/PreviewSidebar.tsx
```

Alternativ, wenn das zu groß ist:

```txt
src/components/studio/sidebar/StudioSidebar.tsx
```

mit internen kleinen Render-Funktionen.

## Implementer Prompt PR-17

```txt
You are the Implementer Agent.

Implement PR-17: Add contextual left sidebar.

Context:
The app has workflow sections:
Plan → Story → Stations → Route → Preview.
The left sidebar should adapt to the active workflow section and show relevant readiness/checklist information.

Rules:
- Keep the PR small.
- Do not add real AI API calls.
- Do not add new dependencies.
- Do not redesign all workspaces.
- Preserve existing station behavior.
- Use shared readiness/local-check functions if available.
- If shared readiness does not exist yet, keep simple local placeholders and do not overbuild.

Tasks:
1. Add or update StudioSidebar so it receives:
   - activeSection
   - draft/tour data
   - selectedStation if available

2. Render contextual sidebar content:
   Plan:
   - tour readiness
   - export blockers summary

   Story:
   - storyline status
   - intro status
   - outro status
   - tone/rules status

   Stations:
   - selected station title
   - GPS status
   - photo status
   - story status
   - riddle status
   - success status
   - open full station editor button if already supported

   Route:
   - station count
   - route reviewed status
   - distance status
   - long segment placeholder if not yet implemented

   Preview:
   - export readiness
   - language completeness placeholder
   - preview tested placeholder

3. Keep styling consistent with existing paper/burgundy UI.

Acceptance criteria:
- Sidebar content changes when switching workflow tabs.
- Stations sidebar still supports selected station workflow.
- No behavior regression.
- No TypeScript errors.
- No console warnings.

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
```

---

# PR-18 — Add AssistantSlot Scaffold

## Ziel

Ein wiederverwendbarer UI-Platz für spätere Agenten.

Noch ohne echte AI.

Der AssistantSlot soll in jedem Workspace verwendet werden können:

```txt
Plan      → Plan assistant
Story     → Story assistant
Stations  → Station assistant
Route     → Route assistant
Preview   → QA assistant
```

## Non-goals

- keine API
- keine OpenAI-Anbindung
- keine echten Prompts an Server senden
- keine Daten automatisch überschreiben
- keine komplexe Suggestion Engine

## Neue Dateien

```txt
src/components/studio/assistant/assistantTypes.ts
src/components/studio/assistant/AssistantSlot.tsx
src/components/studio/assistant/LocalCheckList.tsx
src/components/studio/assistant/SuggestionPanel.tsx
```

## Typen

```ts
import type { StudioWorkflowSection } from '../workflow/workflowTypes';
import type { LocalCheck } from '../readiness/readinessTypes';

export type AssistantActionId =
  | 'plan.improveConcept'
  | 'story.createStoryline'
  | 'story.refineIntro'
  | 'station.reviewStation'
  | 'station.createRiddle'
  | 'route.reviewRoute'
  | 'preview.runQA'
  | 'translation.checkCompleteness';

export type AssistantAction = {
  id: AssistantActionId;
  label: string;
  description?: string;
  disabled?: boolean;
};

export type AssistantSuggestion = {
  id: string;
  title: string;
  reason: string;
  proposedChange?: string;
  target?: {
    section: StudioWorkflowSection;
    stationId?: string;
    field?: string;
  };
};
```

## AssistantSlot Props

```ts
type AssistantSlotProps = {
  section: StudioWorkflowSection;
  title: string;
  description?: string;
  checks?: LocalCheck[];
  actions?: AssistantAction[];
  suggestions?: AssistantSuggestion[];
  disabled?: boolean;
};
```

## Verhalten in PR-18

- zeigt Titel und Beschreibung
- zeigt lokale Checks, falls vorhanden
- zeigt Actions als deaktivierte oder lokale Mock-Buttons
- zeigt Hinweis:

```txt
Local checks only. AI provider is not connected yet.
```

## Implementer Prompt PR-18

```txt
You are the Implementer Agent.

Implement PR-18: Add AssistantSlot scaffold.

Context:
The app will later have assistant/agent integration per workflow section.
For now we only need reusable UI scaffolding without real AI API calls.

Rules:
- No real AI API.
- No network calls.
- No API keys.
- No data overwriting.
- No new dependencies.
- Keep it small and reusable.
- Use existing visual style.

Tasks:
1. Add:
   src/components/studio/assistant/assistantTypes.ts
   src/components/studio/assistant/AssistantSlot.tsx
   src/components/studio/assistant/LocalCheckList.tsx
   src/components/studio/assistant/SuggestionPanel.tsx

2. Define typed assistant actions and suggestions.

3. AssistantSlot should render:
   - title
   - description
   - local checks
   - available actions
   - suggestions, if provided
   - small note that only local checks are active for now

4. Integrate AssistantSlot minimally in PlanWorkspace.
   If PlanWorkspace does not exist yet, integrate it in the most appropriate existing workflow placeholder.

5. Do not add real generation behavior.
   Buttons may be disabled or call local no-op handlers.

Acceptance criteria:
- AssistantSlot renders in Plan workspace.
- No network/API logic exists.
- No secrets or API keys are introduced.
- Types are reusable for later PRs.
- UI is calm and does not dominate the screen.
- No TypeScript errors.

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
```

---

# Warum diese zwei PRs wichtig sind

PR-17 macht die UI kontextsensitiv.  
PR-18 reserviert den Platz für Agenten.

Dadurch wird die spätere Integration nicht angeklebt, sondern organisch eingebaut.  
Keine digitale Klette, sondern Mykorrhiza.
