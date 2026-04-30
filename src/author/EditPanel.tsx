import { useState } from 'react';
import type { ContentBlock, RiddleEntry } from '@/schema';
import {
  formatAcceptedAnswersInput,
  parseAcceptedAnswersInput,
} from '@/schema';
import { ImageCapture } from '@/components/ImageCapture';
import { splitHeading } from '@/renderer/ContentSectionRenderer';

export type EditPayload =
  | { kind: 'hero'; blobId: string }
  | { kind: 'stationTitle'; value: string }
  | { kind: 'section'; blocks: ContentBlock[] }
  | { kind: 'answers'; acceptedAnswers: string[]; hints: string[] }
  | {
      kind: 'tourIntro';
      title: string;
      description: ContentBlock[];
    }
  | {
      kind: 'riddleSetup';
      blocks: ContentBlock[];
      riddleType: RiddleEntry['riddleType'];
      solutionInputType: RiddleEntry['solutionInputType'];
      acceptedAnswers: string[];
      hints: string[];
    };

interface Props {
  targetPath: string;
  label: string;
  draftId: string;
  stationTitle: string;
  heroBlobId?: string;
  sectionBlocks?: ContentBlock[];
  sectionFallbackTitle?: string;
  riddleType: RiddleEntry['riddleType'];
  solutionInputType: RiddleEntry['solutionInputType'];
  acceptedAnswers: string[];
  hints: string[];
  onSave: (payload: EditPayload) => void;
}

export function EditPanel({
  targetPath,
  label,
  draftId,
  stationTitle,
  heroBlobId,
  sectionBlocks,
  sectionFallbackTitle = label,
  riddleType,
  solutionInputType,
  acceptedAnswers,
  hints,
  onSave,
}: Props) {
  if (targetPath.endsWith('.image')) {
    return (
      <>
        <h2>{label}</h2>
        <p className="stq-riddle-modal-copy">
          Update the player-facing image without changing the native preview layout.
        </p>
        <ImageCapture
          draftId={draftId}
          preset="station"
          blobId={heroBlobId}
          onCaptured={(blobId) => onSave({ kind: 'hero', blobId })}
          aspectClass="aspect-[4/3]"
          label="Choose station image"
        />
      </>
    );
  }

  if (targetPath.endsWith('.title')) {
    return (
      <TextFieldPanel
        title={label}
        value={stationTitle}
        onSave={(value) => onSave({ kind: 'stationTitle', value })}
      />
    );
  }

  if (targetPath.endsWith('.answers')) {
    return (
      <AnswersPanel
        acceptedAnswers={acceptedAnswers}
        hints={hints}
        onSave={(nextAnswers, nextHints) =>
          onSave({
            kind: 'answers',
            acceptedAnswers: nextAnswers,
            hints: nextHints,
          })
        }
      />
    );
  }

  if (targetPath === 'tour.intro') {
    return (
      <TourIntroPanel
        titleValue={stationTitle}
        descriptionBlocks={sectionBlocks ?? []}
        onSave={(title, description) =>
          onSave({ kind: 'tourIntro', title, description })
        }
      />
    );
  }

  if (targetPath.endsWith('riddleSection')) {
    return (
      <RiddleSetupPanel
        blocks={sectionBlocks ?? []}
        fallbackTitle={sectionFallbackTitle}
        riddleType={riddleType}
        solutionInputType={solutionInputType}
        acceptedAnswers={acceptedAnswers}
        hints={hints}
        onSave={(payload) => onSave({ kind: 'riddleSetup', ...payload })}
      />
    );
  }

  return (
    <SectionPanel
      title={label}
      blocks={sectionBlocks ?? []}
      fallbackTitle={sectionFallbackTitle}
      onSave={(blocks) => onSave({ kind: 'section', blocks })}
    />
  );
}

