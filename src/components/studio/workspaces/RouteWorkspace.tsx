import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { calculateRouteLengthMeters } from '@/map/routePlanning';
import { hasUsableStationCoordinate } from '@/utils/coordinates';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import {
  toAuthorMapCoordinate,
  type AuthorMapCoordinate,
  type AuthorMapRoute,
  type AuthorMapRoutePointMarker,
} from '@/components/map/mapTypes';
import type { RecordedRoutePoint, RiddleEntry } from '@/schema';
import { Icon } from '../Icon';
import { PhoneMapMockup } from './PhoneMapMockup';
import type { BaseWorkspaceProps } from './workspaceTypes';

interface Props extends BaseWorkspaceProps {
  selectedId: string | null;
  onSelectStation: (id: string) => void;
  editable?: boolean;
  topRightPill?: ReactNode;
}

const FIELD_ROUTE_COLOR = '#2196f3';
const ROUTE_STATION_SNAP_METERS = 20;
const ROUTE_DUPLICATE_POINT_METERS = 1;
const EARTH_RADIUS_METERS = 6_371_000;

export function RouteWorkspace({
  draft,
  locale,
  selectedId,
  onSelectStation,
  onChange,
  editable = true,
  topRightPill,
}: Props) {
  const { t } = useEditorLanguage();
  const [focusEnabled, setFocusEnabled] = useState(false);
  const [focusTrigger, setFocusTrigger] = useState<string | null>(null);
  const [selectedSegmentFromId, setSelectedSegmentFromId] = useState<string | null>(
    null,
  );
  const [pendingSegmentPoints, setPendingSegmentPoints] = useState<
    RecordedRoutePoint[] | null
  >(null);

  // Segment selection lives entirely inside this workspace. The arrow
  // between station N and N+1 in the dock selects station N as the
  // segment origin; tapping the same arrow again leaves it selected.
  const validSegmentOrigins = useMemo(
    () =>
      draft.stations
        .slice(0, Math.max(0, draft.stations.length - 1))
        .map((station) => station.id),
    [draft.stations],
  );
  useEffect(() => {
    if (
      selectedSegmentFromId &&
      validSegmentOrigins.includes(selectedSegmentFromId)
    ) {
      return;
    }
    setSelectedSegmentFromId(validSegmentOrigins[0] ?? null);
  }, [validSegmentOrigins, selectedSegmentFromId]);
  useEffect(() => {
    setPendingSegmentPoints(null);
  }, [selectedSegmentFromId]);
  useEffect(() => {
    if (!editable) {
      setPendingSegmentPoints(null);
    }
  }, [editable]);

  const segmentFromIndex = selectedSegmentFromId
    ? draft.stations.findIndex((station) => station.id === selectedSegmentFromId)
    : -1;
  const selectedStation =
    segmentFromIndex >= 0 ? draft.stations[segmentFromIndex] : null;
  const nextStation =
    segmentFromIndex >= 0 && segmentFromIndex < draft.stations.length - 1
      ? draft.stations[segmentFromIndex + 1]
      : null;

  const selectedRouteSegment = useMemo(
    () =>
      selectedStation &&
      nextStation &&
      hasUsableStationCoordinate(selectedStation) &&
      hasUsableStationCoordinate(nextStation)
        ? {
            from: {
              lat: selectedStation.position_lat,
              lng: selectedStation.position_lng,
            },
            to: { lat: nextStation.position_lat, lng: nextStation.position_lng },
          }
        : null,
    [selectedStation, nextStation],
  );

  const stationsWithCoordinates = useMemo(
    () => draft.stations.filter(hasUsableStationCoordinate),
    [draft.stations],
  );

  // Find the [start, end] slice of recordedRoute that belongs to the
  // currently selected segment. Slice is inclusive of the anchor points.
  // If either endpoint anchor isn't found, returns null.
  const segmentSlice = useMemo(
    () =>
      selectedStation && nextStation
        ? findSegmentSlice(draft.recordedRoute, selectedStation, nextStation)
        : null,
    [selectedStation, nextStation, draft.recordedRoute],
  );
  const savedSelectedSegmentPoints = useMemo(
    () =>
      segmentSlice
        ? draft.recordedRoute.slice(segmentSlice.start, segmentSlice.end + 1)
        : null,
    [segmentSlice, draft.recordedRoute],
  );
  const activeSegmentPoints = useMemo(
    () => pendingSegmentPoints ?? savedSelectedSegmentPoints ?? [],
    [pendingSegmentPoints, savedSelectedSegmentPoints],
  );

  const recordedSegmentSlices = useMemo(
    () => getRecordedSegmentSlices(draft.stations, draft.recordedRoute),
    [draft.stations, draft.recordedRoute],
  );
  const drawableSegmentSlices = useMemo(
    () =>
      recordedSegmentSlices.filter(
        (slice) => slice.end - slice.start > 1,
      ),
    [recordedSegmentSlices],
  );
  const routePointMarkers = useMemo<AuthorMapRoutePointMarker[]>(
    () =>
      activeSegmentPoints
        .map((point, index) => ({ point, index }))
        .filter(({ point }) => !findNearbyStation(point, stationsWithCoordinates))
        .map(({ point, index }) => ({
          id: String(index),
          coordinate: toAuthorMapCoordinate(point),
          color: FIELD_ROUTE_COLOR,
          draggable: true,
        })),
    [activeSegmentPoints, stationsWithCoordinates],
  );

  const routes = useMemo<AuthorMapRoute[]>(() => {
    const list: AuthorMapRoute[] = [];

    // Default solid blue connector between every consecutive station pair
    // that has no drawn route yet. The user refines by clicking points and
    // confirming with the check button.
    for (let index = 0; index < draft.stations.length - 1; index += 1) {
      const fromStation = draft.stations[index];
      const toStation = draft.stations[index + 1];
      if (
        !hasUsableStationCoordinate(fromStation) ||
        !hasUsableStationCoordinate(toStation)
      ) {
        continue;
      }
      const existingSlice = findSegmentSlice(
        draft.recordedRoute,
        fromStation,
        toStation,
      );
      if (existingSlice && existingSlice.end - existingSlice.start > 1) {
        continue;
      }
      if (
        pendingSegmentPoints &&
        selectedStation?.id === fromStation.id &&
        nextStation?.id === toStation.id
      ) {
        continue;
      }
      list.push({
        id: `studio-route-segment-default-${index}`,
        points: [
          { lat: fromStation.position_lat, lng: fromStation.position_lng },
          { lat: toStation.position_lat, lng: toStation.position_lng },
        ],
        style: {
          color: FIELD_ROUTE_COLOR,
          weight: 5,
          opacity: 0.85,
        },
      });
    }

    for (let index = 0; index < draft.stations.length - 1; index += 1) {
      const fromStation = draft.stations[index];
      const toStation = draft.stations[index + 1];
      if (
        !hasUsableStationCoordinate(fromStation) ||
        !hasUsableStationCoordinate(toStation)
      ) {
        continue;
      }
      const slice = findSegmentSlice(
        draft.recordedRoute,
        fromStation,
        toStation,
      );
      if (!slice || slice.end - slice.start <= 1) continue;
      if (
        pendingSegmentPoints &&
        selectedStation?.id === fromStation.id &&
        nextStation?.id === toStation.id
      ) {
        continue;
      }
      const points = draft.recordedRoute
        .slice(slice.start, slice.end + 1)
        .map(toAuthorMapCoordinate);
      list.push({
        id: `studio-recorded-route-segment-${index}`,
        points,
        style: {
          color: FIELD_ROUTE_COLOR,
          weight: 6,
          opacity: 0.95,
        },
      });
    }

    if (
      pendingSegmentPoints &&
      pendingSegmentPoints.length >= 1 &&
      selectedStation &&
      nextStation &&
      hasUsableStationCoordinate(selectedStation) &&
      hasUsableStationCoordinate(nextStation)
    ) {
      const fromAnchor = {
        lat: selectedStation.position_lat,
        lng: selectedStation.position_lng,
      };
      const toAnchor = {
        lat: nextStation.position_lat,
        lng: nextStation.position_lng,
      };
      const interior = pendingSegmentPoints
        .map(toAuthorMapCoordinate)
        .filter(
          (point) =>
            !isNearStation(point, selectedStation) &&
            !isNearStation(point, nextStation),
        );
      list.push({
        id: 'studio-recorded-route-pending-segment',
        points: [fromAnchor, ...interior, toAnchor],
        style: {
          color: FIELD_ROUTE_COLOR,
          weight: 6,
          opacity: 0.95,
        },
      });
    }

    return list;
  }, [
    draft.stations,
    drawableSegmentSlices,
    pendingSegmentPoints,
    segmentSlice,
    selectedStation,
    nextStation,
    draft.recordedRoute,
  ]);

  const fitPoints = useMemo<AuthorMapCoordinate[]>(() => {
    const stationPoints = stationsWithCoordinates.map((station) => ({
      lat: station.position_lat,
      lng: station.position_lng,
    }));
    const routePoints = [
      ...draft.recordedRoute.map(toAuthorMapCoordinate),
      ...activeSegmentPoints.map(toAuthorMapCoordinate),
    ];
    return [...stationPoints, ...routePoints];
  }, [stationsWithCoordinates, draft.recordedRoute, activeSegmentPoints]);

  const fitSignature = useMemo(
    () =>
      fitPoints
        .map((point) => `${point.lat.toFixed(6)},${point.lng.toFixed(6)}`)
        .join('|'),
    [fitPoints],
  );

  function appendRoutePoint(coordinate: AuthorMapCoordinate) {
    if (!editable) {
      return;
    }
    if (!selectedStation || !hasUsableStationCoordinate(selectedStation)) {
      return;
    }
    const nearbyStation = findNearbyStation(coordinate, stationsWithCoordinates);
    const snapped = nearbyStation
      ? { lat: nearbyStation.position_lat, lng: nearbyStation.position_lng }
      : coordinate;
    const point: RecordedRoutePoint = {
      lat: snapped.lat,
      lng: snapped.lng,
      timestamp: Date.now(),
    };

    setPendingSegmentPoints((current) => {
      const base =
        current ??
        savedSelectedSegmentPoints?.slice() ??
        [stationAnchorPoint(selectedStation, point.timestamp - 1)];
      const next = [...base];
      const insertAt =
        nextStation &&
        next.length > 1 &&
        isNearStation(next[next.length - 1], nextStation)
          ? next.length - 1
          : next.length;
      const previous = next[insertAt - 1];
      if (
        previous &&
        distanceMeters(previous, point) <= ROUTE_DUPLICATE_POINT_METERS
      ) {
        return current ?? base;
      }
      next.splice(insertAt, 0, point);
      return next;
    });
  }

  function saveSegment() {
    if (
      !editable ||
      !pendingSegmentPoints ||
      !selectedStation ||
      !nextStation ||
      !hasUsableStationCoordinate(selectedStation) ||
      !hasUsableStationCoordinate(nextStation)
    ) {
      return;
    }
    const now = Date.now();
    const segment = normalizeSegmentForSave(
      pendingSegmentPoints,
      selectedStation,
      nextStation,
      now,
    );
    if (segment.length < 2) {
      return;
    }
    onChange((prev) => {
      const nextRoute = [...prev.recordedRoute];
      const existingSlice = findSegmentSlice(
        nextRoute,
        selectedStation,
        nextStation,
      );
      if (existingSlice) {
        nextRoute.splice(
          existingSlice.start,
          existingSlice.end - existingSlice.start + 1,
          ...segment,
        );
        return { ...prev, recordedRoute: nextRoute };
      }

      const fromAnchorIndex = findNearestStationAnchorIndex(
        nextRoute,
        selectedStation,
      );
      if (fromAnchorIndex >= 0) {
        nextRoute.splice(fromAnchorIndex, 1, ...segment);
      } else {
        nextRoute.push(...segment);
      }
      return { ...prev, recordedRoute: nextRoute };
    });
    setPendingSegmentPoints(null);
    // Advance the in-workspace segment selection to the next pair, if any.
    const nextNextIndex = segmentFromIndex + 1;
    if (
      nextNextIndex >= 0 &&
      nextNextIndex < draft.stations.length - 1
    ) {
      setSelectedSegmentFromId(draft.stations[nextNextIndex].id);
    }
  }

  // Tapping a station on the map: if it's the next-in-line, finish the
  // segment; otherwise append its coordinate as a route waypoint
  // (matches field mode's shortcut).
  function handleStationSelect(stationId: string) {
    const station = draft.stations.find((s) => s.id === stationId);
    if (!station || !hasUsableStationCoordinate(station)) return;
    appendRoutePoint({
      lat: station.position_lat,
      lng: station.position_lng,
    });
  }

  function handleMapClick(coordinate: AuthorMapCoordinate) {
    appendRoutePoint(coordinate);
  }

  function handleRoutePointDrag(
    routePointId: string,
    coordinate: AuthorMapCoordinate,
  ) {
    const index = Number(routePointId);
    if (!Number.isInteger(index) || index < 0) return;
    setPendingSegmentPoints((current) => {
      const base = current ?? savedSelectedSegmentPoints?.slice();
      if (!base || index >= base.length) return current;
      return base.map((point, i) =>
        i === index
          ? { ...point, lat: coordinate.lat, lng: coordinate.lng, timestamp: Date.now() }
          : point,
      );
    });
  }

  // Remove the last pending point. Saved segments are first copied into a
  // pending edit so undo does not mutate the stored route until Save.
  function undoLast() {
    setPendingSegmentPoints((current) => {
      const base = current ?? savedSelectedSegmentPoints?.slice();
      if (!base || base.length <= 1) return current;
      const next = [...base];
      if (
        nextStation &&
        next.length > 2 &&
        isNearStation(next[next.length - 1], nextStation)
      ) {
        next.splice(next.length - 2, 1);
      } else {
        next.pop();
      }
      return next.length > 0 ? next : null;
    });
  }

  // Delete the selected segment only: keep both station anchors for adjacent
  // segment lookup, but remove every drawable point between them. Segment
  // rendering ignores anchor-only slices so this does not reconnect as a
  // straight line.
  function clearSegment() {
    setPendingSegmentPoints(null);
    if (!segmentSlice) return;
    const { start, end } = segmentSlice;
    if (end - start <= 1) return;
    onChange((prev) => ({
      ...prev,
      recordedRoute: [
        ...prev.recordedRoute.slice(0, start + 1),
        ...prev.recordedRoute.slice(end),
      ],
    }));
  }

  function toggleFocus() {
    if (focusEnabled) {
      setFocusEnabled(false);
      setFocusTrigger(null);
      return;
    }
    if (fitPoints.length < 2) return;
    setFocusEnabled(true);
    setFocusTrigger(String(Date.now()));
  }

  const totalDistance = useMemo(
    () =>
      drawableSegmentSlices.reduce(
        (total, slice) => {
          if (
            pendingSegmentPoints &&
            segmentSlice &&
            slice.start === segmentSlice.start &&
            slice.end === segmentSlice.end
          ) {
            return total;
          }
          return (
            total +
            calculateRouteLengthMeters(
              draft.recordedRoute.slice(slice.start, slice.end + 1),
            )
          );
        },
        0,
      ) +
      (pendingSegmentPoints
        ? calculateRouteLengthMeters(pendingSegmentPoints)
        : 0),
    [drawableSegmentSlices, pendingSegmentPoints, segmentSlice, draft.recordedRoute],
  );

  const fromLabel = selectedStation
    ? selectedStation[locale].location || `${t('studio.station')} ${selectedStation.number}`
    : '—';
  const toLabel = nextStation
    ? nextStation[locale].location || `${t('studio.station')} ${nextStation.number}`
    : '—';
  const canSaveSegment =
    Boolean(
      editable &&
        pendingSegmentPoints &&
        selectedStation &&
        nextStation &&
        hasUsableStationCoordinate(selectedStation) &&
        hasUsableStationCoordinate(nextStation),
    ) &&
    normalizeSegmentForSave(
      pendingSegmentPoints ?? [],
      selectedStation!,
      nextStation!,
      Date.now(),
    ).length >= 2;

  const routeEditorTools = (
    <>
      <button
        type="button"
        className={focusEnabled ? 'is-active' : ''}
        onClick={toggleFocus}
        disabled={!focusEnabled && fitPoints.length < 2}
        aria-label="Focus route"
        aria-pressed={focusEnabled}
      >
        <Icon name="compass" size={15} />
      </button>
      <button
        type="button"
        onClick={saveSegment}
        disabled={!canSaveSegment}
        aria-label="Save segment"
      >
        <Icon name="check" size={15} />
      </button>
      <button
        type="button"
        onClick={undoLast}
        disabled={
          pendingSegmentPoints
            ? pendingSegmentPoints.length <= 1
            : !savedSelectedSegmentPoints || savedSelectedSegmentPoints.length <= 1
        }
        aria-label="Undo last point in this segment"
      >
        <Icon name="chevron-left" size={15} />
      </button>
      <button
        type="button"
        onClick={clearSegment}
        disabled={
          !segmentSlice || segmentSlice.end - segmentSlice.start <= 1
        }
        aria-label="Delete current segment"
      >
        <Icon name="trash" size={15} />
      </button>
    </>
  );

  return (
    <PhoneMapMockup
      draft={draft}
      locale={locale}
      selectedId={selectedId}
      onSelectStation={editable ? handleStationSelect : onSelectStation}
      detail={t('workflow.route')}
      routes={routes}
      routePointMarkers={editable ? routePointMarkers : undefined}
      onRoutePointCoordinateChange={
        editable ? handleRoutePointDrag : undefined
      }
      onMapClick={editable ? handleMapClick : undefined}
      onRouteClick={
        editable
          ? (routeId) => {
              const match = routeId.match(/-(\d+)$/);
              if (!match) return;
              const segmentIndex = Number(match[1]);
              const fromStation = draft.stations[segmentIndex];
              if (!fromStation) return;
              setSelectedSegmentFromId(fromStation.id);
            }
          : undefined
      }
      topRightPill={
        topRightPill || editable ? (
          <>
            {topRightPill}
            {editable && (
              <div className="stq-mobile-map-edit-actions">
                {routeEditorTools}
              </div>
            )}
          </>
        ) : undefined
      }
      showLayersControl
      fitToCoordinates={focusEnabled && fitPoints.length > 1 ? fitPoints : undefined}
      fitTrigger={focusEnabled ? `${focusTrigger ?? 'on'}:${fitSignature}` : undefined}
      bottomSheet={
        <div className="stq-phone-map-route-stats">
          <span>{t('workflow.route')}</span>
          <strong>{formatDistance(totalDistance)}</strong>
          <small>
            {fromLabel} → {toLabel} · {draft.recordedRoute.length} {t('studio.points')}
          </small>
        </div>
      }
      segmentArrows={
        editable
          ? {
              selectedFromId: selectedSegmentFromId,
              onSelect: (fromStationId) => {
                setSelectedSegmentFromId(fromStationId);
              },
            }
          : undefined
      }
    />
  );
}

