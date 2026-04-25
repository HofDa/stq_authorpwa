import { useEffect, useMemo, useState } from 'react';
import {
  DEFAULT_LOCALE,
  createId,
  emptyStation,
  type Locale,
  type TourDraft,
} from '@/schema';
import type { AuthorMapBasemapKey } from '@/components/map/mapTypes';
import { DEFAULT_AUTHOR_MAP_BASEMAP } from '@/components/map/mapTypes';
import type { FieldView } from './types';
import { useFieldGps } from './useFieldGps';

interface Props {
  draft: TourDraft;
  initialStationId: string | null;
  onChange: (recipe: (prev: TourDraft) => TourDraft) => void;
}

export function useFieldModeState({
  draft,
  initialStationId,
  onChange,
}: Props) {
  const [selectedId, setSelectedId] = useState<string | null>(
    initialStationId ?? draft.stations[0]?.id ?? null,
  );
  const [view, setView] = useState<FieldView>('station');
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [assistantOpen, setAssistantOpen] = useState(false);
  const [storylineOpen, setStorylineOpen] = useState(false);
  const [basemap, setBasemap] = useState<AuthorMapBasemapKey>(
    DEFAULT_AUTHOR_MAP_BASEMAP,
  );
  const { gpsLive, gps, gpsError, toggleGps } = useFieldGps();

  useEffect(() => {
    if (selectedId && !draft.stations.some((station) => station.id === selectedId)) {
      setSelectedId(draft.stations[0]?.id ?? null);
    }
  }, [draft.stations, selectedId]);

  const selected = useMemo(
    () => draft.stations.find((station) => station.id === selectedId) ?? null,
    [draft.stations, selectedId],
  );

  const selectedIndex = selected
    ? draft.stations.findIndex((station) => station.id === selected.id)
    : -1;

  function step(delta: -1 | 1) {
    if (selectedIndex < 0) return;
    const next = selectedIndex + delta;
    if (next < 0 || next >= draft.stations.length) return;
    setSelectedId(draft.stations[next].id);
  }

  function pinSelectedToGps() {
    if (!selected || !gps) return;
    const stationId = selected.id;
    onChange((prev) => ({
      ...prev,
      stations: prev.stations.map((station) =>
        station.id === stationId
          ? { ...station, position_lat: gps.lat, position_lng: gps.lng }
          : station,
      ),
    }));
  }

  function setSelectedPhoto(blobId: string) {
    if (!selected) return;
    const stationId = selected.id;
    onChange((prev) => ({
      ...prev,
      stations: prev.stations.map((station) =>
        station.id === stationId ? { ...station, imageBlobId: blobId } : station,
      ),
    }));
  }

  function addStationAt(coordinate: { lat: number; lng: number }) {
    const id = createId('stn');
    onChange((prev) => {
      const number = prev.stations.length + 1;
      const station = {
        ...emptyStation(id, number),
        position_lat: coordinate.lat,
        position_lng: coordinate.lng,
      };
      return { ...prev, stations: [...prev.stations, station] };
    });
    // The new station has an id we know up-front, so we can select it.
    setSelectedId(id);
  }

  return {
    view,
    setView,
    locale,
    setLocale,
    assistantOpen,
    setAssistantOpen,
    storylineOpen,
    setStorylineOpen,
    gpsLive,
    gps,
    gpsError,
    toggleGps,
    selected,
    selectedId,
    selectStation: (id: string) => setSelectedId(id),
    selectStationFromList: (id: string) => {
      setSelectedId(id);
      setView('station');
    },
    goPrev: () => step(-1),
    goNext: () => step(1),
    pinSelectedToGps,
    setSelectedPhoto,
    addStationAt,
    basemap,
    setBasemap,
    gpsAccuracy: gps?.accuracy ?? null,
    tourLabel: draft.tour[locale].location || 'Tour',
    selectedLabel: selected
      ? `Station ${selected.number}: ${selected[locale].location || 'Unnamed'}`
      : 'No station selected',
    isFirst: selectedIndex <= 0,
    isLast: selectedIndex < 0 || selectedIndex >= draft.stations.length - 1,
  };
}

