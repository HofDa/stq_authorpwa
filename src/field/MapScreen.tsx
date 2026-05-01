import type { Locale, RiddleEntry, TourDraft } from '@/schema';
import { useEffect, useMemo, useRef, useState } from 'react';
import type { AuthorMapBasemapKey } from '@/components/map/mapTypes';
import type { AuthorMapCoordinate } from '@/components/map/mapTypes';
import type { CurrentGps } from '@/components/studio/field/types';
import { Icon } from '@/components/studio/Icon';
import { getTourTitleLabel } from '@/utils/localizedContent';
import { hasUsableStationCoordinate } from '@/utils/coordinates';
import { MapView } from './MapView';
import { StationPillBar } from './StationPillBar';
import { StationBottomSheet, type BottomSheetState } from './StationBottomSheet';

interface Props {
  draft: TourDraft;
  locale: Locale;
  selectedStation: RiddleEntry | null;
  selectedStationId: string | null;
  gps: CurrentGps | null;
  gpsLive: boolean;
  gpsError: string | null;
  basemap: AuthorMapBasemapKey;
  authorMode: boolean;
  solvedStationIds: Set<string>;
  bottomSheetState: BottomSheetState;
  isFirst: boolean;
  isLast: boolean;
  onSelectStation: (stationId: string) => void;
  onSheetStateChange: (state: BottomSheetState) => void;
  onAuthorModeChange: (enabled: boolean) => void;
  onStationSolved: (stationId: string) => void;
  onBackToTour: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToggleGps: () => void;
  onChange: (recipe: (prev: TourDraft) => TourDraft) => void;
}

