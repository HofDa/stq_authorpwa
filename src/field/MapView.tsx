import type { Locale, RecordedRoutePoint, RiddleEntry } from '@/schema';
import { AuthorMap } from '@/components/map/AuthorMap';
import {
  AUTHOR_MAP_CURRENT_POSITION_STYLE_FIELD,
  type AuthorMapBasemapKey,
  type AuthorMapControlAction,
  type AuthorMapCoordinate,
  toAuthorMapCoordinate,
} from '@/components/map/mapTypes';
import { hasUsableStationCoordinate } from '@/utils/coordinates';
import {
  hasSelectedStationIcon,
  normalizeStationVisualChoice,
} from '@/stations/visuals';
import type { CurrentGps } from '@/components/studio/field/types';
import { getStationLocationLabel } from '@/utils/localizedContent';

interface Props {
  stations: RiddleEntry[];
  selectedStationId: string | null;
  locale: Locale;
  gps: CurrentGps | null;
  gpsLive: boolean;
  basemap: AuthorMapBasemapKey;
  recordedRoute?: RecordedRoutePoint[];
  routeEditActive?: boolean;
  stationEditActive?: boolean;
  selectedRouteSegment?: {
    from: AuthorMapCoordinate;
    to: AuthorMapCoordinate;
  } | null;
  onSelectStation: (stationId: string) => void;
  onMapClick?: (coordinate: AuthorMapCoordinate) => void;
  draggableStationIds?: string[];
  onStationCoordinateChange?: (
    stationId: string,
    coordinate: { lat: number; lng: number },
  ) => void;
  onRoutePointCoordinateChange?: (
    routePointId: string,
    coordinate: { lat: number; lng: number },
  ) => void;
  navigationSegment?: {
    from: AuthorMapCoordinate;
    to: AuthorMapCoordinate;
    progress: number;
    trigger: string;
  } | null;
  controlAction?: AuthorMapControlAction | null;
}

const DEFAULT_CENTER = { lat: 46.6703, lng: 11.1594 };
const FIELD_ROUTE_COLOR = '#2196f3';
const ROUTE_STATION_SNAP_METERS = 20;
const EARTH_RADIUS_METERS = 6_371_000;

