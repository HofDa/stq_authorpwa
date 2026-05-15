import { useEffect, type MutableRefObject } from 'react';
import type maplibregl from 'maplibre-gl';
import { useLatest } from '@/hooks/useLatest';
import type { AuthorMapCoordinate } from './mapTypes';
import {
  getActiveRouteHitLayerIds,
  type RouteLayerRef,
} from './mapLibreUtils';

export function useMapLibreMapClick({
  mapRef,
  onMapClick,
  routeLayersRef,
  styleReady,
}: {
  mapRef: MutableRefObject<maplibregl.Map | null>;
  onMapClick?: (coordinate: AuthorMapCoordinate) => void;
  routeLayersRef: MutableRefObject<RouteLayerRef[]>;
  styleReady: boolean;
}) {
  const onMapClickRef = useLatest(onMapClick);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    const handleClick = (event: maplibregl.MapMouseEvent) => {
      const hitLayerIds = getActiveRouteHitLayerIds(
        map,
        routeLayersRef.current,
      );
      if (hitLayerIds.length > 0) {
        const routeHits = map.queryRenderedFeatures(event.point, {
          layers: hitLayerIds,
        });
        if (routeHits.length > 0) {
          return;
        }
      }

      onMapClickRef.current?.({
        lat: event.lngLat.lat,
        lng: event.lngLat.lng,
      });
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [mapRef, onMapClickRef, routeLayersRef, styleReady]);
}
