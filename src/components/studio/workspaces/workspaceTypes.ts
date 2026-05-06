import type { Locale, TourDraft } from '@/schema';

export type DraftChangeHandler = (
  patch: Partial<TourDraft> | ((prev: TourDraft) => TourDraft),
) => void;

/**
 * Shared shape for the studio workspaces. Each workspace receives the
 * full draft, the active locale, and a draft mutator.
 */
export interface BaseWorkspaceProps {
  draft: TourDraft;
  locale: Locale;
  onChange: DraftChangeHandler;
}

/**
 * Workspaces that own a language switcher (currently only Preview).
 */
export interface LocaleAwareWorkspaceProps extends BaseWorkspaceProps {
  onLocaleChange: (locale: Locale) => void;
}
