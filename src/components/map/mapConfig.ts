import type { StyleSpecification } from 'maplibre-gl';

export type MapProvider = 'leaflet' | 'maplibre';

export function resolveMapProvider(value: string | undefined): MapProvider {
  return value === 'leaflet' ? 'leaflet' : 'maplibre';
}

export const MAP_PROVIDER = resolveMapProvider(import.meta.env.VITE_MAP_PROVIDER);

export function resolveMapStyleUrl(
  value: string | undefined,
  legacyValue?: string | undefined,
) {
  return value?.trim() || legacyValue?.trim() || null;
}

export const MAPLIBRE_STYLE_URL = resolveMapStyleUrl(
  import.meta.env.VITE_MAP_STYLE_URL,
  import.meta.env.VITE_MAPLIBRE_STYLE_URL,
);

export const DEFAULT_MAPLIBRE_STYLE = {
  version: 8,
  sources: {
    openstreetmap: {
      type: 'raster',
      tiles: ['https://tile.openstreetmap.org/{z}/{x}/{y}.png'],
      tileSize: 256,
      attribution: '&copy; OpenStreetMap contributors',
    },
  },
  layers: [
    {
      id: 'openstreetmap',
      type: 'raster',
      source: 'openstreetmap',
    },
  ],
} satisfies StyleSpecification;
