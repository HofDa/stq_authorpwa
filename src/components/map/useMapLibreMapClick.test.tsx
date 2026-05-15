/** @vitest-environment happy-dom */
import { act, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type maplibregl from 'maplibre-gl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { RouteLayerRef } from './mapLibreUtils';
import { useMapLibreMapClick } from './useMapLibreMapClick';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;

beforeEach(() => {
  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
});

describe('useMapLibreMapClick', () => {
  it('suppresses map clicks when a route hit layer is under the pointer', () => {
    const onMapClick = vi.fn();
    const { map, emitClick } = createMapClickHarness([{ id: 'route-hit' }]);

    act(() => {
      root.render(
        <MapClickHarness
          map={map}
          onMapClick={onMapClick}
          routeLayers={[
            {
              layerId: 'route-layer',
              sourceId: 'route-source',
              hitLayerId: 'route-hit',
            },
          ]}
        />,
      );
    });

    act(() => {
      emitClick();
    });

    expect(onMapClick).not.toHaveBeenCalled();
    expect(map.queryRenderedFeatures).toHaveBeenCalledWith(
      { x: 12, y: 18 },
      { layers: ['route-hit'] },
    );
  });

  it('forwards ordinary map clicks when no route hit layer is present', () => {
    const onMapClick = vi.fn();
    const { map, emitClick } = createMapClickHarness([]);

    act(() => {
      root.render(
        <MapClickHarness
          map={map}
          onMapClick={onMapClick}
          routeLayers={[
            {
              layerId: 'route-layer',
              sourceId: 'route-source',
              hitLayerId: 'route-hit',
            },
          ]}
        />,
      );
    });

    act(() => {
      emitClick();
    });

    expect(onMapClick).toHaveBeenCalledWith({ lat: 46.5, lng: 11.35 });
  });
});

function MapClickHarness({
  map,
  onMapClick,
  routeLayers,
}: {
  map: maplibregl.Map;
  onMapClick: (coordinate: { lat: number; lng: number }) => void;
  routeLayers: RouteLayerRef[];
}) {
  const mapRef = useRef<maplibregl.Map | null>(map);
  const routeLayersRef = useRef<RouteLayerRef[]>(routeLayers);

  useMapLibreMapClick({
    mapRef,
    onMapClick,
    routeLayersRef,
    styleReady: true,
  });

  return null;
}

function createMapClickHarness(routeHits: Array<{ id: string }>) {
  let clickHandler: ((event: maplibregl.MapMouseEvent) => void) | null = null;
  const map = {
    on: vi.fn((eventName: string, handler: typeof clickHandler) => {
      if (eventName === 'click') {
        clickHandler = handler;
      }
    }),
    off: vi.fn(),
    getLayer: vi.fn((layerId: string) =>
      layerId === 'route-hit' ? {} : undefined,
    ),
    queryRenderedFeatures: vi.fn(() => routeHits),
  } as unknown as maplibregl.Map;

  return {
    map,
    emitClick: () => {
      clickHandler?.({
        point: { x: 12, y: 18 },
        lngLat: { lat: 46.5, lng: 11.35 },
      } as maplibregl.MapMouseEvent);
    },
  };
}
