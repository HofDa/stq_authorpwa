# PR-Paket: Tour-Metadaten, Authoring-Meta & AI-Kontext

Ziel dieses PR-Pakets ist ein sauberer Umbau des Tour-Metadatenbereichs im Author Studio.

Die zentrale Idee:

```txt
Tour
├── publicMeta       // sichtbar für Endnutzer:innen
├── adminMeta        // intern: Status, Team, Rechte, Freigabe
├── authoringMeta    // intern: Zielgruppe, Ton, Lernziele, Qualitätsregeln
├── aiContext        // intern: Regeln für AI-assisted Tour-Erstellung
└── story            // getrennt halten: Figuren, Storybogen, Erzählwelt
```

Wichtig: **Meta ist nicht Story.**  
Meta steuert Erstellung, Qualität, Tonalität, Freigabe und KI-Verhalten. Story beschreibt das Spielerlebnis.

## Empfohlene PR-Reihenfolge

1. **PR-35**: Tour-Meta-Schema vorbereiten
2. **PR-36**: Choice-Kataloge und Button-Auswahlmöglichkeiten einführen
3. **PR-37**: Meta Overview UI mit Tabs bauen
4. **PR-38**: Public Meta Editor bauen
5. **PR-39**: Admin Meta Editor bauen
6. **PR-40**: Authoring Meta Editor bauen
7. **PR-41**: AI Context Builder bauen
8. **PR-42**: Meta Readiness Checks & Validation
9. **PR-43**: Migration vorhandener Tourdaten
10. **PR-44**: AI Prompt Payload aus Meta generieren

## UX-Leitprinzipien

- Viele Dinge sollen per Button/Chip auswählbar sein, nicht über freie Textfelder.
- Freitext bleibt möglich, aber erst nach klaren Presets.
- AI-relevante Regeln müssen sichtbar, editierbar und prüfbar sein.
- Enduser-sichtbare und interne Felder dürfen nicht vermischt werden.
- Story-Felder bleiben separat.
- Keine KI darf vorhandene Inhalte still überschreiben.
- AI-Kontext ist Arbeitsanweisung, nicht Spielertext.

## Wiederverwendbare UI-Komponenten

Langfristig sinnvoll:

```txt
MetaSectionCard
ChoiceChipGroup
MultiChoiceTagPicker
RiskLevelSelector
LanguageCompletenessPanel
AudienceSelector
ToneSelector
RiddleTypeSelector
GuardrailSelector
ReadinessCheckList
AIPromptPreviewPanel
```

## Minimaler Zielzustand nach allen PRs

Autor:innen können im Tour Editor:

- sichtbare Tourdaten pflegen
- interne Projekt-/Workflow-Daten pflegen
- Zielgruppe, Ton, Lernziele und Regeln auswählen
- AI-Kontext durch Buttons konfigurieren
- bevorzugte Rätseltypen auswählen
- verbotene Muster auswählen
- Sicherheits- und Quellenregeln pflegen
- eine Vorschau sehen, welche Informationen an den AI-Agenten gehen
- Meta-Readiness prüfen
