import { useEffect, useMemo, useState, type ReactNode } from 'react';
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
  onAddStation: () => void;
  onTitleBack?: () => void;
  onChange: (patch: Partial<TourDraft> | ((prev: TourDraft) => TourDraft)) => void;
  editMode?: boolean;
  onEditModeToggle?: () => void;
  mobileSelectionFlow?: boolean;
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
  onTitleBack,
  onChange,
  editMode = true,
  onEditModeToggle,
  mobileSelectionFlow = false,
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

  useEffect(() => {
    if (!selectedId) {
      setSheetState('closed');
      setActiveStationPanel(null);
      setSelectedEditableRegion(null);
      setRightDrawerState('closed');
    }
  }, [selectedId]);

  useEffect(() => {
    if (!editMode) {
      setActiveStationPanel(null);
      setSelectedEditableRegion(null);
      setRightDrawerState('closed');
    }
  }, [editMode]);

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

  function selectStationAt(index: number) {
    const station = draft.stations[index];
    if (station) onSelectStation(station.id);
  }

  function onSelectStation(stationId: string) {
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
        dockLeadingAction={
          onEditModeToggle
            ? {
                ariaLabel: editMode ? 'Bearbeiten beenden' : 'Bearbeiten',
                active: editMode,
                icon: <Icon name="edit" size={15} />,
                onClick: onEditModeToggle,
              }
            : undefined
        }
        hideZoomControls
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
                onPrev={() => selectStationAt(selectedStationIndex - 1)}
                onNext={() => selectStationAt(selectedStationIndex + 1)}
                isFirst={selectedStationIndex <= 0}
                isLast={selectedStationIndex >= draft.stations.length - 1}
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
    </>
  );
}
