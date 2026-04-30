# PR-37 — Meta Overview UI mit Tabs bauen

## Ziel

Im Tour Editor einen neuen Bereich **Tour Meta** einführen.

Dieser Bereich zeigt vier klar getrennte Tabs:

```txt
Öffentlich
Intern
Authoring
AI-Kontext
Story
```

Optional zusätzlich:

```txt
Checks
```

## UX-Ziel

Autor:innen sollen sofort verstehen:

- Was sieht der Enduser?
- Was ist nur intern?
- Was steuert Ton und Zielgruppe?
- Was steuert die KI?
- Was ist echte Story?

## Non-Goals

- Noch keine vollständige Feldbearbeitung
- Keine AI Calls
- Keine Migration
- Kein finaler visueller Feinschliff

## Neue Komponenten

Vorschlag:

```txt
src/components/tourMeta/TourMetaPanel.tsx
src/components/tourMeta/TourMetaTabs.tsx
src/components/tourMeta/MetaSectionCard.tsx
```

## Layout

```txt
Tour Editor
└── Tour Meta Panel
    ├── Header
    │   ├── Status
    │   ├── Readiness
    │   └── Quick Actions
    ├── Tabs
    │   ├── Öffentlich
    │   ├── Intern
    │   ├── Authoring
    │   ├── AI-Kontext
    │   └── Story
    └── Active Tab Content
```

## Header-Beispiel

```txt
Tour Meta
Status: Draft
Meta Readiness: 54%
Sprachen: DE aktiv · IT fehlt · EN fehlt

[Meta prüfen] [AI-Kontext Vorschau] [Fehlende Felder ergänzen]
```

## Tab-Beschreibung

### Öffentlich

Enduser-sichtbare Daten:

- Titel
- Untertitel
- Kurzbeschreibung
- Dauer
- Strecke
- Schwierigkeit
- Themen
- Zielgruppe
- Sprachen

### Intern

Nicht sichtbar:

- Status
- Owner
- Version
- Rechte
- Freigabe
- Wartung
- Client/Partner

### Authoring

Redaktionelle Steuerung:

- primäre Zielgruppe
- Tonalität
- Lesestufe
- Lernziele
- didaktische Modi
- Qualitätsregeln

### AI-Kontext

Interne AI-Regeln:

- Assistant-Rolle
- Core Idea
- bevorzugte Rätseltypen
- zu vermeidende Rätseltypen
- Guardrails
- Quellenpolitik
- Übersetzungsregeln

### Story

Getrennte Story-Ebene:

- Prämisse
- Figuren
- Storybogen
- wiederkehrende Motive
- Finale

## UI-Skizze

```txt
┌──────────────────────────────────────────────────────────────┐
│ Tour Meta · Draft · 54% ready                                │
│ [Meta prüfen] [AI-Kontext Vorschau]                          │
├──────────────────────────────────────────────────────────────┤
│ Öffentlich | Intern | Authoring | AI-Kontext | Story          │
├──────────────────────────────────────────────────────────────┤
│ Aktiver Tab                                                   │
│                                                              │
│ [Card] Basisdaten                                             │
│ [Card] Auswahlfelder                                          │
│ [Card] Hinweise / Checks                                      │
└──────────────────────────────────────────────────────────────┘
```

## Acceptance Criteria

- Tour Editor hat sichtbaren Tour-Meta-Bereich.
- Tabs wechseln lokale UI-Ansicht.
- Keine Vermischung von Story und AI-Kontext.
- Leere Meta-Blöcke rendern ohne Fehler.
- Bestehende Touren ohne Meta-Blöcke rendern mit Defaults.
- Aktiver Tab ist visuell eindeutig.

## Tests

- Component rendert mit leerer Tour.
- Component rendert mit vollständiger Tour.
- Tabwechsel funktioniert.
- Story und AI-Kontext erscheinen in getrennten Tabs.

## Codex Prompt

```txt
Implement PR-37.

Goal:
Add a Tour Meta panel with tabs: Public, Internal, Authoring, AI Context, Story.

Constraints:
- Use existing design system/components where possible.
- Do not implement full field editing yet.
- Use placeholder cards if needed.
- Must handle missing meta blocks safely.
- Keep AI Context and Story visually separated.
- Add basic tests for rendering and tab switching.

After implementation:
- Run typecheck/tests.
- Summarize files changed.
```
