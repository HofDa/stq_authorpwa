import { useEffect, useRef, useState } from 'react';
import { divIcon, latLngBounds } from 'leaflet';
import {
  Circle,
  CircleMarker,
  MapContainer,
  Marker,
  Polyline,
  TileLayer,
  Tooltip,
  useMap,
} from 'react-leaflet';
import type { RecordedRoutePoint, TourDraft } from '@/schema';
import {
  calculateRouteLengthMeters,
  deriveStationPathsFromRecordedRoute,
} from '@/map/routePlanning';

interface Props {
  draft: TourDraft;
  onChange: (recipe: (prev: TourDraft) => TourDraft) => void;
}

const DEFAULT_CENTER: [number, number] = [46.6703, 11.1594];

export function LiveRoutePlannerPanel({ draft, onChange }: Props) {
  const [tracking, setTracking] = useState(false);
  const [selectedStationId, setSelectedStationId] = useState(
    draft.stations[0]?.id ?? '',
  );
  const [currentPosition, setCurrentPosition] =
    useState<RecordedRoutePoint | null>(null);
  const [plannerError, setPlannerError] = useState<string | null>(null);
  const [toleranceMeters, setToleranceMeters] = useState(12);
  const [fitTrigger, setFitTrigger] = useState(1);
  const lastRecordedPointRef = useRef<RecordedRoutePoint | undefined>(
    draft.recordedRoute[draft.recordedRoute.length - 1],
  );

  useEffect(() => {
    lastRecordedPointRef.current =
      draft.recordedRoute[draft.recordedRoute.length - 1];
  }, [draft.recordedRoute]);

  useEffect(() => {
    if (
      selectedStationId &&
      draft.stations.some((station) => station.id === selectedStationId)
    ) {
      return;
    }
    setSelectedStationId(draft.stations[0]?.id ?? '');
  }, [draft.stations, selectedStationId]);

  useEffect(() => {
    if (!tracking) {
      return;
    }

    if (!navigator.geolocation) {
      setPlannerError('Geolocation is not supported on this device.');
      setTracking(false);
      return;
    }

    setPlannerError(null);
    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const point: RecordedRoutePoint = {
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: position.timestamp,
        };
        setCurrentPosition(point);
        const lastPoint = lastRecordedPointRef.current;
        if (!shouldAppendPoint(lastPoint, point)) {
          return;
        }
        lastRecordedPointRef.current = point;
        onChange((prev) => ({
          ...prev,
          recordedRoute: [...prev.recordedRoute, point],
        }));
      },
      (error) => {
        setPlannerError(`GPS tracking error: ${error.message}`);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10_000,
      },
    );

    return () => navigator.geolocation.clearWatch(watchId);
  }, [tracking, onChange]);

  const derivation = deriveStationPathsFromRecordedRoute(
    draft.stations,
    draft.recordedRoute,
    toleranceMeters,
  );
  const selectedStation = draft.stations.find(
    (station) => station.id === selectedStationId,
  );
  const selectedStationPath = derivation.stationPaths.find(
    (path) => path.stationId === selectedStationId,
  );
  const rawDistanceMeters = calculateRouteLengthMeters(draft.recordedRoute);
  const optimizedDistanceMeters = calculateRouteLengthMeters(
    derivation.optimizedRoute,
  );
  const mapPoints = collectMapPoints(
    draft.recordedRoute,
    derivation.optimizedRoute,
    draft.stations,
    currentPosition,
  );

  function assignCurrentPositionToStation() {
    if (!selectedStationId || !currentPosition) {
      return;
    }
    onChange((prev) => ({
      ...prev,
      stations: prev.stations.map((station) =>
        station.id === selectedStationId
          ? {
              ...station,
              position_lat: currentPosition.lat,
              position_lng: currentPosition.lng,
            }
          : station,
      ),
    }));
  }

  function clearRecordedRoute() {
    if (!confirm('Clear the recorded route for this tour draft?')) {
      return;
    }
    onChange((prev) => ({ ...prev, recordedRoute: [] }));
  }

  function applyOptimizedPaths() {
    if (derivation.stationPaths.length === 0) {
      setPlannerError('Record a route before generating optimized station paths.');
      return;
    }

    setPlannerError(null);
    const polylineByStationId = new Map(
      derivation.stationPaths.map((path) => [path.stationId, path.polylineString]),
    );
    onChange((prev) => ({
      ...prev,
      stations: prev.stations.map((station) => ({
        ...station,
        polylineString:
          polylineByStationId.get(station.id) ?? station.polylineString,
      })),
    }));
  }

  return (
    <section className="card flex flex-col gap-4">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-labelSm uppercase tracking-[0.18em] text-primary/80">
            Live Route
          </p>
          <h2 className="mt-1 text-h5">Map Planner</h2>
          <p className="mt-1 text-bodySm text-disabled">
            Walk the tour, record the path, then write optimized route segments
            into each station.
          </p>
        </div>
        <button className="btn-ghost" onClick={() => setFitTrigger((value) => value + 1)}>
          Recenter
        </button>
      </div>

      <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
        <StatCard label="Raw points" value={String(draft.recordedRoute.length)} />
        <StatCard
          label="Optimized"
          value={String(derivation.optimizedRoute.length)}
        />
        <StatCard label="Raw distance" value={formatDistance(rawDistanceMeters)} />
        <StatCard
          label="Optimized"
          value={formatDistance(optimizedDistanceMeters)}
        />
      </div>

      <div className="stq-map-shell overflow-hidden rounded-md border border-border">
        <MapContainer
          center={DEFAULT_CENTER}
          zoom={15}
          scrollWheelZoom
          className="h-[26rem] w-full"
        >
          <TileLayer
            attribution="&copy; OpenStreetMap contributors"
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBoundsEffect
            points={mapPoints}
            trigger={`${fitTrigger}:${mapPoints.length}:${mapPoints[mapPoints.length - 1]?.join(',') ?? 'none'}`}
          />

          {draft.recordedRoute.length >= 2 && (
            <Polyline
              positions={draft.recordedRoute.map(toLatLng)}
              pathOptions={{
                color: '#cc7a00',
                weight: 4,
                opacity: 0.65,
                dashArray: '8 10',
              }}
            />
          )}

          {derivation.optimizedRoute.length >= 2 && (
            <Polyline
              positions={derivation.optimizedRoute.map(toLatLng)}
              pathOptions={{
                color: '#2196f3',
                weight: 5,
                opacity: 0.95,
              }}
            />
          )}

          {draft.stations.map((station) => (
            <Marker
              key={station.id}
              position={[station.position_lat, station.position_lng]}
              icon={stationMarkerIcon(
                String(station.number),
                station.id === selectedStationId,
              )}
              eventHandlers={{
                click: () => setSelectedStationId(station.id),
              }}
            >
              <Tooltip direction="top" offset={[0, -18]}>
                Station {station.number}
              </Tooltip>
            </Marker>
          ))}

          {selectedStation && !isZeroCoordinate(selectedStation) && (
            <CircleMarker
              center={[selectedStation.position_lat, selectedStation.position_lng]}
              radius={20}
              pathOptions={{
                color: '#904A48',
                weight: 2,
                fillOpacity: 0.08,
              }}
            />
          )}

          {currentPosition && (
            <>
              <CircleMarker
                center={[currentPosition.lat, currentPosition.lng]}
                radius={8}
                pathOptions={{
                  color: '#0d5ea8',
                  weight: 2,
                  fillColor: '#2196f3',
                  fillOpacity: 0.95,
                }}
              />
              {currentPosition.accuracy && currentPosition.accuracy > 0 && (
                <Circle
                  center={[currentPosition.lat, currentPosition.lng]}
                  radius={currentPosition.accuracy}
                  pathOptions={{
                    color: '#2196f3',
                    weight: 1,
                    opacity: 0.4,
                    fillColor: '#90CAF9',
                    fillOpacity: 0.12,
                  }}
                />
              )}
            </>
          )}
        </MapContainer>
      </div>

      <div className="grid gap-3 md:grid-cols-[1.4fr_1fr]">
        <section className="rounded-md border border-border bg-background p-3">
          <div className="grid gap-3 sm:grid-cols-2">
            <label className="flex flex-col gap-1">
              <span className="text-labelSm">Selected station</span>
              <select
                className="input-field"
                value={selectedStationId}
                onChange={(event) => setSelectedStationId(event.target.value)}
              >
                {draft.stations.length === 0 ? (
                  <option value="">No stations yet</option>
                ) : (
                  draft.stations.map((station) => (
                    <option key={station.id} value={station.id}>
                      {station.number}.{' '}
                      {station.en.location ||
                        station.de.location ||
                        station.it.location ||
                        station.id}
                    </option>
                  ))
                )}
              </select>
            </label>

            <label className="flex flex-col gap-1">
              <span className="text-labelSm">Optimize tolerance (meters)</span>
              <input
                className="input-field"
                type="number"
                min={1}
                max={100}
                value={toleranceMeters}
                onChange={(event) =>
                  setToleranceMeters(Math.max(1, Number(event.target.value) || 1))
                }
              />
            </label>
          </div>

          <div className="mt-3 flex flex-wrap gap-2">
            <button
              className={tracking ? 'btn-primary' : 'btn-ghost'}
              onClick={() => setTracking((value) => !value)}
            >
              {tracking ? 'Pause Tracking' : 'Start Tracking'}
            </button>
            <button
              className="btn-ghost"
              onClick={assignCurrentPositionToStation}
              disabled={!selectedStationId || !currentPosition}
            >
              Use Current GPS For Station
            </button>
            <button
              className="btn-primary"
              onClick={applyOptimizedPaths}
              disabled={derivation.stationPaths.length === 0}
            >
              Write Optimized Paths
            </button>
            <button
              className="btn-ghost"
              onClick={clearRecordedRoute}
              disabled={draft.recordedRoute.length === 0}
            >
              Clear Track
            </button>
          </div>

          <div className="mt-3 flex flex-col gap-2">
            {plannerError && (
              <p className="rounded-sm border border-error/30 bg-error/5 px-3 py-2 text-bodySm text-error">
                {plannerError}
              </p>
            )}
            {tracking && (
              <p className="rounded-sm border border-success/30 bg-success/5 px-3 py-2 text-bodySm text-text">
                Live tracking is running. New GPS points are being stored in this
                draft.
              </p>
            )}
            {derivation.warnings.map((warning) => (
              <p
                key={warning}
                className="rounded-sm border border-border bg-white px-3 py-2 text-bodySm text-disabled"
              >
                {warning}
              </p>
            ))}
          </div>
        </section>

        <section className="rounded-md border border-border bg-white p-3">
          <h3 className="text-h6">Selected Station Path</h3>
          {selectedStation && selectedStationPath ? (
            <div className="mt-3 flex flex-col gap-2 text-bodySm">
              <p>
                Station {selectedStation.number} will receive a route with{' '}
                {selectedStationPath.pointCount} point
                {selectedStationPath.pointCount === 1 ? '' : 's'}.
              </p>
              <p>Estimated segment length: {formatDistance(selectedStationPath.distanceMeters)}.</p>
              <p>
                Current stored polyline:
                {' '}
                {selectedStation.polylineString ? 'present' : 'empty'}
              </p>
            </div>
          ) : (
            <p className="mt-3 text-bodySm text-disabled">
              Select a station and record a route to preview the exported path.
            </p>
          )}
        </section>
      </div>
    </section>
  );
}

