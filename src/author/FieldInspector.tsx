import { useMemo, useState } from 'react';
import type {
  AcceptedAnswersByLocale,
  ContentBlock,
  Locale,
  RiddleEntry,
  TourDraft,
} from '@/schema';
import { useBlobUrl } from '@/hooks/useBlobUrl';
import { useStationPatcher } from '@/hooks/useDraftPatchers';
import { getStationLocationLabel } from '@/utils/localizedContent';
import { RiddleScreen } from '@/renderer/RiddleScreen';
import {
  STATION_SECTION_FALLBACK_TITLES,
  STATION_SECTION_KEYS,
  type RendererSectionKey,
} from '@/renderer/stationSections';
import { AuthorOverlay } from './AuthorOverlay';
import { AgentPanel } from './AgentPanel';
import { EditPanel, type EditPayload } from './EditPanel';
import { useAuthorSelection } from './useAuthorSelection';
import { Icon } from '@/components/studio/Icon';
import { useConfirm, useToast } from '@/components/ui/FeedbackProvider';
import { CaptureButton } from '@/components/CaptureButton';
import { StationVisualPicker } from '@/components/stations/StationVisualPicker';
import {
  hasSelectedStationIcon,
  normalizeStationVisualChoice,
} from '@/stations/visuals';
import { RiddleAiSidePanel, type RiddleAiPanelMode } from './RiddleAiSidePanel';

interface Props {
  draft: TourDraft;
  station: RiddleEntry;
  locale: Locale;
  authorMode?: boolean;
  solved?: boolean;
  onAuthorModeChange?: (enabled: boolean) => void;
  onStationSolved?: (stationId: string) => void;
  onBack?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  onDeleteStation?: (stationId: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
  presentation?: 'fullscreen' | 'mapOverlay';
  onChange: (recipe: (prev: TourDraft) => TourDraft) => void;
}

const SECTION_LABELS: Record<RendererSectionKey, string> = {
  firstSection: 'Story',
  historySection: 'Mehr Infos',
  riddleSection: 'Riddle',
  successSection: 'Success',
};

export function FieldInspector({
  draft,
  station,
  locale,
  authorMode = false,
  solved = false,
  onAuthorModeChange,
  onStationSolved,
  onBack,
  onPrev,
  onNext,
  onDeleteStation,
  isFirst,
  isLast,
  presentation,
  onChange,
}: Props) {
  const [historyOpen, setHistoryOpen] = useState(false);
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiPanelMode, setAiPanelMode] = useState<RiddleAiPanelMode>('image');
  const [iconEditorOpen, setIconEditorOpen] = useState(false);
  const selection = useAuthorSelection();
  const confirm = useConfirm();
  const toast = useToast();
  const heroBlobUrl = useBlobUrl(station.imageBlobId);
  const content = station[locale];
  const title = getStationLocationLabel(station, locale);
  const imageUrl = heroBlobUrl ?? resolveAssetPath(station.imagePath);
  const sections = useMemo(
    () =>
      STATION_SECTION_KEYS.map((key) => ({
        key,
        label: SECTION_LABELS[key],
        fallbackTitle: STATION_SECTION_FALLBACK_TITLES[key],
        blocks: content[key],
      })),
    [content],
  );

  const { patchStation, patchLocale } = useStationPatcher(onChange, station.id, locale);

  function setStationImageBlob(blobId: string) {
    patchStation({
      imageBlobId: blobId,
      imagePath: `images/${blobId}.webp`,
    });
  }

  function setSectionBlocks(key: RendererSectionKey, blocks: ContentBlock[]) {
    patchLocale({ [key]: blocks });
  }

  function setAcceptedAnswers(next: AcceptedAnswersByLocale[Locale]) {
    patchStation({
      acceptedAnswers: {
        ...station.acceptedAnswers,
        [locale]: next,
      },
    });
  }

  function save(payload: EditPayload) {
    const target = selection.target;
    if (!target) return;

    if (payload.kind === 'hero') {
      setStationImageBlob(payload.blobId);
    }

    if (payload.kind === 'stationTitle') {
      patchLocale({ location: payload.value });
    }

    if (payload.kind === 'section') {
      const section = sectionFromTarget(target.targetPath);
      if (section) setSectionBlocks(section, payload.blocks);
    }

    if (payload.kind === 'answers') {
      setAcceptedAnswers(payload.acceptedAnswers);
      patchLocale({ hints: payload.hints });
    }

    if (payload.kind === 'riddleSetup') {
      setSectionBlocks('riddleSection', payload.blocks);
      setAcceptedAnswers(payload.acceptedAnswers);
      patchLocale({ hints: payload.hints });
      patchStation({
        riddleType: payload.riddleType,
        solutionInputType: payload.solutionInputType,
      });
    }

    selection.close();
  }

