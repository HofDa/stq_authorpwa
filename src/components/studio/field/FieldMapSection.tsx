import { useEffect, useRef, useState } from 'react';
import type { RiddleEntry } from '@/schema';
import { hasUsableStationCoordinate } from '@/utils/coordinates';
import { normalizeStationVisualChoice } from '@/stations/visuals';
import { AuthorMap } from '@/components/map/AuthorMap';
import {
  AUTHOR_MAP_BASEMAPS,
  AUTHOR_MAP_CURRENT_POSITION_STYLE_FIELD,
  toAuthorMapCoordinate,
  type AuthorMapBasemapKey,
} from '@/components/map/mapTypes';
import { Icon } from '../Icon';
import { FieldCaptureActions } from './FieldCaptureActions';
import type { CurrentGps } from './types';

interface Props {
  draftId: string;
  stations: RiddleEntry[];
  selected: RiddleEntry | null;
  gps: CurrentGps | null;
  gpsLive: boolean;
  gpsError: string | null;
  tourLabel: string;
  basemap: AuthorMapBasemapKey;
  onSelectStation: (id: string) => void;
  onToggleGps: () => void;
  onEditStation: () => void;
  onPinHere: () => void;
  onPhotoCaptured: (blobId: string) => void;
  onAddStationAt: (coordinate: { lat: number; lng: number }) => void;
  onChangeBasemap: (key: AuthorMapBasemapKey) => void;
}

const DEFAULT_CENTER = { lat: 46.6703, lng: 11.1594 };

