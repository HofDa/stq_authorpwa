# PR-41 — AI Context Builder mit Guardrails & Button-Auswahl

## Ziel

Den Tab **AI-Kontext** als kontrollierten Builder für AI-assisted Tour-Erstellung bauen.

Die KI soll klare Regeln bekommen, aber Autor:innen sollen diese Regeln über verständliche UI-Elemente pflegen können.

## Wichtig

AI-Kontext ist **nicht Story**.  
AI-Kontext ist **Arbeitsanweisung an den Assistenten**.

## Bereiche

```txt
Assistant-Rolle
Core Idea
Ton-Guidelines
Bevorzugte Rätseltypen
Zu vermeidende Rätseltypen
Guardrails
Quellenpolitik
Übersetzungspolitik
Station-Draft-Regeln
Prompt-Vorschau
```

## UI-Aufbau

```txt
AI-Kontext
├── AI Briefing
├── Rätselpräferenzen
├── Guardrails
├── Quellen & Fakten
├── Übersetzungen
├── Station Draft Rules
└── Prompt Preview
```

## Felder

### Assistant-Rolle

Preset Buttons:

```txt
[Co-Autor für GPS-Rätseltouren]
[Redaktioneller Assistent]
[Didaktischer Assistent]
[Übersetzungsassistent]
[Qualitätsprüfer]
```

Freitext-Erweiterung möglich.

### Core Idea

Freitext, aber mit Quick Prompts:

```txt
[Aus Public Meta übernehmen]
[Aus Story-Prämisse ableiten]
[Aus Field Notes zusammenfassen]
```

### Ton-Guidelines

Aus `authoringMeta.tone` übernehmen, aber editierbar:

```txt
[spielerisch]
[leicht wissenschaftlich]
[trockener Humor]
[klar & einfach]
```

### Bevorzugte Rätseltypen

Multi Select:

```txt
[Zählen]
[Beobachtung]
[Symbole zuordnen]
[Einfacher Code]
[Richtung]
[Muster erkennen]
[Foto-Aufgabe]
[Kompass]
[QR]
[NFC]
```

### Zu vermeidende Rätseltypen

Multi Select:

```txt
[Google-Suche nötig]
[Privatgrund nötig]
[gefährliche Aktion]
[zu viel Lesen]
[reines Vorwissen]
[unklares Zählen]
[stark wetterabhängig]
```

### Guardrails

Multi Select mit empfohlenen Defaults:

```txt
[Keine GPS-Koordinaten erfinden]
[Keine lokalen historischen Fakten erfinden]
[Unsichere Fakten markieren]
[Bestehende Inhalte nicht ungefragt überschreiben]
[Story und Meta nicht vermischen]
[Keine Tiere stören]
[Kein Privatgrund]
[Keine gefährlichen Aktionen]
[Texte kurz halten]
```

### Quellenpolitik

Segmented Controls:

```txt
Fakten verwenden:
[Nur bereitgestellte Quellen]
[Quellen bevorzugen, Unsicheres markieren]
[Freie Recherche erlaubt]

Unsichere Fakten:
[blockieren]
[markieren]
[als Frage notieren]
```

### Übersetzungspolitik

```txt
[Übersetzungen als Draft markieren]
[Nie automatisch final freigeben]
[Ortsnamen nicht übersetzen]
[Eigennamen beibehalten]
[Kindgerechte Sprache erhalten]
```

### Station Draft Rules

```txt
Required Sections:
[Ankommen] [Beobachtung] [Wissen] [Rätsel] [Hints] [Erfolg]

Max Zeichen pro Station:
[900] [1200] [1500] [1800] [frei]

Hints:
[1] [2] [3] [4]

Pro Station:
[Sichtbarer Anker nötig]
[Spieleraktion nötig]
[Nächster Hinweis nötig]
[Keine Lösung im ersten Text]
```

## Prompt Preview

Am Ende soll eine nicht-editierbare Vorschau entstehen:

```txt
Diese Informationen gehen an den AI-Assistenten:
- Rolle
- Zielgruppe
- Ton
- Guardrails
- Rätselpräferenzen
- Quellenpolitik
- Station-Draft-Regeln
```

Wichtig: Die Preview ist kein Chat. Sie ist Kontrollansicht.

## Datenbeispiel

```json
{
  "aiContext": {
    "assistantRole": "Co-Autor für GPS-geführte Rätseltouren in Südtirol",
    "coreIdea": "Familienfreundliche Rätseltour über eine Spatzenpiratenbande in Schenna",
    "toneGuidelines": ["playful", "scientific_light", "dry_humor"],
    "preferredRiddleTypes": ["counting", "observation", "simple_code"],
    "avoidRiddleTypes": ["requires_google", "private_property", "dangerous_action"],
    "guardrails": [
      "do_not_invent_gps",
      "do_not_invent_history",
      "mark_uncertain_facts",
      "do_not_overwrite",
      "separate_story_and_meta"
    ],
    "sourcePolicy": {
      "mayUseProvidedSourcesOnly": true,
      "mustMarkUnverifiedClaims": true,
      "neverInventLocalHistory": true
    },
    "translationPolicy": {
      "markTranslationsAsDraft": true,
      "neverAutoApprove": true,
      "keepProperNames": true
    },
    "stationDraftRules": {
      "requiredSections": ["arrival", "observation", "knowledge", "riddle", "hints", "success"],
      "maxCharactersPerStation": 1500,
      "hintsRequired": 3
    }
  }
}
```

## Acceptance Criteria

- AI Context Tab ist bearbeitbar.
- Guardrails sind per Button auswählbar.
- Rätselpräferenzen sind per Button auswählbar.
- Quellenpolitik ist eindeutig auswählbar.
- Übersetzungspolitik ist auswählbar.
- Station-Draft-Regeln sind auswählbar.
- Prompt Preview zeigt verständlich, was später an AI gehen würde.
- Keine Story wird in AI-Kontext verschoben.
- AI-Kontext wird nicht an Enduser angezeigt.

## Tests

- Guardrail-Auswahl aktualisiert `aiContext.guardrails`.
- Preferred Riddle Types werden gespeichert.
- Avoid Riddle Types werden gespeichert.
- Quellenpolitik toggelt korrekt.
- Prompt Preview enthält Guardrails.
- Prompt Preview enthält keine Story-Felder außer explizit erlaubten Briefing-Zusammenfassungen.

## Codex Prompt

```txt
Implement PR-41.

Goal:
Build AIContextBuilder as a controlled UI for configuring AI-assisted tour creation.

Requirements:
- Use choice catalogs from PR-36.
- Add multi-select guardrails, preferred riddle types, avoid riddle types.
- Add source policy controls.
- Add translation policy controls.
- Add station draft rules controls.
- Add read-only AI prompt/context preview.
- Keep story separate.
- Do not call any AI API.
- Add tests for guardrail and riddle type selection.

After implementation:
- Run typecheck/tests.
- Summarize changed files.
```
