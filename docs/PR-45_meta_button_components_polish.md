# PR-45 — Reusable Button/Chip Components für Meta Editor

## Ziel

Die vielen Auswahlmöglichkeiten im Meta-Bereich sollen über wiederverwendbare Komponenten laufen, nicht über überall duplizierte Button-Logik.

## Problem

Wenn jeder Tab eigene Button-Gruppen baut, entsteht schnell Chaos:

- uneinheitliches Verhalten
- uneinheitliche Farben
- Single-/Multi-Select Fehler
- IDs und Labels werden vermischt
- Tests werden mühsam

## Komponenten

```txt
ChoiceChip
ChoiceChipGroup
MultiChoiceTagPicker
SegmentedChoice
BooleanToggleCard
PresetButtonGrid
EditableListField
```

## API-Vorschlag

### ChoiceChipGroup

```tsx
<ChoiceChipGroup
  label=\"Tonalität\"
  options={toneChoices}
  value={selectedTone}
  onChange={setSelectedTone}
  mode=\"multi\"
/>
```

Props:

```ts
type ChoiceChipGroupProps = {
  label?: string;
  description?: string;
  options: ChoiceOption[];
  value: string | string[];
  onChange: (nextValue: string | string[]) => void;
  mode: "single" | "multi";
  showDescriptions?: boolean;
  showRecommended?: boolean;
};
```

### SegmentedChoice

```tsx
<SegmentedChoice
  label=\"Lesestufe\"
  options={readingLevelChoices}
  value={readingLevel}
  onChange={setReadingLevel}
/>
```

### BooleanToggleCard

```tsx
<BooleanToggleCard
  label=\"Bildrechte geklärt\"
  description=\"Sind alle verwendeten Bilder rechtlich freigegeben?\"
  checked={imageRightsCleared}
  onChange={setImageRightsCleared}
/>
```

### EditableListField

Für Lernziele oder Open Questions:

```tsx
<EditableListField
  label=\"Lernziele\"
  value={learningGoals}
  onChange={setLearningGoals}
  presets={learningGoalPresets}
/>
```

## UX-Regeln

- Selected Chips sind klar sichtbar.
- Recommended Options bekommen Badge.
- Multi-Select zeigt Anzahl.
- Single-Select erlaubt immer nur einen Wert.
- IDs werden gespeichert, Labels angezeigt.
- Tastaturbedienung nicht vergessen.

## Acceptance Criteria

- Wiederverwendbare Komponenten existieren.
- PublicMetaEditor, AuthoringMetaEditor und AIContextBuilder nutzen sie.
- Single-Select und Multi-Select sind zuverlässig.
- Recommended Badge wird unterstützt.
- Es werden IDs gespeichert, nicht Labels.
- Komponenten sind testbar.

## Tests

```ts
describe("ChoiceChipGroup", () => {
  it("selects one item in single mode", () => {});
  it("toggles multiple items in multi mode", () => {});
  it("stores ids instead of labels", () => {});
  it("renders recommended badge", () => {});
});
```

## Codex Prompt

```txt
Implement PR-45.

Goal:
Extract reusable choice/button components for the Tour Meta editor.

Requirements:
- Add ChoiceChipGroup with single and multi mode.
- Add SegmentedChoice or reuse ChoiceChipGroup in single mode.
- Add BooleanToggleCard.
- Add EditableListField if useful.
- Refactor existing meta editors to use these components.
- Preserve current behavior.
- Add component tests.

After implementation:
- Run typecheck/tests.
- Summarize refactors.
```
