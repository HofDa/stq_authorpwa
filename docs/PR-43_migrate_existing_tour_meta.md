# PR-43 — Migration vorhandener Tourdaten zu neuer Meta-Struktur

## Ziel

Bestehende Touren sollen beim Laden oder Speichern in die neue Meta-Struktur überführt werden, ohne Inhalte zu verlieren.

## Problem

Vorhandene Tourdaten haben wahrscheinlich Felder wie:

```txt
title
description
language
difficulty
duration
theme
story
```

Diese müssen sauber aufgeteilt werden.

## Zielstruktur

```txt
publicMeta
adminMeta
authoringMeta
aiContext
story
```

## Migrationsprinzip

- Keine Daten löschen.
- Unklare Felder konservativ in `publicMeta` oder `adminMeta.legacy` ablegen.
- Story nur dann in `story` verschieben, wenn sie eindeutig Story ist.
- AI Context nicht automatisch aus Story erzeugen.
- Migration idempotent machen: mehrfaches Ausführen verändert Daten nicht erneut.

## Neue Datei

```txt
src/domain/tourMeta/migrateTourMeta.ts
```

## Funktion

```ts
export function migrateTourMeta(tour: Tour): Tour {
  // returns a tour with publicMeta/adminMeta/authoringMeta/aiContext/story
}
```

## Mapping-Vorschlag

```txt
tour.title             -> publicMeta.title
tour.subtitle          -> publicMeta.subtitle
tour.description       -> publicMeta.shortDescription oder longDescription
tour.durationMinutes   -> publicMeta.durationMinutes
tour.distanceMeters    -> publicMeta.distanceMeters
tour.difficulty        -> publicMeta.difficulty.riddle oder walking, je nach bestehender Bedeutung
tour.themes            -> publicMeta.themes
tour.languages         -> publicMeta.languages
tour.story             -> story, nur wenn bestehendes Feld klar Story ist
```

## Legacy-Fallback

Für unklare Felder:

```ts
adminMeta.legacy = {
  originalFields: {...}
}
```

Nur falls sinnvoll und nicht zu schwergewichtig.

## Defaults

Wenn fehlen:

```txt
adminMeta.status = "draft"
adminMeta.schemaVersion = "1.0.0"
adminMeta.contentVersion = "0.1.0"
authoringMeta.tone = []
aiContext.guardrails = recommended defaults
```

## Empfohlene Default Guardrails

```txt
do_not_invent_gps
do_not_invent_history
mark_uncertain_facts
do_not_overwrite
separate_story_and_meta
```

## Acceptance Criteria

- Alte Touren laden ohne Crash.
- Neue Meta-Blöcke werden ergänzt.
- Bestehende sichtbare Daten bleiben sichtbar.
- Migration ist idempotent.
- Story wird nicht in AI-Kontext kopiert.
- AI-Kontext bekommt nur sichere Defaults, keine erfundene Story.

## Tests

```ts
describe("migrateTourMeta", () => {
  it("adds missing meta blocks", () => {});
  it("moves title into publicMeta", () => {});
  it("does not overwrite existing publicMeta", () => {});
  it("is idempotent", () => {});
  it("does not copy story into aiContext", () => {});
});
```

## Codex Prompt

```txt
Implement PR-43.

Goal:
Add safe migration for existing tour data to the new metadata structure.

Requirements:
- Add migrateTourMeta utility.
- Add default metadata for missing blocks.
- Preserve existing title/description/duration/themes where possible.
- Do not invent AI context from story.
- Add recommended AI guardrails only as safe defaults.
- Migration must be idempotent.
- Add tests.

After implementation:
- Run typecheck/tests.
- Summarize migration behavior and edge cases.
```
