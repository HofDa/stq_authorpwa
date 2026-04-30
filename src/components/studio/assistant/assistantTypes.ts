import type { StudioWorkflowSection } from '../workflow/workflowTypes';
import type { AiActionId } from '@/services/ai/aiTypes';

/**
 * Stable identifiers for the assistant actions per workspace. Wired up to
 * mock no-ops in PR-18; real implementations land once the AI provider
 * boundary (PR-25) exists.
 */
export type AssistantActionId = AiActionId;

export type AssistantAction = {
  id: AssistantActionId;
  label: string;
  description?: string;
  disabled?: boolean;
  onTrigger?: () => void;
};

/**
 * A single suggestion the assistant could present. The shape is stable so
 * later PRs can render real model output through the same UI without
 * changing the consumer code.
 */
export type AssistantSuggestion = {
  id: string;
  title: string;
  reason: string;
  proposedChange?: string;
  target?: {
    section: StudioWorkflowSection;
    stationId?: string;
    field?: string;
  };
  onApply?: () => void;
  onDismiss?: () => void;
};
