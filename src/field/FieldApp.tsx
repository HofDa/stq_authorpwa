import { useMemo, useState } from 'react';
import type { Locale, TourDraft } from '@/schema';
import { DEFAULT_LOCALE } from '@/schema';
import type { AuthorMapBasemapKey } from '@/components/map/mapTypes';
import { DEFAULT_AUTHOR_MAP_BASEMAP } from '@/components/map/mapTypes';
import { useFieldGps } from '@/components/studio/field/useFieldGps';
import { MapScreen } from './MapScreen';
import { TourDetailScreen } from './TourDetailScreen';
import { TourMenuScreen } from './TourMenuScreen';
import type { BottomSheetState } from './StationBottomSheet';

type FieldView = 'tourMenu' | 'tourDetail' | 'map';

interface Props {
  drafts: TourDraft[];
  initialTourId?: string | null;
  initialStationId?: string | null;
  onChange: (draftId: string, recipe: (prev: TourDraft) => TourDraft) => void;
  onCreateTour?: () => void;
}

export function FieldApp({
  drafts,
  initialTourId,
  initialStationId,
  onChange,
  onCreateTour,
}: Props) {
  const [view, setView] = useState<FieldView>('tourMenu');
  const [selectedTourId, setSelectedTourId] = useState<string | null>(
    initialTourId ?? drafts[0]?.draftId ?? null,
  );
  const [selectedStationId, setSelectedStationId] = useState<string | null>(
    initialStationId ?? null,
  );
  const [activeLanguage] = useState<Locale>(DEFAULT_LOCALE);
  const [authorMode, setAuthorMode] = useState(false);
  const [bottomSheetState, setBottomSheetState] =
    useState<BottomSheetState>('closed');
  const [basemap] = useState<AuthorMapBasemapKey>(DEFAULT_AUTHOR_MAP_BASEMAP);
  const [solvedStationIds, setSolvedStationIds] = useState<Set<string>>(
    () => new Set(),
  );
  const { gpsLive, gps, gpsError, toggleGps } = useFieldGps();

  const selectedDraft = useMemo(
    () => drafts.find((draft) => draft.draftId === selectedTourId) ?? drafts[0] ?? null,
    [drafts, selectedTourId],
  );
  const selectedStation =
    selectedDraft?.stations.find((station) => station.id === selectedStationId) ??
    selectedDraft?.stations[0] ??
    null;
  const selectedIndex =
    selectedDraft && selectedStation
      ? selectedDraft.stations.findIndex((station) => station.id === selectedStation.id)
      : -1;

  function openTour(draftId: string) {
    const draft = drafts.find((item) => item.draftId === draftId);
    setSelectedTourId(draftId);
    setSelectedStationId(draft?.stations[0]?.id ?? null);
    setBottomSheetState('closed');
    setView('tourDetail');
  }

  function startTour() {
    if (!selectedDraft) return;
    setSelectedStationId((current) => current ?? selectedDraft.stations[0]?.id ?? null);
    setBottomSheetState('closed');
    setView('map');
  }

  function selectStation(stationId: string) {
    setSelectedStationId(stationId);
  }

  function markStationSolved(stationId: string) {
    setSolvedStationIds((current) => {
      if (current.has(stationId)) return current;
      const next = new Set(current);
      next.add(stationId);
      return next;
    });
  }

  function step(delta: -1 | 1) {
    if (!selectedDraft || selectedIndex < 0) return;
    const next = selectedIndex + delta;
    if (next < 0 || next >= selectedDraft.stations.length) return;
    setSelectedStationId(selectedDraft.stations[next].id);
    setBottomSheetState('collapsed');
  }

  if (view === 'tourMenu') {
    return (
      <TourMenuScreen
        drafts={drafts}
        locale={activeLanguage}
        onCreateTour={onCreateTour ?? (() => undefined)}
        onOpenTour={openTour}
      />
    );
  }

  if (!selectedDraft) {
    return (
      <TourMenuScreen
        drafts={drafts}
        locale={activeLanguage}
        onCreateTour={onCreateTour ?? (() => undefined)}
        onOpenTour={openTour}
      />
    );
  }

  if (view === 'tourDetail') {
    return (
      <TourDetailScreen
        draft={selectedDraft}
        locale={activeLanguage}
        authorMode={authorMode}
        onAuthorModeChange={setAuthorMode}
        onBack={() => setView('tourMenu')}
        onStart={startTour}
        onChange={(recipe) => onChange(selectedDraft.draftId, recipe)}
      />
    );
  }

  return (
    <MapScreen
      draft={selectedDraft}
      locale={activeLanguage}
      selectedStation={selectedStation}
      selectedStationId={selectedStation?.id ?? selectedStationId}
      gps={gps}
      gpsLive={gpsLive}
      gpsError={gpsError}
      basemap={basemap}
      authorMode={authorMode}
      solvedStationIds={solvedStationIds}
      bottomSheetState={bottomSheetState}
      isFirst={selectedIndex <= 0}
      isLast={selectedIndex < 0 || selectedIndex >= selectedDraft.stations.length - 1}
      onSelectStation={selectStation}
      onSheetStateChange={setBottomSheetState}
      onAuthorModeChange={setAuthorMode}
      onStationSolved={markStationSolved}
      onBackToTour={() => {
        setBottomSheetState('closed');
        setView('tourDetail');
      }}
      onPrev={() => step(-1)}
      onNext={() => step(1)}
      onToggleGps={toggleGps}
      onChange={(recipe) => onChange(selectedDraft.draftId, recipe)}
    />
  );
}
