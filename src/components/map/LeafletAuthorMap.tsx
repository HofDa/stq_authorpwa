import { useEffect, useRef } from 'react';
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
import { buildStationMarkerSvg } from '@/stations/visuals';
import {
  AUTHOR_MAP_BASEMAPS,
  AUTHOR_MAP_CURRENT_POSITION_STYLE_PLANNER,
  DEFAULT_AUTHOR_MAP_BASEMAP,
  type AuthorMapCoordinate,
  type AuthorMapCurrentPosition,
  type AuthorMapProps,
  type AuthorMapSelectionStyle,
  type AuthorMapStation,
} from './mapTypes';

export function LeafletAuthorMap({
  stations,
  viewport,
  className,
  style,
  zoomControl = true,
  routes = [],
  selectedStationId = null,
  currentPosition,
  selectionStyle,
  currentPositionStyle = AUTHOR_MAP_CURRENT_POSITION_STYLE_PLANNER,
  basemap = DEFAULT_AUTHOR_MAP_BASEMAP,
  onSelectStation,
}: AuthorMapProps) {
  const selectedStation =
    stations.find((station) => station.id === selectedStationId) ?? null;
  const basemapConfig =
    AUTHOR_MAP_BASEMAPS[basemap] ?? AUTHOR_MAP_BASEMAPS[DEFAULT_AUTHOR_MAP_BASEMAP];

  return (
    <MapContainer
      center={toLatLng(viewport.center)}
      zoom={viewport.zoom}
      scrollWheelZoom
      zoomControl={zoomControl}
      className={className}
      style={style}
    >
      <TileLayer
        key={basemapConfig.key}
        attribution={basemapConfig.attribution}
        url={basemapConfig.tileUrl}
        maxZoom={basemapConfig.maxZoom}
        subdomains={basemapConfig.subdomains ?? 'abc'}
      />

      {viewport.fitToCoordinates && viewport.fitToCoordinates.length > 0 && (
        <FitBoundsEffect
          coordinates={viewport.fitToCoordinates}
          padding={viewport.fitPadding ?? [28, 28]}
          maxZoom={viewport.fitMaxZoom ?? 17}
          trigger={viewport.fitTrigger}
        />
      )}

      {viewport.panToSelectedStation && selectedStation && (
        <PanToSelectedStationEffect station={selectedStation} />
      )}

      {viewport.flyToCurrentPositionOnActivate && currentPosition && (
        <FlyToCurrentPositionEffect
          currentPosition={currentPosition}
          enabled={viewport.flyToCurrentPositionOnActivate}
          maxZoom={viewport.currentPositionFlyToMaxZoom ?? 17}
        />
      )}

      {routes.map((route) =>
        route.points.length >= 2 ? (
          <Polyline
            key={route.id}
            positions={route.points.map(toLatLng)}
            pathOptions={route.style}
          />
        ) : null,
      )}

      {stations.map((station) => {
        const selected = station.id === selectedStationId;
        return (
          <Marker
            key={station.id}
            position={toLatLng(station.coordinate)}
            icon={stationMarkerIcon(station, selected)}
            eventHandlers={
              onSelectStation ? { click: () => onSelectStation(station.id) } : undefined
            }
          >
            {station.tooltip ? (
              <Tooltip direction="top" offset={[0, -18]}>
                {station.tooltip}
              </Tooltip>
            ) : null}
          </Marker>
        );
      })}

      {selectedStation && selectionStyle ? (
        <SelectedStationHalo
          station={selectedStation}
          selectionStyle={selectionStyle}
        />
      ) : null}

      {currentPosition ? (
        <>
          {currentPosition.accuracyMeters && currentPosition.accuracyMeters > 0 ? (
            <Circle
              center={toLatLng(currentPosition.coordinate)}
              radius={currentPosition.accuracyMeters}
              pathOptions={{
                color: currentPositionStyle.accuracyColor,
                weight: currentPositionStyle.accuracyWeight,
                opacity: currentPositionStyle.accuracyOpacity,
                fillColor: currentPositionStyle.accuracyFillColor,
                fillOpacity: currentPositionStyle.accuracyFillOpacity,
              }}
            />
          ) : null}
          <CircleMarker
            center={toLatLng(currentPosition.coordinate)}
            radius={currentPositionStyle.markerRadius}
            pathOptions={{
              color: currentPositionStyle.markerColor,
              weight: currentPositionStyle.markerWeight,
              fillColor: currentPositionStyle.markerFillColor,
              fillOpacity: currentPositionStyle.markerFillOpacity,
            }}
          />
        </>
      ) : null}
    </MapContainer>
  );
}

