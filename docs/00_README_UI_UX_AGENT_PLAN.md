# SouthTyrolQuests Author UI/UX Refactor – Agenten-Plan

## Ziel

Der Author-Editor soll von einer überladenen Oberfläche zu einem klaren Produktionswerkzeug werden:

```txt
Plan → Story → Stations → Route → Preview
```

Jeder Bereich beantwortet genau eine Hauptfrage:

```txt
Plan      → Was bauen wir?
Story     → Warum ist es spannend?
Stations  → Was passiert vor Ort?
Route     → Funktioniert der Weg?
Preview   → Funktioniert es für Spieler:innen?
```

## Grundprinzip

Nicht alles gleichzeitig zeigen.  
Stattdessen rendert jeder Workflow-Tab einen eigenen Workspace:

```txt
PlanWorkspace
StoryWorkspace
StationsWorkspace
RouteWorkspace
PreviewWorkspace
```

## Programmier-Agenten-Setup

Arbeite pro PR mit getrennten Rollen:

```txt
Architect Agent
→ plant Scope, Grenzen, Akzeptanzkriterien

Implementer Agent
→ setzt genau diesen PR um

UX Reviewer Agent
→ prüft Bedienlogik, Screenshot, Überladung, Begriffe

Code Reviewer Agent
→ prüft Architektur, TypeScript, Seiteneffekte

QA/Test Agent
→ prüft Typecheck, Lint, Tests, Build und manuelle Flows
```

Wichtig:

> Pro PR schreibt nur ein Agent Code. Die anderen reviewen.

## Immer gültige Regeln für Implementer Agents

Kopiere diesen Block in jeden Implementer-Prompt:

```txt
Rules:
- Keep the PR small and focused.
- Do not implement future PRs.
- Do not add real AI API calls.
- Do not redesign unrelated screens.
- Do not change the data model unless explicitly required.
- Do not add new dependencies unless explicitly requested.
- Prefer composition over rewriting.
- Preserve existing behavior.
- Keep TypeScript strict and readable.
- Avoid nested interactive elements such as button inside button.
- Run typecheck, lint, tests and build after implementation.
```

## Zielarchitektur

```txt
src/components/studio/
├─ Studio.tsx
├─ workflow/
│  ├─ WorkflowNav.tsx
│  └─ workflowTypes.ts
├─ workspaces/
│  ├─ PlanWorkspace.tsx
│  ├─ StoryWorkspace.tsx
│  ├─ StationsWorkspace.tsx
│  ├─ RouteWorkspace.tsx
│  └─ PreviewWorkspace.tsx
├─ assistant/
│  ├─ AssistantSlot.tsx
│  ├─ SuggestionPanel.tsx
│  ├─ LocalCheckList.tsx
│  └─ assistantTypes.ts
└─ readiness/
   ├─ tourReadiness.ts
   ├─ stationReadiness.ts
   └─ exportReadiness.ts
```

## Warum diese Struktur?

Weil die spätere Agenten-Integration dann nicht als Chatbot „daneben klebt“, sondern pro Arbeitsbereich sinnvoll eingebettet wird:

```txt
Plan      → Plan Assistant
Story     → Story Assistant
Stations  → Station Assistant
Route     → Route Assistant
Preview   → QA / Export Assistant
```

Die erste Phase ist aber bewusst ohne echte AI-API.  
Zuerst: UI-Struktur, lokale Checks, Vorschlagsmodell.  
Danach: Provider Boundary und echte Agent Actions.
