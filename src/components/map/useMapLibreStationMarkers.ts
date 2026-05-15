import { useEffect, type MutableRefObject } from 'react';
import maplibregl from 'maplibre-gl';
import { useLatest } from '@/hooks/useLatest';
import {
  buildNumberedStationMarkerSvg,
  buildStationMarkerSvg,
} from '@/stations/visuals';
import type {
  AuthorMapCoordinate,
  AuthorMapStation,
} from './mapTypes';
import {
  attachLiveStationMarkerDrag,
  removeStationMarkers,
  toLngLat,
} from './mapLibreUtils';

/* Station marker geometry must stay in lockstep with `.stq-station-marker`
   in `src/index.css`. The marker SVG uses a 63x70 viewBox where the pin tip
   sits near the bottom; this offset keeps the geographic point under the tip
   without relying on MapLibre's bottom-anchor DOM re-measurement. */
const STATION_MARKER_TIP_OFFSET_PX: [number, number] = [0, -27];

export function useMapLibreStationMarkers({
  deletableStationIds,
  draggableStationIds,
  mapRef,
  onDeleteStation,
  onSelectStation,
  onStationCoordinateChange,
  selectedStationId,
  stationMarkersRef,
  stations,
  styleReady,
}: {
  deletableStationIds: string[];
  draggableStationIds: string[];
  mapRef: MutableRefObject<maplibregl.Map | null>;
  onDeleteStation?: (stationId: string) => void;
  onSelectStation?: (stationId: string) => void;
  onStationCoordinateChange?: (
    stationId: string,
    coordinate: AuthorMapCoordinate,
  ) => void;
  selectedStationId: string | null;
  stationMarkersRef: MutableRefObject<maplibregl.Marker[]>;
  stations: AuthorMapStation[];
  styleReady: boolean;
}) {
  const onDeleteStationRef = useLatest(onDeleteStation);
  const onSelectStationRef = useLatest(onSelectStation);
  const onStationCoordinateChangeRef = useLatest(onStationCoordinateChange);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !styleReady) {
      return;
    }

    removeStationMarkers(stationMarkersRef.current);
    const dragCleanups: Array<() => void> = [];
    const draggableStationIdSet = new Set(draggableStationIds);
    const deletableStationIdSet = new Set(deletableStationIds);
    const markers = stations.map((station) => {
      const selected = station.id === selectedStationId;
      const draggable = draggableStationIdSet.has(station.id);
      const deletable = deletableStationIdSet.has(station.id);
      const element = document.createElement('div');
      element.className = `stq-station-marker${
        selected ? ' stq-station-marker--selected' : ''
      }${draggable ? ' stq-station-marker--draggable' : ''}${
        deletable ? ' stq-station-marker--deletable' : ''
      }`;
      element.innerHTML = station.hasSelectedIcon
        ? buildStationMarkerSvg(station.visual, {
            highlighted: selected,
          })
        : buildNumberedStationMarkerSvg(station.visual, station.number, {
            highlighted: selected,
          });
      if (deletable) {
        const deleteButton = document.createElement('button');
        deleteButton.type = 'button';
        deleteButton.className = 'stq-station-marker-delete';
        deleteButton.setAttribute('aria-label', `Delete station ${station.number}`);
        deleteButton.textContent = '×';
        const stopDeleteInteraction = (event: Event) => {
          event.preventDefault();
          event.stopPropagation();
          event.stopImmediatePropagation();
        };
        deleteButton.addEventListener('pointerdown', stopDeleteInteraction);
        deleteButton.addEventListener('mousedown', stopDeleteInteraction);
        deleteButton.addEventListener('touchstart', stopDeleteInteraction, {
          passive: false,
        });
        deleteButton.addEventListener('click', (event) => {
          stopDeleteInteraction(event);
          onDeleteStationRef.current?.(station.id);
        });
        element.appendChild(deleteButton);
      }
      element.title = station.tooltip || `Station ${station.number}`;
      element.style.cursor = draggable ? 'grab' : 'pointer';
      let handledDrag = false;
      element.addEventListener('click', (event) => {
        event.stopPropagation();
        if (handledDrag) {
          handledDrag = false;
          return;
        }

        onSelectStationRef.current?.(station.id);
      });

      const marker = new maplibregl.Marker({
        element,
        anchor: 'center',
        offset: STATION_MARKER_TIP_OFFSET_PX,
        draggable: false,
      })
        .setLngLat(toLngLat(station.coordinate))
        .addTo(map);

      if (draggable) {
        const cleanupDrag = attachLiveStationMarkerDrag({
          element,
          map,
          marker,
          onDragStart: () => {
            handledDrag = true;
            element.style.cursor = 'grabbing';
          },
          onDragEnd: () => {
            element.style.cursor = 'grab';
            const next = marker.getLngLat();
            onStationCoordinateChangeRef.current?.(station.id, {
              lat: next.lat,
              lng: next.lng,
            });
          },
        });
        dragCleanups.push(cleanupDrag);
      }

      return marker;
    });

    stationMarkersRef.current = markers;

    return () => {
      for (const cleanupDrag of dragCleanups) {
        cleanupDrag();
      }
      removeStationMarkers(stationMarkersRef.current);
    };
  }, [
    deletableStationIds,
    draggableStationIds,
    mapRef,
    onDeleteStationRef,
    onSelectStationRef,
    onStationCoordinateChangeRef,
    selectedStationId,
    stationMarkersRef,
    stations,
    styleReady,
  ]);
}
