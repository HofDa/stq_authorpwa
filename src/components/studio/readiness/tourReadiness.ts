import {
  DEFAULT_LOCALE,
  LOCALES,
  type Locale,
  type TourDraft,
} from '@/schema';
import { getStationReadiness } from './stationReadiness';
import { getWorstStatus, presenceCheck, type LocalCheck } from './readinessTypes';

/**
 * Returns the tour-level local checks: title, intro, outro, station count,
 * route reviewed, and per-locale completeness. Designed for the Plan
 * dashboard and contextual sidebars.
 */
export function getTourReadiness(
  draft: TourDraft,
  locale: Locale = DEFAULT_LOCALE,
): LocalCheck[] {
  const tour = draft.tour;
  const localized = tour[locale];
  const missingLocales = LOCALES.filter((l) => !tour[l].title.trim());

  const checks: LocalCheck[] = [
    presenceCheck({
      id: 'tour.title',
      label: 'Tour title',
      present: Boolean(localized.title.trim()),
      missingMessage: 'A tour title is required before you can export.',
      severity: 'error',
      target: { section: 'plan', field: 'title' },
    }),
    presenceCheck({
      id: 'tour.stations',
      label: 'Stations',
      present: draft.stations.length > 0,
      missingMessage: 'Add at least one station to this tour.',
      severity: 'error',
      target: { section: 'stations' },
    }),
    presenceCheck({
      id: 'tour.intro',
      label: 'Intro',
      present: localized.introSection.length > 0,
      missingMessage: 'Set the scene with a short intro for the tour.',
      target: { section: 'story', field: 'intro' },
    }),
    presenceCheck({
      id: 'tour.outro',
      label: 'Outro',
      present: localized.outroSection.length > 0,
      missingMessage:
        'Wrap things up with a short outro for the end of the tour.',
      target: { section: 'story', field: 'outro' },
    }),
    {
      id: 'tour.languages',
      label: 'Language coverage',
      status: missingLocales.length > 0 ? 'draft' : 'ready',
      severity: 'info',
      message:
        missingLocales.length > 0
          ? `Title missing in: ${missingLocales.join(', ')}`
          : undefined,
      target: { section: 'plan', field: 'languages' },
    },
  ];

  return checks;
}

/**
 * Counts how many stations are fully ready (no `missing`/`problem` checks)
 * for the active locale. Used by Plan readiness and station sidebars.
 */
export function getReadyStationCount(
  draft: TourDraft,
  locale: Locale = DEFAULT_LOCALE,
): { ready: number; total: number } {
  const total = draft.stations.length;
  if (total === 0) return { ready: 0, total: 0 };
  const ready = draft.stations.filter(
    (station) => getWorstStatus(getStationReadiness(station, locale)) === 'ready',
  ).length;
  return { ready, total };
}
