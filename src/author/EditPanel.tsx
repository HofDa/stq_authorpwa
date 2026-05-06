import { useState } from 'react';
import type { ContentBlock, RiddleEntry } from '@/schema';
import {
  formatAcceptedAnswersInput,
  parseAcceptedAnswersInput,
} from '@/schema';
import { ImageCapture } from '@/components/ImageCapture';
import { splitHeading } from '@/renderer/splitHeading';

type EditableTextBlockType = 'paragraph' | 'paragraph_styled' | 'line';
type EditableTextBlock = Extract<ContentBlock, { type: EditableTextBlockType }>;

const EDITABLE_TEXT_BLOCK_TYPES: Array<{
  type: EditableTextBlockType;
  label: string;
}> = [
  { type: 'paragraph', label: 'Paragraph' },
  { type: 'paragraph_styled', label: 'Styled paragraph' },
  { type: 'line', label: 'Line' },
];

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
  const [draftBody, setDraftBody] = useState(() => normalizeEditableBodyBlocks(split.body));
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
      <TextBlocksEditor blocks={draftBody} onChange={setDraftBody} />
      <button
        type="button"
        className="stq-riddle-modal-save"
        onClick={() => onSave(blocksWithHeading(draftTitle, draftBody))}
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
  const [draftBody, setDraftBody] = useState(() =>
    normalizeEditableBodyBlocks(descriptionBlocks),
  );
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
      <TextBlocksEditor label="Description blocks" blocks={draftBody} onChange={setDraftBody} />
      <button
        type="button"
        className="stq-riddle-modal-save"
        onClick={() => onSave(draftTitle, cleanBodyBlocks(draftBody))}
      >
        Save
      </button>
    </>
  );
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
  const [draftBody, setDraftBody] = useState(() => normalizeEditableBodyBlocks(split.body));
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
      <TextBlocksEditor blocks={draftBody} onChange={setDraftBody} />
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
            blocks: blocksWithHeading(draftTitle, draftBody),
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

function TextBlocksEditor({
  label = 'Text blocks',
  blocks,
  onChange,
}: {
  label?: string;
  blocks: EditableTextBlock[];
  onChange: (blocks: EditableTextBlock[]) => void;
}) {
  function updateBlock(index: number, next: EditableTextBlock) {
    onChange(blocks.map((block, i) => (i === index ? next : block)));
  }

  function updateType(index: number, type: EditableTextBlockType) {
    const current = blocks[index];
    updateBlock(index, { type, text: current.text });
  }

  function addBlock(type: EditableTextBlockType = 'paragraph') {
    onChange([...blocks, { type, text: '' }]);
  }

  function removeBlock(index: number) {
    const next = blocks.filter((_, i) => i !== index);
    onChange(next.length > 0 ? next : [{ type: 'paragraph', text: '' }]);
  }

  return (
    <div className="stq-riddle-modal-field stq-riddle-text-blocks">
      <span>{label}</span>
      <div className="stq-riddle-text-block-list">
        {blocks.map((block, index) => (
          <div key={index} className="stq-riddle-text-block-row">
            <div className="stq-riddle-text-block-controls">
              <select
                value={block.type}
                onChange={(event) =>
                  updateType(index, event.target.value as EditableTextBlockType)
                }
                aria-label={`Block ${index + 1} type`}
              >
                {EDITABLE_TEXT_BLOCK_TYPES.map((option) => (
                  <option key={option.type} value={option.type}>
                    {option.label}
                  </option>
                ))}
              </select>
              <button
                type="button"
                onClick={() => removeBlock(index)}
                aria-label={`Remove block ${index + 1}`}
              >
                Remove
              </button>
            </div>
            <textarea
              value={block.text}
              onChange={(event) => updateBlock(index, { ...block, text: event.target.value })}
              rows={block.type === 'line' ? 2 : 5}
              placeholder={placeholderForTextBlock(block.type)}
            />
          </div>
        ))}
      </div>
      <div className="stq-riddle-text-block-add">
        {EDITABLE_TEXT_BLOCK_TYPES.map((option) => (
          <button key={option.type} type="button" onClick={() => addBlock(option.type)}>
            Add {option.label.toLowerCase()}
          </button>
        ))}
      </div>
    </div>
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

function normalizeEditableBodyBlocks(blocks: ContentBlock[]): EditableTextBlock[] {
  const editable = blocks.filter(isEditableTextBlock);
  if (editable.length > 0) return editable;
  return [{ type: 'paragraph', text: '' }];
}

function blocksWithHeading(title: string, body: EditableTextBlock[]): ContentBlock[] {
  const blocks: ContentBlock[] = [{ type: 'heading', text: title }];
  blocks.push(...cleanBodyBlocks(body));
  return blocks;
}

function cleanBodyBlocks(blocks: EditableTextBlock[]): EditableTextBlock[] {
  return blocks
    .map((block) => ({ ...block, text: block.text.trim() }))
    .filter((block) => block.text.length > 0);
}

function isEditableTextBlock(block: ContentBlock): block is EditableTextBlock {
  return block.type === 'paragraph' || block.type === 'paragraph_styled' || block.type === 'line';
}

function placeholderForTextBlock(type: EditableTextBlockType) {
  if (type === 'line') return 'Short line...';
  if (type === 'paragraph_styled') return 'Styled paragraph text...';
  return 'Paragraph text...';
}
