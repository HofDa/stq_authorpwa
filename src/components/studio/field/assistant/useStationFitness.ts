import { useMemo } from 'react';
import type { Locale, RiddleEntry, TourDraft } from '@/schema';
import { runLocalAssistantChecks } from '@/assistant/openClaw';
import { stationCompleteness } from '../../completeness';
import type { AssistantProgressSegment } from './AssistantProgressSegments';

export interface StationFitness {
  stats: ReturnType<typeof stationCompleteness>;
  checks: ReturnType<typeof runLocalAssistantChecks>;
  stationTitle: string;
  segments: AssistantProgressSegment[];
  readyLabel: string;
  photoCount: number;
  gpsLabel: string;
  riddleLabel: string;
  contextBlockCount: number;
  hasContext: boolean;
}

export function useStationFitness(
  draft: TourDraft,
  locale: Locale,
  station: RiddleEntry,
): StationFitness {
  const stats = stationCompleteness(station, locale);
  const checks = useMemo(
    () => runLocalAssistantChecks({ draft, locale, kind: 'station', station }),
    [draft, locale, station],
  );
  const localized = station[locale];
  const stationTitle = localized.location || `Station ${station.number}`;

  const segments = useMemo<AssistantProgressSegment[]>(
    () => [
      { key: 'photo', label: 'Photo', done: stats.hasPhoto },
      { key: 'gps', label: 'GPS', done: stats.hasGps },
      {
        key: 'story',
        label: 'Story',
        done: localized.firstSection.length > 0,
      },
      { key: 'riddle', label: 'Riddle', done: stats.hasRiddle },
      {
        key: 'context',
        label: 'Context',
        done:
          localized.historySection.length > 0 ||
          localized.successSection.length > 0,
      },
    ],
    [stats, localized],
  );

  const photoCount = station.imageBlobId || station.imagePath ? 1 : 0;
  const gpsLabel = stats.hasGps
    ? `${station.position_lat.toFixed(3)}°, ${station.position_lng.toFixed(3)}°`
    : 'No pin yet';
  const riddleLabel = stats.hasRiddle ? 'Written' : 'Missing';
  const contextBlockCount =
    localized.historySection.length + localized.successSection.length;
  const hasContext = contextBlockCount > 0;

  return {
    stats,
    checks,
    stationTitle,
    segments,
    readyLabel: buildReadyLabel(stats.percent),
    photoCount,
    gpsLabel,
    riddleLabel,
    contextBlockCount,
    hasContext,
  };
}

function buildReadyLabel(percent: number) {
  if (percent === 100) return 'Ready to ship';
  if (percent >= 75) return 'Almost there';
  if (percent >= 25) return 'Drafting';
  return 'Just started';
}
