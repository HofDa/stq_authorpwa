# PR-40 — Authoring Meta Editor für redaktionelle Steuerung

## Ziel

Den Tab **Authoring** als redaktionelle Steuerzentrale bauen.

Hier wird festgelegt:

- Für wen ist die Tour?
- Wie soll sie klingen?
- Welche Lernziele verfolgt sie?
- Welche didaktischen Modi sollen bevorzugt werden?
- Welche redaktionellen Regeln gelten?

## Wichtig

Diese Daten sind **nicht Story** und **nicht direkt AI Prompt**, aber sie speisen später den AI-Kontext.

## Bereiche

```txt
Zielgruppe
Ton & Stil
Lesestufe
Lernziele
Didaktische Modi
Redaktionelle Regeln
Zu vermeiden
```

## Button-Auswahlmöglichkeiten

### Primäre Zielgruppe

Single Select:

```txt
[Familien]
[Kinder 6–8]
[Kinder 8–12]
[Schulklasse Grundschule]
[Schulklasse Mittelschule]
[Tourist:innen]
[Einheimische]
[Erwachsene]
[Fachpublikum]
```

### Sekundäre Zielgruppen

Multi Select:

```txt
[Familien] [Schulen] [Tourist:innen] [Einheimische] [Hotels] [Museen] [Vereine]
```

### Ton

Multi Select:

```txt
[spielerisch]
[leicht wissenschaftlich]
[abenteuerlich]
[mystisch]
[warmherzig]
[trockener Humor]
[klar & einfach]
[museal]
[seriös]
[poetisch]
```

### Zu vermeiden

Multi Select:

```txt
[zu kindisch]
[zu akademisch]
[zu werblich]
[belehrend]
[kitschig]
[zu lange Sätze]
[zu viele Ausrufezeichen]
[KI-Floskeln]
```

### Lesestufe

Single Select:

```txt
[sehr einfach]
[einfach]
[mittel]
[anspruchsvoll]
```

### Lernziele

Freitextliste mit Quick Add Buttons:

```txt
[Beobachtung fördern]
[Art / Objekt erkennen]
[Lokalen Ort neu wahrnehmen]
[Ökologischen Zusammenhang verstehen]
[Historischen Kontext verstehen]
[Verhalten ändern / Schutz fördern]
```

### Didaktische Modi

Multi Select:

```txt
[Beobachten]
[Zählen]
[Vergleichen]
[Einordnen]
[Muster erkennen]
[Kleine Entdeckung]
[Bewegung]
[Orientierung]
[Storyfortschritt]
[Fachfakt]
[Reflexion]
```

### Redaktionelle Regeln

Toggle/Buttons:

```txt
[Pro Station eine klare Handlung]
[Kurze Texte]
[Fachwissen von Story trennen]
[Keine langen Belehrungen]
[Jede Station braucht sichtbaren Anker]
[Jede Station braucht Spieleraktion]
[Hinweise von leicht bis stark]
[Erfolgstext mit Storyfortschritt]
```

## Datenbeispiel

```json
{
  "authoringMeta": {
    "primaryAudience": "families",
    "secondaryAudiences": ["schools_middle", "tourists"],
    "tone": ["playful", "scientific_light", "dry_humor"],
    "avoidTone": ["too_childish", "too_academic", "moralizing"],
    "readingLevel": "simple",
    "learningGoals": [
      "Haussperlinge als Kulturfolger kennenlernen",
      "Auf kleine Lebensräume im Dorf achten"
    ],
    "didacticModes": ["observation", "counting", "micro_discovery"],
    "editorialRules": [
      "short_texts",
      "one_clear_action_per_station",
      "separate_facts_from_story"
    ]
  }
}
```

## Acceptance Criteria

- Authoring Tab ist bearbeitbar.
- Zielgruppe ist als Button-Auswahl umgesetzt.
- Tonalität ist Multi-Select.
- Zu vermeidender Ton ist Multi-Select.
- Lesestufe ist Single-Select.
- Lernziele sind als Liste bearbeitbar.
- Didaktische Modi sind Multi-Select.
- Redaktionelle Regeln sind auswählbar.
- Keine Story-Texte in diesem Tab.
- Keine technischen Admin-Felder in diesem Tab.

## Tests

- Auswahl primärer Zielgruppe aktualisiert `authoringMeta.primaryAudience`.
- Multi-Select Ton fügt IDs hinzu/entfernt sie.
- Lesestufe bleibt Single Select.
- Lernziel kann hinzugefügt und entfernt werden.
- Authoring Editor verändert nicht `story`.

## Codex Prompt

```txt
Implement PR-40.

Goal:
Build AuthoringMetaEditor with strong button/chip-based controls for target audience, tone, reading level, learning goals, didactic modes and editorial rules.

Requirements:
- Use choice catalogs from PR-36.
- Prefer chips/buttons over free text.
- Keep story separate.
- Keep AI context separate.
- Store stable ids, not labels.
- Add tests for single-select and multi-select behavior.

After implementation:
- Run typecheck/tests.
- Summarize changed files.
```
