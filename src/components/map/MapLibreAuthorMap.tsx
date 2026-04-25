import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { buildStationMarkerSvg } from '@/stations/visuals';
import {
  DEFAULT_MAPLIBRE_STYLE,
  MAPLIBRE_STYLE_URL,
} from './mapConfig';
import type { StyleSpecification } from 'maplibre-gl';
import {
  AUTHOR_MAP_BASEMAPS,
  AUTHOR_MAP_CURRENT_POSITION_STYLE_PLANNER,
  DEFAULT_AUTHOR_MAP_BASEMAP,
  type AuthorMapBasemapKey,
  type AuthorMapCoordinate,
  type AuthorMapProps,
} from './mapTypes';

interface RouteLayerRef {
  layerId: string;
  sourceId: string;
}

const SELECTION_SOURCE_ID = 'stq-author-map-selection-source';
const SELECTION_LAYER_ID = 'stq-author-map-selection-layer';

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
  basemap = DEFAULT_AUTHOR_MAP_BASEMAP,
  onSelectStation,
}: AuthorMapProps) {
  const initialBasemapRef = useRef<AuthorMapBasemapKey>(basemap);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const initialCenterRef = useRef(viewport.center);
  const initialZoomRef = useRef(viewport.zoom);
  const initialZoomControlRef = useRef(zoomControl);
  const [styleReady, setStyleReady] = useState(false);
  const stationMarkersRef = useRef<maplibregl.Marker[]>([]);
  const routeLayersRef = useRef<RouteLayerRef[]>([]);
  const currentPositionMarkerRef = useRef<maplibregl.Marker | null>(null);
  const previousSelectedStationIdRef = useRef<string | null>(null);
  const previousFlyToCurrentPositionRef = useRef(false);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style:
        MAPLIBRE_STYLE_URL ??
        buildBasemapStyle(initialBasemapRef.current) ??
        DEFAULT_MAPLIBRE_STYLE,
      center: toLngLat(initialCenterRef.current),
      zoom: initialZoomRef.current,
      attributionControl: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }));
    if (initialZoomControlRef.current) {
      map.addControl(new maplibregl.NavigationControl(), 'top-left');
    }

    const handleLoad = () => setStyleReady(true);
    map.on('load', handleLoad);
    mapRef.current = map;

    const resizeObserver =
      typeof ResizeObserver === 'undefined' || !containerRef.current
        ? null
        : new ResizeObserver(() => {
            map.resize();
          });
    resizeObserver?.observe(containerRef.current);

    const frameId = window.requestAnimationFrame(() => {
      map.resize();
    });
    const handleWindowResize = () => {
      map.resize();
    };
    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleWindowResize);
      resizeObserver?.disconnect();
      map.off('load', handleLoad);
      setStyleReady(false);
      removeStationMarkers(stationMarkersRef.current);
      removeCurrentPositionMarker(currentPositionMarkerRef.current);
      removeRouteLayers(map, routeLayersRef.current);
      removeLayerAndSource(map, SELECTION_LAYER_ID, SELECTION_SOURCE_ID);
      map.remove();
      mapRef.current = null;
      currentPositionMarkerRef.current = null;
      routeLayersRef.current = [];
      previousSelectedStationIdRef.current = null;
      previousFlyToCurrentPositionRef.current = false;
    };
  }, []);

  // Swap the raster style when the caller toggles between basemaps. Skipped
  // when the user pre-configured an explicit MAPLIBRE_STYLE_URL — in that
  // mode their style URL is the single source of truth.
  useEffect(() => {
    const map = mapRef.current;
    if (!map || MAPLIBRE_STYLE_URL) return;
    if (basemap === initialBasemapRef.current && stationMarkersRef.current.length === 0) {
      // First render already used this style; no-op to avoid double-load.
      return;
    }
    initialBasemapRef.current = basemap;
    const nextStyle = buildBasemapStyle(basemap) ?? DEFAULT_MAPLIBRE_STYLE;
    setStyleReady(false);
    // Detach derived layers/markers from the old style; the dependent
    // effects re-add them once styleReady flips back to true.
    routeLayersRef.current = [];
    stationMarkersRef.current = [];
    previousSelectedStationIdRef.current = null;
    map.setStyle(nextStyle);
    const handleLoad = () => setStyleReady(true);
    map.once('load', handleLoad);
    return () => {
      map.off('load', handleLoad);
    };
  }, [basemap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) {
      return;
    }

    removeStationMarkers(stationMarkersRef.current);
    const markers = stations.map((station) => {
      const selected = station.id === selectedStationId;
      const element = document.createElement('div');
      element.className = `stq-station-marker${
        selected ? ' stq-station-marker--selected' : ''
      }`;
      element.innerHTML = buildStationMarkerSvg(station.visual, {
        highlighted: selected,
      });
      element.title = station.tooltip || `Station ${station.number}`;
      element.style.cursor = onSelectStation ? 'pointer' : 'default';
      if (onSelectStation) {
        element.addEventListener('click', () => onSelectStation(station.id));
      }

      return new maplibregl.Marker({
        element,
        anchor: 'bottom',
      })
        .setLngLat(toLngLat(station.coordinate))
        .addTo(map);
    });

    stationMarkersRef.current = markers;
  }, [stations, selectedStationId, onSelectStation, styleReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) {
      return;
    }

    removeRouteLayers(map, routeLayersRef.current);
    const nextRouteLayers: RouteLayerRef[] = [];

    for (const route of routes) {
      if (route.points.length < 2) {
        continue;
      }

      const suffix = sanitizeLayerSuffix(route.id);
      const sourceId = `stq-author-map-route-source-${suffix}`;
      const layerId = `stq-author-map-route-layer-${suffix}`;

      map.addSource(sourceId, {
        type: 'geojson',
        data: {
          type: 'Feature',
          geometry: {
            type: 'LineString',
            coordinates: route.points.map((point) => toLngLat(point)),
          },
          properties: {},
        },
      });

      const dashArray = parseDashArray(route.style.dashArray);
      map.addLayer({
        id: layerId,
        type: 'line',
        source: sourceId,
        paint: {
          'line-color': route.style.color,
          'line-width': route.style.weight,
          'line-opacity': route.style.opacity ?? 1,
          ...(dashArray ? { 'line-dasharray': dashArray } : {}),
        },
      });

      nextRouteLayers.push({ layerId, sourceId });
    }

    routeLayersRef.current = nextRouteLayers;
  }, [routes, styleReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) {
      return;
    }

    removeLayerAndSource(map, SELECTION_LAYER_ID, SELECTION_SOURCE_ID);
    if (!selectionStyle) {
      return;
    }

    const selectedStation =
      stations.find((station) => station.id === selectedStationId) ?? null;
    if (!selectedStation) {
      return;
    }

    map.addSource(SELECTION_SOURCE_ID, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: toLngLat(selectedStation.coordinate),
        },
        properties: {},
      },
    });

    map.addLayer({
      id: SELECTION_LAYER_ID,
      type: 'circle',
      source: SELECTION_SOURCE_ID,
      paint: {
        'circle-radius': selectionStyle.radius,
        'circle-color': selectionStyle.color,
        'circle-opacity': selectionStyle.fillOpacity,
        'circle-stroke-color': selectionStyle.color,
        'circle-stroke-width': selectionStyle.weight,
      },
    });
  }, [selectionStyle, selectedStationId, stations, styleReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) {
      return;
    }

    removeCurrentPositionMarker(currentPositionMarkerRef.current);
    currentPositionMarkerRef.current = null;

    if (!currentPosition) {
      return;
    }

    const element = document.createElement('div');
    const diameter = currentPositionStyle.markerRadius * 2;
    element.style.width = `${diameter}px`;
    element.style.height = `${diameter}px`;
    element.style.borderRadius = '9999px';
    element.style.boxSizing = 'border-box';
    element.style.border = `${currentPositionStyle.markerWeight}px solid ${currentPositionStyle.markerColor}`;
    element.style.background = currentPositionStyle.markerFillColor;
    element.style.opacity = String(currentPositionStyle.markerFillOpacity);
    element.style.boxShadow = '0 0 0 1px rgba(35, 25, 25, 0.08)';

    currentPositionMarkerRef.current = new maplibregl.Marker({
      element,
      anchor: 'center',
    })
      .setLngLat(toLngLat(currentPosition.coordinate))
      .addTo(map);
  }, [currentPosition, currentPositionStyle, styleReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) {
      return;
    }

    if (!viewport.fitToCoordinates || viewport.fitToCoordinates.length === 0) {
      return;
    }

    if (viewport.fitToCoordinates.length === 1) {
      map.easeTo({
        center: toLngLat(viewport.fitToCoordinates[0]),
        zoom: viewport.fitMaxZoom ?? viewport.zoom,
      });
      return;
    }

    const bounds = new maplibregl.LngLatBounds();
    for (const coordinate of viewport.fitToCoordinates) {
      bounds.extend(toLngLat(coordinate));
    }

    map.fitBounds(bounds, {
      padding: toPaddingOptions(viewport.fitPadding ?? [28, 28]),
      maxZoom: viewport.fitMaxZoom ?? 17,
    });
  }, [
    viewport.fitMaxZoom,
    viewport.fitPadding,
    viewport.fitToCoordinates,
    viewport.fitTrigger,
    viewport.zoom,
    styleReady,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady || !viewport.panToSelectedStation) {
      if (!viewport.panToSelectedStation) {
        previousSelectedStationIdRef.current = null;
      }
      return;
    }

    const selectedStation =
      stations.find((station) => station.id === selectedStationId) ?? null;
    if (!selectedStation) {
      previousSelectedStationIdRef.current = null;
      return;
    }
    if (previousSelectedStationIdRef.current === selectedStation.id) {
      return;
    }

    previousSelectedStationIdRef.current = selectedStation.id;
    map.easeTo({
      center: toLngLat(selectedStation.coordinate),
    });
  }, [selectedStationId, stations, styleReady, viewport.panToSelectedStation]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) {
      return;
    }

    const enabled = Boolean(viewport.flyToCurrentPositionOnActivate);
    if (enabled && !previousFlyToCurrentPositionRef.current && currentPosition) {
      map.flyTo({
        center: toLngLat(currentPosition.coordinate),
        zoom: viewport.currentPositionFlyToMaxZoom ?? 17,
      });
    }
    previousFlyToCurrentPositionRef.current = enabled;
  }, [
    currentPosition,
    styleReady,
    viewport.currentPositionFlyToMaxZoom,
    viewport.flyToCurrentPositionOnActivate,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    map.resize();
  }, [className, style, styleReady]);

  return <div ref={containerRef} className={className} style={style} />;
}

