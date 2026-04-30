import type { CSSProperties } from 'react';
import type { StationVisualChoice } from '@/stations/visuals';

export interface AuthorMapCoordinate {
  lat: number;
  lng: number;
}

export interface AuthorMapStation {
  id: string;
  number: number;
  coordinate: AuthorMapCoordinate;
  tooltip?: string;
  visual: StationVisualChoice;
}

export interface AuthorMapRouteStyle {
  color: string;
  weight: number;
  opacity?: number;
  dashArray?: string;
}

export interface AuthorMapRoute {
  id: string;
  points: AuthorMapCoordinate[];
  style: AuthorMapRouteStyle;
}

export interface AuthorMapCurrentPosition {
  coordinate: AuthorMapCoordinate;
  accuracyMeters?: number;
}

export interface AuthorMapSelectionStyle {
  radius: number;
  color: string;
  weight: number;
  fillOpacity: number;
}

export interface AuthorMapCurrentPositionStyle {
  markerRadius: number;
  markerColor: string;
  markerWeight: number;
  markerFillColor: string;
  markerFillOpacity: number;
  accuracyColor: string;
  accuracyWeight: number;
  accuracyOpacity: number;
  accuracyFillColor: string;
  accuracyFillOpacity: number;
}

export interface AuthorMapViewport {
  center: AuthorMapCoordinate;
  zoom: number;
  fitToCoordinates?: AuthorMapCoordinate[];
  fitPadding?: [number, number];
  fitMaxZoom?: number;
  fitTrigger?: string;
  panToSelectedStation?: boolean;
  flyToCurrentPositionOnActivate?: boolean;
  currentPositionFlyToMaxZoom?: number;
}

export type AuthorMapBasemapKey = 'streets' | 'outdoors' | 'satellite';

export interface AuthorMapBasemap {
  key: AuthorMapBasemapKey;
  label: string;
  /** OpenStreetMap-style XYZ raster tile URL with `{s}` / `{x}` / `{y}` / `{z}` placeholders. */
  tileUrl: string;
  attribution: string;
  maxZoom: number;
  /**
   * Optional list of subdomains for `{s}`. Keep empty for tile servers that
   * do not use subdomains (e.g. Esri ArcGIS).
   */
  subdomains?: string[];
}

export const AUTHOR_MAP_BASEMAPS: Record<AuthorMapBasemapKey, AuthorMapBasemap> = {
  streets: {
    key: 'streets',
    label: 'Streets',
    tileUrl: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    attribution: '&copy; OpenStreetMap contributors',
    maxZoom: 19,
    subdomains: ['a', 'b', 'c'],
  },
  outdoors: {
    key: 'outdoors',
    label: 'Outdoors',
    tileUrl:
      'https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png',
    attribution:
      'Map data: &copy; OpenStreetMap contributors, SRTM | Map style: &copy; OpenTopoMap (CC-BY-SA)',
    maxZoom: 17,
    subdomains: ['a', 'b', 'c'],
  },
  satellite: {
    key: 'satellite',
    label: 'Satellite',
    tileUrl:
      'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    attribution:
      'Tiles &copy; Esri &mdash; Source: Esri, Maxar, Earthstar Geographics, and the GIS User Community',
    maxZoom: 19,
  },
};

export const DEFAULT_AUTHOR_MAP_BASEMAP: AuthorMapBasemapKey = 'streets';

export interface AuthorMapProps {
  stations: AuthorMapStation[];
  viewport: AuthorMapViewport;
  className?: string;
  style?: CSSProperties;
  zoomControl?: boolean;
  routes?: AuthorMapRoute[];
  selectedStationId?: string | null;
  currentPosition?: AuthorMapCurrentPosition | null;
  selectionStyle?: AuthorMapSelectionStyle | null;
  currentPositionStyle?: AuthorMapCurrentPositionStyle;
  basemap?: AuthorMapBasemapKey;
  onSelectStation?: (stationId: string) => void;
  draggableStationIds?: string[];
  onStationCoordinateChange?: (stationId: string, coordinate: AuthorMapCoordinate) => void;
  onViewportCenterChange?: (center: AuthorMapCoordinate) => void;
}

export const AUTHOR_MAP_SELECTION_STYLE_PLANNER: AuthorMapSelectionStyle = {
  radius: 20,
  color: '#904A48',
  weight: 2,
  fillOpacity: 0.08,
};

export const AUTHOR_MAP_CURRENT_POSITION_STYLE_PLANNER: AuthorMapCurrentPositionStyle =
  {
    markerRadius: 8,
    markerColor: '#0d5ea8',
    markerWeight: 2,
    markerFillColor: '#2196f3',
    markerFillOpacity: 0.95,
    accuracyColor: '#2196f3',
    accuracyWeight: 1,
    accuracyOpacity: 0.4,
    accuracyFillColor: '#90CAF9',
    accuracyFillOpacity: 0.12,
  };

export const AUTHOR_MAP_CURRENT_POSITION_STYLE_FIELD: AuthorMapCurrentPositionStyle =
  {
    markerRadius: 7,
    markerColor: 'white',
    markerWeight: 2,
    markerFillColor: '#2196f3',
    markerFillOpacity: 1,
    accuracyColor: '#2196f3',
    accuracyWeight: 1,
    accuracyOpacity: 0.4,
    accuracyFillColor: '#90CAF9',
    accuracyFillOpacity: 0.15,
  };

export function toAuthorMapCoordinate(point: {
  lat: number;
  lng: number;
}): AuthorMapCoordinate {
  return { lat: point.lat, lng: point.lng };
}

export function isUsableAuthorMapCoordinate(
  coordinate: AuthorMapCoordinate | null | undefined,
): coordinate is AuthorMapCoordinate {
  if (!coordinate) {
    return false;
  }

  return (
    Number.isFinite(coordinate.lat) &&
    Number.isFinite(coordinate.lng) &&
    coordinate.lat >= -90 &&
    coordinate.lat <= 90 &&
    coordinate.lng >= -180 &&
    coordinate.lng <= 180 &&
    !(coordinate.lat === 0 && coordinate.lng === 0)
  );
}

export function sanitizeAuthorMapProps(props: AuthorMapProps): AuthorMapProps {
  const stations = props.stations.filter((station) =>
    isUsableAuthorMapCoordinate(station.coordinate),
  );
  const selectedStationId = stations.some(
    (station) => station.id === props.selectedStationId,
  )
    ? props.selectedStationId
    : null;

  return {
    ...props,
    stations,
    routes: props.routes?.map((route) => ({
      ...route,
      points: route.points.filter(isUsableAuthorMapCoordinate),
    })),
    selectedStationId,
    currentPosition:
      props.currentPosition &&
      isUsableAuthorMapCoordinate(props.currentPosition.coordinate)
        ? props.currentPosition
        : null,
    viewport: {
      ...props.viewport,
      fitToCoordinates: props.viewport.fitToCoordinates?.filter(
        isUsableAuthorMapCoordinate,
      ),
    },
  };
}
