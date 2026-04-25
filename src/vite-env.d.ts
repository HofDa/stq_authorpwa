/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_MAP_PROVIDER?: 'leaflet' | 'maplibre';
  readonly VITE_MAP_STYLE_URL?: string;
  readonly VITE_MAPLIBRE_STYLE_URL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
