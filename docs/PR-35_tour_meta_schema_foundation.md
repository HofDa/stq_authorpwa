# PR-35 — Tour-Meta-Schema vorbereiten

## Ziel

Ein neues, klar getrenntes Metadatenmodell für Touren einführen:

```txt
publicMeta
adminMeta
authoringMeta
aiContext
story
```

Die bestehenden Tourdaten sollen nicht radikal umgebaut werden. Dieser PR legt nur die Grundlage.

## Problem

Aktuell besteht die Gefahr, dass folgende Dinge vermischt werden:

- sichtbare Tourbeschreibung
- interne Produktionsinfos
- redaktionelle Zielvorgaben
- AI-Anweisungen
- eigentliche Story

Das wird langfristig gefährlich, weil AI-assisted Erstellung sonst interne Hinweise als Storytext verwenden könnte.

## Non-Goals

- Kein vollständiger UI-Umbau
- Keine AI-Integration
- Keine Migration aller bestehenden Inhalte
- Keine Änderung der Station-Logik
- Keine Änderung am Exportformat, außer nötig für Typen/Defaults

## Neue Datenstruktur

Ergänze oder erweitere das Tour-Modell ungefähr so:

```ts
export type TourMetaStatus =
  | "idea"
  | "research"
  | "field_capture"
  | "draft"
  | "content_review"
  | "translation_review"
  | "playtest_ready"
  | "tested"
  | "approved"
  | "published"
  | "archived";

export type DifficultyLevel = "very_easy" | "easy" | "medium" | "hard";

export type TourPublicMeta = {
  title?: LocalizedString;
  subtitle?: LocalizedString;
  slug?: string;
  shortDescription?: LocalizedString;
  longDescription?: LocalizedString;
  themes?: string[];
  audience?: string[];
  durationMinutes?: number;
  distanceMeters?: number;
  difficulty?: {
    walking?: DifficultyLevel;
    riddle?: DifficultyLevel;
  };
  languages?: string[];
  defaultLanguage?: string;
};

export type TourAdminMeta = {
  status?: TourMetaStatus;
  owner?: string;
  schemaVersion?: string;
  contentVersion?: string;
  createdAt?: string;
  updatedAt?: string;
  reviewedBy?: string;
  approvedForPublishing?: boolean;
  rights?: {
    imageRightsCleared?: boolean;
    audioRightsCleared?: boolean;
    usesThirdPartyContent?: boolean;
    requiresMunicipalityApproval?: boolean;
  };
};

export type TourAuthoringMeta = {
  primaryAudience?: string;
  secondaryAudiences?: string[];
  tone?: string[];
  readingLevel?: string;
  learningGoals?: string[];
  editorialRules?: string[];
  didacticModes?: string[];
};

export type TourAIContext = {
  assistantRole?: string;
  coreIdea?: string;
  toneGuidelines?: string[];
  preferredRiddleTypes?: string[];
  avoidRiddleTypes?: string[];
  guardrails?: string[];
  stationDraftRules?: {
    requiredSections?: string[];
    maxCharactersPerStation?: number;
    hintsRequired?: number;
  };
  sourcePolicy?: {
    mayUseProvidedSourcesOnly?: boolean;
    mustMarkUnverifiedClaims?: boolean;
    neverInventLocalHistory?: boolean;
  };
};

export type TourStoryMeta = {
  premise?: string;
  characters?: Array<{
    name: string;
    role?: string;
    personality?: string;
  }>;
  arc?: {
    beginning?: string;
    middle?: string;
    ending?: string;
  };
};
```

## Implementation Steps

1. Suche das zentrale Tour-Modell.
2. Ergänze die neuen optionalen Meta-Blöcke.
3. Stelle sicher, dass bestehende Tourdaten weiterhin laden.
4. Ergänze Default-Werte beim Erstellen neuer Touren.
5. Ergänze Utility-Funktion:

```ts
export function createDefaultTourMeta(): {
  publicMeta: TourPublicMeta;
  adminMeta: TourAdminMeta;
  authoringMeta: TourAuthoringMeta;
  aiContext: TourAIContext;
  story: TourStoryMeta;
}
```

6. Nutze `schemaVersion: "1.0.0"` als Default.
7. Status neuer Touren: `"draft"` oder `"idea"`.

## Acceptance Criteria

- Bestehende Touren brechen nicht.
- Neue Touren erhalten leere, aber gültige Meta-Blöcke.
- `story` bleibt separat von `aiContext`.
- TypeScript kompiliert ohne neue Fehler.
- Keine UI-Veränderung außer falls nötig für Typfehler.

## Tests

Mindestens ergänzen:

```ts
describe("createDefaultTourMeta", () => {
  it("creates separated meta blocks", () => {});
  it("does not put story fields into aiContext", () => {});
  it("sets default schemaVersion", () => {});
});
```

## Codex Prompt

```txt
Implement PR-35.

Goal:
Introduce a separated tour metadata foundation with publicMeta, adminMeta, authoringMeta, aiContext and story.

Constraints:
- Keep backward compatibility.
- Do not rewrite the Station model.
- Do not build UI yet.
- Add default factory for new tours.
- Add small tests for default meta creation.
- Keep story and aiContext strictly separated.

After implementation:
- Run typecheck.
- Run tests if available.
- Summarize changed files.
```
