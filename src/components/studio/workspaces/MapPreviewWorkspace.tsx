import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  type Locale,
  type RiddleEntry,
  type TourDraft,
} from '@/schema';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import { useBlobUrl } from '@/hooks/useBlobUrl';
import { useLatest } from '@/hooks/useLatest';
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
import { MapEditPill } from './MapEditPill';
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
  /** When true, render the round edit-mode toggle inside the map pill. */
  mapEditMode?: boolean;
  /** Toggle handler for the round map edit-mode toggle. */
  onToggleMapEditMode?: () => void;
  mobileSelectionFlow?: boolean;
  /** When true, renders a floating "+" button to add a station at viewport center. */
  showAddStationFab?: boolean;
  /** When true, renders a floating "−" button to enter delete-station mode. */
  showDeleteStationFab?: boolean;
  /** Called with the station id to delete (after user confirmation). */
  onDeleteStation?: (stationId: string) => void;
  /** When 'desktop', floating actions render outside the phone frame. */
  layout?: 'desktop' | 'mobile';
  /** Observe the bottom sheet state so callers can hide overlapping affordances. */
  onSheetStateChange?: (state: MapSheetState) => void;
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
  mapEditMode,
  onToggleMapEditMode,
  mobileSelectionFlow = false,
  showAddStationFab = false,
  showDeleteStationFab = false,
  onDeleteStation,
  layout = 'mobile',
  onSheetStateChange,
}: Props) {
  const { t } = useEditorLanguage();
  const [sheetState, setSheetState] = useState<MapSheetState>('closed');
  const [internalStationEditMode, setInternalStationEditMode] = useState(false);
  useEffect(() => {
    onSheetStateChange?.(sheetState);
    return () => {
      onSheetStateChange?.('closed');
    };
  }, [sheetState, onSheetStateChange]);
  useEffect(() => {
    if (sheetState === 'closed') setInternalStationEditMode(false);
  }, [sheetState]);
  const effectiveEditMode =
    layout === 'mobile' ? internalStationEditMode : editMode;
  const effectiveSelectionFlow =
    layout === 'mobile' ? internalStationEditMode : mobileSelectionFlow;
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
  const deleteModeRef = useLatest(deleteMode);

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

  const hasReceivedSelectionUpdate = useRef(false);
  useEffect(() => {
    if (!selectedId) {
      setSheetState('closed');
      setActiveStationPanel(null);
      setSelectedEditableRegion(null);
      setRightDrawerState('closed');
    } else if (!deleteModeRef.current) {
      const isMountWithStaleSelection =
        layout === 'mobile' && !hasReceivedSelectionUpdate.current;
      if (!isMountWithStaleSelection) setSheetState('expanded');
    }
    hasReceivedSelectionUpdate.current = true;
  }, [selectedId, layout, deleteModeRef]);

  useEffect(() => {
    if (!effectiveEditMode && !markerEditMode) {
      setActiveStationPanel(null);
      setSelectedEditableRegion(null);
      setRightDrawerState('closed');
    }
  }, [effectiveEditMode, markerEditMode]);

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
  const stationPanel = effectiveEditMode && selectedStation && activeStationPanel
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

    if (effectiveSelectionFlow && effectiveEditMode && stationId === selectedStation?.id) {
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

  function openStationPanel(panel: StationEditPanelKey) {
    setSelectedEditableRegion(panel);
    setActiveStationPanel(panel);
    if (effectiveSelectionFlow) setRightDrawerState('open');
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
      selected: effectiveSelectionFlow && selectedEditableRegion === panel,
      icon,
      onEdit: () => openStationPanel(panel),
    };
  }

  function activateStationImageEdit() {
    openStationPanel('hero');
  }

  const stationImageEditAction = effectiveEditMode ? (
    <div className="stq-riddle-map-card-actions stq-riddle-map-card-actions--center">
      <button
        type="button"
        className="stq-riddle-map-card-action stq-riddle-map-card-action--image stq-image-edit-fab"
        onClick={(event) => {
          event.stopPropagation();
          activateStationImageEdit();
        }}
        aria-label="Edit station image"
        aria-pressed={
          activeStationPanel === 'hero' ||
          (effectiveSelectionFlow && selectedEditableRegion === 'hero') ||
          undefined
        }
        title="Edit station image"
      >
        <Icon name="camera" size={16} />
      </button>
    </div>
  ) : undefined;

  const hasPillContent =
    Boolean(topRightPill) || showAddStationFab || showDeleteStationFab;
  const pillContent = hasPillContent ? (
    <div className="stq-mobile-map-edit-actions">
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
      {topRightPill}
    </div>
  ) : null;
  const sheetVisible = sheetState !== 'closed' && Boolean(selectedStation);
  const stationCardEditPill =
    layout === 'mobile' && sheetVisible ? (
      <div className="stq-phone-map-edit-pill__cluster stq-phone-map-edit-pill__cluster--title">
        <button
          type="button"
          className={`stq-phone-map-edit-pill__toggle stq-map-station-sheet-edit-toggle stq-mobile-studio__major-edit-toggle${
            internalStationEditMode ? ' is-active' : ''
          }`}
          onClick={() => setInternalStationEditMode((value) => !value)}
          aria-label={
            internalStationEditMode ? 'Bearbeiten beenden' : 'Bearbeiten'
          }
          aria-pressed={internalStationEditMode}
        >
          <Icon name="edit" size={18} />
        </button>
      </div>
    ) : undefined;
  let composedTopRightPill = stationCardEditPill;
  if (!sheetVisible && !composedTopRightPill) {
    if (onToggleMapEditMode) {
      composedTopRightPill = (
        <MapEditPill
          content={mapEditMode ? pillContent : null}
          active={Boolean(mapEditMode)}
          onToggle={onToggleMapEditMode}
          variant="title"
        />
      );
    } else {
      composedTopRightPill = pillContent ?? undefined;
    }
  }
  const editableStationIds = useMemo(
    () => draft.stations.map((station) => station.id),
    [draft.stations],
  );

  return (
    <>
      <PhoneMapMockup
        draft={draft}
        locale={locale}
        selectedId={selectedId}
        onSelectStation={onSelectStation}
        detail={t('studio.map')}
        onTitleBack={onTitleBack}
        titlePillAction={layout === 'desktop' ? undefined : composedTopRightPill}
        desktopActions={
          layout === 'desktop' && composedTopRightPill
          ? composedTopRightPill
          : undefined
        }
        onViewportCenterChange={setViewportCenter}
        draggableStationIds={
          markerEditMode && !deleteMode ? editableStationIds : undefined
        }
        deletableStationIds={deleteMode ? editableStationIds : undefined}
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
                        <Icon
                          name="camera"
                          size={16}
                          color="var(--stq-alpha-primary-icon)"
                        />
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
                authorMode={effectiveEditMode}
                interaction={selectedStation.interaction}
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
                mapHeroAction={stationImageEditAction}
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
                  effectiveEditMode
                    ? {
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

      {stationPanel && effectiveSelectionFlow && (
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

      {stationPanel && !effectiveSelectionFlow && (
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
