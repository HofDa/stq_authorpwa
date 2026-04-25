import type { Locale, RiddleEntry } from '@/schema';
import { FieldStationCard } from './FieldStationCard';

interface Props {
  stations: RiddleEntry[];
  locale: Locale;
  selectedId: string | null;
  onSelect: (id: string) => void;
}

export function FieldStationList({
  stations,
  locale,
  selectedId,
  onSelect,
}: Props) {
  return (
    <div
      className="studio-scroll"
      style={{
        position: 'absolute',
        inset: 0,
        overflowY: 'auto',
        padding: '10px 14px 14px',
      }}
    >
      {stations.length === 0 && (
        <p
          style={{
            color: 'var(--stq-text-mute)',
            fontSize: 13,
            textAlign: 'center',
            padding: 24,
          }}
        >
          No stations yet — add one from the desktop studio.
        </p>
      )}
      {stations.map((station) => (
        <FieldStationCard
          key={station.id}
          station={station}
          locale={locale}
          active={station.id === selectedId}
          onSelect={() => onSelect(station.id)}
        />
      ))}
    </div>
  );
}