export function MapScreen({
  draft,
  locale,
  selectedStation,
  selectedStationId,
  gps,
  gpsLive,
  gpsError,
  basemap,
  authorMode,
  solvedStationIds,
  bottomSheetState,
  isFirst,
  isLast,
  onSelectStation,
  onSheetStateChange,
  onAuthorModeChange,
  onStationSolved,
  onBackToTour,
  onPrev,
  onNext,
  onToggleGps,
  onChange,
}: Props) {
  const [markerDragMode, setMarkerDragMode] = useState(false);
  const [navigationSegment, setNavigationSegment] = useState<{
    from: AuthorMapCoordinate;
    to: AuthorMapCoordinate;
    progress: number;
    trigger: string;
  } | null>(null);
  const navigationFrameRef = useRef<number | null>(null);
  const selectedIndex = selectedStation
    ? draft.stations.findIndex((station) => station.id === selectedStation.id)
    : -1;
  const nextStation =
    selectedIndex >= 0 && selectedIndex < draft.stations.length - 1
      ? draft.stations[selectedIndex + 1]
      : null;

  useEffect(() => {
    if (!authorMode) setMarkerDragMode(false);
  }, [authorMode]);

  useEffect(
    () => () => {
      if (navigationFrameRef.current !== null) {
        window.cancelAnimationFrame(navigationFrameRef.current);
      }
    },
    [],
  );

  function openStation(stationId: string) {
    onSelectStation(stationId);
    onSheetStateChange('expanded');
  }

  function changeStationCoordinate(
    stationId: string,
    coordinate: { lat: number; lng: number },
  ) {
    onChange((prev) => ({
      ...prev,
      stations: prev.stations.map((station) =>
        station.id === stationId
          ? {
              ...station,
              position_lat: coordinate.lat,
              position_lng: coordinate.lng,
            }
          : station,
      ),
    }));
  }

  function toggleMarkerDragMode() {
    setMarkerDragMode((enabled) => {
      const next = !enabled;
      if (next) {
        onSheetStateChange('closed');
      }
      return next;
    });
  }

  function deleteStation(stationId: string) {
    const currentIndex = draft.stations.findIndex((station) => station.id === stationId);
    const nextStation =
      draft.stations[currentIndex + 1] ??
      draft.stations[currentIndex - 1] ??
      draft.stations.find((station) => station.id !== stationId) ??
      null;

    onChange((prev) => ({
      ...prev,
      stations: prev.stations
        .filter((station) => station.id !== stationId)
        .map((station, index) => ({ ...station, number: index + 1 })),
    }));
    onSelectStation(nextStation?.id ?? '');
    onSheetStateChange(nextStation ? 'collapsed' : 'closed');
  }

  function goToNextWithNavigation() {
    if (!selectedStation || !nextStation) {
      onNext();
      return;
    }

    if (
      authorMode ||
      !hasUsableStationCoordinate(selectedStation) ||
      !hasUsableStationCoordinate(nextStation)
    ) {
      onNext();
      return;
    }

    if (navigationFrameRef.current !== null) {
      window.cancelAnimationFrame(navigationFrameRef.current);
      navigationFrameRef.current = null;
    }

    const from = {
      lat: selectedStation.position_lat,
      lng: selectedStation.position_lng,
    };
    const to = {
      lat: nextStation.position_lat,
      lng: nextStation.position_lng,
    };
    const trigger = `${selectedStation.id}-${nextStation.id}-${Date.now()}`;
    const startedAt = performance.now();
    const durationMs = 1450;

    onSheetStateChange('closed');
    setNavigationSegment({ from, to, progress: 0, trigger });

    const tick = (now: number) => {
      const progress = Math.min(1, (now - startedAt) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setNavigationSegment({ from, to, progress: eased, trigger });

      if (progress < 1) {
        navigationFrameRef.current = window.requestAnimationFrame(tick);
        return;
      }

      navigationFrameRef.current = null;
      window.setTimeout(() => {
        setNavigationSegment(null);
        onNext();
      }, 120);
    };

    navigationFrameRef.current = window.requestAnimationFrame(tick);
  }

  const draggableStationIds = useMemo(
    () =>
      authorMode && markerDragMode
        ? draft.stations.map((station) => station.id)
        : [],
    [authorMode, draft.stations, markerDragMode],
  );
  const tourTitle = getTourTitleLabel(draft.tour, locale, 'Rätseltour');

  return (
    <main className="stq-field-map-screen">
      <MapView
        stations={draft.stations}
        selectedStationId={selectedStationId}
        locale={locale}
        gps={gps}
        gpsLive={gpsLive}
        basemap={basemap}
        onSelectStation={openStation}
        draggableStationIds={draggableStationIds}
        onStationCoordinateChange={changeStationCoordinate}
        navigationSegment={navigationSegment}
      />
      <div className="stq-field-map-topbar">
        <button
          type="button"
          className="stq-field-map-title-pill"
          onClick={onBackToTour}
          aria-label="Back to tour"
        >
          <Icon name="chevron-left" size={20} />
          <span>{tourTitle}</span>
        </button>
        <button
          type="button"
          className={gpsLive ? 'active' : ''}
          onClick={onToggleGps}
          aria-pressed={gpsLive}
        >
          <Icon name="map-pin" size={16} />
          {gpsLive && gps ? `GPS ±${Math.round(gps.accuracy)}m` : 'GPS'}
        </button>
        {authorMode && (
          <>
            <button
              type="button"
              className={markerDragMode ? 'active' : ''}
              onClick={toggleMarkerDragMode}
              aria-label={
                markerDragMode ? 'Disable marker dragging' : 'Enable marker dragging'
              }
              aria-pressed={markerDragMode}
            >
              <Icon name="hand" size={16} />
            </button>
          </>
        )}
        <button
          type="button"
          className={`stq-field-map-edit-toggle${authorMode ? ' active' : ''}`}
          onClick={() => {
            if (authorMode) setMarkerDragMode(false);
            onAuthorModeChange(!authorMode);
          }}
          aria-label={authorMode ? 'Disable editing' : 'Enable editing'}
          aria-pressed={authorMode}
        >
          <Icon name="edit" size={16} />
        </button>
      </div>
      {gpsError && <div className="stq-field-map-error">{gpsError}</div>}
      <StationPillBar
        stations={draft.stations}
        selectedStationId={selectedStationId}
        locale={locale}
        onSelectStation={openStation}
        onNext={goToNextWithNavigation}
        nextDisabled={!nextStation}
      />
      <StationBottomSheet
        state={bottomSheetState}
        draft={draft}
        station={selectedStation}
        locale={locale}
        authorMode={authorMode}
        solved={selectedStation ? solvedStationIds.has(selectedStation.id) : false}
        onAuthorModeChange={onAuthorModeChange}
        onStationSolved={onStationSolved}
        isFirst={isFirst}
        isLast={isLast}
        onStateChange={onSheetStateChange}
        onBack={() => onSheetStateChange('closed')}
        onPrev={onPrev}
        onNext={goToNextWithNavigation}
        onDeleteStation={deleteStation}
        onChange={onChange}
      />
    </main>
  );
}
