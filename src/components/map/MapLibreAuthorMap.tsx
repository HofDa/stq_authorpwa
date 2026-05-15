import { useRef } from 'react';
import type maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  AUTHOR_MAP_CURRENT_POSITION_STYLE_PLANNER,
  DEFAULT_AUTHOR_MAP_BASEMAP,
  type AuthorMapProps,
} from './mapTypes';
import type { RouteLayerRef } from './mapLibreUtils';
import { useMapLibreCurrentPosition } from './useMapLibreCurrentPosition';
import { useMapLibreInstance } from './useMapLibreInstance';
import { useMapLibreManualPan } from './useMapLibreManualPan';
import { useMapLibreMapClick } from './useMapLibreMapClick';
import { useMapLibreResizeRecovery } from './useMapLibreResizeRecovery';
import { useMapLibreRouteLayers } from './useMapLibreRouteLayers';
import { useMapLibreRoutePointMarkers } from './useMapLibreRoutePointMarkers';
import { useMapLibreSelectionLayer } from './useMapLibreSelectionLayer';
import { useMapLibreStationMarkers } from './useMapLibreStationMarkers';
import { useMapLibreViewport } from './useMapLibreViewport';

export function MapLibreAuthorMap({
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
  routePointMarkers = [],
  basemap = DEFAULT_AUTHOR_MAP_BASEMAP,
  controlAction = null,
  controlZoomStep = 1,
  manualDragPan = false,
  onSelectStation,
  draggableStationIds = [],
  deletableStationIds = [],
  onDeleteStation,
  onStationCoordinateChange,
  onRoutePointCoordinateChange,
  onViewportCenterChange,
  onMapClick,
  onRouteClick,
}: AuthorMapProps) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const stationMarkersRef = useRef<maplibregl.Marker[]>([]);
  const routeLayersRef = useRef<RouteLayerRef[]>([]);
  const routeEndpointMarkersRef = useRef<maplibregl.Marker[]>([]);
  const routePointMarkersRef = useRef<maplibregl.Marker[]>([]);
  const currentPositionMarkerRef = useRef<maplibregl.Marker | null>(null);
  const previousSelectedStationIdRef = useRef<string | null>(null);
  const previousFlyToCurrentPositionRef = useRef(false);

  const { mapError, styleReady } = useMapLibreInstance({
    basemap,
    containerRef,
    currentPositionMarkerRef,
    mapRef,
    manualDragPan,
    previousFlyToCurrentPositionRef,
    previousSelectedStationIdRef,
    routeEndpointMarkersRef,
    routeLayersRef,
    routePointMarkersRef,
    viewport,
    zoomControl,
  });

  useMapLibreMapClick({
    mapRef,
    onMapClick,
    routeLayersRef,
    styleReady,
  });
  useMapLibreStationMarkers({
    deletableStationIds,
    draggableStationIds,
    mapRef,
    onDeleteStation,
    onSelectStation,
    onStationCoordinateChange,
    selectedStationId,
    stationMarkersRef,
    stations,
    styleReady,
  });
  useMapLibreRoutePointMarkers({
    mapRef,
    onRoutePointCoordinateChange,
    routePointMarkers,
    routePointMarkersRef,
    styleReady,
  });
  useMapLibreRouteLayers({
    mapRef,
    onRouteClick,
    routeEndpointMarkersRef,
    routeLayersRef,
    routes,
    styleReady,
  });
  useMapLibreSelectionLayer({
    mapRef,
    selectedStationId,
    selectionStyle,
    stations,
    styleReady,
  });
  useMapLibreCurrentPosition({
    currentPosition,
    currentPositionMarkerRef,
    currentPositionStyle,
    mapRef,
    styleReady,
  });
  useMapLibreViewport({
    controlAction,
    controlZoomStep,
    currentPosition,
    mapRef,
    onViewportCenterChange,
    previousFlyToCurrentPositionRef,
    previousSelectedStationIdRef,
    selectedStationId,
    stations,
    styleReady,
    viewport,
  });
  useMapLibreManualPan({
    containerRef,
    manualDragPan,
    mapRef,
    styleReady,
  });
  useMapLibreResizeRecovery({
    className,
    mapRef,
    style,
    styleReady,
  });

  return (
    <div
      className={className}
      style={{ ...style, position: style?.position ?? 'relative' }}
    >
      <div
        ref={containerRef}
        style={{ position: 'absolute', inset: 0, width: '100%', height: '100%' }}
      />
      {mapError ? (
        <div
          className="pointer-events-none absolute inset-x-3 top-3 z-[500] rounded-2xl border border-amber-200 bg-amber-50/95 px-3 py-2 text-xs font-semibold text-amber-900 shadow-sm"
          role="status"
        >
          Map tiles could not be loaded. Check the map style URL or network connection.
        </div>
      ) : null}
    </div>
  );
}
