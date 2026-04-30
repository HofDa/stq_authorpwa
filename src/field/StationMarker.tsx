import {
  getStationColorOption,
  normalizeStationVisualChoice,
} from '@/stations/visuals';
import type { RiddleEntry } from '@/schema';
import type { CSSProperties } from 'react';

interface Props {
  station: RiddleEntry;
  selected?: boolean;
  onSelect: () => void;
  style?: CSSProperties;
}

export function StationMarker({ station, selected, onSelect, style }: Props) {
  const visual = normalizeStationVisualChoice(station);
  const color = getStationColorOption(visual.iconColorKey);

  return (
    <button
      type="button"
      className={`stq-field-native-marker${selected ? ' active' : ''}`}
      onClick={onSelect}
      style={{
        ...style,
        borderColor: color.stroke,
        color: color.stroke,
      }}
      aria-label={`Open station ${station.number}`}
    >
      {station.number}
    </button>
  );
}