  function openManualEditorFromAi(mode: RiddleAiPanelMode) {
    setAiPanelOpen(false);

    if (mode === 'icon') {
      setIconEditorOpen(true);
      return;
    }

    if (mode === 'image') {
      selection.edit(`riddles[${station.number}].image`, 'station image');
      return;
    }

    if (mode === 'story') {
      selection.edit(
        `riddles[${station.number}].firstSection`,
        'Story heading and text',
      );
      return;
    }

    if (mode === 'facts') {
      selection.edit(
        `riddles[${station.number}].sections.historySection`,
        'Mehr Infos',
      );
      return;
    }

    if (mode === 'riddle') {
      selection.edit(
        `riddles[${station.number}].sections.riddleSection`,
        'Riddle',
      );
      return;
    }

    selection.edit(
      `riddles[${station.number}].sections.successSection`,
      'Success',
    );
  }

  async function deleteStation() {
    if (!onDeleteStation) return;
    const confirmed = await confirm({
      title: 'Delete station?',
      message: `This removes "${title}" from the tour and cannot be undone.`,
      confirmLabel: 'Delete station',
      tone: 'danger',
    });
    if (!confirmed) return;
    onDeleteStation(station.id);
    toast({ title: 'Station deleted', tone: 'success' });
  }

  const overlays = authorMode
    ? {
        hero: (
          <AuthorOverlay
            targetPath={`riddles[${station.number}].image`}
            label="station image"
            tone="dark"
            accent="image"
            onEdit={selection.edit}
          />
        ),
        title: (
          <AuthorOverlay
            targetPath={`riddles[${station.number}].title`}
            label="station title"
            onEdit={selection.edit}
          />
        ),
        firstSection: sectionOverlay(
          station.number,
          'firstSection',
          'Story',
          selection,
          'story',
        ),
        historySection: sectionOverlay(
          station.number,
          'historySection',
          'Mehr Infos',
          selection,
          'facts',
        ),
        riddleSection: sectionOverlay(
          station.number,
          'riddleSection',
          'Riddle',
          selection,
          'riddle',
        ),
        successSection: sectionOverlay(
          station.number,
          'successSection',
          'Success',
          selection,
          'success',
        ),
        answers: (
          <AuthorOverlay
            targetPath={`riddles[${station.number}].answers`}
            label="solution and hints"
            onEdit={selection.edit}
          />
        ),
      }
    : undefined;

  const activeSection = selection.target
    ? sections.find((section) => selection.target?.targetPath.endsWith(section.key))
    : undefined;

