import {
  DEFAULT_LOCALE,
  type Locale,
  type TourDraft,
} from '@/schema';
import { getStationReadiness } from './stationReadiness';
import { getTourReadiness } from './tourReadiness';
import type { LocalCheck } from './readinessTypes';

/**
 * Returns the subset of checks that must clear before export. Aggregates
 * critical tour blockers and the worst station blockers (missing GPS,
 * missing answer, missing success message).
 *
 * The Plan dashboard renders these directly as "Cannot export yet:" lines.
 */
export function getExportReadiness(
  draft: TourDraft,
  locale: Locale = DEFAULT_LOCALE,
): LocalCheck[] {
  const blockers: LocalCheck[] = [];
  const tourChecks = getTourReadiness(draft, locale);

  for (const check of tourChecks) {
    if (isExportBlocking(check)) blockers.push(check);
  }

  const stationsMissingTitle = countStationField(
    draft,
    locale,
    (s) => !s[locale].location.trim(),
  );
  if (stationsMissingTitle > 0) {
    blockers.push({
      id: 'export.stations.title',
      label: 'Station titles',
      status: 'missing',
      severity: 'error',
      message: `${stationsMissingTitle} station${
        stationsMissingTitle === 1 ? '' : 's'
      } missing a title.`,
      target: { section: 'stations' },
    });
  }

  const stationsMissingGps = countStationField(
    draft,
    locale,
    (s) => s.position_lat === 0 && s.position_lng === 0,
  );
  if (stationsMissingGps > 0) {
    blockers.push({
      id: 'export.stations.gps',
      label: 'Station GPS',
      status: 'missing',
      severity: 'error',
      message: `${stationsMissingGps} station${
        stationsMissingGps === 1 ? '' : 's'
      } missing GPS coordinates.`,
      target: { section: 'stations' },
    });
  }

  const stationsMissingSuccess = countStationField(
    draft,
    locale,
    (s) => s[locale].successSection.length === 0,
  );
  if (stationsMissingSuccess > 0) {
    blockers.push({
      id: 'export.stations.success',
      label: 'Station success messages',
      status: 'missing',
      severity: 'error',
      message: `${stationsMissingSuccess} station${
        stationsMissingSuccess === 1 ? '' : 's'
      } missing a success message.`,
      target: { section: 'stations' },
    });
  }

  const stationsWithProblems = draft.stations.filter((station) =>
    getStationReadiness(station, locale).some((c) => c.status === 'problem'),
  ).length;
  if (stationsWithProblems > 0) {
    blockers.push({
      id: 'export.stations.problems',
      label: 'Station issues',
      status: 'problem',
      severity: 'error',
      message: `${stationsWithProblems} station${
        stationsWithProblems === 1 ? '' : 's'
      } with unresolved issues (e.g. riddle without an answer).`,
      target: { section: 'stations' },
    });
  }

  return blockers;
}

export function isReadyToExport(
  draft: TourDraft,
  locale: Locale = DEFAULT_LOCALE,
): boolean {
  return getExportReadiness(draft, locale).length === 0;
}

function isExportBlocking(check: LocalCheck): boolean {
  if (check.severity !== 'error') return false;
  return check.status === 'missing' || check.status === 'problem';
}

function countStationField(
  draft: TourDraft,
  _locale: Locale,
  predicate: (station: TourDraft['stations'][number]) => boolean,
): number {
  return draft.stations.filter(predicate).length;
}