function TextFieldPanel({
  title,
  value,
  onSave,
}: {
  title: string;
  value: string;
  onSave: (value: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  return (
    <>
      <h2>{title}</h2>
      <label className="stq-riddle-modal-field">
        <span>{title}</span>
        <input value={draft} onChange={(event) => setDraft(event.target.value)} />
      </label>
      <button type="button" className="stq-riddle-modal-save" onClick={() => onSave(draft)}>
        Save
      </button>
    </>
  );
}

function SectionPanel({
  title,
  blocks,
  fallbackTitle,
  onSave,
}: {
  title: string;
  blocks: ContentBlock[];
  fallbackTitle: string;
  onSave: (blocks: ContentBlock[]) => void;
}) {
  const split = splitHeading(blocks, fallbackTitle);
  const [draftTitle, setDraftTitle] = useState(split.title);
  const [draftBody, setDraftBody] = useState(blocksToEditableText(split.body));
  return (
    <>
      <h2>{title}</h2>
      <label className="stq-riddle-modal-field">
        <span>Title</span>
        <input
          value={draftTitle}
          onChange={(event) => setDraftTitle(event.target.value)}
        />
      </label>
      <label className="stq-riddle-modal-field">
        <span>Text</span>
        <textarea
          value={draftBody}
          onChange={(event) => setDraftBody(event.target.value)}
          rows={9}
        />
      </label>
      <button
        type="button"
        className="stq-riddle-modal-save"
        onClick={() => onSave(editableTextToBlocks(draftTitle, draftBody))}
      >
        Save
      </button>
    </>
  );
}

function TourIntroPanel({
  titleValue,
  descriptionBlocks,
  onSave,
}: {
  titleValue: string;
  descriptionBlocks: ContentBlock[];
  onSave: (title: string, description: ContentBlock[]) => void;
}) {
  const [draftTitle, setDraftTitle] = useState(titleValue);
  const [draftBody, setDraftBody] = useState(blocksToEditableText(descriptionBlocks));
  return (
    <>
      <h2>Tour intro</h2>
      <label className="stq-riddle-modal-field">
        <span>Title</span>
        <input
          value={draftTitle}
          onChange={(event) => setDraftTitle(event.target.value)}
        />
      </label>
      <label className="stq-riddle-modal-field">
        <span>Description</span>
        <textarea
          value={draftBody}
          onChange={(event) => setDraftBody(event.target.value)}
          rows={9}
        />
      </label>
      <button
        type="button"
        className="stq-riddle-modal-save"
        onClick={() => onSave(draftTitle, bodyTextToBlocks(draftBody))}
      >
        Save
      </button>
    </>
  );
}

function bodyTextToBlocks(body: string): ContentBlock[] {
  return body
    .split(/\n{2,}/)
    .map((entry) => entry.trim())
    .filter(Boolean)
    .map((text) => ({ type: 'paragraph', text }));
}

function RiddleSetupPanel({
  blocks,
  fallbackTitle,
  riddleType,
  solutionInputType,
  acceptedAnswers,
  hints,
  onSave,
}: {
  blocks: ContentBlock[];
  fallbackTitle: string;
  riddleType: RiddleEntry['riddleType'];
  solutionInputType: RiddleEntry['solutionInputType'];
  acceptedAnswers: string[];
  hints: string[];
  onSave: (payload: {
    blocks: ContentBlock[];
    riddleType: RiddleEntry['riddleType'];
    solutionInputType: RiddleEntry['solutionInputType'];
    acceptedAnswers: string[];
    hints: string[];
  }) => void;
}) {
  const split = splitHeading(blocks, fallbackTitle);
  const [draftTitle, setDraftTitle] = useState(split.title);
  const [draftBody, setDraftBody] = useState(blocksToEditableText(split.body));
  const [draftRiddleType, setDraftRiddleType] =
    useState<RiddleEntry['riddleType']>(riddleType);
  const [draftSolutionInputType, setDraftSolutionInputType] =
    useState<RiddleEntry['solutionInputType']>(solutionInputType);
  const [answersText, setAnswersText] = useState(
    formatAcceptedAnswersInput(acceptedAnswers),
  );
  const [hintDrafts, setHintDrafts] = useState(() => {
    const padded = [...hints.slice(0, 3)];
    while (padded.length < 3) padded.push('');
    return padded;
  });

  function setHint(index: number, value: string) {
    setHintDrafts((current) => current.map((hint, i) => (i === index ? value : hint)));
  }

  return (
    <>
      <h2>Riddle setup</h2>
      <label className="stq-riddle-modal-field">
        <span>Title</span>
        <input value={draftTitle} onChange={(event) => setDraftTitle(event.target.value)} />
      </label>
      <label className="stq-riddle-modal-field">
        <span>Text</span>
        <textarea
          value={draftBody}
          onChange={(event) => setDraftBody(event.target.value)}
          rows={7}
        />
      </label>
      <label className="stq-riddle-modal-field">
        <span>Riddle type</span>
        <select
          value={draftRiddleType}
          onChange={(event) =>
            setDraftRiddleType(event.target.value as RiddleEntry['riddleType'])
          }
        >
          <option value="text">Text answer</option>
        </select>
      </label>
      <label className="stq-riddle-modal-field">
        <span>Solution input</span>
        <select
          value={draftSolutionInputType}
          onChange={(event) =>
            setDraftSolutionInputType(event.target.value as RiddleEntry['solutionInputType'])
          }
        >
          <option value="text">Text field</option>
        </select>
      </label>
      <label className="stq-riddle-modal-field">
        <span>Solution / accepted answers</span>
        <input
          value={answersText}
          onChange={(event) => setAnswersText(event.target.value)}
          placeholder="Comma-separated valid answers"
        />
      </label>
      <div className="stq-riddle-modal-field">
        <span>Hints</span>
        {hintDrafts.map((hint, index) => (
          <input
            key={index}
            value={hint}
            onChange={(event) => setHint(index, event.target.value)}
            placeholder={`Hint ${index + 1}`}
          />
        ))}
      </div>
      <button
        type="button"
        className="stq-riddle-modal-save"
        onClick={() =>
          onSave({
            blocks: editableTextToBlocks(draftTitle, draftBody),
            riddleType: draftRiddleType,
            solutionInputType: draftSolutionInputType,
            acceptedAnswers: parseAcceptedAnswersInput(answersText),
            hints: hintDrafts.map((hint) => hint.trim()).filter(Boolean).slice(0, 3),
          })
        }
      >
        Save
      </button>
    </>
  );
}

function AnswersPanel({
  acceptedAnswers,
  hints,
  onSave,
}: {
  acceptedAnswers: string[];
  hints: string[];
  onSave: (acceptedAnswers: string[], hints: string[]) => void;
}) {
  const [answersText, setAnswersText] = useState(
    formatAcceptedAnswersInput(acceptedAnswers),
  );
  const [hintsText, setHintsText] = useState(hints.join('\n'));
  return (
    <>
      <h2>Riddle solution</h2>
      <label className="stq-riddle-modal-field">
        <span>Accepted answers</span>
        <input
          value={answersText}
          onChange={(event) => setAnswersText(event.target.value)}
        />
      </label>
      <label className="stq-riddle-modal-field">
        <span>Hints</span>
        <textarea
          value={hintsText}
          onChange={(event) => setHintsText(event.target.value)}
          rows={5}
        />
      </label>
      <button
        type="button"
        className="stq-riddle-modal-save"
        onClick={() =>
          onSave(
            parseAcceptedAnswersInput(answersText),
            hintsText
              .split('\n')
              .map((hint) => hint.trim())
              .filter(Boolean)
              .slice(0, 3),
          )
        }
      >
        Save
      </button>
    </>
  );
}

function blocksToEditableText(blocks: ContentBlock[]): string {
  return blocks
    .map((block) => {
      if (block.type === 'image') return `[image: ${block.imagePath}]`;
      return block.text;
    })
    .join('\n\n');
}

function editableTextToBlocks(title: string, body: string): ContentBlock[] {
  const blocks: ContentBlock[] = [{ type: 'heading', text: title }];
  for (const text of body.split(/\n{2,}/).map((entry) => entry.trim()).filter(Boolean)) {
    blocks.push({ type: 'paragraph', text });
  }
  return blocks;
}
