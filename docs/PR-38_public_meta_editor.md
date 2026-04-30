# PR-38 — Public Meta Editor mit Button-Auswahl

## Ziel

Den Tab **Öffentlich** als echten Editor ausbauen.

Dieser Bereich enthält alle Daten, die später für Enduser sichtbar sein können:

- Titel
- Untertitel
- Kurzbeschreibung
- Themen
- Zielgruppe
- Dauer
- Strecke
- Schwierigkeit
- Sprachen
- praktische Hinweise

## UX-Prinzip

Freitext nur dort, wo nötig.  
Alles andere über Buttons, Chips, Presets und schnelle Auswahl.

## Neue/erweiterte Komponenten

```txt
PublicMetaEditor.tsx
ChoiceChipGroup.tsx
MultiChoiceTagPicker.tsx
DifficultySelector.tsx
DurationDistanceFields.tsx
LanguageSelector.tsx
PracticalInfoSelector.tsx
```

## Felder

### Titel & Beschreibung

```txt
Titel DE / IT / EN
Untertitel DE / IT / EN
Kurzbeschreibung DE / IT / EN
Langbeschreibung optional
```

### Themen als Buttons

Nutze `themeChoices` aus PR-36:

```txt
[Biodiversität] [Vögel] [Bäume] [Pilze] [Boden] [Geschichte] [Architektur] ...
```

### Zielgruppe als Buttons

```txt
[Familien] [Kinder 6–8] [Kinder 8–12] [Schulen] [Tourist:innen] [Einheimische] ...
```

### Schwierigkeit

Getrennte Auswahl:

```txt
Geh-Schwierigkeit:
[sehr leicht] [leicht] [mittel] [schwer]

Rätsel-Schwierigkeit:
[sehr leicht] [leicht] [mittel] [schwer]
```

### Praktische Hinweise

Button-/Toggle-Liste:

```txt
[Kinderwagen geeignet]
[Rollstuhl geeignet]
[Hunde erlaubt]
[Öffis in der Nähe]
[Parkplatz in der Nähe]
[WC in der Nähe]
[Nur bei Tageslicht]
[Offline nutzbar]
[Internet nötig]
```

### Saison

```txt
[Frühling] [Sommer] [Herbst] [Winter] [Ganzjährig]
```

## Speichern

Jede Änderung aktualisiert `tour.publicMeta`.

## Datenbeispiel

```json
{
  "publicMeta": {
    "themes": ["birds", "family", "biodiversity"],
    "audience": ["families", "children_8_12"],
    "difficulty": {
      "walking": "easy",
      "riddle": "medium"
    },
    "practicalInfo": {
      "strollerFriendly": false,
      "dogsAllowed": true,
      "publicTransportNearby": true,
      "availableOffline": true
    }
  }
}
```

## Acceptance Criteria

- Public Meta Tab ist bearbeitbar.
- Themen per Buttons auswählbar.
- Zielgruppen per Buttons auswählbar.
- Geh- und Rätselschwierigkeit getrennt auswählbar.
- Praktische Hinweise per Toggle auswählbar.
- Freitextfelder für Titel/Beschreibungen bleiben möglich.
- Änderungen landen in `tour.publicMeta`.
- Keine internen AI-Felder im Public Tab.

## Tests

- Auswahl eines Themes aktualisiert `publicMeta.themes`.
- Deselektion entfernt Theme.
- Geh-Schwierigkeit und Rätsel-Schwierigkeit sind getrennt.
- Zielgruppen werden als IDs gespeichert, nicht als Labels.
- Public Meta rendert ohne AI-Kontext.

## Codex Prompt

```txt
Implement PR-38.

Goal:
Build PublicMetaEditor with button/chip-based editing.

Requirements:
- Use choice catalogs from PR-36.
- Add reusable ChoiceChipGroup if not present.
- Add multi-select themes and audiences.
- Add separate walking/riddle difficulty selectors.
- Add practical info toggles.
- Keep AI and internal fields out of this tab.
- Store stable ids in tour.publicMeta.
- Add tests for selecting/deselecting chips.

After implementation:
- Run typecheck and tests.
- Summarize changed files.
```
