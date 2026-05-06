import { useEffect, useRef, useState } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import {
  buildNumberedStationMarkerSvg,
  buildStationMarkerSvg,
} from '@/stations/visuals';
import {
  MAPLIBRE_STYLE_URL,
  resolveMapLibreStyle,
} from './mapConfig';
import {
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

interface MapLibreErrorEvent {
  error?: {
    message?: string;
  };
}

const SELECTION_SOURCE_ID = 'stq-author-map-selection-source';
const SELECTION_LAYER_ID = 'stq-author-map-selection-layer';

/* Station marker geometry — must stay in lockstep with `.stq-station-marker`
   in `src/index.css`. The marker SVG (`buildStationMarkerSvg`) uses a 63×70
   viewBox where the pin's tip sits at y≈68.7. With a CSS box of 40×44 px
   the tip is at y ≈ 44 * (68.7/70) ≈ 43.2 px from the top, so the marker's
   center sits ~21 px above its tip. We anchor at `center` and shift the
   marker UP by 21 px (negative y in MapLibre's pixel space) so the tip
   lands on the geographic point — and we don't rely on `anchor: 'bottom'`,
   which forces MapLibre to re-measure the DOM box on every zoom. */
const STATION_MARKER_TIP_OFFSET_PX: [number, number] = [0, -21];

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
  onSelectStation,
  draggableStationIds = [],
  deletableStationIds = [],
  onDeleteStation,
  onStationCoordinateChange,
  onRoutePointCoordinateChange,
  onViewportCenterChange,
  onMapClick,
}: AuthorMapProps) {
  const initialBasemapRef = useRef<AuthorMapBasemapKey>(basemap);
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(null);
  const initialCenterRef = useRef(viewport.center);
  const initialZoomRef = useRef(viewport.zoom);
  const initialZoomControlRef = useRef(zoomControl);
  const [styleReady, setStyleReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);
  const stationMarkersRef = useRef<maplibregl.Marker[]>([]);
  const routeLayersRef = useRef<RouteLayerRef[]>([]);
  const routeEndpointMarkersRef = useRef<maplibregl.Marker[]>([]);
  const routePointMarkersRef = useRef<maplibregl.Marker[]>([]);
  const currentPositionMarkerRef = useRef<maplibregl.Marker | null>(null);
  const previousSelectedStationIdRef = useRef<string | null>(null);
  const previousFlyToCurrentPositionRef = useRef(false);
  // Capture the latest `onSelectStation` so the marker effect doesn't have to
  // re-run (and re-create every marker) when the parent supplies a fresh
  // arrow-function reference on each render.
  const onSelectStationRef = useRef(onSelectStation);
  useEffect(() => {
    onSelectStationRef.current = onSelectStation;
  }, [onSelectStation]);
  const onDeleteStationRef = useRef(onDeleteStation);
  useEffect(() => {
    onDeleteStationRef.current = onDeleteStation;
  }, [onDeleteStation]);
  const onStationCoordinateChangeRef = useRef(onStationCoordinateChange);
  useEffect(() => {
    onStationCoordinateChangeRef.current = onStationCoordinateChange;
  }, [onStationCoordinateChange]);
  const onRoutePointCoordinateChangeRef = useRef(onRoutePointCoordinateChange);
  useEffect(() => {
    onRoutePointCoordinateChangeRef.current = onRoutePointCoordinateChange;
  }, [onRoutePointCoordinateChange]);
  const onMapClickRef = useRef(onMapClick);
  useEffect(() => {
    onMapClickRef.current = onMapClick;
  }, [onMapClick]);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: resolveMapLibreStyle(initialBasemapRef.current),
      center: toLngLat(initialCenterRef.current),
      zoom: initialZoomRef.current,
      attributionControl: false,
    });

    map.addControl(new maplibregl.AttributionControl({ compact: true }));
    if (initialZoomControlRef.current) {
      map.addControl(new maplibregl.NavigationControl(), 'top-left');
    }

    const handleLoad = () => {
      setMapError(null);
      setStyleReady(true);
      // The container often goes from 0×0 → laid-out between `new
      // maplibregl.Map(...)` and the first paint. Force a resize once we
      // know the style is loaded so tiles render at the correct dimensions.
      window.requestAnimationFrame(() => map.resize());
    };
    const handleError = (event: MapLibreErrorEvent) => {
      const message = event.error?.message ?? 'MapLibre map error';
      setMapError(message);
      console.warn('[AuthorMap] MapLibre error:', event.error);
    };
    map.on('load', handleLoad);
    map.on('error', handleError);
    mapRef.current = map;

    // ResizeObserver keeps tiles aligned when the layout shifts (sidebar
    // drawer opens, parent height changes, etc.). It also covers the
    // initial-mount case where the container had 0 height when the map
    // constructor ran.
    const resizeObserver =
      typeof ResizeObserver === 'undefined' || !containerRef.current
        ? null
        : new ResizeObserver(() => {
            map.resize();
          });
    resizeObserver?.observe(containerRef.current);

    const secondFrameRef: { current: number | null } = { current: null };
    const frameId = window.requestAnimationFrame(() => {
      map.resize();
      secondFrameRef.current = window.requestAnimationFrame(() => map.resize());
    });
    // Belt and suspenders: a second resize on the next macrotask catches the
    // case where layout settles after the RAF.
    const resizeTimerIds = [0, 80, 240, 800, 1600].map((delay) =>
      window.setTimeout(() => {
        map.resize();
        map.triggerRepaint();
        if (map.loaded() || map.isStyleLoaded()) {
          handleLoad();
        }
      }, delay),
    );
    const handleWindowResize = () => map.resize();
    window.addEventListener('resize', handleWindowResize);

    return () => {
      window.cancelAnimationFrame(frameId);
      if (secondFrameRef.current !== null) {
        window.cancelAnimationFrame(secondFrameRef.current);
      }
      for (const timerId of resizeTimerIds) {
        window.clearTimeout(timerId);
      }
      window.removeEventListener('resize', handleWindowResize);
      resizeObserver?.disconnect();
      map.off('load', handleLoad);
      map.off('error', handleError);
      setStyleReady(false);
      removeStationMarkers(stationMarkersRef.current);
      removeCurrentPositionMarker(currentPositionMarkerRef.current);
      removeStationMarkers(routeEndpointMarkersRef.current);
      removeStationMarkers(routePointMarkersRef.current);
      removeRouteLayers(map, routeLayersRef.current);
      removeLayerAndSource(map, SELECTION_LAYER_ID, SELECTION_SOURCE_ID);
      map.remove();
      mapRef.current = null;
      currentPositionMarkerRef.current = null;
      routeLayersRef.current = [];
      routeEndpointMarkersRef.current = [];
      routePointMarkersRef.current = [];
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
    if (basemap === initialBasemapRef.current) {
      // First render of this basemap is handled by the mount-effect's
      // initial style; nothing to swap.
      return;
    }
    initialBasemapRef.current = basemap;
    const nextStyle = resolveMapLibreStyle(basemap, null);
    setStyleReady(false);
    setMapError(null);
    // DOM markers survive style changes, while style layers/sources do not.
    // Remove everything explicitly before swapping styles so the effects can
    // re-add a clean map state once the new style is ready.
    removeStationMarkers(stationMarkersRef.current);
    removeCurrentPositionMarker(currentPositionMarkerRef.current);
    removeStationMarkers(routeEndpointMarkersRef.current);
    removeStationMarkers(routePointMarkersRef.current);
    currentPositionMarkerRef.current = null;
    removeRouteLayers(map, routeLayersRef.current);
    removeLayerAndSource(map, SELECTION_LAYER_ID, SELECTION_SOURCE_ID);
    routeLayersRef.current = [];
    routeEndpointMarkersRef.current = [];
    routePointMarkersRef.current = [];
    previousSelectedStationIdRef.current = null;
    map.setStyle(nextStyle);
    const handleStyleData = () => {
      if (!map.isStyleLoaded()) return;
      setStyleReady(true);
      window.requestAnimationFrame(() => map.resize());
      map.off('styledata', handleStyleData);
    };
    map.on('styledata', handleStyleData);
    return () => {
      map.off('styledata', handleStyleData);
    };
  }, [basemap]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !onViewportCenterChange) {
      return;
    }

    const emitCenter = () => {
      const center = map.getCenter();
      onViewportCenterChange({ lat: center.lat, lng: center.lng });
    };

    emitCenter();
    map.on('moveend', emitCenter);

    return () => {
      map.off('moveend', emitCenter);
    };
  }, [onViewportCenterChange, styleReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) {
      return;
    }

    const handleClick = (event: maplibregl.MapMouseEvent) => {
      onMapClickRef.current?.({
        lat: event.lngLat.lat,
        lng: event.lngLat.lng,
      });
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [styleReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) {
      return;
    }

    removeStationMarkers(stationMarkersRef.current);
    const draggableStationIdSet = new Set(draggableStationIds);
    const deletableStationIdSet = new Set(deletableStationIds);
    const markers = stations.map((station) => {
      const selected = station.id === selectedStationId;
      const draggable = draggableStationIdSet.has(station.id);
      const deletable = deletableStationIdSet.has(station.id);
      const element = document.createElement('div');
      element.className = `stq-station-marker${
        selected ? ' stq-station-marker--selected' : ''
      }${draggable ? ' stq-station-marker--draggable' : ''}${
        deletable ? ' stq-station-marker--deletable' : ''
      }`;
      element.innerHTML = station.hasSelectedIcon
        ? buildStationMarkerSvg(station.visual, {
            highlighted: selected,
          })
        : buildNumberedStationMarkerSvg(station.visual, station.number, {
            highlighted: selected,
          });
      if (deletable) {
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'stq-station-marker-delete';
        deleteButton.setAttribute('aria-label', `Delete station ${station.number}`);
        deleteButton.textContent = '×';
        deleteButton.addEventListener('click', (event) => {
          event.stopPropagation();
          onDeleteStationRef.current?.(station.id);
        });
        element.appendChild(deleteButton);
      }
      element.title = station.tooltip || `Station ${station.number}`;
      element.style.cursor = draggable ? 'grab' : 'pointer';
      let handledDrag = false;
      element.addEventListener('click', (event) => {
        event.stopPropagation();
        if (handledDrag) {
          handledDrag = false;
          return;
        }

        onSelectStationRef.current?.(station.id);
      });

      const marker = new maplibregl.Marker({
        element,
        anchor: 'center',
        offset: STATION_MARKER_TIP_OFFSET_PX,
        draggable,
      })
        .setLngLat(toLngLat(station.coordinate))
        .addTo(map);

      if (draggable) {
        marker.on('dragstart', () => {
          handledDrag = true;
          element.style.cursor = 'grabbing';
        });
        marker.on('dragend', () => {
          element.style.cursor = 'grab';
          const next = marker.getLngLat();
          onStationCoordinateChangeRef.current?.(station.id, {
            lat: next.lat,
            lng: next.lng,
          });
        });
      }

      return marker;
    });

    stationMarkersRef.current = markers;
  }, [deletableStationIds, draggableStationIds, stations, selectedStationId, styleReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) {
      return;
    }

    removeStationMarkers(routePointMarkersRef.current);
    const nextRoutePointMarkers = routePointMarkers.map((routePoint) => {
      const element = createRoutePointMarkerElement(routePoint.color);
      const marker = new maplibregl.Marker({
        element,
        anchor: 'center',
        draggable: routePoint.draggable ?? false,
      })
        .setLngLat(toLngLat(routePoint.coordinate))
        .addTo(map);

      if (routePoint.draggable) {
        marker.on('dragstart', () => {
          element.style.cursor = 'grabbing';
        });
        marker.on('dragend', () => {
          element.style.cursor = 'grab';
          const next = marker.getLngLat();
          onRoutePointCoordinateChangeRef.current?.(routePoint.id, {
            lat: next.lat,
            lng: next.lng,
          });
        });
      }

      return marker;
    });
    routePointMarkersRef.current = nextRoutePointMarkers;
  }, [routePointMarkers, styleReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) {
      return;
    }

    removeRouteLayers(map, routeLayersRef.current);
    removeStationMarkers(routeEndpointMarkersRef.current);
    const nextRouteLayers: RouteLayerRef[] = [];
    const nextEndpointMarkers: maplibregl.Marker[] = [];

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
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': route.style.color,
          'line-width': route.style.weight,
          'line-opacity': route.style.opacity ?? 1,
          ...(dashArray ? { 'line-dasharray': dashArray } : {}),
        },
      });

      nextRouteLayers.push({ layerId, sourceId });

      if (route.endpointMarkers) {
        for (const point of getRouteEndpointPoints(route.points)) {
          const element = createRouteEndpointMarkerElement(route.style.color);
          const marker = new maplibregl.Marker({
            element,
            anchor: 'center',
          })
            .setLngLat(toLngLat(point))
            .addTo(map);
          nextEndpointMarkers.push(marker);
        }
      }
    }

    routeLayersRef.current = nextRouteLayers;
    routeEndpointMarkersRef.current = nextEndpointMarkers;
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

