import { useState } from 'react';
import type { ReactNode } from 'react';
import {
  formatAcceptedAnswersInput,
  parseAcceptedAnswersInput,
} from '@/schema';
import type {
  AcceptedAnswersByLocale,
  ContentBlock,
  Locale,
  RiddleEntry,
  TourDraft,
} from '@/schema';
import { EditableText } from './EditableText';
import { EditableContentSection } from './EditableContentSection';
import { ImageCapture } from '@/components/ImageCapture';
import { CaptureButton } from '@/components/CaptureButton';
import { useBlobUrl } from '@/hooks/useBlobUrl';
import { useStationPatcher } from '@/hooks/useDraftPatchers';
import { useSignal } from '@/hooks/useSignal';
import { Icon } from '@/components/studio/Icon';
import {
  STATION_SECTION_FALLBACK_TITLES,
  STATION_SECTION_KEYS,
  type RendererSectionKey,
} from '@/renderer/stationSections';

interface Props {
  draft: TourDraft;
  station: RiddleEntry;
  locale: Locale;
  onChange: (recipe: (prev: TourDraft) => TourDraft) => void;
}

const SECTION_EYEBROWS: Record<RendererSectionKey, string> = {
  firstSection: 'Story',
  historySection: 'Context',
  riddleSection: 'Challenge',
  successSection: 'Solved',
};

const SECTION_AI_TARGETS: Record<RendererSectionKey, string> = {
  firstSection: 'story section',
  historySection: 'background section',
  riddleSection: 'riddle section',
  successSection: 'success section',
};

/**
 * Visual twin of the native station drawer, fully editable in place.
 */
export function InlineStationDrawer({
  draft,
  station,
  locale,
  onChange,
}: Props) {
  const [titleEditSignal, triggerTitleEdit] = useSignal();
  const [heroCaptureSignal, triggerHeroCapture] = useSignal();
  const content = station[locale];
  const photoUrl = useBlobUrl(station.imageBlobId);
  const { patchStation, patchLocale } = useStationPatcher(onChange, station.id, locale);

  function setStationBlob(blobId: string) {
    patchStation({
      imageBlobId: blobId,
      imagePath: `images/${blobId}.webp`,
    });
  }

  function setSectionBlocks(key: RendererSectionKey, blocks: ContentBlock[]) {
    patchLocale({ [key]: blocks });
  }

  return (
    <article className="stq-native-station-drawer">
      <div className="stq-native-hero">
        <FieldElementActions
          editLabel="Edit station image"
          aiLabel="Ask AI agent for station image"
          onEdit={triggerHeroCapture}
          tone="onImage"
        />
        {photoUrl ? (
          <>
            <img
              src={photoUrl}
              alt=""
              className="stq-native-hero-image"
            />
            <div className="absolute right-2 top-2">
              <CaptureButton
                draftId={draft.draftId}
                preset="station"
                onCaptured={setStationBlob}
                className="stq-native-capture-retake"
              />
            </div>
            <ImageCapture
              draftId={draft.draftId}
              preset="station"
              onCaptured={setStationBlob}
              aspectClass="hidden"
              label=""
              captureSignal={heroCaptureSignal}
            />
          </>
        ) : (
          <ImageCapture
            draftId={draft.draftId}
            preset="station"
            onCaptured={setStationBlob}
            aspectClass="aspect-square"
            label="Tap to photograph this location"
            rounded="none"
            captureSignal={heroCaptureSignal}
          />
        )}
      </div>
      <header className="stq-native-titlebar stq-native-element stq-native-element--solid">
        <FieldElementActions
          editLabel="Edit station title"
          aiLabel="Ask AI agent for station title"
          onEdit={triggerTitleEdit}
          tone="onPrimary"
        />
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center
                     rounded-full bg-white/20 font-ui text-h5"
        >
          {station.number}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-ui text-h5">
            <EditableText
              value={content.location}
              onChange={(location) => patchLocale({ location })}
              placeholder="Station name"
              className="text-white"
              editSignal={titleEditSignal}
            />
          </h1>
          <p className="text-labelSm opacity-80">
            {station.position_lat.toFixed(5)},{' '}
            {station.position_lng.toFixed(5)}
          </p>
        </div>
      </header>

      <div className="stq-native-section-stack">
        {STATION_SECTION_KEYS.map((key) => (
          <StationContentSection
            key={key}
            draftId={draft.draftId}
            eyebrow={SECTION_EYEBROWS[key]}
            fallbackTitle={STATION_SECTION_FALLBACK_TITLES[key]}
            aiTarget={SECTION_AI_TARGETS[key]}
            blocks={content[key]}
            onChange={(blocks) => setSectionBlocks(key, blocks)}
          >
            {key === 'riddleSection' && (
              <RiddleAnswerSection
                acceptedAnswers={station.acceptedAnswers[locale]}
                onAcceptedAnswers={(acceptedAnswers) =>
                  patchStation({
                    acceptedAnswers: {
                      ...station.acceptedAnswers,
                      [locale]: acceptedAnswers,
                    },
                  })
                }
                hints={content.hints}
                onHints={(hints) => patchLocale({ hints })}
              />
            )}
          </StationContentSection>
        ))}
      </div>
    </article>
  );
}

