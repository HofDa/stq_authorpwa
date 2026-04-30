# PR-25 — Prepare AI Provider Boundary

## Ziel

Jetzt wird die technische Grenze für echte AI vorbereitet.  
Noch **keine echte Produktiv-Anbindung mit API-Key im Browser**.

Wichtig:

> Kein OpenAI-Key oder anderer Provider-Key direkt im Frontend.

Frontend ruft später nur dein eigenes Backend, eine Serverless Function oder einen Edge Endpoint auf.

## Erwartete Dateien

```txt
src/services/ai/aiTypes.ts
src/services/ai/aiClient.ts
src/services/ai/mockAiClient.ts
src/services/ai/promptBuilder.ts
src/services/ai/agentActions.ts
src/services/ai/aiConfig.ts
```

Optional:

```txt
src/services/ai/browserAiClient.ts
```

Aber nur als Stub, nicht mit echten Secrets.

## Implementer Prompt

```txt
You are the Implementer Agent.

Implement PR-25: Prepare AI provider boundary.

Context:
The app now has workspaces, AssistantSlot and a mock suggestion system.
Before connecting real AI, we need a clean provider boundary so the UI does not depend directly on a specific AI provider.

Goal:
Add a provider-agnostic AI service layer with types, mock client and prompt/action contracts.
Do not call real external APIs yet.

Rules:
- Do not add dependencies.
- Do not call OpenAI or any external AI API.
- Do not put API keys in the frontend.
- Do not implement backend/serverless in this PR.
- Keep all real provider calls disabled or mocked.
- Keep this PR focused on boundaries, types and contracts.
- Existing mock suggestion system must continue to work.

Tasks:
1. Add AI types:
   src/services/ai/aiTypes.ts

   Suggested types:
   export type AiAgentId =
     | 'plan'
     | 'story'
     | 'station'
     | 'route'
     | 'preview'
     | 'translation';

   export type AiActionId =
     | 'plan.improveConcept'
     | 'story.generateIntro'
     | 'story.generateOutro'
     | 'story.suggestWritingRules'
     | 'station.writeStory'
     | 'station.writeRiddle'
     | 'station.createHints'
     | 'route.reviewFlow'
     | 'preview.runQa'
     | 'translation.translateMissing';

   export type AiRequest = {
     agentId: AiAgentId;
     actionId: AiActionId;
     locale: string;
     tourContext: unknown;
     target?: {
       section: string;
       stationId?: string;
       field?: string;
     };
     userInstruction?: string;
   };

   export type AiResponse = {
     suggestions: AssistantSuggestion[];
     rawText?: string;
     warnings?: string[];
   };

2. Add AI client interface:
   src/services/ai/aiClient.ts

   export interface AiClient {
     runAction(request: AiRequest): Promise<AiResponse>;
   }

3. Add mock AI client:
   src/services/ai/mockAiClient.ts

   It should implement AiClient and return deterministic mock suggestions.

4. Add prompt builder:
   src/services/ai/promptBuilder.ts

   It should export pure functions that build structured prompt payloads.
   No real API call.
   No secrets.

5. Add agent action definitions:
   src/services/ai/agentActions.ts

   Define available actions per agent:
   - Plan agent
   - Story agent
   - Station agent
   - Route agent
   - Preview agent
   - Translation agent

6. Add AI config:
   src/services/ai/aiConfig.ts

   It should define current provider mode:
   - 'mock'
   - 'remote-disabled'

   Default must be 'mock'.

7. Integrate lightly:
   Use mockAiClient in AssistantSlot or one workspace if straightforward.
   Do not refactor every Assistant action.
   The goal is to prove the boundary works, not to implement all agents.

8. Security requirement:
   Add a comment or README note:
   "Real AI calls must be routed through a backend/serverless endpoint. Do not expose provider API keys in the browser."

9. Do not change app data model.
   Do not auto-apply AI output.
   AI output should become AssistantSuggestion objects.

Acceptance criteria:
- AI service layer exists.
- MockAiClient implements AiClient.
- Agent action IDs are centralized.
- No real external API is called.
- No API key is used or expected in the frontend.
- Existing mock suggestions still work.
- At least one assistant action can use MockAiClient to return a suggestion.
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

## Security Note

```txt
Real AI calls must be routed through a backend/serverless endpoint.
Do not expose provider API keys in the browser.
Frontend should send a structured AiRequest to your own endpoint.
The endpoint validates user/session/project limits and calls the provider.
```

## Implementation Notes

```txt
Status:
- AI service boundary added under src/services/ai.
- AiClient.runAction is the UI/provider boundary.
- Default provider mode is mock.
- remote-disabled exists only as a safe config state.
- Agent action definitions are centralized in agentActions.ts.
- Plan assistant "Improve concept" is wired to MockAiClient.
- Other assistant actions remain disabled by design.
- AI output is rendered as AssistantSuggestion objects and is not auto-applied.

Validation:
- npm run typecheck
- npm run lint
- npm test
- npm run build
```

## UX Review Checklist

```txt
Does the AI boundary stay invisible to normal users?
Does the UI still show suggestions, not raw AI output?
Are agent actions named clearly?
Is the provider mode safely set to mock by default?
Are there no secrets or direct provider calls in frontend code?
```