export function MapView({
  stations,
  selectedStationId,
  locale,
  gps,
  gpsLive,
  basemap,
  recordedRoute = [],
  routeEditActive = false,
  stationEditActive = false,
  selectedRouteSegment = null,
  onSelectStation,
  onMapClick,
  draggableStationIds = [],
  onStationCoordinateChange,
  onRoutePointCoordinateChange,
  navigationSegment = null,
  controlAction = null,
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
  const routeLayers = buildRouteLayers({
    recordedRoute: normalizeRouteStationAnchors(recordedRoute, stationsWithCoordinates),
    routeEditActive,
    selectedRouteSegment,
    navigationRoutePoints,
  });
  const routePointMarkers = buildRoutePointMarkers({
    recordedRoute,
    stationsWithCoordinates,
    routeEditActive,
  });
  const mapStations = buildMapStations({
    stationsWithCoordinates,
    selected,
    selectedStationId,
    center,
    locale,
  });

  return (
    <AuthorMap
      className="stq-field-author-map"
      stations={mapStations}
      selectedStationId={selectedStationId}
      routes={routeLayers}
      routePointMarkers={routePointMarkers}
      currentPosition={
        gps
          ? {
              coordinate: toAuthorMapCoordinate(gps),
              accuracyMeters: gps.accuracy,
            }
          : null
      }
      controlAction={controlAction}
      currentPositionStyle={AUTHOR_MAP_CURRENT_POSITION_STYLE_FIELD}
      basemap={basemap}
      onSelectStation={onSelectStation}
      onMapClick={routeEditActive || stationEditActive ? onMapClick : undefined}
      draggableStationIds={draggableStationIds}
      onStationCoordinateChange={onStationCoordinateChange}
      onRoutePointCoordinateChange={onRoutePointCoordinateChange}
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

function buildMapStations({
  stationsWithCoordinates,
  selected,
  selectedStationId,
  center,
  locale,
}: {
  stationsWithCoordinates: RiddleEntry[];
  selected: RiddleEntry | null;
  selectedStationId: string | null;
  center: AuthorMapCoordinate;
  locale: Locale;
}) {
  const positioned = stationsWithCoordinates.map((station) =>
    toMapStation(station, {
      lat: station.position_lat,
      lng: station.position_lng,
    }, locale),
  );

  if (
    selected &&
    selected.id === selectedStationId &&
    !hasUsableStationCoordinate(selected) &&
    !positioned.some((station) => station.id === selected.id)
  ) {
    positioned.push(toMapStation(selected, center, locale));
  }

  return positioned;
}

function toMapStation(
  station: RiddleEntry,
  coordinate: AuthorMapCoordinate,
  locale: Locale,
) {
  return {
    id: station.id,
    number: station.number,
    coordinate,
    visual: normalizeStationVisualChoice(station),
    hasSelectedIcon: hasSelectedStationIcon(station),
    label: getStationLocationLabel(station, locale),
  };
}

function buildRouteLayers({
  recordedRoute,
  routeEditActive,
  selectedRouteSegment,
  navigationRoutePoints,
}: {
  recordedRoute: RecordedRoutePoint[];
  routeEditActive: boolean;
  selectedRouteSegment: { from: AuthorMapCoordinate; to: AuthorMapCoordinate } | null;
  navigationRoutePoints: AuthorMapCoordinate[];
}) {
  const routes = [];

  if (routeEditActive && selectedRouteSegment) {
    routes.push({
      id: 'field-selected-route-guide',
      points: [selectedRouteSegment.from, selectedRouteSegment.to],
      style: {
        color: FIELD_ROUTE_COLOR,
        weight: 5,
        opacity: 0.8,
        dashArray: '6 7',
      },
    });
  }

  if (recordedRoute.length >= 2) {
    routes.push({
      id: 'field-recorded-route',
      points: recordedRoute.map(toAuthorMapCoordinate),
      style: {
        color: FIELD_ROUTE_COLOR,
        weight: routeEditActive ? 6 : 4,
        opacity: routeEditActive ? 0.95 : 0.7,
      },
    });
  }

  if (navigationRoutePoints.length >= 2) {
    routes.push({
      id: 'field-app-navigation-route',
      points: navigationRoutePoints,
      style: {
        color: FIELD_ROUTE_COLOR,
        weight: 7,
        opacity: 0.98,
      },
    });
  }

  return routes;
}

function normalizeRouteStationAnchors(
  recordedRoute: RecordedRoutePoint[],
  stationsWithCoordinates: RiddleEntry[],
) {
  return recordedRoute.map((point) => {
    const station = findNearbyStation(point, stationsWithCoordinates);
    return station
      ? {
          ...point,
          lat: station.position_lat,
          lng: station.position_lng,
        }
      : point;
  });
}

function buildRoutePointMarkers({
  recordedRoute,
  stationsWithCoordinates,
  routeEditActive,
}: {
  recordedRoute: RecordedRoutePoint[];
  stationsWithCoordinates: RiddleEntry[];
  routeEditActive: boolean;
}) {
  if (!routeEditActive) {
    return [];
  }

  return recordedRoute
    .map((point, index) => ({ point, index }))
    .filter(({ point }) => !findNearbyStation(point, stationsWithCoordinates))
    .map(({ point, index }) => ({
      id: String(index),
      coordinate: toAuthorMapCoordinate(point),
      color: FIELD_ROUTE_COLOR,
      draggable: true,
    }));
}

function findNearbyStation(
  point: { lat: number; lng: number },
  stationsWithCoordinates: RiddleEntry[],
) {
  return (
    stationsWithCoordinates.find(
      (station) =>
        distanceMeters(point, {
          lat: station.position_lat,
          lng: station.position_lng,
        }) <= ROUTE_STATION_SNAP_METERS,
    ) ?? null
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

function distanceMeters(
  left: { lat: number; lng: number },
  right: { lat: number; lng: number },
) {
  const lat1 = left.lat * (Math.PI / 180);
  const lat2 = right.lat * (Math.PI / 180);
  const deltaLat = (right.lat - left.lat) * (Math.PI / 180);
  const deltaLng = (right.lng - left.lng) * (Math.PI / 180);
  const a =
    Math.sin(deltaLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(deltaLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
