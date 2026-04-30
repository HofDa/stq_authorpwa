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
  RiddleLocaleContent,
  TourDraft,
} from '@/schema';
import { EditableText } from './EditableText';
import { EditableContentSection } from './EditableContentSection';
import { ImageCapture } from '@/components/ImageCapture';
import { CaptureButton } from '@/components/CaptureButton';
import { useBlobUrl } from '@/hooks/useBlobUrl';
import { Icon } from '@/components/studio/Icon';

interface Props {
  draft: TourDraft;
  station: RiddleEntry;
  locale: Locale;
  onChange: (recipe: (prev: TourDraft) => TourDraft) => void;
}

type SectionKey = 'firstSection' | 'historySection' | 'riddleSection' | 'successSection';

const SECTIONS: Array<{
  key: SectionKey;
  fallbackTitle: string;
  aiTarget: string;
}> = [
  { key: 'firstSection', fallbackTitle: 'Story', aiTarget: 'story section' },
  {
    key: 'historySection',
    fallbackTitle: 'Background',
    aiTarget: 'background section',
  },
  { key: 'riddleSection', fallbackTitle: 'Riddle', aiTarget: 'riddle section' },
  { key: 'successSection', fallbackTitle: 'Success', aiTarget: 'success section' },
];

const SECTION_EYEBROWS: Record<SectionKey, string> = {
  firstSection: 'Story',
  historySection: 'Context',
  riddleSection: 'Challenge',
  successSection: 'Solved',
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
  const [titleEditSignal, setTitleEditSignal] = useState(0);
  const [heroCaptureSignal, setHeroCaptureSignal] = useState(0);
  const content = station[locale];
  const photoUrl = useBlobUrl(station.imageBlobId);

  function patchStation(patch: Partial<RiddleEntry>) {
    onChange((prev) => ({
      ...prev,
      stations: prev.stations.map((s) =>
        s.id === station.id ? { ...s, ...patch } : s,
      ),
    }));
  }

  function patchLocale(patch: Partial<RiddleLocaleContent>) {
    onChange((prev) => ({
      ...prev,
      stations: prev.stations.map((s) =>
        s.id === station.id ? { ...s, [locale]: { ...s[locale], ...patch } } : s,
      ),
    }));
  }

  function setStationBlob(blobId: string) {
    patchStation({
      imageBlobId: blobId,
      imagePath: `images/${blobId}.webp`,
    });
  }

  function setSectionBlocks(key: SectionKey, blocks: ContentBlock[]) {
    patchLocale({ [key]: blocks });
  }

  return (
    <article className="stq-native-station-drawer">
      <div className="stq-native-hero">
        <FieldElementActions
          editLabel="Edit station image"
          aiLabel="Ask AI agent for station image"
          onEdit={() => setHeroCaptureSignal((value) => value + 1)}
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
          onEdit={() => setTitleEditSignal((value) => value + 1)}
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
        {SECTIONS.map((section) => (
          <StationContentSection
            key={section.key}
            draftId={draft.draftId}
            eyebrow={SECTION_EYEBROWS[section.key]}
            fallbackTitle={section.fallbackTitle}
            aiTarget={section.aiTarget}
            blocks={content[section.key]}
            onChange={(blocks) => setSectionBlocks(section.key, blocks)}
          >
            {section.key === 'riddleSection' && (
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
  const [sectionTitleEditSignal, setSectionTitleEditSignal] = useState(0);
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
          onEdit={() => setSectionTitleEditSignal((value) => value + 1)}
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
  const [answerEditSignal, setAnswerEditSignal] = useState(0);
  const [hintEditSignal, setHintEditSignal] = useState<number | null>(null);

  return (
    <div className="stq-native-riddle-panel">
      <label className="stq-native-form-row stq-native-element">
        <FieldElementActions
          editLabel="Edit accepted answers"
          aiLabel="Ask AI agent for accepted answers"
          onEdit={() => setAnswerEditSignal((value) => value + 1)}
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
