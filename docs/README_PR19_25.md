# PR-19 bis PR-25: UI/UX-Refactor mit Agent-Integration

Dieses Paket enthält die nächsten PR-Spezifikationen für den Tour-Authoring-Editor.

## Ziel

Die UI soll von einem überladenen Arbeitsraum zu klar getrennten Workspaces werden:

```txt
Plan | Story | Stations | Route | Preview
```

Parallel wird die spätere Agenten-Integration vorbereitet, aber kontrolliert:

- zuerst UI-Struktur
- dann lokale Checks
- dann AssistantSlot
- dann Mock Suggestions
- dann AI Provider Boundary
- erst später echte API-Anbindung

## Enthaltene Dateien

```txt
README_PR19_25.md
PR19_BUILD_STORY_WORKSPACE.md
PR20_SPLIT_STATIONS_MAP_EDIT.md
PR21_PREVIEW_COLLAPSIBLE_WORKSPACE_AWARE.md
PR22_ROUTE_WORKSPACE_CLEANUP.md
PR23_FULL_PREVIEW_WORKSPACE.md
PR24_MOCK_SUGGESTION_SYSTEM.md
PR25_AI_PROVIDER_BOUNDARY.md
REVIEW_CHECKLIST_PR19_25.md
```

## Empfohlene Reihenfolge

```txt
PR-19 — Build Story Workspace
PR-20 — Split Stations into Map/Edit modes
PR-21 — Make Preview collapsible and workspace-aware
PR-22 — Build Route workspace cleanup
PR-23 — Build full Preview workspace
PR-24 — Add mock suggestion system
PR-25 — Prepare AI provider boundary
```

## Harte Grenzen bis PR-25

```txt
Keine echte AI-API
Keine API-Keys im Frontend
Kein großer Datenmodell-Umbau
Keine Drag/drop-Library
Keine automatische KI-Überschreibung von Inhalten
Kein Monster-PR
```

## Agenten-Arbeitsweise

Pro PR:

```txt
1. Architect Agent prüft Scope.
2. Implementer Agent setzt genau diesen PR um.
3. QA/Test Agent führt Typecheck, Lint, Tests und Build aus.
4. UX Reviewer prüft Flow, Überladung und Screenlogik.
5. Code Reviewer prüft Architektur, Imports, Seiteneffekte.
```

Wichtig:

> Nur ein Agent schreibt Code pro PR. Reviewer reviewen nur.
