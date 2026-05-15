import { useEffect, type MutableRefObject } from 'react';
import maplibregl from 'maplibre-gl';
import { useLatest } from '@/hooks/useLatest';
import type {
  AuthorMapCoordinate,
  AuthorMapRoute,
} from './mapTypes';
import { resolveMapLibrePaintColor } from './mapLibrePaintTokens';
import {
  createRouteEndpointMarkerElement,
  getRouteEndpointPoints,
  parseDashArray,
  removeRouteLayers,
  removeStationMarkers,
  sanitizeLayerSuffix,
  toLngLat,
  type RouteLayerRef,
} from './mapLibreUtils';

export function useMapLibreRouteLayers({
  mapRef,
  onRouteClick,
  routeEndpointMarkersRef,
  routeLayersRef,
  routes,
  styleReady,
}: {
  mapRef: MutableRefObject<maplibregl.Map | null>;
  onRouteClick?: (routeId: string, coordinate: AuthorMapCoordinate) => void;
  routeEndpointMarkersRef: MutableRefObject<maplibregl.Marker[]>;
  routeLayersRef: MutableRefObject<RouteLayerRef[]>;
  routes: AuthorMapRoute[];
  styleReady: boolean;
}) {
  const onRouteClickRef = useLatest(onRouteClick);

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
      const hitLayerId = `stq-author-map-route-hit-${suffix}`;

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
          'line-color': resolveMapLibrePaintColor(route.style.color),
          'line-width': route.style.weight,
          'line-opacity': route.style.opacity ?? 1,
          ...(dashArray ? { 'line-dasharray': dashArray } : {}),
        },
      });

      map.addLayer({
        id: hitLayerId,
        type: 'line',
        source: sourceId,
        layout: {
          'line-cap': 'round',
          'line-join': 'round',
        },
        paint: {
          'line-color': 'transparent',
          'line-opacity': 0,
          'line-width': Math.max(route.style.weight + 14, 18),
        },
      });

      const routeId = route.id;
      const handleRouteClick = (event: maplibregl.MapMouseEvent) => {
        event.preventDefault();
        event.originalEvent?.stopPropagation();
        if (!onRouteClickRef.current) return;
        onRouteClickRef.current(routeId, {
          lat: event.lngLat.lat,
          lng: event.lngLat.lng,
        });
      };
      const handleRouteMouseEnter = () => {
        map.getCanvas().style.cursor = 'pointer';
      };
      const handleRouteMouseLeave = () => {
        map.getCanvas().style.cursor = '';
      };
      map.on('click', hitLayerId, handleRouteClick);
      map.on('mouseenter', hitLayerId, handleRouteMouseEnter);
      map.on('mouseleave', hitLayerId, handleRouteMouseLeave);

      nextRouteLayers.push({
        layerId,
        sourceId,
        hitLayerId,
        handleRouteClick,
        handleRouteMouseEnter,
        handleRouteMouseLeave,
      });

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

    return () => {
      removeRouteLayers(map, routeLayersRef.current);
      removeStationMarkers(routeEndpointMarkersRef.current);
    };
  }, [
    mapRef,
    onRouteClickRef,
    routeEndpointMarkersRef,
    routeLayersRef,
    routes,
    styleReady,
  ]);
}
