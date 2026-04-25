import type { CSSProperties } from 'react';
import type { RiddleEntry } from '@/schema';
import {
  buildStationIconSvg,
  buildStationMarkerSvg,
  getStationColorOption,
  normalizeStationVisualChoice,
  svgToDataUri,
  type StationVisualChoice,
} from '@/stations/visuals';

interface BaseProps {
  className?: string;
  style?: CSSProperties;
  alt?: string;
}

type Props =
  | ({ station: Pick<RiddleEntry, 'id' | 'iconPath' | 'markerIconPath' | 'iconKey' | 'iconColorKey'> } & BaseProps)
  | ({ choice: StationVisualChoice } & BaseProps);

export function StationIconPreview(props: Props) {
  const choice = 'choice' in props ? props.choice : normalizeStationVisualChoice(props.station);
  return (
    <img
      src={svgToDataUri(buildStationIconSvg(choice))}
      alt={props.alt ?? ''}
      className={props.className}
      style={{
        display: 'block',
        width: 40,
        height: 40,
        ...props.style,
      }}
    />
  );
}

export function StationMarkerPreview(props: Props) {
  const choice =
    'choice' in props ? props.choice : normalizeStationVisualChoice(props.station);
  return (
    <img
      src={svgToDataUri(buildStationMarkerSvg(choice))}
      alt={props.alt ?? ''}
      className={props.className}
      style={{
        display: 'block',
        width: 42,
        height: 64,
        ...props.style,
      }}
    />
  );
}

export function StationRailPreview(props: Props) {
  const choice =
    'choice' in props ? props.choice : normalizeStationVisualChoice(props.station);
  const color = getStationColorOption(choice.iconColorKey);

  return (
    <div
      className={props.className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderRadius: 9999,
        background: '#FFFFFF',
        padding: '10px 12px',
        boxShadow: '0 8px 24px rgba(35, 25, 25, 0.14)',
        ...props.style,
      }}
    >
      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          width: 44,
          height: 44,
          borderRadius: 9999,
          background: color.ring,
          color: '#FFFFFF',
          fontSize: 28,
          fontWeight: 700,
          lineHeight: 1,
          flex: 'none',
        }}
      >
        i
      </div>

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minWidth: 0,
          flex: 1,
          justifyContent: 'center',
        }}
      >
        <RailIcon
          choice={{ iconKey: 'leaf', iconColorKey: 'pine' }}
          tint="#B8B0AF"
        />
        <RailIcon
          choice={{ iconKey: 'star', iconColorKey: 'amber' }}
          tint="#B8B0AF"
        />
        <RailIcon choice={choice} active ringColor={color.ring} />
        <RailIcon
          choice={{ iconKey: 'cup', iconColorKey: 'claret' }}
          tint="#B8B0AF"
        />
      </div>

      <div
        style={{
          color: '#231919',
          fontSize: 36,
          lineHeight: 1,
          flex: 'none',
          padding: '0 2px',
        }}
      >
        ›
      </div>
    </div>
  );
}

function RailIcon({
  choice,
  active = false,
  ringColor,
  tint,
}: {
  choice: StationVisualChoice;
  active?: boolean;
  ringColor?: string;
  tint?: string;
}) {
  if (active) {
    return (
      <div
        style={{
          width: 60,
          height: 60,
          padding: 6,
          borderRadius: 9999,
          border: `3px solid ${ringColor ?? '#A44F4A'}`,
          display: 'grid',
          placeItems: 'center',
          background: '#FFFFFF',
          flex: 'none',
        }}
      >
        <StationIconPreview
          choice={choice}
          style={{ width: 38, height: 38 }}
        />
      </div>
    );
  }

  return (
    <div
      style={{
        width: 48,
        height: 48,
        display: 'grid',
        placeItems: 'center',
        opacity: 1,
        flex: 'none',
      }}
    >
      <StationIconPreview
        choice={choice}
        style={{
          width: 38,
          height: 38,
          filter: tint ? `grayscale(1) brightness(0.72) opacity(0.9)` : undefined,
        }}
      />
    </div>
  );
}
