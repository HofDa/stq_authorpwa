/** @vitest-environment happy-dom */
import { act, useRef } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type maplibregl from 'maplibre-gl';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { useMapLibreManualPan } from './useMapLibreManualPan';

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

describe('useMapLibreManualPan', () => {
  it('pans the map for a single touch pointer', () => {
    const map = createMap();

    renderManualPanHarness(map);

    dispatchPointer('pointerdown', { pointerId: 1, pointerType: 'touch' });
    dispatchPointer('pointermove', {
      clientX: 8,
      clientY: 0,
      pointerId: 1,
      pointerType: 'touch',
    });

    expect(map.panBy).toHaveBeenCalledWith([-8, -0], { animate: false });
  });

  it('yields multi-touch gestures so MapLibre can pinch zoom', () => {
    const map = createMap();

    renderManualPanHarness(map);

    dispatchPointer('pointerdown', { pointerId: 1, pointerType: 'touch' });
    dispatchPointer('pointerdown', { pointerId: 2, pointerType: 'touch' });
    dispatchPointer('pointermove', {
      clientX: 8,
      clientY: 0,
      pointerId: 1,
      pointerType: 'touch',
    });

    expect(map.panBy).not.toHaveBeenCalled();
  });
});

function renderManualPanHarness(map: maplibregl.Map) {
  act(() => {
    root.render(<ManualPanHarness map={map} />);
  });
}

function ManualPanHarness({ map }: { map: maplibregl.Map }) {
  const containerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<maplibregl.Map | null>(map);

  useMapLibreManualPan({
    containerRef,
    manualDragPan: true,
    mapRef,
    styleReady: true,
  });

  return <div ref={containerRef} data-testid="map" />;
}

function createMap() {
  return {
    dragPan: {
      disable: vi.fn(),
      enable: vi.fn(),
    },
    panBy: vi.fn(),
  } as unknown as maplibregl.Map;
}

function dispatchPointer(
  type: string,
  init: {
    clientX?: number;
    clientY?: number;
    pointerId: number;
    pointerType: string;
  },
) {
  const target = container.querySelector('[data-testid="map"]');
  if (!target) {
    throw new Error('Map test container not found');
  }

  const event = new Event(type, { bubbles: true, cancelable: true });
  Object.assign(event, {
    button: 0,
    clientX: init.clientX ?? 0,
    clientY: init.clientY ?? 0,
    pointerId: init.pointerId,
    pointerType: init.pointerType,
  });

  act(() => {
    target.dispatchEvent(event);
  });
}