function StationContentSection({
  draftId,
  eyebrow,
  fallbackTitle,
  aiTarget,
  blocks,
  onChange,
  children,
}: {
  draftId: string;
  eyebrow: string;
  fallbackTitle: string;
  aiTarget: string;
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  children?: ReactNode;
}) {
  const [sectionTitleEditSignal, triggerSectionTitleEdit] = useSignal();
  const headingIndex = blocks.findIndex((block) => block.type === 'heading');
  const heading =
    headingIndex >= 0 && blocks[headingIndex].type === 'heading'
      ? blocks[headingIndex]
      : null;
  const title = heading?.text ?? '';
  const bodyBlocks =
    headingIndex >= 0
      ? blocks.filter((_, index) => index !== headingIndex)
      : blocks;

  function setTitle(nextTitle: string) {
    if (headingIndex >= 0) {
      onChange(
        blocks.map((block, index) =>
          index === headingIndex ? { type: 'heading', text: nextTitle } : block,
        ),
      );
      return;
    }
    onChange([{ type: 'heading', text: nextTitle }, ...blocks]);
  }

  function setBodyBlocks(nextBodyBlocks: ContentBlock[]) {
    const nextHeading: ContentBlock = {
      type: 'heading',
      text: title || fallbackTitle,
    };

    if (headingIndex < 0) {
      onChange([nextHeading, ...nextBodyBlocks]);
      return;
    }

    const mergedBlocks = nextBodyBlocks.slice();
    const insertAt = Math.min(headingIndex, mergedBlocks.length);
    mergedBlocks.splice(insertAt, 0, nextHeading);
    onChange(mergedBlocks);
  }

  return (
    <section className="stq-native-content-section">
      <header className="stq-native-section-header stq-native-element">
        <FieldElementActions
          editLabel={`Edit ${fallbackTitle} title`}
          aiLabel={`Ask AI agent for ${aiTarget} title`}
          onEdit={triggerSectionTitleEdit}
        />
        <div className="stq-native-section-eyebrow">{eyebrow}</div>
        <EditableText
          as="h2"
          value={title}
          onChange={setTitle}
          placeholder={fallbackTitle}
          className="stq-native-section-title"
          editSignal={sectionTitleEditSignal}
        />
      </header>

      <EditableContentSection
        draftId={draftId}
        blocks={bodyBlocks}
        onChange={setBodyBlocks}
      />

      {children}
    </section>
  );
}

function FieldElementActions({
  editLabel,
  aiLabel,
  onEdit,
  tone = 'default',
}: {
  editLabel: string;
  aiLabel: string;
  onEdit: () => void;
  tone?: 'default' | 'onImage' | 'onPrimary';
}) {
  return (
    <div
      className={`stq-native-element-actions stq-native-element-actions--${tone}`}
      aria-label="Element actions"
    >
      <button
        type="button"
        className="stq-native-action-btn"
        onClick={onEdit}
        aria-label={editLabel}
        title={editLabel}
      >
        <Icon name="edit" size={14} />
      </button>
      <button
        type="button"
        className="stq-native-action-btn stq-native-action-btn--ai"
        disabled
        aria-label={aiLabel}
        title="AI agent not connected yet"
      >
        <Icon name="sparkles" size={14} />
      </button>
    </div>
  );
}

function RiddleAnswerSection({
  acceptedAnswers,
  onAcceptedAnswers,
  hints,
  onHints,
}: {
  acceptedAnswers: AcceptedAnswersByLocale[Locale];
  onAcceptedAnswers: (next: string[]) => void;
  hints: string[];
  onHints: (next: string[]) => void;
}) {
  const [answerEditSignal, triggerAnswerEdit] = useSignal();
  const [hintEditSignal, setHintEditSignal] = useState<number | null>(null);

  return (
    <div className="stq-native-riddle-panel">
      <label className="stq-native-form-row stq-native-element">
        <FieldElementActions
          editLabel="Edit accepted answers"
          aiLabel="Ask AI agent for accepted answers"
          onEdit={triggerAnswerEdit}
        />
        <span className="text-labelSm text-disabled">Accepted answers</span>
        <input
          className="input-field"
          value={formatAcceptedAnswersInput(acceptedAnswers)}
          onChange={(e) => onAcceptedAnswers(parseAcceptedAnswersInput(e.target.value))}
          ref={(node) => {
            if (node && answerEditSignal > 0) node.focus();
          }}
          placeholder="Comma-separated valid answers"
        />
      </label>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-labelSm text-disabled">
          Hints (up to 3, third reveals the answer)
        </legend>
        {hints.map((hint, i) => (
          <div key={i} className="stq-native-form-row stq-native-element">
            <FieldElementActions
              editLabel={`Edit hint ${i + 1}`}
              aiLabel={`Ask AI agent for hint ${i + 1}`}
              onEdit={() => setHintEditSignal(i)}
            />
            <input
              className="input-field"
              value={hint}
              placeholder={`Hint ${i + 1}`}
              ref={(node) => {
                if (node && hintEditSignal === i) node.focus();
              }}
              onChange={(e) => {
                const next = hints.slice();
                next[i] = e.target.value;
                onHints(next);
              }}
            />
            <button
              type="button"
              className="btn-ghost text-labelSm text-error"
              onClick={() => onHints(hints.filter((_, idx) => idx !== i))}
            >
              ✕
            </button>
          </div>
        ))}
        {hints.length < 3 && (
          <button
            type="button"
            className="btn-ghost self-start text-labelSm"
            onClick={() => onHints([...hints, ''])}
          >
            + Add hint
          </button>
        )}
      </fieldset>
    </div>
  );
}