function FitBoundsEffect({
  coordinates,
  padding,
  maxZoom,
  trigger,
}: {
  coordinates: AuthorMapCoordinate[];
  padding: [number, number];
  maxZoom: number;
  trigger?: string;
}) {
  const map = useMap();
  const paddingKey = `${padding[0]}:${padding[1]}`;
  const fitToken = trigger ?? buildFitToken(coordinates);

  useEffect(() => {
    if (coordinates.length === 0) {
      return;
    }
    map.fitBounds(latLngBounds(coordinates.map(toLatLng)), {
      padding,
      maxZoom,
    });
  }, [map, fitToken, paddingKey, maxZoom]); // eslint-disable-line react-hooks/exhaustive-deps -- fit is intentionally driven by the supplied trigger

  return null;
}

function PanToSelectedStationEffect({ station }: { station: AuthorMapStation }) {
  const map = useMap();
  const lastSelectedIdRef = useRef<string | null>(null);

  useEffect(() => {
    if (station.id !== lastSelectedIdRef.current) {
      lastSelectedIdRef.current = station.id;
      map.panTo(toLatLng(station.coordinate), { animate: true });
    }
  }, [station, map]);

  return null;
}

function FlyToCurrentPositionEffect({
  currentPosition,
  enabled,
  maxZoom,
}: {
  currentPosition: AuthorMapCurrentPosition;
  enabled: boolean;
  maxZoom: number;
}) {
  const map = useMap();
  const previousEnabledRef = useRef(false);

  useEffect(() => {
    if (enabled && !previousEnabledRef.current) {
      const center = toLatLng(currentPosition.coordinate);
      const bounds = latLngBounds([center, center]).pad(0.001);
      map.flyToBounds(bounds, { maxZoom });
    }
    previousEnabledRef.current = enabled;
  }, [currentPosition, enabled, map, maxZoom]);

  return null;
}

function SelectedStationHalo({
  station,
  selectionStyle,
}: {
  station: AuthorMapStation;
  selectionStyle: AuthorMapSelectionStyle;
}) {
  return (
    <CircleMarker
      center={toLatLng(station.coordinate)}
      radius={selectionStyle.radius}
      pathOptions={{
        color: selectionStyle.color,
        weight: selectionStyle.weight,
        fillOpacity: selectionStyle.fillOpacity,
      }}
    />
  );
}

function stationMarkerIcon(station: AuthorMapStation, selected: boolean) {
  return divIcon({
    className: '',
    iconSize: [40, 64],
    iconAnchor: [20, 64],
    html: `<div class="stq-station-marker${
      selected ? ' stq-station-marker--selected' : ''
    }">${buildStationMarkerSvg(station.visual, {
      highlighted: selected,
    })}</div>`,
  });
}

function toLatLng(coordinate: AuthorMapCoordinate): [number, number] {
  return [coordinate.lat, coordinate.lng];
}

function buildFitToken(coordinates: AuthorMapCoordinate[]) {
  const first = coordinates[0];
  const last = coordinates[coordinates.length - 1];
  return `${coordinates.length}:${
    first ? `${first.lat.toFixed(5)},${first.lng.toFixed(5)}` : 'none'
  }:${
    last ? `${last.lat.toFixed(5)},${last.lng.toFixed(5)}` : 'none'
  }`;
}

