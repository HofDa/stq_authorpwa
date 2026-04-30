import { useMemo, useState } from 'react';
import type {
  AcceptedAnswersByLocale,
  ContentBlock,
  Locale,
  RiddleEntry,
  RiddleLocaleContent,
  TourDraft,
} from '@/schema';
import { useBlobUrl } from '@/hooks/useBlobUrl';
import { getStationLocationLabel } from '@/utils/localizedContent';
import { RiddleScreen, type RendererSectionKey } from '@/renderer/RiddleScreen';
import { AuthorOverlay } from './AuthorOverlay';
import { AgentPanel } from './AgentPanel';
import { EditPanel, type EditPayload } from './EditPanel';
import { useAuthorSelection } from './useAuthorSelection';
import { Icon } from '@/components/studio/Icon';
import type { IconName } from '@/components/studio/Icon';
import { CaptureButton } from '@/components/CaptureButton';
import { StationVisualPicker } from '@/components/stations/StationVisualPicker';
import { normalizeStationVisualChoice } from '@/stations/visuals';
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
  isFirst?: boolean;
  isLast?: boolean;
  presentation?: 'fullscreen' | 'mapOverlay';
  onChange: (recipe: (prev: TourDraft) => TourDraft) => void;
}

const SECTION_META: Array<{
  key: RendererSectionKey;
  label: string;
  fallbackTitle: string;
}> = [
  { key: 'firstSection', label: 'Story', fallbackTitle: 'Story' },
  { key: 'historySection', label: 'Mehr Infos', fallbackTitle: 'Background' },
  { key: 'riddleSection', label: 'Riddle', fallbackTitle: 'Riddle' },
  { key: 'successSection', label: 'Success', fallbackTitle: 'Success' },
];

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
  const heroBlobUrl = useBlobUrl(station.imageBlobId);
  const content = station[locale];
  const title = getStationLocationLabel(station, locale);
  const imageUrl = heroBlobUrl ?? resolveAssetPath(station.imagePath);
  const sections = useMemo(
    () =>
      SECTION_META.map((section) => ({
        ...section,
        blocks: content[section.key],
      })),
    [content.firstSection, content.historySection, content.riddleSection, content.successSection],
  );

  function patchStation(patch: Partial<RiddleEntry>) {
    onChange((prev) => ({
      ...prev,
      stations: prev.stations.map((entry) =>
        entry.id === station.id ? { ...entry, ...patch } : entry,
      ),
    }));
  }

  function patchLocale(patch: Partial<RiddleLocaleContent>) {
    onChange((prev) => ({
      ...prev,
      stations: prev.stations.map((entry) =>
        entry.id === station.id
          ? { ...entry, [locale]: { ...entry[locale], ...patch } }
          : entry,
      ),
    }));
  }

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

  const overlays = authorMode
    ? {
        hero: (
          <AuthorOverlay
            targetPath={`riddles[${station.number}].image`}
            label="station image"
            tone="dark"
            agentIcon="wand"
            onEdit={selection.edit}
            onAgent={selection.agent}
          />
        ),
        title: (
          <AuthorOverlay
            targetPath={`riddles[${station.number}].title`}
            label="station title"
            onEdit={selection.edit}
            onAgent={selection.agent}
          />
        ),
        firstSection: sectionOverlay(
          station.number,
          'firstSection',
          'Story',
          selection,
          () => {
            setAiPanelMode('story');
            setAiPanelOpen(true);
          },
          'sparkles',
        ),
        historySection: sectionOverlay(
          station.number,
          'historySection',
          'Mehr Infos',
          selection,
          () => {
            setAiPanelMode('facts');
            setAiPanelOpen(true);
          },
          'layers',
        ),
        riddleSection: sectionOverlay(
          station.number,
          'riddleSection',
          'Riddle',
          selection,
          () => {
            setAiPanelMode('riddle');
            setAiPanelOpen(true);
          },
          'puzzle',
        ),
        successSection: sectionOverlay(
          station.number,
          'successSection',
          'Success',
          selection,
          () => {
            setAiPanelMode('success');
            setAiPanelOpen(true);
          },
          'check-circle',
        ),
        answers: (
          <AuthorOverlay
            targetPath={`riddles[${station.number}].answers`}
            label="solution and hints"
            onEdit={selection.edit}
            onAgent={selection.agent}
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
        iconPath={station.iconPath}
        stationVisual={normalizeStationVisualChoice(station)}
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
            <button
              type="button"
              className={`stq-riddle-author-toggle${authorMode ? ' active' : ''}`}
              onClick={() => onAuthorModeChange(!authorMode)}
              aria-pressed={authorMode}
            >
              <Icon name="edit" size={13} />
              Author
            </button>
          ) : null
        }
        mapHeroAction={
          authorMode ? (
            <div className="stq-riddle-map-card-actions">
              <CaptureButton
                draftId={draft.draftId}
                preset="station"
                onCaptured={setStationImageBlob}
                className="stq-riddle-map-card-action"
                ariaLabel={imageUrl ? 'Replace station image' : 'Capture station image'}
                label={<Icon name="camera" size={18} />}
                capture={false}
              />
              <button
                type="button"
                className="stq-riddle-map-card-action"
                onClick={() => {
                  setAiPanelMode('image');
                  setAiPanelOpen(true);
                }}
                aria-label="AI image editing coming soon"
              >
                <Icon name="wand" size={18} />
              </button>
            </div>
          ) : null
        }
        mapIconAction={
          authorMode ? (
            <>
              <button
                type="button"
                className="stq-riddle-map-icon-action stq-riddle-map-icon-action--edit"
                onClick={(event) => {
                  event.stopPropagation();
                  setIconEditorOpen(true);
                }}
                aria-label="Edit station icon"
              >
                <Icon name="edit" size={13} />
              </button>
              <button
                type="button"
                className="stq-riddle-map-icon-action stq-riddle-map-icon-action--ai"
                onClick={(event) => {
                  event.stopPropagation();
                  setAiPanelMode('icon');
                  setAiPanelOpen(true);
                }}
                aria-label="Open AI helper for station icon"
              >
                <Icon name="map-pin" size={13} />
              </button>
            </>
          ) : null
        }
        storyHeadingAction={
          authorMode ? (
            <div className="stq-riddle-heading-actions">
              <button
                type="button"
                className="stq-riddle-heading-action"
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
              <button
                type="button"
                className="stq-riddle-heading-action"
                onClick={() => {
                  setAiPanelMode('story');
                  setAiPanelOpen(true);
                }}
                aria-label="Open AI assistant for story heading"
              >
                <Icon name="sparkles" size={17} />
              </button>
            </div>
          ) : null
        }
        historyHeadingAction={
          authorMode ? (
            <div className="stq-riddle-heading-actions">
              <button
                type="button"
                className="stq-riddle-heading-action"
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
              <button
                type="button"
                className="stq-riddle-heading-action"
                onClick={() => {
                  setAiPanelMode('facts');
                  setAiPanelOpen(true);
                }}
                aria-label="Open AI assistant for background facts"
              >
                <Icon name="layers" size={17} />
              </button>
            </div>
          ) : null
        }
        riddleHeadingAction={
          authorMode ? (
            <div className="stq-riddle-heading-actions">
              <button
                type="button"
                className="stq-riddle-heading-action"
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
              <button
                type="button"
                className="stq-riddle-heading-action"
                onClick={() => {
                  setAiPanelMode('riddle');
                  setAiPanelOpen(true);
                }}
                aria-label="Open AI assistant for riddle"
              >
                <Icon name="puzzle" size={17} />
              </button>
            </div>
          ) : null
        }
        successHeadingAction={
          authorMode ? (
            <div className="stq-riddle-heading-actions">
              <button
                type="button"
                className="stq-riddle-heading-action"
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
              <button
                type="button"
                className="stq-riddle-heading-action"
                onClick={() => {
                  setAiPanelMode('success');
                  setAiPanelOpen(true);
                }}
                aria-label="Open AI assistant for success message"
              >
                <Icon name="check-circle" size={17} />
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
  onAgent?: () => void,
  agentIcon?: IconName,
) {
  return (
    <AuthorOverlay
      targetPath={`riddles[${stationNumber}].sections.${key}`}
      label={label}
      agentIcon={agentIcon}
      onEdit={selection.edit}
      onAgent={onAgent ?? selection.agent}
    />
  );
}

function sectionFromTarget(targetPath: string): RendererSectionKey | null {
  for (const section of SECTION_META) {
    if (targetPath.endsWith(section.key)) return section.key;
  }
  return null;
}

function resolveAssetPath(path: string | undefined): string | undefined {
  if (!path) return undefined;
  if (/^(https?:|blob:|data:)/.test(path)) return path;
  return `/${path.replace(/^\/+/, '')}`;
}
