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
}: Props) {
  const isMapOverlay = presentation === 'mapOverlay';
  const solvedView = solved && !authorMode;
  const [story, history, riddle, success] = sections;
  const [answerDraft, setAnswerDraft] = useState('');
  const [selectedChoice, setSelectedChoice] = useState<number | null>(null);
  const [successOpen, setSuccessOpen] = useState(false);
  const normalizedAnswers = acceptedAnswers.map(normalizeAnswer).filter(Boolean);
  const submittedAnswer =
    selectedChoice === null ? answerDraft : String(selectedChoice + 1);
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
              <StoryText
                blocks={story.blocks}
                fallbackTitle={story.fallbackTitle}
                leadImageUrl={isMapOverlay ? undefined : imageUrl}
                leadImagePlaceholder={!isMapOverlay}
                headingAction={isMapOverlay ? storyHeadingAction : undefined}
              />
            </div>

            <div className="stq-render-target">
              {overlays?.historySection}
              <HistoryPanel
                blocks={history.blocks}
                fallbackTitle={history.fallbackTitle}
                open={historyOpen}
                onToggle={onHistoryToggle}
                headingAction={isMapOverlay ? historyHeadingAction : undefined}
              />
            </div>

            <div className="stq-render-target">
              {overlays?.riddleSection}
              <StoryText
                blocks={riddle.blocks}
                fallbackTitle={riddle.fallbackTitle}
                centeredLines
                headingAction={isMapOverlay ? riddleHeadingAction : undefined}
              />
            </div>

            <section className="stq-riddle-answer stq-riddle-section stq-render-target">
              {overlays?.answers}
              {isMapOverlay ? (
                <div className="stq-riddle-choice-grid" aria-label="Antwortauswahl">
                  {[0, 1, 2].map((slot) => (
                    <button
                      key={slot}
                      type="button"
                      className={`stq-riddle-choice${
                        selectedChoice === slot ? ' stq-riddle-choice--selected' : ''
                      }`}
                      aria-label={`Antwort ${slot + 1}`}
                      aria-pressed={selectedChoice === slot}
                      disabled={authorMode}
                      onClick={() => setSelectedChoice(slot)}
                    >
                      <span className="stq-riddle-choice-arrow stq-riddle-choice-arrow--up" />
                      <span
                        className={`stq-riddle-choice-image stq-riddle-choice-image--${slot + 1}`}
                      />
                      <span className="stq-riddle-choice-arrow stq-riddle-choice-arrow--down" />
                    </button>
                  ))}
                </div>
              ) : (
                <input
                  className="stq-riddle-answer-field"
                  value={answerDraft}
                  onChange={(event) => setAnswerDraft(event.target.value)}
                  placeholder="Lösung"
                  disabled={authorMode}
                />
              )}
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
              <button type="button" className="stq-riddle-hint" disabled>
                {hints.length > 0 ? 'Hinweis anzeigen' : 'Kein Hinweis'}
              </button>
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

      {!authorMode && successOpen && (
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
              <StoryText blocks={success.blocks} fallbackTitle={success.fallbackTitle} />
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

function normalizeAnswer(answer: string) {
  return answer.trim().toLocaleLowerCase();
}
