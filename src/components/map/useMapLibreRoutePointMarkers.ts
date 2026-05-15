import { useEffect, type MutableRefObject } from 'react';
import maplibregl from 'maplibre-gl';
import { useLatest } from '@/hooks/useLatest';
import type {
  AuthorMapCoordinate,
  AuthorMapRoutePointMarker,
} from './mapTypes';
import {
  createRoutePointMarkerElement,
  removeStationMarkers,
  toLngLat,
} from './mapLibreUtils';

export function useMapLibreRoutePointMarkers({
  mapRef,
  onRoutePointCoordinateChange,
  routePointMarkers,
  routePointMarkersRef,
  styleReady,
}: {
  mapRef: MutableRefObject<maplibregl.Map | null>;
  onRoutePointCoordinateChange?: (
    routePointId: string,
    coordinate: AuthorMapCoordinate,
  ) => void;
  routePointMarkers: AuthorMapRoutePointMarker[];
  routePointMarkersRef: MutableRefObject<maplibregl.Marker[]>;
  styleReady: boolean;
}) {
  const onRoutePointCoordinateChangeRef = useLatest(onRoutePointCoordinateChange);

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

    return () => {
      removeStationMarkers(routePointMarkersRef.current);
    };
  }, [
    mapRef,
    onRoutePointCoordinateChangeRef,
    routePointMarkers,
    routePointMarkersRef,
    styleReady,
  ]);
}