export function FieldMapSection({
  draftId,
  stations,
  selected,
  gps,
  gpsLive,
  gpsError,
  tourLabel,
  basemap,
  onSelectStation,
  onToggleGps,
  onEditStation,
  onPinHere,
  onPhotoCaptured,
  onAddStationAt,
  onChangeBasemap,
}: Props) {
  const [layersOpen, setLayersOpen] = useState(false);
  const layersRef = useRef<HTMLDivElement | null>(null);
  // Close the layers popover on outside click.
  useEffect(() => {
    if (!layersOpen) return;
    function onPointer(e: PointerEvent) {
      if (!layersRef.current) return;
      if (!layersRef.current.contains(e.target as Node)) {
        setLayersOpen(false);
      }
    }
    window.addEventListener('pointerdown', onPointer);
    return () => window.removeEventListener('pointerdown', onPointer);
  }, [layersOpen]);

  function handleAddStation() {
    if (gps) {
      onAddStationAt({ lat: gps.lat, lng: gps.lng });
      return;
    }
    // No GPS — fall back to whatever we are centered on so the new station
    // lands somewhere visible the author can drag/refine later.
    onAddStationAt({ lat: center.lat, lng: center.lng });
  }
  const stationsWithCoordinates = stations.filter(hasUsableStationCoordinate);

  const center = (() => {
    if (selected && hasUsableStationCoordinate(selected)) {
      return {
        lat: selected.position_lat,
        lng: selected.position_lng,
      };
    }
    const pinned = stationsWithCoordinates[0];
    if (pinned) {
      return {
        lat: pinned.position_lat,
        lng: pinned.position_lng,
      };
    }
    if (gps) return toAuthorMapCoordinate(gps);
    return DEFAULT_CENTER;
  })();
  const routePoints = stationsWithCoordinates.map((station) => ({
    lat: station.position_lat,
    lng: station.position_lng,
  }));
  const mapStations = stationsWithCoordinates.map((station) => ({
    id: station.id,
    number: station.number,
    coordinate: {
      lat: station.position_lat,
      lng: station.position_lng,
    },
    visual: normalizeStationVisualChoice(station),
  }));
  const mapCurrentPosition = gps
    ? {
        coordinate: toAuthorMapCoordinate(gps),
        accuracyMeters: gps.accuracy,
      }
    : null;

  return (
    <div style={{ position: 'absolute', inset: 0 }}>
      <AuthorMap
        stations={mapStations}
        selectedStationId={selected?.id ?? null}
        routes={[
          {
            id: 'field-station-route',
            points: routePoints,
            style: {
              color: '#904A48',
              weight: 4,
              opacity: 0.9,
              dashArray: '10 6',
            },
          },
        ]}
        currentPosition={mapCurrentPosition}
        currentPositionStyle={AUTHOR_MAP_CURRENT_POSITION_STYLE_FIELD}
        basemap={basemap}
        onSelectStation={onSelectStation}
        viewport={{
          center,
          zoom: 15,
          panToSelectedStation: true,
          flyToCurrentPositionOnActivate: gpsLive,
          currentPositionFlyToMaxZoom: 17,
        }}
        zoomControl={false}
        style={{ height: '100%', width: '100%' }}
      />

      <div
        style={{
          position: 'absolute',
          top: 10,
          left: 10,
          display: 'flex',
          gap: 6,
          alignItems: 'center',
          zIndex: 1000,
          pointerEvents: 'none',
        }}
      >
        <span
          className="studio-chip"
          style={{ background: 'white', pointerEvents: 'auto' }}
        >
          <Icon name="map-pin" size={13} color="var(--stq-primary)" />
          {tourLabel}
        </span>
        <span
          className="studio-chip"
          style={{ background: 'white', pointerEvents: 'auto' }}
        >
          <span
            className={`studio-dot ${
              gpsLive && gps ? 'studio-dot--ok stq-pulse-dot' : ''
            }`}
            style={
              !gpsLive || !gps ? { background: 'var(--stq-text-mute)' } : undefined
            }
          />
          {gpsLive
            ? gps
              ? `GPS ±${Math.round(gps.accuracy)}m`
              : 'GPS searching…'
            : 'GPS off'}
        </span>
      </div>

      <div
        ref={layersRef}
        style={{
          position: 'absolute',
          top: 10,
          right: 10,
          display: 'flex',
          flexDirection: 'column',
          gap: 6,
          zIndex: 1000,
          alignItems: 'flex-end',
        }}
      >
        <div style={{ position: 'relative' }}>
          <button
            type="button"
            className="studio-btn-icon"
            title="Map layers"
            aria-haspopup="menu"
            aria-expanded={layersOpen}
            onClick={() => setLayersOpen((v) => !v)}
            style={
              layersOpen
                ? {
                    background: 'var(--stq-primary)',
                    color: 'white',
                    borderColor: 'var(--stq-primary)',
                  }
                : undefined
            }
          >
            <Icon name="layers" size={15} />
          </button>
          {layersOpen && (
            <div role="menu" className="stq-field-layers-menu">
              {(Object.keys(AUTHOR_MAP_BASEMAPS) as AuthorMapBasemapKey[]).map(
                (key) => {
                  const item = AUTHOR_MAP_BASEMAPS[key];
                  const active = key === basemap;
                  return (
                    <button
                      key={key}
                      type="button"
                      role="menuitemradio"
                      aria-checked={active}
                      className={`stq-field-layers-item${
                        active ? ' stq-field-layers-item--active' : ''
                      }`}
                      onClick={() => {
                        onChangeBasemap(key);
                        setLayersOpen(false);
                      }}
                    >
                      <span className={`stq-field-layers-swatch stq-field-layers-swatch--${key}`} />
                      <span style={{ flex: 1 }}>{item.label}</span>
                      {active && (
                        <Icon name="check" size={14} color="var(--stq-primary)" />
                      )}
                    </button>
                  );
                },
              )}
            </div>
          )}
        </div>
        <button
          type="button"
          className="studio-btn-icon"
          onClick={onToggleGps}
          title={gpsLive ? 'Turn GPS off' : 'Turn GPS on'}
          aria-pressed={gpsLive}
          style={
            gpsLive
              ? {
                  background: 'var(--stq-primary)',
                  color: 'white',
                  borderColor: 'var(--stq-primary)',
                }
              : undefined
          }
        >
          <Icon name="map-pin" size={15} />
        </button>
        <button
          type="button"
          className="studio-btn-icon"
          onClick={handleAddStation}
          title={
            gps
              ? 'Drop a new station at your GPS position'
              : 'Drop a new station at the map center'
          }
        >
          <Icon name="plus" size={15} />
        </button>
      </div>

      {gpsError && (
        <div
          role="alert"
          style={{
            position: 'absolute',
            top: 60,
            left: 10,
            right: 10,
            padding: '8px 10px',
            background: 'white',
            border: '1px solid var(--stq-error)',
            borderRadius: 10,
            color: 'var(--stq-error)',
            fontSize: 12,
            zIndex: 1000,
          }}
        >
          {gpsError}
        </div>
      )}

      {selected && (
        <div className="stq-field-floating-card">
          <div style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
            <div
              className="studio-pin studio-pin--selected"
              style={{ width: 34, height: 34, fontSize: 13 }}
            >
              {selected.number}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 13, fontWeight: 700 }}>
                {selected.en.location || 'Unnamed station'}
              </div>
              <div
                style={{
                  fontSize: 11,
                  color: 'var(--stq-text-mute)',
                  marginTop: 2,
                  fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
                }}
              >
                {hasUsableStationCoordinate(selected)
                  ? `${selected.position_lat.toFixed(5)}, ${selected.position_lng.toFixed(5)}`
                  : 'No GPS pin yet'}
              </div>
            </div>
            <button
              className="studio-btn-primary"
              style={{ minHeight: 34, fontSize: 12, padding: '0 14px' }}
              onClick={onEditStation}
            >
              Edit
            </button>
          </div>
          <FieldCaptureActions
            draftId={draftId}
            currentBlobId={selected.imageBlobId}
            gpsAvailable={Boolean(gps)}
            onPinHere={onPinHere}
            onPhotoCaptured={onPhotoCaptured}
          />
        </div>
      )}
    </div>
  );
}