  return (
    <>
      <RiddleScreen
        title={title}
        stationNumber={station.number}
        totalStations={draft.stations.length}
        imageUrl={imageUrl}
        iconPath={hasSelectedStationIcon(station) ? station.iconPath : undefined}
        stationVisual={
          hasSelectedStationIcon(station)
            ? normalizeStationVisualChoice(station)
            : undefined
        }
        sections={sections}
        acceptedAnswers={station.acceptedAnswers[locale]}
        hints={content.hints}
        solved={solved}
        onSolved={() => onStationSolved?.(station.id)}
        historyOpen={historyOpen}
        onHistoryToggle={() => setHistoryOpen((value) => !value)}
        presentation={presentation}
        onBack={onBack}
        onPrev={onPrev}
        onNext={onNext}
        isFirst={isFirst}
        isLast={isLast}
        overlays={overlays}
        authorMode={authorMode}
        authorToggle={
          onAuthorModeChange ? (
            <div className="stq-riddle-author-top-actions">
              {authorMode && onDeleteStation && (
                <button
                  type="button"
                  className="stq-riddle-danger-toggle"
                  onClick={deleteStation}
                  aria-label="Delete station"
                >
                  <Icon name="trash" size={13} />
                </button>
              )}
              <button
                type="button"
                className={`stq-riddle-author-toggle${authorMode ? ' active' : ''}`}
                onClick={() => onAuthorModeChange(!authorMode)}
                aria-pressed={authorMode}
              >
                <Icon name="edit" size={13} />
                Author
              </button>
            </div>
          ) : null
        }
        mapHeroAction={
          authorMode ? (
            <div className="stq-riddle-map-card-actions">
              {onDeleteStation && (
                <button
                  type="button"
                  className="stq-riddle-map-card-action stq-riddle-map-card-action--danger"
                  onClick={deleteStation}
                  aria-label="Delete station"
                >
                  <Icon name="trash" size={18} />
                </button>
              )}
              <CaptureButton
                draftId={draft.draftId}
                preset="station"
                onCaptured={setStationImageBlob}
                className="stq-riddle-map-card-action stq-riddle-map-card-action--image"
                ariaLabel={imageUrl ? 'Replace station image' : 'Capture station image'}
                label={<Icon name="camera" size={18} />}
                capture={false}
              />
            </div>
          ) : null
        }
        mapIconAction={
          authorMode ? (
            <>
              <button
                type="button"
                className="stq-riddle-map-icon-action stq-riddle-map-icon-action--icon"
                onClick={(event) => {
                  event.stopPropagation();
                  setIconEditorOpen(true);
                }}
                aria-label="Edit station icon"
              >
                <Icon name="edit" size={13} />
              </button>
            </>
          ) : null
        }
        storyHeadingAction={
          authorMode ? (
            <div className="stq-riddle-heading-actions">
              <button
                type="button"
                className="stq-riddle-heading-action stq-riddle-heading-action--story"
                onClick={() =>
                  selection.edit(
                    `riddles[${station.number}].firstSection`,
                    'Story heading and text',
                  )
                }
                aria-label="Edit story heading and text"
              >
                <Icon name="edit" size={17} />
              </button>
            </div>
          ) : null
        }
        historyHeadingAction={
          authorMode ? (
            <div className="stq-riddle-heading-actions">
              <button
                type="button"
                className="stq-riddle-heading-action stq-riddle-heading-action--facts"
                onClick={() =>
                  selection.edit(
                    `riddles[${station.number}].sections.historySection`,
                    'Mehr Infos',
                  )
                }
                aria-label="Edit background facts"
              >
                <Icon name="edit" size={17} />
              </button>
            </div>
          ) : null
        }
        riddleHeadingAction={
          authorMode ? (
            <div className="stq-riddle-heading-actions">
              <button
                type="button"
                className="stq-riddle-heading-action stq-riddle-heading-action--riddle"
                onClick={() =>
                  selection.edit(
                    `riddles[${station.number}].sections.riddleSection`,
                    'Riddle',
                  )
                }
                aria-label="Edit riddle text"
              >
                <Icon name="edit" size={17} />
              </button>
            </div>
          ) : null
        }
        successHeadingAction={
          authorMode ? (
            <div className="stq-riddle-heading-actions">
              <button
                type="button"
                className="stq-riddle-heading-action stq-riddle-heading-action--success"
                onClick={() =>
                  selection.edit(
                    `riddles[${station.number}].sections.successSection`,
                    'Success',
                  )
                }
                aria-label="Edit success message"
              >
                <Icon name="edit" size={17} />
              </button>
            </div>
          ) : null
        }
      />

      {authorMode && !iconEditorOpen && !selection.target && (
        <RiddleAiSidePanel
          locale={locale}
          stationTitle={title}
          mode={aiPanelMode}
          onModeChange={setAiPanelMode}
          open={aiPanelOpen}
          onOpenChange={setAiPanelOpen}
          onManualEdit={openManualEditorFromAi}
        />
      )}

      {authorMode && iconEditorOpen && (
        <div
          className="stq-riddle-modal-backdrop"
          role="presentation"
          onClick={() => setIconEditorOpen(false)}
        >
          <section
            className="stq-riddle-modal stq-riddle-visual-modal"
            role="dialog"
            aria-modal="true"
            aria-label="Edit station icon"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="stq-riddle-modal-close"
              onClick={() => setIconEditorOpen(false)}
              aria-label="Close"
            >
              <Icon name="x" size={18} />
            </button>
            <h2>Station Icon</h2>
            <StationVisualPicker
              station={station}
              stations={draft.stations}
              onChange={patchStation}
            />
          </section>
        </div>
      )}

      {selection.target && (
        <div
          className="stq-riddle-modal-backdrop"
          role="presentation"
          onClick={selection.close}
        >
          <div
            className="stq-riddle-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="stq-riddle-modal-close"
              onClick={selection.close}
            >
              <Icon name="x" size={18} />
            </button>
            {selection.target.kind === 'agent' ? (
              <AgentPanel label={selection.target.label} />
            ) : (
              <EditPanel
                targetPath={selection.target.targetPath}
                label={selection.target.label}
                draftId={draft.draftId}
                stationTitle={title}
                heroBlobId={station.imageBlobId}
                sectionBlocks={activeSection?.blocks}
                sectionFallbackTitle={activeSection?.fallbackTitle}
                riddleType={station.riddleType}
                solutionInputType={station.solutionInputType}
                acceptedAnswers={station.acceptedAnswers[locale]}
                hints={content.hints}
                onSave={save}
              />
            )}
          </div>
        </div>
      )}
    </>
  );
}

function sectionOverlay(
  stationNumber: number,
  key: RendererSectionKey,
  label: string,
  selection: ReturnType<typeof useAuthorSelection>,
  accent: 'story' | 'facts' | 'riddle' | 'success',
) {
  return (
    <AuthorOverlay
      targetPath={`riddles[${stationNumber}].sections.${key}`}
      label={label}
      accent={accent}
      onEdit={selection.edit}
    />
  );
}

function sectionFromTarget(targetPath: string): RendererSectionKey | null {
  return STATION_SECTION_KEYS.find((key) => targetPath.endsWith(key)) ?? null;
}

function resolveAssetPath(path: string | undefined): string | undefined {
  if (!path) return undefined;
  if (/^(https?:|blob:|data:)/.test(path)) return path;
  return `/${path.replace(/^\/+/, '')}`;
}
