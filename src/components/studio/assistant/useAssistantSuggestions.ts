import { useCallback, useMemo, useState } from 'react';
import type { Locale, TourDraft } from '@/schema';
import type { StudioWorkflowSection } from '../workflow/workflowTypes';
import type { AssistantSuggestion } from './assistantTypes';
import { buildMockSuggestions } from './mockSuggestions';

interface Args {
  section: StudioWorkflowSection;
  draft: TourDraft;
  locale: Locale;
  /**
   * Optional override. Defaults to the deterministic mock generator from
   * `mockSuggestions.ts`. Real-AI implementations later swap this for a
   * function that calls the provider boundary.
   */
  build?: typeof buildMockSuggestions;
  limit?: number;
}

interface State {
  /** Suggestions visible right now, with `onApply` / `onDismiss` wired up. */
  suggestions: AssistantSuggestion[];
  /**
   * Reset all dismissals — useful when the workspace wants a "Show all"
   * affordance later. Not surfaced in the UI yet.
   */
  resetDismissals: () => void;
  /** True iff the user has hidden one or more suggestions in this session. */
  hasDismissed: boolean;
}

/**
 * Wraps `buildMockSuggestions` with per-session dismissal tracking and
 * binds `onDismiss` to every returned suggestion. Apply handlers are
 * caller-supplied: workspaces hand in any side-effects they want to run
 * for the suggestion id (or leave them undefined for a no-op).
 */
export function useAssistantSuggestions(args: Args): State {
  const { section, draft, locale, build = buildMockSuggestions, limit } = args;
  const [dismissed, setDismissed] = useState<ReadonlySet<string>>(
    () => new Set(),
  );

  const dismiss = useCallback((id: string) => {
    setDismissed((prev) => {
      if (prev.has(id)) return prev;
      const next = new Set(prev);
      next.add(id);
      return next;
    });
  }, []);

  const resetDismissals = useCallback(() => {
    setDismissed(new Set());
  }, []);

  const suggestions = useMemo<AssistantSuggestion[]>(() => {
    const generated = build(section, { draft, locale, dismissed, limit });
    return generated.map((suggestion) => ({
      ...suggestion,
      onDismiss: () => dismiss(suggestion.id),
    }));
  }, [build, section, draft, locale, dismissed, limit, dismiss]);

  return {
    suggestions,
    resetDismissals,
    hasDismissed: dismissed.size > 0,
  };
}