function getRouteEndpointPoints(points: AuthorMapCoordinate[]) {
  const first = points[0];
  const last = points[points.length - 1];
  if (!first || !last) {
    return [];
  }

  if (first.lat === last.lat && first.lng === last.lng) {
    return [first];
  }

  return [first, last];
}

function createRouteEndpointMarkerElement(color: string) {
  const element = document.createElement('div');
  element.style.width = '12px';
  element.style.height = '12px';
  element.style.borderRadius = '999px';
  element.style.background = color;
  element.style.border = '2px solid #ffffff';
  element.style.boxShadow = '0 2px 8px rgba(25, 35, 45, 0.22)';
  element.style.pointerEvents = 'none';
  element.style.zIndex = '20';
  return element;
}

function createRoutePointMarkerElement(color: string) {
  const element = document.createElement('button');
  element.type = 'button';
  element.setAttribute('aria-label', 'Move route point');
  element.style.width = '18px';
  element.style.height = '18px';
  element.style.borderRadius = '999px';
  element.style.background = '#ffffff';
  element.style.border = `3px solid ${color}`;
  element.style.boxShadow = '0 2px 9px rgba(25, 35, 45, 0.25)';
  element.style.cursor = 'grab';
  element.style.padding = '0';
  element.style.touchAction = 'none';
  element.style.zIndex = '30';
  return element;
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
