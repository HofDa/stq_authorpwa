import { useEffect, type MutableRefObject } from 'react';
import maplibregl from 'maplibre-gl';
import { useLatest } from '@/hooks/useLatest';
import type {
  AuthorMapControlAction,
  AuthorMapCoordinate,
  AuthorMapCurrentPosition,
  AuthorMapStation,
  AuthorMapViewport,
} from './mapTypes';
import { toLngLat, toPaddingOptions } from './mapLibreUtils';

const FAST_CAMERA_DURATION_MS = 120;

export function useMapLibreViewport({
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
}: {
  controlAction?: AuthorMapControlAction | null;
  controlZoomStep: number;
  currentPosition?: AuthorMapCurrentPosition | null;
  mapRef: MutableRefObject<maplibregl.Map | null>;
  onViewportCenterChange?: (center: AuthorMapCoordinate) => void;
  previousFlyToCurrentPositionRef: MutableRefObject<boolean>;
  previousSelectedStationIdRef: MutableRefObject<string | null>;
  selectedStationId: string | null;
  stations: AuthorMapStation[];
  styleReady: boolean;
  viewport: AuthorMapViewport;
}) {
  const onViewportCenterChangeRef = useLatest(onViewportCenterChange);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !onViewportCenterChangeRef.current) {
      return;
    }

    let lastLat: number | null = null;
    let lastLng: number | null = null;
    const emitCenter = () => {
      const center = map.getCenter();
      if (lastLat === center.lat && lastLng === center.lng) return;
      lastLat = center.lat;
      lastLng = center.lng;
      onViewportCenterChangeRef.current?.({ lat: center.lat, lng: center.lng });
    };

    map.on('moveend', emitCenter);

    return () => {
      map.off('moveend', emitCenter);
    };
  }, [mapRef, onViewportCenterChangeRef, styleReady]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) {
      return;
    }

    if (!viewport.fitToCoordinates || viewport.fitToCoordinates.length === 0) {
      return;
    }

    if (viewport.fitToCoordinates.length === 1) {
      map.stop();
      map.easeTo({
        center: toLngLat(viewport.fitToCoordinates[0]),
        zoom: viewport.fitMaxZoom ?? viewport.zoom,
        duration: FAST_CAMERA_DURATION_MS,
      });
      return;
    }

    const bounds = new maplibregl.LngLatBounds();
    for (const coordinate of viewport.fitToCoordinates) {
      bounds.extend(toLngLat(coordinate));
    }

    map.stop();
    map.fitBounds(bounds, {
      padding: toPaddingOptions(viewport.fitPadding ?? [28, 28]),
      maxZoom: viewport.fitMaxZoom ?? 17,
      duration: FAST_CAMERA_DURATION_MS,
    });
  }, [
    mapRef,
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
    map.stop();
    map.easeTo({
      center: toLngLat(selectedStation.coordinate),
      duration: FAST_CAMERA_DURATION_MS,
    });
  }, [
    mapRef,
    previousSelectedStationIdRef,
    selectedStationId,
    stations,
    styleReady,
    viewport.panToSelectedStation,
  ]);

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
    mapRef,
    previousFlyToCurrentPositionRef,
    styleReady,
    viewport.currentPositionFlyToMaxZoom,
    viewport.flyToCurrentPositionOnActivate,
  ]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady || !controlAction) {
      return;
    }

    const zoomStep = Math.max(0.25, controlZoomStep);
    if (controlAction.type === 'zoomIn') {
      map.stop();
      map.jumpTo({
        zoom: Math.min(map.getMaxZoom(), map.getZoom() + zoomStep),
      });
      return;
    }

    if (controlAction.type === 'zoomOut') {
      map.stop();
      map.jumpTo({
        zoom: Math.max(map.getMinZoom(), map.getZoom() - zoomStep),
      });
      return;
    }

    if (controlAction.type === 'recenter' && currentPosition) {
      map.flyTo({
        center: toLngLat(currentPosition.coordinate),
        zoom: viewport.currentPositionFlyToMaxZoom ?? Math.max(map.getZoom(), 16),
      });
    }
  }, [
    controlAction,
    controlZoomStep,
    currentPosition,
    mapRef,
    styleReady,
    viewport.currentPositionFlyToMaxZoom,
  ]);
}
