import { useEffect, type MutableRefObject } from 'react';
import maplibregl from 'maplibre-gl';
import type {
  AuthorMapCurrentPosition,
  AuthorMapCurrentPositionStyle,
} from './mapTypes';
import {
  removeCurrentPositionMarker,
  toLngLat,
} from './mapLibreUtils';

export function useMapLibreCurrentPosition({
  currentPosition,
  currentPositionMarkerRef,
  currentPositionStyle,
  mapRef,
  styleReady,
}: {
  currentPosition?: AuthorMapCurrentPosition | null;
  currentPositionMarkerRef: MutableRefObject<maplibregl.Marker | null>;
  currentPositionStyle: AuthorMapCurrentPositionStyle;
  mapRef: MutableRefObject<maplibregl.Map | null>;
  styleReady: boolean;
}) {
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
    element.style.boxShadow = 'var(--stq-shadow-map-marker)';

    currentPositionMarkerRef.current = new maplibregl.Marker({
      element,
      anchor: 'center',
    })
      .setLngLat(toLngLat(currentPosition.coordinate))
      .addTo(map);

    return () => {
      removeCurrentPositionMarker(currentPositionMarkerRef.current);
      currentPositionMarkerRef.current = null;
    };
  }, [
    currentPosition,
    currentPositionMarkerRef,
    currentPositionStyle,
    mapRef,
    styleReady,
  ]);
}
