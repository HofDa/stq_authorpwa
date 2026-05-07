import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import {
  formatAcceptedAnswersInput,
  parseAcceptedAnswersInput,
  type Locale,
  type RiddleEntry,
  type TourDraft,
} from '@/schema';
import type { ContentBlock } from '@/schema/contentBlock';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import { useBlobUrl } from '@/hooks/useBlobUrl';
import { storeImageBlob } from '@/media/imagePipeline';
import { RiddleScreen } from '@/renderer/RiddleScreen';
import {
  STATION_SECTION_FALLBACK_TITLES,
  STATION_SECTION_KEYS,
  type RendererSectionKey,
} from '@/renderer/stationSections';
import {
  applyStationVisualSelection,
  hasSelectedStationIcon,
  normalizeStationVisualChoice,
  STATION_ICON_OPTIONS,
} from '@/stations/visuals';
import { EditPanel, type EditPanelField } from '../EditPanel';
import { Icon } from '../Icon';
import { StationIconPreview } from '@/components/stations/StationVisualPreview';
import { PhoneMapMockup } from './PhoneMapMockup';
import { MapStationSheet, type MapSheetState } from './MapStationSheet';
import { TextBodyPanel } from './TextBodyPanel';

interface Props {
  draft: TourDraft;
  locale: Locale;
  selectedId: string | null;
  onSelectStation: (id: string) => void;
  onAddStation: () => void;
  onChange: (patch: Partial<TourDraft> | ((prev: TourDraft) => TourDraft)) => void;
}

