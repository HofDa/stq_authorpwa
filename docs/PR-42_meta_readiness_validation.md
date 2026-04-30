# PR-42 — Meta Readiness Checks & Validation

## Ziel

Einen Meta-Readiness-Check einführen, der prüft, ob die Tour-Metadaten ausreichend gepflegt sind.

Das ist besonders wichtig für:

- Veröffentlichung
- Team-Review
- AI-assisted Erstellung
- Übersetzung
- spätere Wartung

## Bereiche

Checks für:

```txt
Public Meta
Admin Meta
Authoring Meta
AI Context
Story
Safety / Rights
```

## Neue Utility-Datei

```txt
src/domain/tourMeta/readiness.ts
```

## Check-Typ

```ts
export type MetaReadinessSeverity = "info" | "warning" | "error";

export type MetaReadinessCheck = {
  id: string;
  label: string;
  description?: string;
  severity: MetaReadinessSeverity;
  passed: boolean;
  path?: string;
  group: "public" | "admin" | "authoring" | "ai" | "story" | "rights" | "safety";
};
```

## Beispiel-Checks

### Public Meta

```txt
Titel vorhanden
Kurzbeschreibung vorhanden
Dauer gesetzt
Strecke gesetzt
Zielgruppe gesetzt
Mindestens ein Thema gewählt
Sprachen definiert
```

### Admin Meta

```txt
Status gesetzt
Owner gesetzt
Content Version gesetzt
Freigabe noch nicht versehentlich true bei Draft
```

### Authoring Meta

```txt
Primäre Zielgruppe gesetzt
Ton gesetzt
Lesestufe gesetzt
Mindestens ein Lernziel
Mindestens eine redaktionelle Regel
```

### AI Context

```txt
Assistant Role gesetzt
Core Idea gesetzt
Mindestens drei Guardrails
Keine GPS-Erfindung verboten
Keine Story-Meta-Vermischung verboten
Bevorzugte Rätseltypen gesetzt
Zu vermeidende Rätseltypen gesetzt
Quellenpolitik gesetzt
```

### Story

```txt
Story-Prämisse gesetzt
Storybogen grob gesetzt
Figuren optional, aber falls vorhanden mit Namen
```

### Rechte / Sicherheit

```txt
Bildrechte geprüft
Gemeindefreigabe Status gesetzt
Privatgrund geprüft
Sicherheitsregeln gesetzt
```

## Readiness Score

Berechne einen einfachen Score:

```ts
score = passedRequiredChecks / requiredChecks
```

Oder:

```ts
error = blockiert Publishing
warning = senkt Score
info = Hinweis
```

## UI

Im Meta Panel Header:

```txt
Meta Readiness: 68%
[3 Errors] [7 Warnings]
```

Zusätzlich Tab **Checks** oder rechte Side Panel:

```txt
Public Meta
✓ Titel vorhanden
! Kurzbeschreibung fehlt

AI Context
✓ Keine GPS-Koordinaten erfinden
! Quellenpolitik fehlt
✕ Mindestens 3 Guardrails nötig
```

Jeder Check sollte auf den passenden Tab/Feldbereich verweisen können.

## Acceptance Criteria

- Readiness Utility existiert.
- Checks sind gruppiert.
- Score wird berechnet.
- Meta Panel zeigt Score.
- Fehler/Warnungen sind sichtbar.
- Checks laufen auch bei unvollständigen Tourdaten ohne Crash.
- AI Context Checks prüfen zentrale Guardrails.

## Tests

```ts
describe("evaluateTourMetaReadiness", () => {
  it("does not crash with empty tour", () => {});
  it("requires public title", () => {});
  it("requires ai guardrails for AI readiness", () => {});
  it("flags missing source policy", () => {});
  it("computes score between 0 and 100", () => {});
});
```

## Codex Prompt

```txt
Implement PR-42.

Goal:
Add metadata readiness validation for Tour Meta.

Requirements:
- Add readiness utility with typed checks.
- Cover publicMeta, adminMeta, authoringMeta, aiContext, story, rights and safety.
- Compute score between 0 and 100.
- Show readiness score in Tour Meta Panel.
- Add checks view or side panel.
- Checks must not crash on missing data.
- Add tests for empty and partial metadata.

After implementation:
- Run typecheck/tests.
- Summarize changed files and important checks.
```
