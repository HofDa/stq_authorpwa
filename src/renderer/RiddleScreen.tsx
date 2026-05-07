import type { ContentBlock } from '@/schema';
import type { ReactNode } from 'react';
import { useState } from 'react';
import { Icon } from '@/components/studio/Icon';
import type { StationVisualChoice } from '@/stations/visuals';
import { BottomNav } from './BottomNav';
import { CenterIcon } from './CenterIcon';
import { HeroImage } from './HeroImage';
import { HistoryPanel } from './HistoryPanel';
import { StoryText } from './StoryText';
import type { RendererSectionKey } from './stationSections';

export type { RendererSectionKey } from './stationSections';

export interface RendererSection {
  key: RendererSectionKey;
  label: string;
  fallbackTitle: string;
  blocks: ContentBlock[];
}

interface Props {
  title: string;
  stationNumber: number;
  totalStations?: number;
  imageUrl?: string;
  iconPath?: string;
  stationVisual?: StationVisualChoice;
  sections: RendererSection[];
  acceptedAnswers: string[];
  hints: string[];
  showHintLabel?: string;
  noHintLabel?: string;
  solved?: boolean;
  onSolved?: () => void;
  historyOpen: boolean;
  onHistoryToggle: () => void;
  presentation?: 'fullscreen' | 'mapOverlay';
  onBack?: () => void;
  onPrev?: () => void;
  onNext?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
  overlays?: Partial<Record<RendererSectionKey | 'hero' | 'title' | 'answers', ReactNode>>;
  authorToggle?: ReactNode;
  authorMode?: boolean;
  mapHeroAction?: ReactNode;
  mapIconAction?: ReactNode;
  storyHeadingAction?: ReactNode;
  historyHeadingAction?: ReactNode;
  riddleHeadingAction?: ReactNode;
  successHeadingAction?: ReactNode;
  editableRegions?: Partial<
    Record<
      | 'hero'
      | 'title'
      | 'story'
      | 'history'
      | 'riddle'
      | 'riddleSettings'
      | 'answers'
      | 'successSection',
      {
        label: string;
        active?: boolean;
        icon?: ReactNode;
        onEdit: () => void;
      }
    >
  >;
}