function FitBoundsEffect({
  points,
  trigger,
}: {
  points: [number, number][];
  trigger: string;
}) {
  const map = useMap();

  useEffect(() => {
    if (points.length === 0) {
      return;
    }
    map.fitBounds(latLngBounds(points), {
      padding: [28, 28],
      maxZoom: 17,
    });
  }, [map, trigger]);

  return null;
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border bg-white px-3 py-2">
      <p className="text-labelSm uppercase tracking-wide text-disabled">{label}</p>
      <p className="mt-1 text-h6">{value}</p>
    </div>
  );
}

function stationMarkerIcon(label: string, selected: boolean) {
  return divIcon({
    className: '',
    iconSize: [36, 36],
    iconAnchor: [18, 18],
    html: `<div class="stq-station-marker${
      selected ? ' stq-station-marker--selected' : ''
    }"><span class="stq-station-marker__bubble">${label}</span></div>`,
  });
}

function collectMapPoints(
  recordedRoute: RecordedRoutePoint[],
  optimizedRoute: RecordedRoutePoint[],
  stations: TourDraft['stations'],
  currentPosition: RecordedRoutePoint | null,
) {
  const points: [number, number][] = [];

  for (const point of recordedRoute) {
    points.push([point.lat, point.lng]);
  }
  for (const point of optimizedRoute) {
    points.push([point.lat, point.lng]);
  }
  for (const station of stations) {
    if (!isZeroCoordinate(station)) {
      points.push([station.position_lat, station.position_lng]);
    }
  }
  if (currentPosition) {
    points.push([currentPosition.lat, currentPosition.lng]);
  }

  return points;
}

function formatDistance(distanceMeters: number) {
  if (distanceMeters >= 1000) {
    return `${(distanceMeters / 1000).toFixed(2)} km`;
  }
  return `${Math.round(distanceMeters)} m`;
}

function shouldAppendPoint(
  previous: RecordedRoutePoint | undefined,
  next: RecordedRoutePoint,
) {
  if (next.accuracy && next.accuracy > 80) {
    return false;
  }
  if (!previous) {
    return true;
  }

  const elapsedMs = next.timestamp - previous.timestamp;
  const deltaMeters = calculateRouteLengthMeters([previous, next]);
  return elapsedMs >= 3_000 || deltaMeters >= 4;
}

function toLatLng(point: RecordedRoutePoint): [number, number] {
  return [point.lat, point.lng];
}

function isZeroCoordinate(station: TourDraft['stations'][number]) {
  return station.position_lat === 0 && station.position_lng === 0;
}
