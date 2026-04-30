import type { Locale, RiddleEntry } from '@/schema';
import { getStationLocationLabel } from '@/utils/localizedContent';
import { stationCompleteness } from '../completeness';

interface Props {
  station: RiddleEntry;
  locale: Locale;
  active: boolean;
  onSelect: () => void;
}

export function FieldStationCard({
  station,
  locale,
  active,
  onSelect,
}: Props) {
  const stats = stationCompleteness(station, locale);
  const status: 'ok' | 'warn' | 'err' =
    stats.percent === 100 ? 'ok' : stats.percent >= 25 ? 'warn' : 'err';
  const label =
    status === 'ok' ? 'Ready' : status === 'warn' ? 'Drafting' : 'Empty';

  return (
    <button
      type="button"
      onClick={onSelect}
      className="stq-field-list-row"
      style={{
        background: active ? 'white' : 'transparent',
        borderColor: active
          ? 'var(--stq-primary)'
          : 'var(--stq-border-soft)',
      }}
    >
      <div className="studio-pin" style={{ width: 28, height: 28, fontSize: 12 }}>
        {station.number}
      </div>
      <div style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
        <div
          style={{
            fontSize: 13,
            fontWeight: 700,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {getStationLocationLabel(station, locale)}
        </div>
        <div style={{ fontSize: 11, color: 'var(--stq-text-mute)' }}>
          {label} · {stats.percent}%
        </div>
      </div>
      <span className={`studio-dot studio-dot--${status}`} />
    </button>
  );
}
