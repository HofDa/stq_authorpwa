import type { Locale, RiddleEntry } from '@/schema';
import { getStationLocationLabel } from '@/utils/localizedContent';
import { Icon } from '@/components/studio/Icon';
import {
  hasSelectedStationIcon,
  normalizeStationVisualChoice,
} from '@/stations/visuals';
import { CenterIcon } from '@/renderer/CenterIcon';

interface Props {
  stations: RiddleEntry[];
  selectedStationId: string | null;
  locale: Locale;
  onSelectStation: (stationId: string) => void;
  onNext?: () => void;
  nextDisabled?: boolean;
}

export function StationPillBar({
  stations,
  selectedStationId,
  locale,
  onSelectStation,
  onNext,
  nextDisabled = false,
}: Props) {
  return (
    <nav className="stq-station-pillbar" aria-label="Stations">
      <button
        type="button"
        className="stq-station-pillbar-info"
        aria-label="Tour info"
      >
        <span>i</span>
      </button>
      {stations.map((station) => (
        <button
          key={station.id}
          type="button"
          className={station.id === selectedStationId ? 'active' : ''}
          onClick={() => onSelectStation(station.id)}
          aria-label={getStationLocationLabel(station, locale)}
        >
          <CenterIcon
            iconPath={hasSelectedStationIcon(station) ? station.iconPath : undefined}
            fallback={station.number}
            visual={
              hasSelectedStationIcon(station)
                ? normalizeStationVisualChoice(station)
                : undefined
            }
          />
        </button>
      ))}
      {onNext && (
        <button
          type="button"
          className="stq-station-pillbar-next"
          onClick={onNext}
          disabled={nextDisabled}
          aria-label="Next station"
        >
          <Icon name="chevron-right" size={34} stroke={2.6} />
        </button>
      )}
    </nav>
  );
}
