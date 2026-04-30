# PR-46 — Story Meta separat und sicher halten

## Ziel

Den Story-Tab so bauen, dass Storyinformationen gepflegt werden können, ohne mit AI-Kontext oder Public Meta zu verschmelzen.

## Warum?

Story ist Spielerlebnis und Erzählwelt.  
AI-Kontext ist Arbeitsanweisung.  
Public Meta ist Kataloginformation.

Diese Dinge dürfen nicht ineinanderlaufen.

## Story-Felder

```txt
Prämisse
Hauptkonflikt
Erzählversprechen
Figuren
Storybogen
Wiederkehrende Motive
Finale
```

## UI

```txt
Story
├── Prämisse
├── Figuren
│   ├── Name
│   ├── Rolle
│   ├── Persönlichkeit
│   └── Darf in Stationen verwendet werden?
├── Storybogen
│   ├── Anfang
│   ├── Mitte
│   └── Ende
├── Motive
└── Story-Regeln
```

## Figuren-Editor

Für jede Figur:

```txt
Name
Rolle
Persönlichkeit
Sprechstil
Darf neue Hinweise geben?
Darf in AI-Drafts verwendet werden?
```

## Story-Regeln als Buttons

```txt
[Jede Station bringt Story minimal weiter]
[Neue Figuren nur vorschlagen]
[Figuren konsistent halten]
[Fachwissen getrennt von Story]
[Finale nicht vorwegnehmen]
```

## Datenbeispiel

```json
{
  "story": {
    "premise": "Die Spieler folgen den Spuren einer Spatzenpiratenbande.",
    "characters": [
      {
        "name": "Kluge Klara",
        "role": "Anführerin",
        "personality": "scharfsinnig, mutig, leicht streng",
        "canBeUsedByAI": true
      }
    ],
    "arc": {
      "beginning": "Die Spieler entdecken erste Spuren.",
      "middle": "Jede Station enthüllt ein weiteres Mitglied.",
      "ending": "Die Spieler finden den geheimen Piratenbrunnen."
    },
    "storyRules": [
      "keep_characters_consistent",
      "do_not_reveal_finale_early",
      "separate_facts_from_story"
    ]
  }
}
```

## Acceptance Criteria

- Story Tab ist bearbeitbar.
- Story wird nicht in `aiContext` gespeichert.
- Figuren können ergänzt, bearbeitet und entfernt werden.
- Story-Regeln sind per Buttons auswählbar.
- AI darf Figuren nur verwenden, wenn später im Payload erlaubt.
- Public Meta bleibt unverändert.

## Tests

- Figur hinzufügen.
- Figur entfernen.
- Story-Regel toggeln.
- Story wird nicht in aiContext geschrieben.
- AI Payload nutzt Story nur als storyBrief.

## Codex Prompt

```txt
Implement PR-46.

Goal:
Build StoryMetaEditor and keep story strictly separated from AI context and public metadata.

Requirements:
- Add fields for premise, characters, arc and story rules.
- Add character list editor.
- Add story rule chips/buttons.
- Do not write story data into aiContext.
- Ensure AI prompt payload uses story only as storyBrief.
- Add tests for separation.

After implementation:
- Run typecheck/tests.
- Summarize changed files.
```
