import type { Locale, TourDraft } from '@/schema';
import type { StudioWorkflowSection } from '@/components/studio/workflow/workflowTypes';
import type { AssistantSuggestion } from '@/components/studio/assistant/assistantTypes';

export type AiAgentId =
  | 'plan'
  | 'story'
  | 'station'
  | 'route'
  | 'preview'
  | 'translation';

/**
 * Shapes of the requests the studio knows how to send to an AI provider.
 *
 * The boundary intentionally accepts the workspace section + the locale +
 * a redacted slice of the draft, never the whole `TourDraft` — so when the
 * real backend lands, callers don't have to remember to filter local-only
 * fields (like `coverBlobId`) before sending.
 */
export type AiActionId =
  | 'plan.improveConcept'
  | 'story.createStoryline'
  | 'story.refineIntro'
  | 'story.refineOutro'
  | 'station.reviewStation'
  | 'station.createRiddle'
  | 'station.shortenText'
  | 'route.reviewRoute'
  | 'preview.runQA'
  | 'translation.checkCompleteness';

export interface AiRequest {
  /** Provider-agnostic agent family. */
  agentId: AiAgentId;
  /** Stable id for the action being requested. */
  actionId: AiActionId;
  /** Originating workspace — used by the provider for routing/logging. */
  section: StudioWorkflowSection;
  /** Active editing locale at the time of the request. */
  locale: Locale;
  /** Optional station scope when the action is per-station. */
  stationId?: string;
  /** Structured, redacted tour context for provider prompts. */
  tourContext?: unknown;
  /** Free-form context the action wants to attach (excerpts, notes). */
  context?: Record<string, string>;
  /** ISO-8601 timestamp; useful for caching and deterministic mock replies. */
  timestamp: string;
}

export interface AiResponse {
  /**
   * A small set of suggestions the workspace can render through the
   * existing `SuggestionPanel`. Empty array is a valid "nothing to add"
   * response.
   */
  suggestions: AssistantSuggestion[];
  /**
   * Provider self-identification. Useful for tests and for showing a tag
   * like "Mock provider" in the UI without leaking config.
   */
  provider: 'mock' | 'remote';
  /** Optional notice for the UI (rate limit, degraded mode, etc.). */
  notice?: string;
  /** Optional provider text for diagnostics. UI should render suggestions. */
  rawText?: string;
  /** Non-blocking provider warnings. */
  warnings?: string[];
}

/** Helper input to `promptBuilder` — kept narrow on purpose. */
export interface PromptContextInput {
  draft: TourDraft;
  locale: Locale;
  stationId?: string;
}
