import type { StyleSpecification } from 'maplibre-gl';
import {
  AUTHOR_MAP_BASEMAPS,
  DEFAULT_AUTHOR_MAP_BASEMAP,
  type AuthorMapBasemapKey,
} from './mapTypes';

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

export function expandTileUrlSubdomains(
  tileUrl: string,
  subdomains: string[] | undefined,
): string[] {
  if (!tileUrl.includes('{s}')) {
    return [tileUrl];
  }

  if (!subdomains || subdomains.length === 0) {
    return [tileUrl.replace('{s}.', '').replace('{s}', '')];
  }

  return subdomains.map((subdomain) => tileUrl.replace('{s}', subdomain));
}

export function buildRasterBasemapStyle(
  key: AuthorMapBasemapKey = DEFAULT_AUTHOR_MAP_BASEMAP,
): StyleSpecification {
  const basemap = AUTHOR_MAP_BASEMAPS[key] ?? AUTHOR_MAP_BASEMAPS[DEFAULT_AUTHOR_MAP_BASEMAP];

  return {
    version: 8,
    sources: {
      basemap: {
        type: 'raster',
        tiles: expandTileUrlSubdomains(basemap.tileUrl, basemap.subdomains),
        tileSize: 256,
        maxzoom: basemap.maxZoom,
        attribution: basemap.attribution,
      },
    },
    layers: [
      {
        id: 'basemap',
        type: 'raster',
        source: 'basemap',
      },
    ],
  } satisfies StyleSpecification;
}

export function resolveMapLibreStyle(
  basemap: AuthorMapBasemapKey = DEFAULT_AUTHOR_MAP_BASEMAP,
  styleUrl = MAPLIBRE_STYLE_URL,
): string | StyleSpecification {
  return styleUrl ?? buildRasterBasemapStyle(basemap);
}

export const DEFAULT_MAPLIBRE_STYLE = buildRasterBasemapStyle(
  DEFAULT_AUTHOR_MAP_BASEMAP,
);
