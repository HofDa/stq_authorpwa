import { useRef } from 'react';
import type maplibregl from 'maplibre-gl';
import type { RouteLayerRef } from './mapLibreUtils';

export function useMapLibreRefs() {
  return {
    containerRef: useRef<HTMLDivElement | null>(null),
    currentPositionMarkerRef: useRef<maplibregl.Marker | null>(null),
    mapRef: useRef<maplibregl.Map | null>(null),
    previousFlyToCurrentPositionRef: useRef(false),
    previousSelectedStationIdRef: useRef<string | null>(null),
    routeEndpointMarkersRef: useRef<maplibregl.Marker[]>([]),
    routeLayersRef: useRef<RouteLayerRef[]>([]),
    routePointMarkersRef: useRef<maplibregl.Marker[]>([]),
    stationMarkersRef: useRef<maplibregl.Marker[]>([]),
  };
}
