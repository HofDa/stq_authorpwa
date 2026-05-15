import { useEffect, type MutableRefObject } from 'react';
import type maplibregl from 'maplibre-gl';

const TAP_SLOP_PX = 4;

export function useMapLibreManualPan({
  containerRef,
  manualDragPan,
  mapRef,
  styleReady,
}: {
  containerRef: MutableRefObject<HTMLDivElement | null>;
  manualDragPan: boolean;
  mapRef: MutableRefObject<maplibregl.Map | null>;
  styleReady: boolean;
}) {
  useEffect(() => {
    const map = mapRef.current;
    const container = containerRef.current;
    if (!map || !container) {
      return;
    }

    if (!manualDragPan) {
      map.dragPan.enable();
      return;
    }

    map.dragPan.disable();

    let activePointerId: number | null = null;
    let lastX = 0;
    let lastY = 0;
    let downX = 0;
    let downY = 0;
    let didMove = false;
    const activeTouchPointers = new Set<number>();

    const releaseActivePointer = () => {
      if (
        activePointerId !== null &&
        container.hasPointerCapture(activePointerId)
      ) {
        container.releasePointerCapture(activePointerId);
      }
      activePointerId = null;
      didMove = false;
    };

    const shouldIgnorePointer = (target: EventTarget | null) => {
      if (!(target instanceof Element)) {
        return true;
      }

      return Boolean(
        target.closest(
          [
            'button',
            'a',
            'input',
            'textarea',
            'select',
            '[role="button"]',
            '.maplibregl-marker',
            '.stq-station-marker',
            '.maplibregl-ctrl',
          ].join(','),
        ),
      );
    };

    const handlePointerDown = (event: PointerEvent) => {
      if (event.pointerType === 'touch') {
        activeTouchPointers.add(event.pointerId);
        if (activeTouchPointers.size > 1) {
          releaseActivePointer();
          return;
        }
      }

      if (event.button !== 0 || shouldIgnorePointer(event.target)) {
        return;
      }

      activePointerId = event.pointerId;
      lastX = event.clientX;
      lastY = event.clientY;
      downX = event.clientX;
      downY = event.clientY;
      didMove = false;
    };

    const handlePointerMove = (event: PointerEvent) => {
      if (event.pointerType === 'touch' && activeTouchPointers.size > 1) {
        releaseActivePointer();
        return;
      }

      if (activePointerId !== event.pointerId) {
        return;
      }

      const deltaX = event.clientX - lastX;
      const deltaY = event.clientY - lastY;
      lastX = event.clientX;
      lastY = event.clientY;

      if (!didMove) {
        const totalDx = event.clientX - downX;
        const totalDy = event.clientY - downY;
        if (Math.hypot(totalDx, totalDy) > TAP_SLOP_PX) {
          didMove = true;
          try {
            container.setPointerCapture(event.pointerId);
          } catch {
            /* capture can fail if the pointer was already released */
          }
        }
      }

      if (didMove && (deltaX !== 0 || deltaY !== 0)) {
        map.panBy([-deltaX, -deltaY], { animate: false });
        event.preventDefault();
      }
    };

    const handlePointerEnd = (event: PointerEvent) => {
      if (event.pointerType === 'touch') {
        activeTouchPointers.delete(event.pointerId);
      }

      if (activePointerId !== event.pointerId) {
        return;
      }

      if (container.hasPointerCapture(event.pointerId)) {
        container.releasePointerCapture(event.pointerId);
      }
      activePointerId = null;
      if (didMove) {
        event.preventDefault();
      }
    };

    container.addEventListener('pointerdown', handlePointerDown, true);
    container.addEventListener('pointermove', handlePointerMove, true);
    container.addEventListener('pointerup', handlePointerEnd, true);
    container.addEventListener('pointercancel', handlePointerEnd, true);

    return () => {
      container.removeEventListener('pointerdown', handlePointerDown, true);
      container.removeEventListener('pointermove', handlePointerMove, true);
      container.removeEventListener('pointerup', handlePointerEnd, true);
      container.removeEventListener('pointercancel', handlePointerEnd, true);
    };
  }, [containerRef, manualDragPan, mapRef, styleReady]);
}