function snapToStation(
  coordinate: AuthorMapCoordinate,
  target: RiddleEntry | null,
): AuthorMapCoordinate {
  if (!target || !hasUsableStationCoordinate(target)) return coordinate;
  const targetCoord = { lat: target.position_lat, lng: target.position_lng };
  return distanceMeters(coordinate, targetCoord) <= ROUTE_STATION_SNAP_METERS
    ? targetCoord
    : coordinate;
}

function stationAnchorPoint(
  station: RiddleEntry,
  timestamp: number,
): RecordedRoutePoint {
  return {
    lat: station.position_lat,
    lng: station.position_lng,
    timestamp,
  };
}

function normalizeSegmentForSave(
  points: RecordedRoutePoint[],
  from: RiddleEntry,
  to: RiddleEntry,
  timestamp: number,
): RecordedRoutePoint[] {
  const segment = points.slice();
  const fromAnchor = stationAnchorPoint(from, timestamp - 1);
  const toAnchor = stationAnchorPoint(to, timestamp);

  if (segment.length === 0 || !isNearStation(segment[0], from)) {
    segment.unshift(fromAnchor);
  } else {
    segment[0] = { ...segment[0], lat: fromAnchor.lat, lng: fromAnchor.lng };
  }

  const last = segment[segment.length - 1];
  if (!last || !isNearStation(last, to)) {
    segment.push(toAnchor);
  } else {
    segment[segment.length - 1] = {
      ...last,
      lat: toAnchor.lat,
      lng: toAnchor.lng,
    };
  }

  return segment;
}

