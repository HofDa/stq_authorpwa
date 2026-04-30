import { useMemo } from 'react';
import type { Locale, RiddleEntry, TourDraft } from '@/schema';
import { runLocalAssistantChecks } from '@/assistant/openClaw';
import { Icon } from '../../Icon';
import { stationCompleteness } from '../../completeness';
import { AssistantCaptureMicButton } from './AssistantCaptureMicButton';
import { AssistantChecksList } from './AssistantChecksList';
import { AssistantFitnessCard } from './AssistantFitnessCard';
import { AssistantFitnessScore } from './AssistantFitnessScore';
import { AssistantProgressSegments } from './AssistantProgressSegments';
import type { AssistantProgressSegment } from './AssistantProgressSegments';
import { AssistantPromptCard } from './AssistantPromptCard';

interface StationAssistantContentProps {
  draft: TourDraft;
  locale: Locale;
  station: RiddleEntry;
  isFirst: boolean;
  isLast: boolean;
  onPrev: () => void;
  onNext: () => void;
}

export function StationAssistantContent({
  draft,
  locale,
  station,
  isFirst,
  isLast,
  onPrev,
  onNext,
}: StationAssistantContentProps) {
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

  const readyLabel = buildReadyLabel(stats.percent);
  const photoCount = station.imageBlobId || station.imagePath ? 1 : 0;
  const gpsLabel = stats.hasGps
    ? `${station.position_lat.toFixed(3)}°, ${station.position_lng.toFixed(3)}°`
    : 'No pin yet';
  const riddleLabel = stats.hasRiddle ? 'Written' : 'Missing';
  const contextBlockCount =
    localized.historySection.length + localized.successSection.length;
  const hasContext = contextBlockCount > 0;

  return (
    <>
      <div className="stq-assistant-header">
        <button
          type="button"
          className="studio-btn-icon"
          onClick={onPrev}
          disabled={isFirst}
          aria-label="Previous station"
        >
          <Icon name="chevron-left" size={16} />
        </button>
        <AssistantFitnessScore percent={stats.percent} />
        <div style={{ flex: 1, minWidth: 0, textAlign: 'center' }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: '0.16em',
              color: 'var(--stq-primary)',
              textTransform: 'uppercase',
            }}
          >
            Station {station.number} · Fitness
          </div>
          <div
            style={{
              fontFamily: 'Lato, Georgia, serif',
              fontSize: 18,
              fontWeight: 700,
              lineHeight: 1.2,
              letterSpacing: '-0.005em',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
            }}
          >
            {stationTitle}
          </div>
          <div
            style={{
              fontSize: 11,
              color: 'var(--stq-text-mute)',
              marginTop: 2,
            }}
          >
            {readyLabel}
          </div>
        </div>
        <button
          type="button"
          className="studio-btn-icon"
          onClick={onNext}
          disabled={isLast}
          aria-label="Next station"
        >
          <Icon name="chevron-right" size={16} />
        </button>
      </div>

      <AssistantProgressSegments segments={segments} />
      <AssistantPromptCard stationTitle={stationTitle} />

      <div className="stq-assistant-fitness-grid">
        <AssistantFitnessCard
          icon="camera"
          label="Photo"
          value={photoCount > 0 ? `${photoCount} captured` : 'Missing'}
          done={photoCount > 0}
        />
        <AssistantFitnessCard
          icon="map-pin"
          label="GPS"
          value={gpsLabel}
          done={stats.hasGps}
        />
        <AssistantFitnessCard
          icon="type"
          label="Riddle"
          value={riddleLabel}
          done={stats.hasRiddle}
        />
        <AssistantFitnessCard
          icon="layers"
          label="Context"
          value={hasContext ? `${contextBlockCount} blocks` : 'Add context'}
          done={hasContext}
        />
      </div>

      <AssistantChecksList checks={checks} />
      <AssistantCaptureMicButton draft={draft} locale={locale} station={station} />
    </>
  );
}

function buildReadyLabel(percent: number) {
  if (percent === 100) return 'Ready to ship';
  if (percent >= 75) return 'Almost there';
  if (percent >= 25) return 'Drafting';
  return 'Just started';
}
