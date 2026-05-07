import { useEffect, useMemo, useState } from 'react';
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
  onChange: (patch: Partial<TourDraft> | ((prev: TourDraft) => TourDraft)) => void;
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
  onChange,
}: Props) {
  const { t } = useEditorLanguage();
  const [sheetState, setSheetState] = useState<MapSheetState>('closed');
  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeStationPanel, setActiveStationPanel] =
    useState<StationEditPanelKey | null>(null);

  useEffect(() => {
    if (!selectedId) {
      setSheetState('closed');
      setActiveStationPanel(null);
    }
  }, [selectedId]);

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
  const stationPanel = selectedStation && activeStationPanel
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
    onSelectStationProp(stationId);
    setSheetState('expanded');
    setActiveStationPanel(null);
  }

  const sheetVisible = sheetState !== 'closed' && Boolean(selectedStation);

  return (
    <>
      <PhoneMapMockup
        draft={draft}
        locale={locale}
        selectedId={selectedId}
        onSelectStation={onSelectStation}
        detail={t('studio.map')}
        hideZoomControls
        bottomSheet={
          sheetVisible && selectedStation ? (
            <MapStationSheet
              state={sheetState}
              onStateChange={(next) => {
                setSheetState(next);
                if (next === 'closed') setActiveStationPanel(null);
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
                }}
                onPrev={() => selectStationAt(selectedStationIndex - 1)}
                onNext={() => selectStationAt(selectedStationIndex + 1)}
                isFirst={selectedStationIndex <= 0}
                isLast={selectedStationIndex >= draft.stations.length - 1}
                editableRegions={{
                  hero: {
                    label: 'Edit station image',
                    active: activeStationPanel === 'hero',
                    onEdit: () => setActiveStationPanel('hero'),
                  },
                  title: {
                    label: 'Edit station title',
                    active: activeStationPanel === 'title',
                    onEdit: () => setActiveStationPanel('title'),
                  },
                  story: {
                    label: 'Edit story',
                    active: activeStationPanel === 'story',
                    onEdit: () => setActiveStationPanel('story'),
                  },
                  history: {
                    label: 'Edit more infos',
                    active: activeStationPanel === 'history',
                    onEdit: () => setActiveStationPanel('history'),
                  },
                  riddle: {
                    label: 'Edit riddle',
                    active: activeStationPanel === 'riddle',
                    onEdit: () => setActiveStationPanel('riddle'),
                  },
                  riddleSettings: {
                    label: t('studio.riddleSettings'),
                    active: activeStationPanel === 'riddleSettings',
                    icon: <Icon name="settings" size={12} />,
                    onEdit: () => setActiveStationPanel('riddleSettings'),
                  },
                  answers: {
                    label: t('studio.hints'),
                    active: activeStationPanel === 'answers',
                    onEdit: () => setActiveStationPanel('answers'),
                  },
                  successSection: {
                    label: SECTION_LABELS.successSection,
                    active: activeStationPanel === 'successSection',
                    onEdit: () => setActiveStationPanel('successSection'),
                  },
                }}
              />
            </MapStationSheet>
          ) : null
        }
      />

      {stationPanel && (
        <EditPanel
          title={stationPanel.title}
          fields={stationPanel.fields}
          open={activeStationPanel !== null}
          onClose={() => setActiveStationPanel(null)}
        >
          {stationPanel.body}
        </EditPanel>
      )}
    </>
  );
}