interface RecordedSegmentSlice {
  start: number;
  end: number;
}

function findSegmentSlice(
  recordedRoute: RecordedRoutePoint[],
  from: RiddleEntry,
  to: RiddleEntry,
): RecordedSegmentSlice | null {
  if (!hasUsableStationCoordinate(from) || !hasUsableStationCoordinate(to)) {
    return null;
  }

  let start = -1;
  for (let index = 0; index < recordedRoute.length; index += 1) {
    if (isNearStation(recordedRoute[index], from)) {
      start = index;
      break;
    }
  }
  if (start === -1) return null;

  let end = -1;
  for (let index = start + 1; index < recordedRoute.length; index += 1) {
    if (isNearStation(recordedRoute[index], to)) {
      end = index;
      break;
    }
  }
  if (end === -1) return null;

  return { start, end };
}

function getRecordedSegmentSlices(
  stations: RiddleEntry[],
  recordedRoute: RecordedRoutePoint[],
): RecordedSegmentSlice[] {
  const slices: RecordedSegmentSlice[] = [];
  let searchStart = 0;

  for (let index = 0; index < stations.length - 1; index += 1) {
    const from = stations[index];
    const to = stations[index + 1];
    if (!hasUsableStationCoordinate(from) || !hasUsableStationCoordinate(to)) {
      continue;
    }

    const fromCoord = { lat: from.position_lat, lng: from.position_lng };
    const toCoord = { lat: to.position_lat, lng: to.position_lng };
    let start = -1;
    for (let routeIndex = searchStart; routeIndex < recordedRoute.length; routeIndex += 1) {
      if (distanceMeters(recordedRoute[routeIndex], fromCoord) <= ROUTE_STATION_SNAP_METERS) {
        start = routeIndex;
        break;
      }
    }
    if (start === -1) continue;

    let end = -1;
    for (let routeIndex = start + 1; routeIndex < recordedRoute.length; routeIndex += 1) {
      if (distanceMeters(recordedRoute[routeIndex], toCoord) <= ROUTE_STATION_SNAP_METERS) {
        end = routeIndex;
        break;
      }
    }
    if (end === -1) continue;

    slices.push({ start, end });
    searchStart = end;
  }

  return slices;
}

function findNearestStationAnchorIndex(
  recordedRoute: RecordedRoutePoint[],
  station: RiddleEntry,
): number {
  if (!hasUsableStationCoordinate(station)) return -1;

  for (let index = recordedRoute.length - 1; index >= 0; index -= 1) {
    if (isNearStation(recordedRoute[index], station)) {
      return index;
    }
  }

  return -1;
}

function isNearStation(
  point: { lat: number; lng: number },
  station: RiddleEntry,
): boolean {
  if (!hasUsableStationCoordinate(station)) return false;
  return (
    distanceMeters(point, {
      lat: station.position_lat,
      lng: station.position_lng,
    }) <= ROUTE_STATION_SNAP_METERS
  );
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

function formatDistance(meters: number): string {
  if (!Number.isFinite(meters) || meters <= 0) return '0 m';
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(2).replace('.', ',')} km`;
}
