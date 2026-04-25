import {
  DEFAULT_LOCALE,
  hasAcceptedAnswer,
  type Locale,
  type RiddleEntry,
  type TourDraft,
} from '@/schema';

export interface StationCompleteness {
  hasPhoto: boolean;
  hasGps: boolean;
  hasRiddle: boolean;
  hasSuccessMessage: boolean;
  blockCount: number;
  percent: number;
}

export function stationCompleteness(
  station: RiddleEntry,
  locale: Locale = DEFAULT_LOCALE,
): StationCompleteness {
  const localized = getLocalizedStationContent(station, locale);
  const hasPhoto = Boolean(station.imageBlobId || station.imagePath);
  const hasGps = station.position_lat !== 0 || station.position_lng !== 0;
  const hasRiddle = hasAcceptedAnswer(station.acceptedAnswers, locale);
  const hasSuccessMessage = localized.successSection.length > 0;
  const blockCount =
    localized.firstSection.length +
    localized.historySection.length +
    localized.riddleSection.length +
    localized.successSection.length;
  const percent =
    (hasPhoto ? 25 : 0) +
    (hasGps ? 25 : 0) +
    (hasRiddle ? 25 : 0) +
    (blockCount > 0 ? 25 : 0);
  return { hasPhoto, hasGps, hasRiddle, hasSuccessMessage, blockCount, percent };
}

export function tourCompleteness(
  draft: TourDraft,
  locale: Locale = DEFAULT_LOCALE,
): {
  ready: number;
  total: number;
  percent: number;
} {
  const total = draft.stations.length;
  if (total === 0) return { ready: 0, total: 0, percent: 0 };
  const ready = draft.stations.filter(
    (s) => stationCompleteness(s, locale).percent === 100,
  ).length;
  return { ready, total, percent: Math.round((ready / total) * 100) };
}

function getLocalizedStationContent(station: RiddleEntry, locale: Locale) {
  return station[locale];
}
