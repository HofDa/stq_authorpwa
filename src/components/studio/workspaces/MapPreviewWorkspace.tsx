import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  type Locale,
  type RiddleEntry,
  type TourDraft,
} from '@/schema';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import { useBlobUrl } from '@/hooks/useBlobUrl';
import { RiddleScreen } from '@/renderer/RiddleScreen';
import { resolveRendererAssetPath } from '@/renderer/assetPaths';
import {
  STATION_SECTION_FALLBACK_TITLES,
  STATION_SECTION_KEYS,
  type RendererSectionKey,
} from '@/renderer/stationSections';
import {
  hasSelectedStationIcon,
  normalizeStationVisualChoice,
} from '@/stations/visuals';
import { EditPanel } from '../EditPanel';
import { Icon } from '../Icon';
import {
  RightEditDrawer,
  type RightEditDrawerState,
} from '../mobile/RightEditDrawer';
import { StationIconPreview } from '@/components/stations/StationVisualPreview';
import type { AuthorMapCoordinate } from '@/components/map/mapTypes';
import { PhoneMapMockup } from './PhoneMapMockup';
import { MapStationSheet, type MapSheetState } from './MapStationSheet';
import {
  getStationEditPanel,
  getStoryHeading,
  type StationEditPanelKey,
} from './StationEditPanel';

interface Props {
  draft: TourDraft;
  locale: Locale;
  selectedId: string | null;
  onSelectStation: (id: string) => void;
  onAddStation: (coordinate?: AuthorMapCoordinate) => void;
  onTitleBack?: () => void;
  onOpenOutro?: () => void;
  onChange: (patch: Partial<TourDraft> | ((prev: TourDraft) => TourDraft)) => void;
  editMode?: boolean;
  markerEditMode?: boolean;
  topRightPill?: ReactNode;
  mobileSelectionFlow?: boolean;
  /** When true, renders a floating "+" button to add a station at viewport center. */
  showAddStationFab?: boolean;
  /** When true, renders a floating "−" button to enter delete-station mode. */
  showDeleteStationFab?: boolean;
  /** Called with the station id to delete (after user confirmation). */
  onDeleteStation?: (stationId: string) => void;
}

const SECTION_LABELS: Record<RendererSectionKey, string> = {
  firstSection: 'Story',
  historySection: 'Mehr Infos',
  riddleSection: 'Riddle',
  successSection: 'Success',
};

