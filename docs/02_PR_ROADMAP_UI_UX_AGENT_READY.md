# PR Roadmap – UI/UX Refactor mit Agent-Integration im Hinterkopf

## Phase 1 – Workflow-Shell stabilisieren

### PR-14 — Stabilize workflow shell

Ziel:

- Workflow-Tabs typisieren
- Workspaces einführen
- Studio rendert je nach aktivem Tab einen Workspace
- bestehendes Stations-/Map-Verhalten erhalten

Ergebnis:

```txt
PlanWorkspace
StoryWorkspace
StationsWorkspace
RouteWorkspace
PreviewWorkspace
```

---

### PR-15 — Make Plan a real dashboard

Ziel:

- Plan zeigt keine große Karte und keine Stations-Timeline mehr
- Plan wird Dashboard für Tour-Grunddaten und Readiness

Enthält:

- Tour Basics
- Audience & Theme
- Tour Goal
- Readiness
- Export Blockers
- Route Summary

---

### PR-16 — Add shared readiness/local-check model

Ziel:

- lokale Checks zentralisieren
- Grundlage für spätere Agenten schaffen

Beispiele:

```txt
missing title
missing GPS
missing intro
missing success message
station has no riddle
route not reviewed
language incomplete
```

---

## Phase 2 – UI kontextabhängig machen

### PR-17 — Add contextual left sidebar

Ziel:

Die linke Sidebar zeigt je nach Tab andere Informationen:

```txt
Plan      → Tour readiness
Story     → Story checklist
Stations  → selected station checklist
Route     → route checklist
Preview   → export readiness
```

---

### PR-18 — Add AssistantSlot scaffold

Ziel:

Ein wiederverwendbarer Platz für spätere Agenten.

Noch ohne API.

```txt
AssistantSlot
LocalCheckList
SuggestionPanel placeholder
```

---

### PR-19 — Build Story workspace

Ziel:

Story bekommt einen echten Arbeitsbereich:

- Storyline
- Tone of voice
- Characters / motifs
- Intro
- Outro
- Writing rules
- AssistantSlot vorbereitet

---

## Phase 3 – Stations und Preview entlasten

### PR-20 — Split Stations into Map/Edit modes

Ziel:

Stations wird nicht mehr überladen.

```txt
Stations → Map mode
Stations → Edit mode
```

Map mode:

- Karte groß
- Pins
- Stationen anlegen
- GPS/Position

Edit mode:

- Texte
- Rätsel
- Hints
- Success
- Preview optional

---

### PR-21 — Make Preview collapsible and workspace-aware

Ziel:

Phone Preview ist nicht immer dominant.

Regeln:

```txt
Plan      → keine oder kleine Preview
Story     → Intro/Outro Preview
Stations  → optional collapsible Preview
Route     → Preview hidden/collapsed
Preview   → große zentrale Preview
```

---

### PR-22 — Build Route workspace cleanup

Ziel:

Route wird eigener Arbeitsbereich:

- große Karte
- Segmentliste
- Reihenfolge
- Distanz-Warnungen
- Route AssistantSlot vorbereitet

---

### PR-23 — Build full Preview workspace

Ziel:

Preview als echter Testmodus:

- große Phone Preview
- Sprache wechseln
- Intro testen
- Station testen
- Hinweise öffnen
- Lösung simulieren
- Success/Outro prüfen
- Export readiness anzeigen

---

## Phase 4 – Agenten-Fundament

### PR-24 — Add mock suggestion system

Ziel:

Agenten-Vorschläge simulieren, noch ohne API.

```ts
type AssistantSuggestion = {
  id: string;
  title: string;
  reason: string;
  proposedChange: string;
  target: {
    section: StudioWorkflowSection;
    stationId?: string;
    field?: string;
  };
};
```

UI:

```txt
Apply
Dismiss
```

---

### PR-25 — Prepare AI provider boundary

Ziel:

Technische Grenze für spätere echte AI-API.

```txt
src/services/ai/
├─ aiClient.ts
├─ aiTypes.ts
├─ promptBuilder.ts
└─ mockAiClient.ts
```

Wichtig:

- kein API-Key im Browser
- später Backend/Edge Function/Serverless Endpoint verwenden

---

### PR-26 — Add real agent action contracts

Ziel:

Jeder Agent bekommt klare Actions:

```txt
plan.improveConcept
story.generateIntro
story.generateOutro
station.writeRiddle
station.shortenText
route.reviewFlow
preview.runQA
translation.translateMissing
```

Noch können sie mocken. Die Verträge stehen aber.

---

# Reihenfolge

```txt
PR-14 → PR-15 → PR-16 → PR-17 → PR-18
```

Erst danach größere Workspace-Umbauten.

Warum?

Weil zuerst das Nervensystem stabil sein muss, bevor man neue Reflexe einbaut. Sonst zuckt der digitale Tausendfüßer in alle Richtungen.
