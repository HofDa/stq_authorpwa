# PR-24 — Add Mock Suggestion System

## Ziel

Jetzt wird Agentenverhalten vorbereitet, aber weiterhin ohne echte AI-API.

Die App bekommt strukturierte Vorschläge:

```txt
Suggestion
├─ title
├─ reason
├─ proposed change
├─ target
├─ apply
└─ dismiss
```

Das ist die Grundlage für spätere echte Agenten.

## Erwartete Dateien

```txt
src/components/studio/assistant/assistantSuggestionTypes.ts
src/components/studio/assistant/SuggestionPanel.tsx
src/components/studio/assistant/mockSuggestions.ts
src/components/studio/assistant/useAssistantSuggestions.ts
```

## Implementer Prompt

```txt
You are the Implementer Agent.

Implement PR-24: Add mock suggestion system.

Context:
AssistantSlot exists, but agent behavior is not yet structured.
Before connecting a real AI provider, we need a safe local suggestion system.
Suggestions must be reviewable and user-controlled.

Goal:
Add a mock/local assistant suggestion system that can show structured suggestions and optionally apply safe local changes where already supported.

Rules:
- Do not call external APIs.
- Do not add dependencies.
- Do not use real AI.
- Do not auto-apply changes.
- Suggestions must always be user-approved.
- Keep this PR focused.
- Do not redesign all workspaces.
- Do not change unrelated business logic.

Tasks:
1. Add assistant suggestion types:
   src/components/studio/assistant/assistantSuggestionTypes.ts

   Suggested types:
   export type AssistantSuggestionStatus =
     | 'pending'
     | 'applied'
     | 'dismissed';

   export type AssistantSuggestionTarget = {
     section: StudioWorkflowSection;
     stationId?: string;
     field?: string;
   };

   export type AssistantSuggestion = {
     id: string;
     title: string;
     reason: string;
     proposedChange: string;
     target: AssistantSuggestionTarget;
     status: AssistantSuggestionStatus;
     canApply: boolean;
   };

2. Add SuggestionPanel:
   src/components/studio/assistant/SuggestionPanel.tsx

   It should show:
   - title
   - reason
   - proposed change
   - target label
   - Apply button if canApply
   - Dismiss button

3. Add mockSuggestions:
   src/components/studio/assistant/mockSuggestions.ts

   Provide local mock suggestion factories:
   - createMissingIntroSuggestion()
   - createMissingOutroSuggestion()
   - createWritingRulesSuggestion()
   - createStationNeedsRiddleSuggestion()
   - createRouteLongSegmentSuggestion()

4. Add useAssistantSuggestions:
   src/components/studio/assistant/useAssistantSuggestions.ts

   It should manage:
   - current suggestions
   - add suggestion
   - dismiss suggestion
   - mark applied

5. Integrate SuggestionPanel into AssistantSlot or relevant workspaces.
   Start with StoryWorkspace and PreviewWorkspace if simple.
   Do not over-integrate everywhere.

6. Apply behavior:
   If safe field update handlers already exist, support Apply for simple text fields.
   If not, keep Apply disabled and show:
   "Apply will be available once this field is editable here."

7. Mock assistant actions:
   In StoryWorkspace AssistantSlot:
   - "Suggest writing rules"
   - "Suggest intro structure"
   - "Suggest outro structure"

   In PreviewWorkspace:
   - "Find export blockers"

8. No real AI client.
   No API keys.
   No provider abstraction yet.

9. Keep styling consistent:
   - calm suggestion cards
   - clear Apply/Dismiss actions
   - no flashy chatbot UI

Acceptance criteria:
- AssistantSlot can show structured suggestions.
- Suggestions can be dismissed.
- Suggestions are never auto-applied.
- At least StoryWorkspace can generate a mock suggestion.
- PreviewWorkspace can show mock export-readiness suggestions if easy.
- No external API calls.
- No new dependencies.
- No TypeScript errors.
- No nested button warnings.

Run:
npm run typecheck
npm run lint
npm test
npm run build

Return:
- changed files
- summary
- failures
- suggested next PR
```

## UX Review Checklist

```txt
Are suggestions reviewable and calm?
Is Apply never automatic?
Is Dismiss obvious?
Does the system feel like assistant support, not chatbot noise?
Are disabled Apply states explained clearly?
```
