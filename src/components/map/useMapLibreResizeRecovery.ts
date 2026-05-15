import { useEffect, type CSSProperties, type MutableRefObject } from 'react';
import type maplibregl from 'maplibre-gl';

export function useMapLibreResizeRecovery({
  className,
  mapRef,
  style,
  styleReady,
}: {
  className?: string;
  mapRef: MutableRefObject<maplibregl.Map | null>;
  style?: CSSProperties;
  styleReady: boolean;
}) {
  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    map.resize();
  }, [className, mapRef, style, styleReady]);
}
