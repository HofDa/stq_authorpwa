import { useEffect, useRef, useState, type MutableRefObject } from 'react';
import maplibregl from 'maplibre-gl';
import {
  MAPLIBRE_STYLE_URL,
  resolveMapLibreStyle,
} from './mapConfig';
import type {
  AuthorMapBasemapKey,
  AuthorMapViewport,
} from './mapTypes';
import { SELECTION_LAYER_ID, SELECTION_SOURCE_ID } from './mapLibreLayerIds';
import {
  removeCurrentPositionMarker,
  removeLayerAndSource,
  removeRouteLayers,
  removeStationMarkers,
  toLngLat,
  type RouteLayerRef,
} from './mapLibreUtils';

interface MapLibreErrorEvent {
  error?: {
    message?: string;
  };
}

const FAST_WHEEL_ZOOM_RATE = 1 / 50;

export function useMapLibreInstance({
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
}: {
  basemap: AuthorMapBasemapKey;
  containerRef: MutableRefObject<HTMLDivElement | null>;
  currentPositionMarkerRef: MutableRefObject<maplibregl.Marker | null>;
  mapRef: MutableRefObject<maplibregl.Map | null>;
  manualDragPan: boolean;
  previousFlyToCurrentPositionRef: MutableRefObject<boolean>;
  previousSelectedStationIdRef: MutableRefObject<string | null>;
  routeEndpointMarkersRef: MutableRefObject<maplibregl.Marker[]>;
  routeLayersRef: MutableRefObject<RouteLayerRef[]>;
  routePointMarkersRef: MutableRefObject<maplibregl.Marker[]>;
  viewport: AuthorMapViewport;
  zoomControl: boolean;
}) {
  const initialBasemapRef = useRef<AuthorMapBasemapKey>(basemap);
  const initialCenterRef = useRef(viewport.center);
  const initialZoomRef = useRef(viewport.zoom);
  const initialZoomControlRef = useRef(zoomControl);
  const initialManualDragPanRef = useRef(manualDragPan);
  const [styleReady, setStyleReady] = useState(false);
  const [mapError, setMapError] = useState<string | null>(null);

  useEffect(() => {
    if (!containerRef.current || mapRef.current) {
      return;
    }

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: resolveMapLibreStyle(initialBasemapRef.current),
      center: toLngLat(initialCenterRef.current),
      zoom: initialZoomRef.current,
      interactive: true,
      dragPan: !initialManualDragPanRef.current,
      scrollZoom: true,
      boxZoom: true,
      keyboard: true,
      doubleClickZoom: true,
      touchZoomRotate: true,
      attributionControl: false,
    });

    if (initialManualDragPanRef.current) {
      map.dragPan.disable();
    } else {
      map.dragPan.enable();
    }
    map.scrollZoom.enable();
    map.scrollZoom.setWheelZoomRate(FAST_WHEEL_ZOOM_RATE);
    map.boxZoom.enable();
    map.keyboard.enable();
    map.doubleClickZoom.enable();
    map.touchZoomRotate.enable();

    map.addControl(new maplibregl.AttributionControl({ compact: true }));
    if (initialZoomControlRef.current) {
      map.addControl(new maplibregl.NavigationControl(), 'top-left');
    }

    const handleLoad = () => {
      setMapError(null);
      setStyleReady(true);
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
  }, [
    containerRef,
    currentPositionMarkerRef,
    mapRef,
    previousFlyToCurrentPositionRef,
    previousSelectedStationIdRef,
    routeEndpointMarkersRef,
    routeLayersRef,
    routePointMarkersRef,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || MAPLIBRE_STYLE_URL) return;
    if (basemap === initialBasemapRef.current) {
      return;
    }

    initialBasemapRef.current = basemap;
    const nextStyle = resolveMapLibreStyle(basemap, null);
    setStyleReady(false);
    setMapError(null);
    removeRouteLayers(map, routeLayersRef.current);
    removeLayerAndSource(map, SELECTION_LAYER_ID, SELECTION_SOURCE_ID);
    routeLayersRef.current = [];
    previousSelectedStationIdRef.current = null;
    map.setStyle(nextStyle);

    const handleStyleLoad = () => {
      if (!map.isStyleLoaded()) return;
      setStyleReady(true);
      window.requestAnimationFrame(() => map.resize());
      map.off('style.load', handleStyleLoad);
    };
    map.on('style.load', handleStyleLoad);
    return () => {
      map.off('style.load', handleStyleLoad);
    };
  }, [basemap, mapRef, previousSelectedStationIdRef, routeLayersRef]);

  return { mapError, styleReady };
}
