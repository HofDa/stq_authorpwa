import maplibregl from 'maplibre-gl';
import type { AuthorMapCoordinate } from './mapTypes';

export interface RouteLayerRef {
  layerId: string;
  sourceId: string;
}

export function removeStationMarkers(markers: maplibregl.Marker[]) {
  for (const marker of markers) {
    marker.remove();
  }
  markers.length = 0;
}

export function removeCurrentPositionMarker(marker: maplibregl.Marker | null) {
  marker?.remove();
}

export function removeRouteLayers(
  map: maplibregl.Map,
  routeLayers: RouteLayerRef[],
) {
  for (const routeLayer of routeLayers) {
    removeLayerAndSource(map, routeLayer.layerId, routeLayer.sourceId);
  }
}

export function removeLayerAndSource(
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

export function parseDashArray(dashArray: string | undefined) {
  if (!dashArray) {
    return undefined;
  }

  const values = dashArray
    .split(/[\s,]+/)
    .map((value) => Number(value))
    .filter((value) => Number.isFinite(value) && value > 0);

  return values.length > 0 ? values : undefined;
}

export function getRouteEndpointPoints(points: AuthorMapCoordinate[]) {
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

export function createRouteEndpointMarkerElement(color: string) {
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

export function createRoutePointMarkerElement(color: string) {
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

export function sanitizeLayerSuffix(value: string) {
  return value.replace(/[^a-zA-Z0-9-_]/g, '-');
}

export function toLngLat(coordinate: AuthorMapCoordinate): [number, number] {
  return [coordinate.lng, coordinate.lat];
}

export function toPaddingOptions(padding: [number, number]) {
  return {
    top: padding[1],
    right: padding[0],
    bottom: padding[1],
    left: padding[0],
  };
}

export function attachLiveStationMarkerDrag({
  element,
  map,
  marker,
  onDragStart,
  onDragEnd,
}: {
  element: HTMLElement;
  map: maplibregl.Map;
  marker: maplibregl.Marker;
  onDragStart: () => void;
  onDragEnd: () => void;
}) {
  let active = false;
  let moved = false;
  let dragOffset = { x: 0, y: 0 };

  const stop = (event: Event) => {
    event.preventDefault();
    event.stopPropagation();
    event.stopImmediatePropagation();
  };

  const start = (clientX: number, clientY: number) => {
    map.stop();
    const pointerPoint = getMapClientPoint(map, clientX, clientY);
    const markerPoint = map.project(marker.getLngLat());
    dragOffset = {
      x: pointerPoint.x - markerPoint.x,
      y: pointerPoint.y - markerPoint.y,
    };
    active = true;
    moved = false;
    onDragStart();
  };

  const move = (clientX: number, clientY: number) => {
    if (!active) return;
    const pointerPoint = getMapClientPoint(map, clientX, clientY);
    marker.setLngLat(
      map.unproject([
        pointerPoint.x - dragOffset.x,
        pointerPoint.y - dragOffset.y,
      ]),
    );
    moved = true;
  };

  const finish = () => {
    if (!active) return;
    active = false;
    window.removeEventListener('mousemove', handleMouseMove, true);
    window.removeEventListener('mouseup', handleMouseUp, true);
    window.removeEventListener('touchmove', handleTouchMove, true);
    window.removeEventListener('touchend', handleTouchEnd, true);
    window.removeEventListener('touchcancel', handleTouchEnd, true);
    onDragEnd();
  };

  const handleMouseMove = (event: MouseEvent) => {
    move(event.clientX, event.clientY);
    stop(event);
  };

  const handleMouseUp = (event: MouseEvent) => {
    finish();
    stop(event);
  };

  const handleTouchMove = (event: TouchEvent) => {
    const touch = event.touches[0];
    if (!touch) return;
    move(touch.clientX, touch.clientY);
    stop(event);
  };

  const handleTouchEnd = (event: TouchEvent) => {
    finish();
    stop(event);
  };

  element.addEventListener(
    'mousedown',
    (event) => {
      if (event.button !== 0) return;
      if ((event.target as Element | null)?.closest('.stq-station-marker-delete')) {
        return;
      }
      start(event.clientX, event.clientY);
      window.addEventListener('mousemove', handleMouseMove, true);
      window.addEventListener('mouseup', handleMouseUp, true);
      stop(event);
    },
    true,
  );

  element.addEventListener(
    'touchstart',
    (event) => {
      if ((event.target as Element | null)?.closest('.stq-station-marker-delete')) {
        return;
      }
      const touch = event.touches[0];
      if (!touch) return;
      start(touch.clientX, touch.clientY);
      window.addEventListener('touchmove', handleTouchMove, {
        capture: true,
        passive: false,
      });
      window.addEventListener('touchend', handleTouchEnd, true);
      window.addEventListener('touchcancel', handleTouchEnd, true);
      stop(event);
    },
    { capture: true, passive: false },
  );

  element.addEventListener(
    'click',
    (event) => {
      if (!moved) return;
      moved = false;
      stop(event);
    },
    true,
  );
}

function getMapClientPoint(map: maplibregl.Map, clientX: number, clientY: number) {
  const rect = map.getCanvasContainer().getBoundingClientRect();
  return {
    x: clientX - rect.left,
    y: clientY - rect.top,
  };
}
