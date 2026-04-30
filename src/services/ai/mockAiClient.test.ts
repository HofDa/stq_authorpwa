import { describe, expect, it } from 'vitest';
import { AI_PROVIDER_MODE, getAiClient } from './aiConfig';
import { getAiAgentAction } from './agentActions';
import { createMockAiClient } from './mockAiClient';

describe('AI provider boundary', () => {
  it('defaults to mock provider mode', () => {
    expect(AI_PROVIDER_MODE).toBe('mock');
    expect(getAiClient().id).toBe('mock');
  });

  it('centralizes agent action definitions', () => {
    const action = getAiAgentAction('plan.improveConcept');
    expect(action.agentId).toBe('plan');
    expect(action.section).toBe('plan');
  });

  it('returns deterministic mock suggestions through runAction', async () => {
    const client = createMockAiClient({ latencyMs: 0 });
    const response = await client.runAction({
      agentId: 'plan',
      actionId: 'plan.improveConcept',
      section: 'plan',
      locale: 'de',
      tourContext: {},
      timestamp: '2026-04-26T00:00:00.000Z',
    });

    expect(response.provider).toBe('mock');
    expect(response.suggestions).toHaveLength(1);
    expect(response.suggestions[0].target?.section).toBe('plan');
  });
});
