# PR-44 — AI Prompt Payload aus Meta generieren

## Ziel

Aus `publicMeta`, `authoringMeta`, `aiContext` und optional `story` einen sauberen AI-Payload erzeugen.

Dieser Payload soll später für AI-assisted Tour-Erstellung verwendet werden.

## Wichtig

Dieser PR macht **keine AI API Calls**.  
Er erzeugt nur eine strukturierte Datenbasis für spätere Prompts.

## Neue Datei

```txt
src/domain/tourMeta/buildAIPromptContext.ts
```

## Funktion

```ts
export function buildAIPromptContext(tour: Tour): AIPromptContextPayload
```

## Payload-Struktur

```ts
export type AIPromptContextPayload = {
  role: string;
  publicBrief: {
    title?: string;
    subtitle?: string;
    shortDescription?: string;
    themes?: string[];
    audience?: string[];
    durationMinutes?: number;
    difficulty?: {
      walking?: string;
      riddle?: string;
    };
  };
  authoring: {
    primaryAudience?: string;
    secondaryAudiences?: string[];
    tone?: string[];
    avoidTone?: string[];
    readingLevel?: string;
    learningGoals?: string[];
    didacticModes?: string[];
    editorialRules?: string[];
  };
  aiRules: {
    coreIdea?: string;
    preferredRiddleTypes?: string[];
    avoidRiddleTypes?: string[];
    guardrails?: string[];
    sourcePolicy?: unknown;
    translationPolicy?: unknown;
    stationDraftRules?: unknown;
  };
  storyBrief?: {
    premise?: string;
    characters?: Array<{
      name: string;
      role?: string;
      personality?: string;
    }>;
    arc?: unknown;
  };
};
```

## Grundregel

Story darf nur als **StoryBrief** hinein, nicht als AI-Regel.

Meta darf nicht als Spielertext formuliert werden.

## Prompt Preview UI

Im AI-Kontext-Tab sollte angezeigt werden:

```txt
AI Payload Preview
├── Rolle
├── Public Brief
├── Authoring Rules
├── AI Guardrails
└── Story Brief
```

Optional als JSON-Preview für Debug:

```txt
[JSON anzeigen]
[Für Prompt kopieren]
```

## Guardrails im Payload

Guardrails sollen als IDs und optional als Labels verfügbar sein.

Beispiel:

```json
{
  "guardrails": [
    {
      "id": "do_not_invent_gps",
      "label": "Keine GPS-Koordinaten erfinden"
    }
  ]
}
```

## Acceptance Criteria

- AI Payload Builder existiert.
- Keine AI API Calls.
- Payload enthält Public Brief, Authoring und AI-Regeln.
- Story wird nur als StoryBrief eingebunden.
- Payload enthält keine Admin-Rechte-Felder, außer später ausdrücklich gewünscht.
- Preview im AI-Kontext-Tab zeigt Payload verständlich an.
- Funktion crasht nicht bei unvollständigen Tourdaten.

## Tests

```ts
describe("buildAIPromptContext", () => {
  it("builds payload from publicMeta and authoringMeta", () => {});
  it("includes guardrails", () => {});
  it("keeps story in storyBrief", () => {});
  it("does not include admin rights fields", () => {});
  it("handles missing meta blocks", () => {});
});
```

## Codex Prompt

```txt
Implement PR-44.

Goal:
Build a structured AI prompt/context payload from tour metadata.

Requirements:
- Add buildAIPromptContext utility.
- Include public brief, authoring rules, ai rules and optional story brief.
- Do not call AI APIs.
- Do not mix story into ai rules.
- Do not include admin/legal fields unless absolutely required.
- Add readable preview in AI Context tab.
- Add tests.

After implementation:
- Run typecheck/tests.
- Summarize payload structure.
```
