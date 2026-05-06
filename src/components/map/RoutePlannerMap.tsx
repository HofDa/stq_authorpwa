import type { RecordedRoutePoint, RiddleEntry } from '@/schema';
import {
  hasSelectedStationIcon,
  normalizeStationVisualChoice,
} from '@/stations/visuals';
import { hasUsableStationCoordinate } from '@/utils/coordinates';
import { AuthorMap } from './AuthorMap';
import {
  AUTHOR_MAP_CURRENT_POSITION_STYLE_PLANNER,
  AUTHOR_MAP_SELECTION_STYLE_PLANNER,
  toAuthorMapCoordinate,
} from './mapTypes';

interface Props {
  stations: RiddleEntry[];
  recordedRoute: RecordedRoutePoint[];
  optimizedRoute: RecordedRoutePoint[];
  currentPosition: RecordedRoutePoint | null;
  selectedStationId: string;
  fitTrigger: number;
  onSelectStation: (stationId: string) => void;
}

const DEFAULT_CENTER = { lat: 46.6703, lng: 11.1594 };

export function RoutePlannerMap({
  stations,
  recordedRoute,
  optimizedRoute,
  currentPosition,
  selectedStationId,
  fitTrigger,
  onSelectStation,
}: Props) {
  const stationsWithCoordinates = stations.filter(hasUsableStationCoordinate);
  const mapStations = stationsWithCoordinates.map((station) => ({
    id: station.id,
    number: station.number,
    coordinate: {
      lat: station.position_lat,
      lng: station.position_lng,
    },
    tooltip: `Station ${station.number}`,
    visual: normalizeStationVisualChoice(station),
    hasSelectedIcon: hasSelectedStationIcon(station),
  }));
  const mapPoints = collectMapPoints(
    recordedRoute,
    optimizedRoute,
    stationsWithCoordinates,
    currentPosition,
  );
  const fitTriggerKey = `${fitTrigger}:${mapPoints.length}:${
    mapPoints[mapPoints.length - 1]
      ? `${mapPoints[mapPoints.length - 1].lat},${mapPoints[mapPoints.length - 1].lng}`
      : 'none'
  }`;

  return (
    <div
      className="stq-map-shell"
      style={{ position: 'absolute', inset: 0, overflow: 'hidden' }}
    >
      <AuthorMap
        stations={mapStations}
        selectedStationId={selectedStationId}
        routes={[
          {
            id: 'recorded-route',
            points: recordedRoute.map(toAuthorMapCoordinate),
            style: {
              color: '#2196f3',
              weight: 4,
              opacity: 0.45,
              dashArray: '8 10',
            },
          },
          {
            id: 'optimized-route',
            points: optimizedRoute.map(toAuthorMapCoordinate),
            style: {
              color: '#0d7fe8',
              weight: 6,
              opacity: 0.95,
            },
          },
        ]}
        currentPosition={
          currentPosition
            ? {
                coordinate: toAuthorMapCoordinate(currentPosition),
                accuracyMeters: currentPosition.accuracy,
              }
            : null
        }
        currentPositionStyle={AUTHOR_MAP_CURRENT_POSITION_STYLE_PLANNER}
        selectionStyle={AUTHOR_MAP_SELECTION_STYLE_PLANNER}
        onSelectStation={onSelectStation}
        viewport={{
          center: DEFAULT_CENTER,
          zoom: 15,
          fitToCoordinates: mapPoints,
          fitPadding: [28, 28],
          fitMaxZoom: 17,
          fitTrigger: fitTriggerKey,
        }}
        style={{ width: '100%', height: '100%' }}
      />
    </div>
  );
}

function collectMapPoints(
  recordedRoute: RecordedRoutePoint[],
  optimizedRoute: RecordedRoutePoint[],
  stations: RiddleEntry[],
  currentPosition: RecordedRoutePoint | null,
) {
  const points: { lat: number; lng: number }[] = [];

  for (const point of recordedRoute) {
    points.push(toAuthorMapCoordinate(point));
  }
  for (const point of optimizedRoute) {
    points.push(toAuthorMapCoordinate(point));
  }
  for (const station of stations) {
    points.push({
      lat: station.position_lat,
      lng: station.position_lng,
    });
  }
  if (currentPosition) {
    points.push(toAuthorMapCoordinate(currentPosition));
  }

  return points;
}
