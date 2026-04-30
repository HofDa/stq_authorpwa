# PR-36 — Choice-Kataloge und Button-Auswahlmöglichkeiten einführen

## Ziel

Vordefinierte Auswahlmöglichkeiten für Autor:innen einführen.  
Der Meta-Editor soll später nicht aus 80 Freitextfeldern bestehen, sondern aus klaren Buttons/Chips.

## Warum?

Viele Metadaten sind besser als auswählbare Optionen:

- Zielgruppe
- Tonalität
- Lesestufe
- Themen
- Rätseltypen
- didaktische Modi
- Guardrails
- Sicherheitsregeln
- AI-Regeln
- Quellenpolitik

Das macht die UI schneller, konsistenter und AI-freundlicher.

## Non-Goals

- Noch kein vollständiger Editor
- Noch keine Persistenzlogik ändern
- Keine AI Calls
- Kein Design-Finishing

## Neue Datei

Vorschlag:

```txt
src/config/tourMetaChoices.ts
```

oder:

```txt
src/domain/tourMeta/choices.ts
```

## Choice-Struktur

```ts
export type ChoiceOption = {
  id: string;
  label: string;
  description?: string;
  category?: string;
  recommended?: boolean;
};
```

## Kataloge

### Zielgruppen

```ts
export const audienceChoices: ChoiceOption[] = [
  { id: "families", label: "Familien", description: "Gemischte Gruppe aus Kindern und Erwachsenen", recommended: true },
  { id: "children_6_8", label: "Kinder 6–8", description: "Sehr kurze Texte, einfache Aufgaben" },
  { id: "children_8_12", label: "Kinder 8–12", description: "Ideale Rätsel-Zielgruppe", recommended: true },
  { id: "teens", label: "Jugendliche", description: "Weniger kindliche Ansprache" },
  { id: "schools_primary", label: "Grundschule", description: "Didaktisch stark geführt" },
  { id: "schools_middle", label: "Mittelschule", description: "Mehr Fachinhalt möglich" },
  { id: "tourists", label: "Tourist:innen", description: "Ortskontext und Orientierung wichtig" },
  { id: "locals", label: "Einheimische", description: "Neue Perspektive auf bekannte Orte" },
  { id: "adults", label: "Erwachsene", description: "Weniger verspielt, mehr Kontext" },
  { id: "experts", label: "Fachpublikum", description: "Höhere fachliche Dichte" }
];
```

### Tonalität

```ts
export const toneChoices: ChoiceOption[] = [
  { id: "playful", label: "spielerisch", recommended: true },
  { id: "scientific_light", label: "leicht wissenschaftlich", recommended: true },
  { id: "mysterious", label: "mystisch" },
  { id: "adventurous", label: "abenteuerlich" },
  { id: "warm", label: "warmherzig" },
  { id: "dry_humor", label: "trockener Humor" },
  { id: "poetic", label: "poetisch" },
  { id: "clear_plain", label: "klar & einfach" },
  { id: "museum_like", label: "museal" },
  { id: "serious", label: "seriös" }
];
```

### Zu vermeidender Ton

```ts
export const avoidToneChoices: ChoiceOption[] = [
  { id: "too_childish", label: "zu kindisch" },
  { id: "too_academic", label: "zu akademisch" },
  { id: "too_marketing", label: "zu werblich" },
  { id: "too_many_exclamation_marks", label: "zu viele Ausrufezeichen" },
  { id: "generic_ai_phrases", label: "KI-Floskeln" },
  { id: "moralizing", label: "belehrend" },
  { id: "kitsch", label: "kitschig" },
  { id: "lore_overload", label: "zu viel Lore" }
];
```

### Themen

```ts
export const themeChoices: ChoiceOption[] = [
  { id: "biodiversity", label: "Biodiversität" },
  { id: "wild_bees", label: "Wildbienen" },
  { id: "birds", label: "Vögel" },
  { id: "trees", label: "Bäume" },
  { id: "fungi", label: "Pilze" },
  { id: "soil", label: "Boden" },
  { id: "water", label: "Wasser" },
  { id: "history", label: "Geschichte" },
  { id: "architecture", label: "Architektur" },
  { id: "myth", label: "Mythos" },
  { id: "local_culture", label: "Lokalkultur" },
  { id: "orientation", label: "Orientierung" }
];
```

### Rätseltypen

