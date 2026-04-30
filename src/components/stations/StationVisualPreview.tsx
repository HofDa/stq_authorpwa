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

type StationLike = Pick<
  RiddleEntry,
  'id' | 'iconPath' | 'markerIconPath' | 'iconKey' | 'iconColorKey'
>;

type Props =
  | ({ station: StationLike } & BaseProps)
  | ({ choice: StationVisualChoice } & BaseProps);

interface RailProps extends BaseProps {
  station: StationLike;
  stations?: ReadonlyArray<StationLike>;
  activeStationId?: string;
}

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

export function StationRailPreview({
  station,
  stations,
  activeStationId,
  className,
  style,
}: RailProps) {
  const activeChoice = normalizeStationVisualChoice(station);
  const activeColor = getStationColorOption(activeChoice.iconColorKey);
  const railStations = stations && stations.length > 0 ? stations : [station];
  const activeId = activeStationId ?? station.id;

  return (
    <div
      className={className}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 10,
        borderRadius: 9999,
        background: '#FFFFFF',
        padding: '10px 12px',
        boxShadow: '0 8px 24px rgba(35, 25, 25, 0.14)',
        minWidth: 0,
        ...style,
      }}
    >
      <div
        style={{
          display: 'grid',
          placeItems: 'center',
          width: 44,
          height: 44,
          borderRadius: 9999,
          background: activeColor.ring,
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
        className="stq-station-rail-track"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          minWidth: 0,
          flex: 1,
          overflowX: 'auto',
          scrollbarWidth: 'none',
          padding: '2px 4px',
        }}
      >
        {railStations.map((entry) => {
          const choice = normalizeStationVisualChoice(entry);
          const isActive = entry.id === activeId;
          if (isActive) {
            return (
              <RailIcon
                key={entry.id}
                choice={choice}
                active
                ringColor={activeColor.ring}
              />
            );
          }
          return <RailIcon key={entry.id} choice={choice} tint="#B8B0AF" />;
        })}
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
