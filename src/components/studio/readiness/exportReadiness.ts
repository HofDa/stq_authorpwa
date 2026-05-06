import {
  DEFAULT_LOCALE,
  type Locale,
  type TourDraft,
} from '@/schema';
import { getStationReadiness } from './stationReadiness';
import { getTourReadiness } from './tourReadiness';
import { pluralBlocker, type LocalCheck } from './readinessTypes';

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
  const stationsTarget = { section: 'stations' as const };
  const tourBlockers = getTourReadiness(draft, locale).filter(isExportBlocking);

  const countStations = (predicate: (s: TourDraft['stations'][number]) => boolean) =>
    draft.stations.filter(predicate).length;

  const stationBlockers = [
    pluralBlocker({
      id: 'export.stations.title',
      label: 'Station titles',
      count: countStations((s) => !s[locale].location.trim()),
      noun: 'station',
      missingWhat: 'missing a title',
      target: stationsTarget,
    }),
    pluralBlocker({
      id: 'export.stations.gps',
      label: 'Station GPS',
      count: countStations(
        (s) => s.position_lat === 0 && s.position_lng === 0,
      ),
      noun: 'station',
      missingWhat: 'missing GPS coordinates',
      target: stationsTarget,
    }),
    pluralBlocker({
      id: 'export.stations.success',
      label: 'Station success messages',
      count: countStations((s) => s[locale].successSection.length === 0),
      noun: 'station',
      missingWhat: 'missing a success message',
      target: stationsTarget,
    }),
    pluralBlocker({
      id: 'export.stations.problems',
      label: 'Station issues',
      count: countStations((station) =>
        getStationReadiness(station, locale).some((c) => c.status === 'problem'),
      ),
      noun: 'station',
      missingWhat: 'with unresolved issues (e.g. riddle without an answer)',
      status: 'problem',
      target: stationsTarget,
    }),
  ].filter((check): check is LocalCheck => check !== null);

  return [...tourBlockers, ...stationBlockers];
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
