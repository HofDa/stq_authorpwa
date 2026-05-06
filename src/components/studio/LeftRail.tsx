import type { Locale, RiddleEntry, TourDraft } from '@/schema';
import { Icon } from './Icon';
import { stationCompleteness, tourCompleteness } from './completeness';

interface Props {
  draft: TourDraft;
  selected: RiddleEntry | null;
  locale: Locale;
  onSelectPrev: () => void;
  onSelectNext: () => void;
}

export function LeftRail({
  draft,
  selected,
  locale,
  onSelectPrev,
  onSelectNext,
}: Props) {
  const tour = draft.tour;
  const tourStats = tourCompleteness(draft, locale);
  const selectedStats = selected ? stationCompleteness(selected, locale) : null;
  const selectedIdx = selected
    ? draft.stations.findIndex((s) => s.id === selected.id)
    : -1;
  const isFirst = selectedIdx <= 0;
  const isLast = selectedIdx < 0 || selectedIdx >= draft.stations.length - 1;

  return (
    <aside
      className="stq-author-tool-left-rail"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        minHeight: 0,
      }}
    >
      {/* Tour meta card */}
      <section
        style={{
          background: 'var(--stq-desktop-panel-bg, white)',
          border: '1px solid var(--stq-desktop-panel-border, var(--stq-border))',
          borderRadius: 'var(--stq-desktop-panel-radius, 18px)',
          padding: 14,
          boxShadow: 'var(--stq-desktop-panel-shadow, var(--stq-shadow-soft))',
          color: 'var(--stq-desktop-panel-text, var(--stq-text))',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={eyebrow}>Tour</div>
          <span className="studio-chip" style={{ fontSize: 10, padding: '2px 8px', background: 'var(--stq-bg)' }}>
            <span className="studio-dot studio-dot--warn" />
            Drafting
          </span>
        </div>
        <h3
          style={{
            fontFamily: 'var(--stq-font-ui)',
            fontSize: 17,
            fontWeight: 700,
            margin: '6px 0 0',
            lineHeight: 1.2,
          }}
        >
          {tour[locale].title || (
            <span style={{ color: 'var(--stq-text-mute)', fontStyle: 'italic', fontWeight: 400 }}>
              Untitled tour
            </span>
          )}
        </h3>
        <div style={{ fontSize: 12, color: 'var(--stq-text-mute)', marginTop: 4 }}>
          {tour[locale].location || '—'}
        </div>
        <div className="studio-progress" style={{ marginTop: 10 }}>
          <div style={{ width: `${tourStats.percent}%` }} />
        </div>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginTop: 6,
            fontSize: 11,
            color: 'var(--stq-text-mute)',
          }}
        >
          <span>
            {tourStats.percent}% · {tourStats.ready}/{tourStats.total} ready
          </span>
          <span>v0.1 draft</span>
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 6,
            marginTop: 12,
            fontSize: 11,
          }}
        >
          <MetaTile label="DURATION" value={tour[locale].duration || '—'} />
          <MetaTile label="DISTANCE" value={tour.distance || '—'} />
        </div>
      </section>

      {/* Selected station inspector */}
      <section
        style={{
          background: 'var(--stq-desktop-panel-bg, white)',
          border: '1px solid var(--stq-desktop-panel-border, var(--stq-border))',
          borderRadius: 'var(--stq-desktop-panel-radius, 18px)',
          padding: 14,
          boxShadow: 'var(--stq-desktop-panel-shadow, var(--stq-shadow-soft))',
          color: 'var(--stq-desktop-panel-text, var(--stq-text))',
          flex: 1,
          minHeight: 0,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {selected && selectedStats ? (
          <>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div style={eyebrow}>
                Station {selected.number} / {draft.stations.length}
              </div>
              <div style={{ display: 'flex', gap: 4 }}>
                <button
                  className="studio-btn-icon"
                  style={{ width: 28, height: 28 }}
                  onClick={onSelectPrev}
                  disabled={isFirst}
                  aria-label="Previous station"
                >
                  <Icon name="chevron-left" size={13} />
                </button>
                <button
                  className="studio-btn-icon"
                  style={{ width: 28, height: 28 }}
                  onClick={onSelectNext}
                  disabled={isLast}
                  aria-label="Next station"
                >
                  <Icon name="chevron-right" size={13} />
                </button>
              </div>
            </div>
            <h3
              style={{
                fontFamily: 'var(--stq-font-ui)',
                fontSize: 16,
                fontWeight: 700,
                margin: '6px 0 2px',
                lineHeight: 1.2,
              }}
            >
              {selected[locale].location || (
                <span style={{ color: 'var(--stq-text-mute)', fontStyle: 'italic', fontWeight: 400 }}>
                  Unnamed station
                </span>
              )}
            </h3>
            <div
              style={{
                fontFamily: 'var(--stq-font-ui)',
                fontSize: 10.5,
                color: 'var(--stq-text-mute)',
              }}
            >
              {selected.position_lat.toFixed(5)}, {selected.position_lng.toFixed(5)}
            </div>
            <div className="studio-progress" style={{ marginTop: 10 }}>
              <div style={{ width: `${selectedStats.percent}%` }} />
            </div>
            <div style={{ marginTop: 12, display: 'flex', flexDirection: 'column', gap: 6 }}>
              <ChecklistRow icon="camera" label="Station photo" done={selectedStats.hasPhoto} action="Retake" />
              <ChecklistRow icon="map-pin" label="GPS coordinates" done={selectedStats.hasGps} action="Use current" />
              <ChecklistRow
                icon="type"
                label="Story blocks"
                done={selectedStats.blockCount > 0}
                detail={`${selectedStats.blockCount} block${selectedStats.blockCount === 1 ? '' : 's'}`}
              />
              <ChecklistRow icon="sparkles" label="Riddle & answer" done={selectedStats.hasRiddle} action="Write" />
              <ChecklistRow
                icon="check-circle"
                label="Success message"
                done={selectedStats.hasSuccessMessage}
                action="Write"
              />
            </div>
          </>
        ) : (
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              flex: 1,
              color: 'var(--stq-text-mute)',
              fontSize: 13,
              textAlign: 'center',
              padding: 24,
            }}
          >
            Select a station from the timeline below to inspect it.
          </div>
        )}
      </section>
    </aside>
  );
}