function removeStationMarkers(markers: maplibregl.Marker[]) {
  for (const marker of markers) {
    marker.remove();
  }
  markers.length = 0;
}

function removeCurrentPositionMarker(marker: maplibregl.Marker | null) {
  marker?.remove();
}

function removeRouteLayers(map: maplibregl.Map, routeLayers: RouteLayerRef[]) {
  for (const routeLayer of routeLayers) {
    removeLayerAndSource(map, routeLayer.layerId, routeLayer.sourceId);
  }
}

function removeLayerAndSource(
  map: maplibregl.Map,
  layerId: string,
  sourceId: string,
) {
  if (map.getLayer(layerId)) {
    map.removeLayer(layerId);
  }
  if (map.getSource(sourceId)) {
    map.removeSource(sourceId);
  }
}

function parseDashArray(dashArray: string | undefined) {
  if (!dashArray) {
    return undefined;
  }

  const values = dashArray
    .split(/[\s,]+/)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);

  return values.length > 0 ? values : undefined;
}

function sanitizeLayerSuffix(value: string) {
  return value.replace(/[^a-zA-Z0-9-_]/g, '-');
}

function toLngLat(coordinate: AuthorMapCoordinate): [number, number] {
  return [coordinate.lng, coordinate.lat];
}

function toPaddingOptions(padding: [number, number]) {
  return {
    top: padding[1],
    right: padding[0],
    bottom: padding[1],
    left: padding[0],
  };
}

/**
 * Build a one-source raster `StyleSpecification` from a basemap key. We
 * intentionally render the basemap raster source under any other layers
 * MapLibre may add (markers are DOM-overlay only, so they are unaffected).
 *
 * Returns `null` when the key is unknown — callers fall back to the bundled
 * default OpenStreetMap style.
 */
function buildBasemapStyle(
  key: AuthorMapBasemapKey,
): StyleSpecification | null {
  const basemap = AUTHOR_MAP_BASEMAPS[key];
  if (!basemap) return null;
  const subdomains = basemap.subdomains?.[0];
  // MapLibre raster `tiles` arrays do not understand Leaflet's `{s}` token,
  // so we collapse it to the first declared subdomain (or strip it).
  const tileUrl = basemap.tileUrl.replace(
    '{s}',
    subdomains ?? '',
  );
  return {
    version: 8,
    sources: {
      basemap: {
        type: 'raster',
        tiles: [tileUrl],
        tileSize: 256,
        maxzoom: basemap.maxZoom,
        attribution: basemap.attribution,
      },
    },
    layers: [
      {
        id: 'basemap',
        type: 'raster',
        source: 'basemap',
      },
    ],
  };
}
