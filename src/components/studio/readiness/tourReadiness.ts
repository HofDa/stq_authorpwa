import {
  DEFAULT_LOCALE,
  LOCALES,
  type Locale,
  type TourDraft,
} from '@/schema';
import { getStationReadiness } from './stationReadiness';
import { getWorstStatus, type LocalCheck } from './readinessTypes';

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
  const checks: LocalCheck[] = [];

  checks.push({
    id: 'tour.title',
    label: 'Tour title',
    status: localized.title.trim() ? 'ready' : 'missing',
    severity: 'error',
    message: localized.title.trim()
      ? undefined
      : 'A tour title is required before you can export.',
    target: { section: 'plan', field: 'title' },
  });

  checks.push({
    id: 'tour.stations',
    label: 'Stations',
    status: draft.stations.length > 0 ? 'ready' : 'missing',
    severity: 'error',
    message:
      draft.stations.length > 0
        ? undefined
        : 'Add at least one station to this tour.',
    target: { section: 'stations' },
  });

  checks.push({
    id: 'tour.intro',
    label: 'Intro',
    status: localized.introSection.length > 0 ? 'ready' : 'missing',
    severity: 'warning',
    message:
      localized.introSection.length > 0
        ? undefined
        : 'Set the scene with a short intro for the tour.',
    target: { section: 'story', field: 'intro' },
  });

  checks.push({
    id: 'tour.outro',
    label: 'Outro',
    status: localized.outroSection.length > 0 ? 'ready' : 'missing',
    severity: 'warning',
    message:
      localized.outroSection.length > 0
        ? undefined
        : 'Wrap things up with a short outro for the end of the tour.',
    target: { section: 'story', field: 'outro' },
  });

  const missingLocales = LOCALES.filter((l) => !tour[l].title.trim());
  if (missingLocales.length > 0) {
    checks.push({
      id: 'tour.languages',
      label: 'Language coverage',
      status: 'draft',
      severity: 'info',
      message: `Title missing in: ${missingLocales.join(', ')}`,
      target: { section: 'plan', field: 'languages' },
    });
  } else {
    checks.push({
      id: 'tour.languages',
      label: 'Language coverage',
      status: 'ready',
      severity: 'info',
      target: { section: 'plan', field: 'languages' },
    });
  }

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