export function MapPreviewWorkspace({
  draft,
  locale,
  selectedId,
  onSelectStation: onSelectStationProp,
  onAddStation,
  onTitleBack,
  onOpenOutro,
  onChange,
  editMode = true,
  markerEditMode = false,
  topRightPill,
  mobileSelectionFlow = false,
  showAddStationFab = false,
  showDeleteStationFab = false,
  onDeleteStation,
}: Props) {
  const { t } = useEditorLanguage();
  const [sheetState, setSheetState] = useState<MapSheetState>('closed');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeStationPanel, setActiveStationPanel] =
    useState<StationEditPanelKey | null>(null);
  const [selectedEditableRegion, setSelectedEditableRegion] =
    useState<StationEditPanelKey | null>(null);
  const [rightDrawerState, setRightDrawerState] =
    useState<RightEditDrawerState>('closed');
  const [viewportCenter, setViewportCenter] =
    useState<AuthorMapCoordinate | null>(null);
  const [deleteMode, setDeleteMode] = useState(false);
  const [pendingDeleteId, setPendingDeleteId] = useState<string | null>(null);
  const deleteModeRef = useRef(deleteMode);
  deleteModeRef.current = deleteMode;

  useEffect(() => {
    if (!showDeleteStationFab) {
      setDeleteMode(false);
      setPendingDeleteId(null);
    }
  }, [showDeleteStationFab]);

  useEffect(() => {
    if (deleteMode) {
      setSheetState('closed');
      setActiveStationPanel(null);
      setRightDrawerState('closed');
    }
  }, [deleteMode]);

  useEffect(() => {
    if (!selectedId) {
      setSheetState('closed');
      setActiveStationPanel(null);
      setSelectedEditableRegion(null);
      setRightDrawerState('closed');
    } else if (!deleteModeRef.current) {
      setSheetState('expanded');
    }
  }, [selectedId]);

  useEffect(() => {
    if (!editMode && !markerEditMode) {
      setActiveStationPanel(null);
      setSelectedEditableRegion(null);
      setRightDrawerState('closed');
    }
  }, [editMode, markerEditMode]);

  const selectedStation =
    draft.stations.find((station) => station.id === selectedId) ??
    draft.stations[0] ??
    null;
  const selectedImageBlobUrl = useBlobUrl(selectedStation?.imageBlobId);
  const selectedImageUrl =
    selectedImageBlobUrl ?? resolveRendererAssetPath(selectedStation?.imagePath);

  function patchStation(
    stationId: string,
    updater: (station: RiddleEntry) => RiddleEntry,
  ) {
    onChange((prev) => ({
      ...prev,
      stations: prev.stations.map((station) =>
        station.id === stationId ? updater(station) : station,
      ),
    }));
  }

  function patchSelectedLocale(
    stationId: string,
    patch: Partial<RiddleEntry[Locale]>,
  ) {
    patchStation(stationId, (station) => ({
      ...station,
      [locale]: {
        ...station[locale],
        ...patch,
      },
    }));
  }

  const stationSections = useMemo(
    () =>
      selectedStation
        ? STATION_SECTION_KEYS.map((key) => ({
            key,
            label: SECTION_LABELS[key],
            fallbackTitle: STATION_SECTION_FALLBACK_TITLES[key],
            blocks: selectedStation[locale][key],
          }))
        : [],
    [locale, selectedStation],
  );
  const stationPanel = editMode && selectedStation && activeStationPanel
    ? getStationEditPanel({
        panel: activeStationPanel,
        station: selectedStation,
        locale,
        t,
        draftId: draft.draftId,
        imageUrl: selectedImageUrl,
        onPatchLocale: (patch) => patchSelectedLocale(selectedStation.id, patch),
        onPatchStation: (patch) =>
          patchStation(selectedStation.id, (station) => ({
            ...station,
            ...patch,
          })),
      })
    : null;
  const selectedStationIndex = selectedStation
    ? draft.stations.findIndex((station) => station.id === selectedStation.id)
    : -1;

  function onSelectStation(stationId: string) {
    if (deleteModeRef.current) {
      setPendingDeleteId(stationId);
      return;
    }
    if (markerEditMode) {
      onSelectStationProp(stationId);
      setSheetState('closed');
      setActiveStationPanel(null);
      setSelectedEditableRegion(null);
      setRightDrawerState('closed');
      return;
    }

    if (mobileSelectionFlow && editMode && stationId === selectedStation?.id) {
      setSheetState('expanded');
      openStationPanel('marker');
      return;
    }

    onSelectStationProp(stationId);
    setSheetState('expanded');
    setActiveStationPanel(null);
    setSelectedEditableRegion(null);
    setRightDrawerState('closed');
  }

  function selectEditableRegion(panel: StationEditPanelKey) {
    setSelectedEditableRegion(panel);
    setActiveStationPanel(null);
    setRightDrawerState('closed');
  }

  function openStationPanel(panel: StationEditPanelKey) {
    setSelectedEditableRegion(panel);
    setActiveStationPanel(panel);
    if (mobileSelectionFlow) setRightDrawerState('open');
  }

  function closeStationPanel() {
    setActiveStationPanel(null);
    setRightDrawerState('closed');
  }

  function addStationAtViewportCenter() {
    onAddStation(viewportCenter ?? undefined);
    setSheetState('closed');
    setActiveStationPanel(null);
    setSelectedEditableRegion(null);
    setRightDrawerState('closed');
  }

  function editableRegion(
    panel: StationEditPanelKey,
    label: string,
    icon?: ReactNode,
  ) {
    return {
      label,
      active: activeStationPanel === panel,
      selected: mobileSelectionFlow && selectedEditableRegion === panel,
      icon,
      onSelect: mobileSelectionFlow
        ? () => selectEditableRegion(panel)
        : undefined,
      onEdit: () => openStationPanel(panel),
    };
  }

  const composedTopRightPill =
    topRightPill || showAddStationFab || showDeleteStationFab ? (
      <div className="stq-mobile-map-edit-actions">
        {topRightPill}
        {showAddStationFab && (
          <button
            type="button"
            onClick={addStationAtViewportCenter}
            aria-label={t('studio.addStation')}
            title={t('studio.addStation')}
          >
            <Icon name="plus" size={15} />
          </button>
        )}
        {showDeleteStationFab && (
          <button
            type="button"
            className={deleteMode ? 'is-active' : ''}
            onClick={() => setDeleteMode((value) => !value)}
            aria-label={deleteMode ? 'Löschen beenden' : 'Station löschen'}
            aria-pressed={deleteMode}
            title={deleteMode ? 'Löschen beenden' : 'Station löschen'}
          >
            <Icon name="trash" size={15} />
          </button>
        )}
      </div>
    ) : undefined;

  const sheetVisible = sheetState !== 'closed' && Boolean(selectedStation);
  const mobileContextToolbar =
    mobileSelectionFlow && editMode && selectedStation ? (
      <>
        <button
          type="button"
          className={activeStationPanel === 'station' ? 'is-active' : ''}
          aria-label={t('studio.editStation')}
          aria-pressed={activeStationPanel === 'station' || undefined}
          onClick={() => openStationPanel('station')}
        >
          <Icon name="settings" size={16} />
        </button>
        <button
          type="button"
          className={activeStationPanel === 'marker' ? 'is-active' : ''}
          aria-label="Marker & GPS"
          aria-pressed={activeStationPanel === 'marker' || undefined}
          onClick={() => openStationPanel('marker')}
        >
          <Icon name="map-pin" size={16} />
        </button>
      </>
    ) : undefined;

  return (
    <>
      <PhoneMapMockup
        draft={draft}
        locale={locale}
        selectedId={selectedId}
        onSelectStation={onSelectStation}
        detail={t('studio.map')}
        onTitleBack={onTitleBack}
        toolbar={mobileContextToolbar}
        topRightPill={composedTopRightPill}
        onViewportCenterChange={setViewportCenter}
        draggableStationIds={
          markerEditMode && !deleteMode
            ? draft.stations.map((station) => station.id)
            : undefined
        }
        deletableStationIds={
          deleteMode ? draft.stations.map((station) => station.id) : undefined
        }
        onDeleteStation={(stationId) => setPendingDeleteId(stationId)}
        onStationCoordinateChange={(stationId, coordinate) => {
          patchStation(stationId, (station) => ({
            ...station,
            position_lat: coordinate.lat,
            position_lng: coordinate.lng,
          }));
        }}
        showLayersControl
        bottomSheet={
          sheetVisible && selectedStation ? (
            <MapStationSheet
              state={sheetState}
              onStateChange={(next) => {
                setSheetState(next);
                if (next === 'closed') {
                  setActiveStationPanel(null);
                  setSelectedEditableRegion(null);
                  setRightDrawerState('closed');
                }
              }}
              collapsedHeader={
                <div className="stq-map-station-sheet-collapsed-row">
                  <div className="stq-map-station-sheet-icon">
                    <StationIconPreview
                      station={selectedStation}
                      style={{ width: 32, height: 32 }}
                    />
                  </div>
                  <div className="stq-map-station-sheet-thumb">
                    {selectedImageUrl ? (
                      <img src={selectedImageUrl} alt="" />
                    ) : (
                      <div className="stq-map-station-sheet-thumb-empty">
                        <Icon name="camera" size={16} color="rgba(144,74,72,0.6)" />
                      </div>
                    )}
                  </div>
                  <div className="stq-map-station-sheet-titles">
                    <div className="stq-map-station-sheet-eyebrow">
                      {t('studio.station')} {selectedStation.number}
                    </div>
                    <div className="stq-map-station-sheet-title">
                      {getStoryHeading(selectedStation, locale, t)}
                    </div>
                  </div>
                </div>
              }
            >
              <RiddleScreen
                title={getStoryHeading(selectedStation, locale, t)}
                stationNumber={selectedStation.number}
                totalStations={draft.stations.length}
                imageUrl={selectedImageUrl}
                iconPath={
                  hasSelectedStationIcon(selectedStation)
                    ? selectedStation.iconPath
                    : undefined
                }
                stationVisual={
                  hasSelectedStationIcon(selectedStation)
                    ? normalizeStationVisualChoice(selectedStation)
                    : undefined
                }
                sections={stationSections}
                acceptedAnswers={selectedStation.acceptedAnswers[locale]}
                hints={selectedStation[locale].hints}
                showHintLabel={t('studio.showHint')}
                noHintLabel={t('studio.noHint')}
                historyOpen={historyOpen}
                onHistoryToggle={() => setHistoryOpen((open) => !open)}
                presentation="mapOverlay"
                onBack={() => {
                  setSheetState('closed');
                  setActiveStationPanel(null);
                  setSelectedEditableRegion(null);
                  setRightDrawerState('closed');
                }}
                onSolved={() => {
                  if (selectedStationIndex >= draft.stations.length - 1) {
                    onOpenOutro?.();
                  }
                }}
                editableRegions={
                  editMode
                    ? {
                        hero: editableRegion('hero', 'Edit station image'),
                        title: editableRegion('title', 'Edit station title'),
                        story: editableRegion('story', 'Edit story'),
                        history: editableRegion('history', 'Edit more infos'),
                        riddle: editableRegion('riddle', 'Edit riddle'),
                        riddleSettings: editableRegion(
                          'riddleSettings',
                          t('studio.riddleSettings'),
                          <Icon name="settings" size={12} />,
                        ),
                        answers: editableRegion('answers', t('studio.hints')),
                        successSection: editableRegion(
                          'successSection',
                          SECTION_LABELS.successSection,
                        ),
                      }
                    : undefined
                }
              />
            </MapStationSheet>
          ) : null
        }
      />

      {stationPanel && mobileSelectionFlow && (
        <RightEditDrawer
          title={stationPanel.title}
          fields={stationPanel.fields}
          state={rightDrawerState}
          onStateChange={setRightDrawerState}
          onClose={closeStationPanel}
        >
          {stationPanel.body}
        </RightEditDrawer>
      )}

      {stationPanel && !mobileSelectionFlow && (
        <EditPanel
          title={stationPanel.title}
          fields={stationPanel.fields}
          open={activeStationPanel !== null}
          onClose={closeStationPanel}
        >
          {stationPanel.body}
        </EditPanel>
      )}

      {pendingDeleteId && (() => {
        const target = draft.stations.find((s) => s.id === pendingDeleteId);
        if (!target) return null;
        const label =
          target[locale].location || `${t('studio.station')} ${target.number}`;
        return (
          <div
            className="stq-confirm-overlay"
            role="dialog"
            aria-modal="true"
            aria-label="Station löschen bestätigen"
          >
            <div className="stq-confirm-dialog">
              <h3 className="stq-confirm-dialog__title">Station löschen?</h3>
              <p className="stq-confirm-dialog__body">
                „{label}" wird unwiderruflich entfernt.
              </p>
              <div className="stq-confirm-dialog__actions">
                <button
                  type="button"
                  className="stq-confirm-dialog__btn"
                  onClick={() => setPendingDeleteId(null)}
                >
                  Abbrechen
                </button>
                <button
                  type="button"
                  className="stq-confirm-dialog__btn stq-confirm-dialog__btn--danger"
                  onClick={() => {
                    onDeleteStation?.(pendingDeleteId);
                    setPendingDeleteId(null);
                  }}
                >
                  Löschen
                </button>
              </div>
            </div>
          </div>
        );
      })()}
    </>
  );
}
