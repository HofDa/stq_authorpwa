import type { Locale, RiddleEntry } from '@/schema';
import { AuthorMap } from '@/components/map/AuthorMap';
import {
  AUTHOR_MAP_CURRENT_POSITION_STYLE_FIELD,
  type AuthorMapBasemapKey,
  type AuthorMapCoordinate,
  toAuthorMapCoordinate,
} from '@/components/map/mapTypes';
import { hasUsableStationCoordinate } from '@/utils/coordinates';
import { normalizeStationVisualChoice } from '@/stations/visuals';
import type { CurrentGps } from '@/components/studio/field/types';
import { getStationLocationLabel } from '@/utils/localizedContent';
import { StationMarker } from './StationMarker';

interface Props {
  stations: RiddleEntry[];
  selectedStationId: string | null;
  locale: Locale;
  gps: CurrentGps | null;
  gpsLive: boolean;
  basemap: AuthorMapBasemapKey;
  onSelectStation: (stationId: string) => void;
  draggableStationIds?: string[];
  onStationCoordinateChange?: (
    stationId: string,
    coordinate: { lat: number; lng: number },
  ) => void;
  navigationSegment?: {
    from: AuthorMapCoordinate;
    to: AuthorMapCoordinate;
    progress: number;
    trigger: string;
  } | null;
}

const DEFAULT_CENTER = { lat: 46.6703, lng: 11.1594 };

export function MapView({
  stations,
  selectedStationId,
  locale,
  gps,
  gpsLive,
  basemap,
  onSelectStation,
  draggableStationIds = [],
  onStationCoordinateChange,
  navigationSegment = null,
}: Props) {
  const stationsWithCoordinates = stations.filter(hasUsableStationCoordinate);
  const selected = stations.find((station) => station.id === selectedStationId) ?? null;
  const center =
    selected && hasUsableStationCoordinate(selected)
      ? { lat: selected.position_lat, lng: selected.position_lng }
      : gps
        ? toAuthorMapCoordinate(gps)
        : stationsWithCoordinates[0]
          ? {
              lat: stationsWithCoordinates[0].position_lat,
              lng: stationsWithCoordinates[0].position_lng,
            }
          : DEFAULT_CENTER;
  const navigationRoutePoints = navigationSegment
    ? buildNavigationRoutePoints(
        navigationSegment.from,
        navigationSegment.to,
        navigationSegment.progress,
      )
    : [];

  if (stationsWithCoordinates.length === 0 && !gps) {
    return (
      <div className="stq-field-placeholder-map">
        <div className="stq-field-placeholder-current" />
        {stations.map((station, index) => (
          <StationMarker
            key={station.id}
            station={station}
            selected={station.id === selectedStationId}
            onSelect={() => onSelectStation(station.id)}
            style={{
              position: 'absolute',
              left: `${24 + (index % 3) * 26}%`,
              top: `${30 + Math.floor(index / 3) * 18}%`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <AuthorMap
      stations={stationsWithCoordinates.map((station) => ({
        id: station.id,
        number: station.number,
        coordinate: {
          lat: station.position_lat,
          lng: station.position_lng,
        },
        visual: normalizeStationVisualChoice(station),
        label: getStationLocationLabel(station, locale),
      }))}
      selectedStationId={selectedStationId}
      routes={
        navigationRoutePoints.length >= 2
          ? [
              {
                id: 'field-app-navigation-route',
                points: navigationRoutePoints,
                style: {
                  color: '#2196f3',
                  weight: 7,
                  opacity: 0.98,
                },
              },
            ]
          : []
      }
      currentPosition={
        gps
          ? {
              coordinate: toAuthorMapCoordinate(gps),
              accuracyMeters: gps.accuracy,
            }
          : null
      }
      currentPositionStyle={AUTHOR_MAP_CURRENT_POSITION_STYLE_FIELD}
      basemap={basemap}
      onSelectStation={onSelectStation}
      draggableStationIds={draggableStationIds}
      onStationCoordinateChange={onStationCoordinateChange}
      viewport={{
        center,
        zoom: 15,
        fitToCoordinates: navigationSegment
          ? [navigationSegment.from, navigationSegment.to]
          : undefined,
        fitPadding: [86, 56],
        fitMaxZoom: 17,
        fitTrigger: navigationSegment?.trigger,
        panToSelectedStation: true,
        flyToCurrentPositionOnActivate: gpsLive,
        currentPositionFlyToMaxZoom: 17,
      }}
      zoomControl={false}
      style={{ height: '100%', width: '100%' }}
    />
  );
}

function buildNavigationRoutePoints(
  from: AuthorMapCoordinate,
  to: AuthorMapCoordinate,
  progress: number,
): AuthorMapCoordinate[] {
  const bend = createSoftBend(from, to);
  const route = [from, bend, to];
  return trimRoute(route, Math.max(0.001, Math.min(1, progress)));
}

function createSoftBend(
  from: AuthorMapCoordinate,
  to: AuthorMapCoordinate,
): AuthorMapCoordinate {
  const latDelta = to.lat - from.lat;
  const lngDelta = to.lng - from.lng;
  const distance = Math.hypot(latDelta, lngDelta);
  const offsetScale = Math.min(distance * 0.22, 0.00045);

  return {
    lat: from.lat + latDelta * 0.58 - lngDelta * offsetScale * 1600,
    lng: from.lng + lngDelta * 0.52 + latDelta * offsetScale * 1600,
  };
}

function trimRoute(
  route: AuthorMapCoordinate[],
  progress: number,
): AuthorMapCoordinate[] {
  const segmentLengths = route.slice(1).map((point, index) =>
    coordinateDistance(route[index], point),
  );
  const totalLength = segmentLengths.reduce((sum, length) => sum + length, 0);
  if (totalLength <= 0) return [route[0], route[route.length - 1]];

  let remaining = totalLength * progress;
  const points = [route[0]];

  for (let index = 1; index < route.length; index += 1) {
    const segmentLength = segmentLengths[index - 1];
    if (remaining >= segmentLength) {
      points.push(route[index]);
      remaining -= segmentLength;
      continue;
    }

    const ratio = segmentLength === 0 ? 1 : remaining / segmentLength;
    points.push(interpolateCoordinate(route[index - 1], route[index], ratio));
    break;
  }

  return points;
}

function coordinateDistance(
  from: AuthorMapCoordinate,
  to: AuthorMapCoordinate,
) {
  return Math.hypot(to.lat - from.lat, to.lng - from.lng);
}

function interpolateCoordinate(
  from: AuthorMapCoordinate,
  to: AuthorMapCoordinate,
  ratio: number,
): AuthorMapCoordinate {
  return {
    lat: from.lat + (to.lat - from.lat) * ratio,
    lng: from.lng + (to.lng - from.lng) * ratio,
  };
}
