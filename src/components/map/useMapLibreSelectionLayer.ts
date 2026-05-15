import { useEffect, type MutableRefObject } from 'react';
import type maplibregl from 'maplibre-gl';
import type {
  AuthorMapSelectionStyle,
  AuthorMapStation,
} from './mapTypes';
import { SELECTION_LAYER_ID, SELECTION_SOURCE_ID } from './mapLibreLayerIds';
import { resolveMapLibrePaintColor } from './mapLibrePaintTokens';
import { removeLayerAndSource, toLngLat } from './mapLibreUtils';

export function useMapLibreSelectionLayer({
  mapRef,
  selectedStationId,
  selectionStyle,
  stations,
  styleReady,
}: {
  mapRef: MutableRefObject<maplibregl.Map | null>;
  selectedStationId: string | null;
  selectionStyle?: AuthorMapSelectionStyle | null;
  stations: AuthorMapStation[];
  styleReady: boolean;
}) {
  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) {
      return;
    }

    removeLayerAndSource(map, SELECTION_LAYER_ID, SELECTION_SOURCE_ID);
    if (!selectionStyle) {
      return;
    }

    const selectedStation =
      stations.find((station) => station.id === selectedStationId) ?? null;
    if (!selectedStation) {
      return;
    }

    map.addSource(SELECTION_SOURCE_ID, {
      type: 'geojson',
      data: {
        type: 'Feature',
        geometry: {
          type: 'Point',
          coordinates: toLngLat(selectedStation.coordinate),
        },
        properties: {},
      },
    });

    const selectionColor = resolveMapLibrePaintColor(selectionStyle.color);
    map.addLayer({
      id: SELECTION_LAYER_ID,
      type: 'circle',
      source: SELECTION_SOURCE_ID,
      paint: {
        'circle-radius': selectionStyle.radius,
        'circle-color': selectionColor,
        'circle-opacity': selectionStyle.fillOpacity,
        'circle-stroke-color': selectionColor,
        'circle-stroke-width': selectionStyle.weight,
      },
    });

    return () => {
      removeLayerAndSource(map, SELECTION_LAYER_ID, SELECTION_SOURCE_ID);
    };
  }, [mapRef, selectedStationId, selectionStyle, stations, styleReady]);
}
