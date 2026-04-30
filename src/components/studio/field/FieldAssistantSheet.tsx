import { useEffect, useMemo } from 'react';
import type { Locale, RiddleEntry, TourDraft } from '@/schema';
import type { AssistantFocus } from '@/assistant/openClaw';
import { Icon } from '../Icon';
import { StationAssistantContent } from './assistant/StationAssistantContent';

interface Props {
  draft: TourDraft;
  locale: Locale;
  station?: RiddleEntry;
  onClose: () => void;
  /** Move to a different station while staying inside the assistant view. */
  onSelectStation?: (id: string) => void;
}

/**
 * Full-screen AI assistant view. Shown when the author taps the "Assistant"
 * button in the field bottom-nav. It carries the current station context,
 * shows a fitness score, calls out missing pieces, and offers a one-tap
 * voice prompt to capture observations on-site.
 */
export function FieldAssistantSheet({
  draft,
  locale,
  station,
  onClose,
  onSelectStation,
}: Props) {
  useEffect(() => {
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, []);

  const stationIndex = useMemo(
    () =>
      station ? draft.stations.findIndex((s) => s.id === station.id) : -1,
    [draft.stations, station],
  );
  const isFirst = stationIndex <= 0;
  const isLast =
    stationIndex < 0 || stationIndex >= draft.stations.length - 1;

  function step(delta: -1 | 1) {
    if (stationIndex < 0 || !onSelectStation) return;
    const next = stationIndex + delta;
    if (next < 0 || next >= draft.stations.length) return;
    onSelectStation(draft.stations[next].id);
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="OpenClaw assistant"
      className="stq-assistant-screen"
    >
      <div className="stq-assistant-topbar">
        <button
          type="button"
          onClick={onClose}
          className="studio-btn-icon"
          aria-label="Close assistant"
        >
          <Icon name="x" size={16} />
        </button>
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            letterSpacing: '0.16em',
            color: 'var(--stq-primary)',
            textTransform: 'uppercase',
          }}
        >
          OpenClaw assistant
        </span>
        <span style={{ width: 34 }} aria-hidden />
      </div>

      <div className="stq-assistant-body studio-scroll">
        {station ? (
          <StationAssistantContent
            draft={draft}
            locale={locale}
            station={station}
            isFirst={isFirst}
            isLast={isLast}
            onPrev={() => step(-1)}
            onNext={() => step(1)}
          />
        ) : (
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              minHeight: 240,
              padding: 24,
              color: 'var(--stq-text-mute)',
              fontSize: 13,
              textAlign: 'center',
            }}
          >
            Select a station first — the assistant tailors its prompts to the
            station you are standing at.
          </div>
        )}
      </div>
    </div>
  );
}

export type FieldAssistantFocus = AssistantFocus;
