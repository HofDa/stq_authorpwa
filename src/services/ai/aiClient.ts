import type { AiRequest, AiResponse } from './aiTypes';

/**
 * Provider boundary used by workspaces and assistant UI.
 *
 * Real AI calls must be routed through a backend/serverless endpoint. Do not
 * expose provider API keys in the browser.
 */
export interface AiClient {
  readonly id: 'mock' | 'remote-disabled';
  runAction(request: AiRequest): Promise<AiResponse>;
}