```ts
export const riddleTypeChoices: ChoiceOption[] = [
  { id: "counting", label: "Zählen", description: "Objekte am Ort zählen", recommended: true },
  { id: "observation", label: "Beobachtung", description: "Etwas Sichtbares erkennen", recommended: true },
  { id: "symbol_matching", label: "Symbole zuordnen", recommended: true },
  { id: "simple_code", label: "Einfacher Code", recommended: true },
  { id: "direction", label: "Richtung finden" },
  { id: "sequence", label: "Reihenfolge" },
  { id: "text_answer", label: "Textantwort" },
  { id: "number_answer", label: "Zahlantwort" },
  { id: "multiple_choice", label: "Multiple Choice" },
  { id: "photo_task", label: "Foto-Aufgabe" },
  { id: "qr", label: "QR-Code" },
  { id: "nfc", label: "NFC" },
  { id: "compass", label: "Kompass" },
  { id: "audio", label: "Audio-Hinweis" },
  { id: "pattern_recognition", label: "Muster erkennen" }
];
```

### Zu vermeidende Rätseltypen

```ts
export const avoidRiddleTypeChoices: ChoiceOption[] = [
  { id: "requires_google", label: "Google-Suche nötig" },
  { id: "private_property", label: "Privatgrund nötig" },
  { id: "dangerous_action", label: "gefährliche Aktion" },
  { id: "too_much_reading", label: "zu viel Lesen" },
  { id: "knowledge_only", label: "reines Vorwissen" },
  { id: "ambiguous_counting", label: "unklares Zählen" },
  { id: "weather_dependent", label: "stark wetterabhängig" }
];
```

### Didaktische Modi

```ts
export const didacticModeChoices: ChoiceOption[] = [
  { id: "observation", label: "Beobachten", recommended: true },
  { id: "counting", label: "Zählen" },
  { id: "compare", label: "Vergleichen" },
  { id: "classify", label: "Einordnen" },
  { id: "micro_discovery", label: "kleine Entdeckung", recommended: true },
  { id: "movement", label: "Bewegung" },
  { id: "orientation", label: "Orientierung" },
  { id: "story_progression", label: "Storyfortschritt" },
  { id: "scientific_fact", label: "Fachfakt" },
  { id: "reflection", label: "Reflexion" }
];
```

### AI Guardrails

```ts
export const aiGuardrailChoices: ChoiceOption[] = [
  { id: "do_not_invent_gps", label: "Keine GPS-Koordinaten erfinden", recommended: true },
  { id: "do_not_invent_history", label: "Keine lokalen historischen Fakten erfinden", recommended: true },
  { id: "mark_uncertain_facts", label: "Unsichere Fakten markieren", recommended: true },
  { id: "do_not_overwrite", label: "Bestehende Inhalte nicht ungefragt überschreiben", recommended: true },
  { id: "separate_story_and_meta", label: "Story und Meta nicht vermischen", recommended: true },
  { id: "no_private_property", label: "Kein Privatgrund" },
  { id: "no_dangerous_actions", label: "Keine gefährlichen Aktionen" },
  { id: "no_disturbing_animals", label: "Keine Tiere stören" },
  { id: "no_collecting_plants", label: "Keine Pflanzen entnehmen" },
  { id: "keep_text_short", label: "Texte kurz halten" }
];
```

### Sicherheitsregeln

```ts
export const safetyRuleChoices: ChoiceOption[] = [
  { id: "no_climbing", label: "Nicht klettern" },
  { id: "stay_on_paths", label: "Auf Wegen bleiben" },
  { id: "cross_roads_carefully", label: "Straßen vorsichtig queren" },
  { id: "adult_supervision", label: "Kinder nur mit Begleitung" },
  { id: "daylight_only", label: "Nur bei Tageslicht" },
  { id: "avoid_ice", label: "Nicht bei Eis/Schnee" },
  { id: "respect_nature", label: "Natur respektieren" },
  { id: "do_not_touch_nests", label: "Nester nicht berühren" }
];
```

## Acceptance Criteria

- Choice-Kataloge sind zentral definiert.
- Kataloge sind typisiert.
- Keine UI-Nutzung in diesem PR nötig.
- IDs sind stabil und maschinenlesbar.
- Labels sind deutsch.
- Empfehlungen sind über `recommended: true` markierbar.

## Tests

Ergänze einfache Tests:

```ts
describe("tourMetaChoices", () => {
  it("has unique ids per choice catalog", () => {});
  it("contains recommended guardrails", () => {});
  it("has labels for all choices", () => {});
});
```

## Codex Prompt

```txt
Implement PR-36.

Goal:
Create centralized, typed choice catalogs for tour meta editing.

Requirements:
- Add ChoiceOption type.
- Add catalogs for audiences, tones, avoid tones, themes, riddle types, avoid riddle types, didactic modes, AI guardrails and safety rules.
- Ensure ids are stable and machine-readable.
- Add tests for duplicate ids and missing labels.
- Do not build UI in this PR.
- Do not modify station editor behavior.

After implementation:
- Run typecheck and tests.
- Summarize added catalogs.
```