type StationEditPanelKey =
  | 'hero'
  | 'title'
  | 'story'
  | 'history'
  | 'riddle'
  | 'riddleSettings'
  | 'answers';

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
    selectedImageBlobUrl ?? resolveAssetPath(selectedStation?.imagePath);

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
                riddleHeadingAction={
                  <button
                    type="button"
                    className={`stq-riddle-settings-cog${activeStationPanel === 'riddleSettings' ? ' is-active' : ''}`}
                    aria-label={t('studio.riddleSettings')}
                    title={t('studio.riddleSettings')}
                    onClick={(event) => {
                      event.stopPropagation();
                      setActiveStationPanel('riddleSettings');
                    }}
                  >
                    <Icon name="settings" size={14} />
                  </button>
                }
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
                  answers: {
                    label: 'Edit answer and hints',
                    active: activeStationPanel === 'answers',
                    onEdit: () => setActiveStationPanel('answers'),
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

function getStationEditPanel({
  panel,
  station,
  locale,
  t,
  draftId,
  imageUrl,
  onPatchLocale,
  onPatchStation,
}: {
  panel: StationEditPanelKey;
  station: RiddleEntry;
  locale: Locale;
  t: ReturnType<typeof useEditorLanguage>['t'];
  draftId: string;
  imageUrl: string | undefined;
  onPatchLocale: (patch: Partial<RiddleEntry[Locale]>) => void;
  onPatchStation: (patch: Partial<RiddleEntry>) => void;
}): { title: string; fields: EditPanelField[]; body?: ReactNode } {
  const localized = station[locale];
  const hints = [...localized.hints, '', '', ''].slice(0, 3);

  const panels: Record<
    StationEditPanelKey,
    { title: string; fields: EditPanelField[]; body?: ReactNode }
  > = {
    hero: {
      title: 'Stations-Bild & Icon',
      fields: [],
      body: (
        <StationImageIconPanelBody
          draftId={draftId}
          station={station}
          imageUrl={imageUrl}
          t={t}
          onPatchStation={onPatchStation}
        />
      ),
    },
    title: {
      title: t('studio.stationTitle'),
      fields: [
        {
          id: 'station-name',
          label: t('studio.stationName'),
          type: 'text',
          value: localized.location,
          placeholder: `${t('studio.station')} ${station.number}`,
          onChange: (value) => onPatchLocale({ location: value }),
        },
        {
          id: 'station-story-heading',
          label: t('studio.storyHeading'),
          type: 'text',
          value: getFirstHeadingText(localized.firstSection),
          placeholder: t('studio.storyHeadingPlaceholder'),
          onChange: (value) =>
            onPatchLocale({
              firstSection: setFirstHeadingText(localized.firstSection, value),
            }),
        },
        {
          id: 'station-icon-label',
          label: t('studio.iconLabel'),
          type: 'text',
          value: station.iconPath,
          placeholder: 'icons/...',
          onChange: (value) => onPatchStation({ iconPath: value }),
        },
      ],
    },
    story: {
      title: t('studio.storyParagraphsTitle'),
      fields: [],
      body: (
        <TextBodyPanel
          blocks={localized.firstSection.filter(
            (block) => block.type !== 'heading',
          )}
          onChange={(nextParagraphs) => {
            const headingBlocks = localized.firstSection.filter(
              (block) => block.type === 'heading',
            );
            onPatchLocale({
              firstSection: [...headingBlocks, ...nextParagraphs],
            });
          }}
          placeholder={t('studio.paragraphPlaceholder')}
        />
      ),
    },
    history: {
      title: t('studio.historySectionTitle'),
      fields: [
        {
          id: 'station-history-heading',
          label: t('studio.heading'),
          type: 'text',
          value: getFirstHeadingText(localized.historySection),
          placeholder: t('studio.historicalContextPlaceholder'),
          onChange: (value) =>
            onPatchLocale({
              historySection: setFirstHeadingText(
                localized.historySection,
                value,
              ),
            }),
        },
      ],
      body: (
        <TextBodyPanel
          blocks={localized.historySection.filter(
            (block) => block.type !== 'heading',
          )}
          onChange={(nextParagraphs) => {
            const headingBlocks = localized.historySection.filter(
              (block) => block.type === 'heading',
            );
            onPatchLocale({
              historySection: [...headingBlocks, ...nextParagraphs],
            });
          }}
          placeholder={t('studio.paragraphPlaceholder')}
        />
      ),
    },
    riddle: {
      title: t('studio.riddle'),
      fields: [
        {
          id: 'station-riddle-heading',
          label: t('studio.heading'),
          type: 'text',
          value: getFirstHeadingText(localized.riddleSection),
          placeholder: t('studio.riddlePlaceholder'),
          onChange: (value) =>
            onPatchLocale({
              riddleSection: setFirstHeadingText(
                localized.riddleSection,
                value,
              ),
            }),
        },
      ],
      body: (
        <TextBodyPanel
          blocks={localized.riddleSection.filter(
            (block) => block.type !== 'heading',
          )}
          onChange={(nextParagraphs) => {
            const headingBlocks = localized.riddleSection.filter(
              (block) => block.type === 'heading',
            );
            onPatchLocale({
              riddleSection: [...headingBlocks, ...nextParagraphs],
            });
          }}
          placeholder={t('studio.riddlePlaceholder')}
          blockType="line"
        />
      ),
    },
    riddleSettings: {
      title: t('studio.riddleSettings'),
      fields: [],
      body: <div>{t('studio.riddleSettingsHint')}</div>,
    },
    answers: {
      title: 'Answer and hints',
      fields: [
        {
          id: 'station-answer',
          label: t('studio.acceptedAnswers'),
          type: 'text',
          value: formatAcceptedAnswersInput(station.acceptedAnswers[locale]),
          placeholder: t('studio.acceptedAnswersPlaceholder'),
          onChange: (value) =>
            onPatchStation({
              acceptedAnswers: {
                ...station.acceptedAnswers,
                [locale]: parseAcceptedAnswersInput(value),
              },
            }),
        },
        {
          id: 'station-hint-1',
          label: t('studio.hint1'),
          type: 'text',
          value: hints[0],
          placeholder: t('studio.hint1Placeholder'),
          onChange: (value) => onPatchLocale({ hints: replaceHint(hints, 0, value) }),
        },
        {
          id: 'station-hint-2',
          label: t('studio.hint2'),
          type: 'text',
          value: hints[1],
          placeholder: t('studio.hint2Placeholder'),
          onChange: (value) => onPatchLocale({ hints: replaceHint(hints, 1, value) }),
        },
        {
          id: 'station-hint-3',
          label: t('studio.hint3'),
          type: 'text',
          value: hints[2],
          placeholder: t('studio.hint3Placeholder'),
          onChange: (value) => onPatchLocale({ hints: replaceHint(hints, 2, value) }),
        },
      ],
    },
  };

  return panels[panel];
}

function getFirstHeadingText(blocks: ContentBlock[]): string {
  const heading = blocks.find((block) => block.type === 'heading');
  return heading?.type === 'heading' ? heading.text : '';
}

function getStoryHeading(
  station: RiddleEntry,
  locale: Locale,
  t: ReturnType<typeof useEditorLanguage>['t'],
): string {
  const heading = getFirstHeadingText(station[locale].firstSection).trim();
  return heading || t('studio.storyHeadingPlaceholder');
}

function setFirstHeadingText(
  blocks: ContentBlock[],
  text: string,
): ContentBlock[] {
  const trimmed = text.trim();
  const headingIndex = blocks.findIndex((block) => block.type === 'heading');

  if (headingIndex >= 0) {
    if (!trimmed) {
      return blocks.filter((_, index) => index !== headingIndex);
    }
    return blocks.map((block, index) =>
      index === headingIndex && block.type === 'heading'
        ? { ...block, text }
        : block,
    );
  }

  if (!trimmed) return blocks;
  return [{ type: 'heading', text }, ...blocks];
}

function replaceHint(hints: string[], index: number, value: string): string[] {
  const next = [...hints];
  next[index] = value;
  return next.map((hint) => hint.trim()).filter(Boolean).slice(0, 3);
}

function resolveAssetPath(path: string | undefined): string | undefined {
  if (!path) return undefined;
  if (/^(https?:|blob:|data:)/.test(path)) return path;
  return `/${path.replace(/^\/+/, '')}`;
}

function StationImageIconPanelBody({
  draftId,
  station,
  imageUrl,
  t,
  onPatchStation,
}: {
  draftId: string;
  station: RiddleEntry;
  imageUrl: string | undefined;
  t: ReturnType<typeof useEditorLanguage>['t'];
  onPatchStation: (patch: Partial<RiddleEntry>) => void;
}) {
  const [tab, setTab] = useState<'photo' | 'upload'>('upload');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const stored = await storeImageBlob(draftId, file, 'station');
      onPatchStation({
        imageBlobId: stored.id,
        imagePath: `images/${stored.id}.webp`,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Capture failed');
    } finally {
      setBusy(false);
    }
  }

  const hasImage = Boolean(imageUrl);
  const statusLabel = station.imageBlobId
    ? t('studio.imageSelected')
    : station.imagePath || t('studio.imageSelected');

  const choice = normalizeStationVisualChoice(station);
  const selectedIconLabel =
    STATION_ICON_OPTIONS.find((option) => option.key === choice.iconKey)?.label ??
    choice.iconKey;

  return (
    <div className="stq-cover-panel">
      <div className="stq-edit-panel-label">{t('studio.stationImage')}</div>

      <div className="stq-cover-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'photo'}
          className={`stq-cover-tab${tab === 'photo' ? ' is-active' : ''}`}
          onClick={() => setTab('photo')}
        >
          <span aria-hidden>📷</span> {t('studio.takePhoto')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'upload'}
          className={`stq-cover-tab${tab === 'upload' ? ' is-active' : ''}`}
          onClick={() => setTab('upload')}
        >
          <span aria-hidden>⬆️</span> {t('studio.upload')}
        </button>
      </div>

      {hasImage && (
        <div className="stq-cover-status" title={statusLabel}>
          {statusLabel}
        </div>
      )}

      <button
        type="button"
        className="stq-cover-dropzone"
        disabled={busy}
        onClick={() =>
          (tab === 'photo' ? cameraInputRef : fileInputRef).current?.click()
        }
      >
        <span aria-hidden className="stq-cover-dropzone-icon">⬆️</span>
        <span className="stq-cover-dropzone-title">
          {busy ? '…' : t('studio.chooseImage')}
        </span>
        <span className="stq-cover-dropzone-hint">
          {t('studio.imageFormatHint')}
        </span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          handleFile(file);
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(event) => {
          const file = event.target.files?.[0];
          event.target.value = '';
          handleFile(file);
        }}
      />

      <input
        type="text"
        className="stq-edit-panel-input"
        value={station.imageBlobId ? '' : station.imagePath}
        placeholder={t('studio.imageUrlPlaceholder')}
        onChange={(event) =>
          onPatchStation({
            imagePath: event.target.value,
            imageBlobId: undefined,
          })
        }
      />

      {error && (
        <p style={{ color: '#c84a3a', fontSize: 12, margin: 0 }}>{error}</p>
      )}

      <div className="stq-edit-panel-label" style={{ marginTop: 18 }}>
        {t('studio.stationIcon')}
      </div>

      <div className="stq-station-icon-current">
        <div className="stq-station-icon-current__preview">
          <StationIconPreview
            station={station}
            style={{ width: 30, height: 30 }}
          />
        </div>
        <span>{t('studio.iconSelected')}: {selectedIconLabel}</span>
      </div>

      <div className="stq-station-icon-grid">
        {STATION_ICON_OPTIONS.map((option) => {
          const selected = option.key === choice.iconKey;
          return (
            <button
              key={option.key}
              type="button"
              className={`stq-station-icon-tile${selected ? ' is-active' : ''}`}
              aria-pressed={selected}
              aria-label={option.label}
              title={option.label}
              onClick={() =>
                onPatchStation(
                  applyStationVisualSelection(station.id, {
                    ...choice,
                    iconKey: option.key,
                  }),
                )
              }
            >
              <StationIconPreview
                choice={{ iconKey: option.key, iconColorKey: choice.iconColorKey }}
                style={{ width: 36, height: 36 }}
              />
            </button>
          );
        })}
        <button
          type="button"
          className="stq-station-icon-tile stq-station-icon-tile--add"
          aria-label={t('studio.addIcon')}
          title={t('studio.addIcon')}
          disabled
        >
          <Icon name="plus" size={18} />
        </button>
      </div>
    </div>
  );
}
