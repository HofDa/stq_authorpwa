import { createMockAiClient } from './mockAiClient';
import type { AiClient } from './aiClient';

export type AiProviderMode = 'mock' | 'remote-disabled';

export const AI_PROVIDER_MODE: AiProviderMode = 'mock';

/**
 * Frontend provider selection stays deliberately local and safe for PR-25.
 *
 * Real AI calls must be routed through a backend/serverless endpoint. Do not
 * expose provider API keys in the browser.
 */
export function getAiClient(): AiClient {
  switch (AI_PROVIDER_MODE) {
    case 'mock':
      return createMockAiClient();
    case 'remote-disabled':
      return remoteDisabledClient;
  }
}

const remoteDisabledClient: AiClient = {
  id: 'remote-disabled',
  async runAction() {
    return {
      provider: 'remote',
      suggestions: [],
      notice:
        'Remote AI is disabled. Route real provider calls through a backend endpoint.',
      warnings: ['remote-disabled'],
    };
  },
};
