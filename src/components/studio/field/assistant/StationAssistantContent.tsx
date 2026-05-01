import type { Locale, RiddleEntry, TourDraft } from '@/schema';
import { Icon } from '../../Icon';
import { AssistantCaptureMicButton } from './AssistantCaptureMicButton';
import { AssistantChecksList } from './AssistantChecksList';
import { AssistantFitnessCard } from './AssistantFitnessCard';
import { AssistantFitnessScore } from './AssistantFitnessScore';
import { AssistantProgressSegments } from './AssistantProgressSegments';
import { AssistantPromptCard } from './AssistantPromptCard';
import { useStationFitness } from './useStationFitness';

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
  const {
    stats,
    checks,
    stationTitle,
    segments,
    readyLabel,
    photoCount,
    gpsLabel,
    riddleLabel,
    contextBlockCount,
    hasContext,
  } = useStationFitness(draft, locale, station);

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
