import { useEffect, useMemo, useState } from 'react';
import { calculateRouteLengthMeters } from '@/map/routePlanning';
import type { RecordedRoutePoint, TourDraft } from '@/schema';
import { hasUsableStationCoordinate } from '@/utils/coordinates';
import {
  toAuthorMapCoordinate,
  type AuthorMapCoordinate,
  type AuthorMapRoute,
  type AuthorMapRoutePointMarker,
} from '@/components/map/mapTypes';
import type { DraftChangeHandler } from './workspaceTypes';
import {
  ROUTE_DUPLICATE_POINT_METERS,
  distanceMeters,
  findNearbyStation,
  findNearestStationAnchorIndex,
  findSegmentSlice,
  getRecordedSegmentSlices,
  isNearStation,
  normalizeSegmentForSave,
  stationAnchorPoint,
} from './routeWorkspaceHelpers';

const FIELD_ROUTE_COLOR = 'var(--stq-color-route)';

interface UseWorkspaceRouteEditingParams {
  draft: TourDraft;
  editable: boolean;
  onChange: DraftChangeHandler;
}

export function useWorkspaceRouteEditing({
  draft,
  editable,
  onChange,
}: UseWorkspaceRouteEditingParams) {
  const [focusEnabled, setFocusEnabled] = useState(false);
  const [focusTrigger, setFocusTrigger] = useState<string | null>(null);
  const [selectedSegmentFromId, setSelectedSegmentFromId] = useState<
    string | null
  >(null);
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

  const stationsWithCoordinates = useMemo(
    () => draft.stations.filter(hasUsableStationCoordinate),
    [draft.stations],
  );

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
    () => recordedSegmentSlices.filter((slice) => slice.end - slice.start > 1),
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
    pendingSegmentPoints,
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
        savedSelectedSegmentPoints?.slice() ?? [
          stationAnchorPoint(selectedStation, point.timestamp - 1),
        ];
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
    const nextNextIndex = segmentFromIndex + 1;
    if (nextNextIndex >= 0 && nextNextIndex < draft.stations.length - 1) {
      setSelectedSegmentFromId(draft.stations[nextNextIndex].id);
    }
  }

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
          ? {
              ...point,
              lat: coordinate.lat,
              lng: coordinate.lng,
              timestamp: Date.now(),
            }
          : point,
      );
    });
  }

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
      drawableSegmentSlices.reduce((total, slice) => {
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
      }, 0) +
      (pendingSegmentPoints
        ? calculateRouteLengthMeters(pendingSegmentPoints)
        : 0),
    [
      drawableSegmentSlices,
      pendingSegmentPoints,
      segmentSlice,
      draft.recordedRoute,
    ],
  );

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

  return {
    activeSegmentPoints,
    canSaveSegment,
    clearSegment,
    fitPoints,
    fitSignature,
    focusEnabled,
    focusTrigger,
    handleMapClick,
    handleRoutePointDrag,
    handleStationSelect,
    pendingSegmentPoints,
    routePointMarkers,
    routes,
    savedSelectedSegmentPoints,
    segmentSlice,
    selectedSegmentFromId,
    selectedStation,
    setSelectedSegmentFromId,
    nextStation,
    toggleFocus,
    totalDistance,
    undoLast,
    saveSegment,
  };
}