export function RiddleScreen({
  title,
  stationNumber,
  totalStations,
  imageUrl,
  iconPath,
  stationVisual,
  sections,
  acceptedAnswers,
  hints,
  showHintLabel = 'Show hint',
  noHintLabel = 'No hint',
  solved = false,
  onSolved,
  historyOpen,
  onHistoryToggle,
  presentation = 'fullscreen',
  onBack,
  onPrev,
  onNext,
  isFirst = false,
  isLast = false,
  overlays,
  authorToggle,
  authorMode = false,
  mapHeroAction,
  mapIconAction,
  storyHeadingAction,
  historyHeadingAction,
  riddleHeadingAction,
  successHeadingAction,
  editableRegions,
}: Props) {
  const isMapOverlay = presentation === 'mapOverlay';
  const solvedView = solved && !authorMode;
  const [story, history, riddle, success] = sections;
  const [answerDraft, setAnswerDraft] = useState('');
  const [successOpen, setSuccessOpen] = useState(false);
  const normalizedAnswers = acceptedAnswers.map(normalizeAnswer).filter(Boolean);
  const submittedAnswer = answerDraft;
  const canSubmit = authorMode || submittedAnswer.trim().length > 0;
  const answerIsCorrect =
    normalizedAnswers.length === 0 ||
    normalizedAnswers.includes(normalizeAnswer(submittedAnswer));
  const stationTotal = totalStations && totalStations > 0 ? totalStations : stationNumber;
  const progressPercent = Math.max(0, Math.min(100, (stationNumber / stationTotal) * 100));

  return (
    <div
      className={[
        'stq-riddle-screen',
        isMapOverlay ? 'stq-riddle-screen--map-overlay' : '',
      ].join(' ')}
    >
      {!isMapOverlay && (
        <HeroImage imageUrl={imageUrl} title={title}>
          <CenterIcon
            iconPath={iconPath}
            fallback={stationNumber}
            visual={stationVisual}
          />
          {overlays?.hero}
        </HeroImage>
      )}

      <div className="stq-riddle-floating-title">
        <button
          type="button"
          className="stq-riddle-title-back"
          aria-label="Back to stations"
          onClick={onBack}
        >
          <Icon name="chevron-left" size={22} />
        </button>
        <h1>{title}</h1>
        {overlays?.title}
      </div>

      {authorToggle}

      <main className="stq-riddle-sheet">
        <div className="stq-riddle-sheet-handle" />
        {isMapOverlay && !solvedView && (
          <EditableRegion config={editableRegions?.hero}>
            <div className="stq-riddle-map-card-hero">
              <div className="stq-riddle-map-card-image">
                {imageUrl ? (
                  <img src={imageUrl} alt="" />
                ) : (
                  <div className="stq-riddle-map-card-image-placeholder">
                    Bild hinzufügen
                  </div>
                )}
                <div className="stq-riddle-map-card-icon">
                  <CenterIcon
                    iconPath={iconPath}
                    fallback={stationNumber}
                    visual={stationVisual}
                  />
                  {mapIconAction}
                </div>
                {mapHeroAction}
              </div>
            </div>
          </EditableRegion>
        )}

        {solvedView ? (
          <section className="stq-riddle-solved-card">
            <StoryText blocks={success.blocks} fallbackTitle={success.fallbackTitle} />
            <div className="stq-riddle-solved-status">
              <span>
                <Icon name="check" size={31} stroke={3.2} />
              </span>
              <strong>Rätsel erfolgreich gelöst</strong>
            </div>
            <button
              type="button"
              className="stq-riddle-solved-next"
              onClick={onNext}
            >
              {isLast ? 'Fertig' : 'Zum nächsten Rätsel'}
            </button>
          </section>
        ) : (
          <>
            <div className="stq-render-target">
              {overlays?.firstSection}
              {editableRegions?.title ? (
                <StoryText
                  blocks={story.blocks}
                  fallbackTitle={story.fallbackTitle}
                  leadImageUrl={isMapOverlay ? undefined : imageUrl}
                  leadImagePlaceholder={!isMapOverlay}
                  headingAction={isMapOverlay ? storyHeadingAction : undefined}
                  headingEditable={editableRegions.title}
                  bodyEditable={editableRegions.story}
                />
              ) : (
                <EditableRegion config={editableRegions?.story}>
                  <StoryText
                    blocks={story.blocks}
                    fallbackTitle={story.fallbackTitle}
                    leadImageUrl={isMapOverlay ? undefined : imageUrl}
                    leadImagePlaceholder={!isMapOverlay}
                    headingAction={isMapOverlay ? storyHeadingAction : undefined}
                  />
                </EditableRegion>
              )}
            </div>

            <div className="stq-render-target">
              {overlays?.historySection}
              <EditableRegion config={editableRegions?.history}>
                <HistoryPanel
                  blocks={history.blocks}
                  fallbackTitle={history.fallbackTitle}
                  open={historyOpen}
                  onToggle={onHistoryToggle}
                  headingAction={isMapOverlay ? historyHeadingAction : undefined}
                />
              </EditableRegion>
            </div>

            <div className="stq-render-target">
              {overlays?.riddleSection}
              <EditableRegion config={editableRegions?.riddle}>
                <StoryText
                  blocks={riddle.blocks}
                  fallbackTitle={riddle.fallbackTitle}
                  centeredLines
                  headingAction={isMapOverlay ? riddleHeadingAction : undefined}
                />
              </EditableRegion>
            </div>

            <section className="stq-riddle-answer stq-riddle-section stq-render-target">
              {overlays?.answers}
              <EditableRegion
                config={editableRegions?.riddleSettings}
                className="stq-riddle-answer-edit-target"
              >
                <input
                  className="stq-riddle-answer-field"
                  value={answerDraft}
                  onChange={(event) => setAnswerDraft(event.target.value)}
                  disabled={authorMode}
                />
                <button
                  type="button"
                  className="stq-riddle-submit"
                  disabled={!canSubmit}
                  onClick={() => {
                    if (authorMode) return;
                    if (answerIsCorrect) setSuccessOpen(true);
                  }}
                >
                  Lösung einreichen
                </button>
              </EditableRegion>
              <EditableRegion
                config={editableRegions?.answers}
                className="stq-riddle-hint-edit-target"
              >
                <button type="button" className="stq-riddle-hint" disabled>
                  {hints.length > 0 ? showHintLabel : noHintLabel}
                </button>
              </EditableRegion>
            </section>
          </>
        )}

        {authorMode && (
          <div className="stq-render-target">
            {overlays?.successSection}
            <StoryText
              blocks={success.blocks}
              fallbackTitle={success.fallbackTitle}
              headingAction={isMapOverlay ? successHeadingAction : undefined}
            />
          </div>
        )}
      </main>

      {(successOpen || authorMode) && (
        <div className="stq-riddle-success-backdrop" role="presentation">
          <section
            className="stq-riddle-success-dialog"
            role="dialog"
            aria-modal="true"
            aria-label="Riddle solved"
          >
            <div className="stq-riddle-success-top">
              <div className="stq-riddle-success-check">
                <Icon name="check" size={52} stroke={3.4} />
              </div>
              <h2>Rätsel erfolgreich gelöst</h2>
              <p>{stationNumber} / {stationTotal}</p>
              <div className="stq-riddle-success-progress" aria-hidden>
                <span style={{ width: `${progressPercent}%` }} />
              </div>
            </div>
            <div className="stq-riddle-success-body">
              <EditableRegion
                config={authorMode ? editableRegions?.successSection : undefined}
                className="stq-riddle-success-edit-target"
              >
                <StoryText
                  blocks={success.blocks}
                  fallbackTitle={success.fallbackTitle}
                />
              </EditableRegion>
            </div>
            <div className="stq-riddle-success-footer">
              <button
                type="button"
                className="stq-riddle-success-next"
                onClick={() => {
                  setSuccessOpen(false);
                  onSolved?.();
                  onNext?.();
                }}
              >
                {isLast ? 'Fertig' : 'Zum nächsten Rätsel'}
              </button>
            </div>
          </section>
        </div>
      )}

      {!solvedView && (onPrev || onNext) && (
        <BottomNav
          onPrevious={onPrev ?? (() => undefined)}
          onNext={onNext ?? (() => undefined)}
          previousDisabled={isFirst}
          nextDisabled={isLast}
        />
      )}
    </div>
  );
}

function EditableRegion({
  config,
  className,
  children,
}: {
  config?: {
    label: string;
    active?: boolean;
    icon?: ReactNode;
    onEdit: () => void;
  };
  className?: string;
  children: ReactNode;
}) {
  if (!config) return <>{children}</>;

  return (
    <div
      className={`stq-editable-region${config.active ? ' stq-editable-region--active' : ''}${
        className ? ` ${className}` : ''
      }`}
      role="button"
      tabIndex={0}
      aria-label={config.label}
      onClick={config.onEdit}
      onKeyDown={(event) => {
        if (event.key === 'Enter' || event.key === ' ') {
          event.preventDefault();
          config.onEdit();
        }
      }}
    >
      {children}
      <span className="stq-editable-pen" aria-hidden>
        {config.icon ?? <Icon name="pen" size={12} />}
      </span>
    </div>
  );
}

function normalizeAnswer(answer: string) {
  return answer.trim().toLocaleLowerCase();
}