const eyebrow: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.14em',
  color: 'var(--stq-primary)',
  textTransform: 'uppercase',
};

function MetaTile({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        padding: '6px 8px',
        background: 'var(--stq-bg)',
        borderRadius: 8,
      }}
    >
      <div
        style={{
          color: 'var(--stq-text-mute)',
          fontSize: 10,
          fontWeight: 600,
          letterSpacing: '0.05em',
        }}
      >
        {label}
      </div>
      <div style={{ fontWeight: 700 }}>{value}</div>
    </div>
  );
}

function ChecklistRow({
  icon,
  label,
  done,
  action,
  detail,
}: {
  icon: 'camera' | 'map-pin' | 'type' | 'sparkles' | 'check-circle';
  label: string;
  done: boolean;
  action?: string;
  detail?: string;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        padding: '7px 10px',
        background: done ? 'rgba(65,104,52,0.06)' : 'var(--stq-bg)',
        borderRadius: 10,
        border: `1px solid ${done ? 'rgba(65,104,52,0.15)' : 'var(--stq-border-soft)'}`,
      }}
    >
      <Icon name={icon} size={13} color={done ? 'var(--stq-success)' : 'var(--stq-text-mute)'} />
      <span style={{ fontSize: 12, fontWeight: 600, flex: 1 }}>{label}</span>
      {done ? (
        <span
          style={{
            fontSize: 11,
            color: 'var(--stq-success)',
            fontWeight: 600,
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
          }}
        >
          <Icon name="check" size={11} color="var(--stq-success)" />
          {detail || 'Done'}
        </span>
      ) : (
        <span
          style={{
            fontSize: 11,
            color: 'var(--stq-primary)',
            fontWeight: 700,
          }}
        >
          {action || 'Add'}
        </span>
      )}
    </div>
  );
}
