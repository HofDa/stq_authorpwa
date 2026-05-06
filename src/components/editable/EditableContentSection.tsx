import { useState } from 'react';
import {
  CONTENT_BLOCK_TYPES,
  emptyBlock,
  type ContentBlock,
  type ContentBlockType,
} from '@/schema';
import { EditableText } from './EditableText';
import { ImageCapture } from '@/components/ImageCapture';
import { useBlobUrl } from '@/hooks/useBlobUrl';
import { useSignal } from '@/hooks/useSignal';
import { Icon } from '@/components/studio/Icon';

interface Props {
  draftId: string;
  blocks: ContentBlock[];
  onChange: (next: ContentBlock[]) => void;
}

/**
 * Inline editor that doubles as the live preview. Tap any block to edit
 * text; tap an image placeholder to capture a photo; use the + button
 * between blocks to insert a new block of the chosen type.
 */
export function EditableContentSection({ draftId, blocks, onChange }: Props) {
  function replaceAt(i: number, next: ContentBlock) {
    const copy = blocks.slice();
    copy[i] = next;
    onChange(copy);
  }

  function insertAt(i: number, type: ContentBlockType) {
    const copy = blocks.slice();
    copy.splice(i, 0, emptyBlock(type));
    onChange(copy);
  }

  function removeAt(i: number) {
    onChange(blocks.filter((_, idx) => idx !== i));
  }

  function move(i: number, delta: -1 | 1) {
    const j = i + delta;
    if (j < 0 || j >= blocks.length) return;
    const copy = blocks.slice();
    [copy[i], copy[j]] = [copy[j], copy[i]];
    onChange(copy);
  }

  return (
    <div className="flex flex-col">
      <InsertDivider onInsert={(type) => insertAt(0, type)} />
      {blocks.map((block, i) => (
        <div key={i}>
          <BlockRow
            block={block}
            draftId={draftId}
            onChange={(next) => replaceAt(i, next)}
            onRemove={() => removeAt(i)}
            onMoveUp={() => move(i, -1)}
            onMoveDown={() => move(i, 1)}
            isFirst={i === 0}
            isLast={i === blocks.length - 1}
          />
          <InsertDivider onInsert={(type) => insertAt(i + 1, type)} />
        </div>
      ))}
    </div>
  );
}

interface RowProps {
  block: ContentBlock;
  draftId: string;
  onChange: (next: ContentBlock) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function BlockRow({
  block,
  draftId,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: RowProps) {
  const [editSignal, triggerEdit] = useSignal();

  return (
    <div className="stq-native-element group">
      <FieldElementActions
        editLabel={`Edit ${block.type} block`}
        aiLabel={`Ask AI agent for ${block.type} block`}
        onEdit={triggerEdit}
      />
      <RowControls
        onMoveUp={onMoveUp}
        onMoveDown={onMoveDown}
        onRemove={onRemove}
        isFirst={isFirst}
        isLast={isLast}
      />
      <BlockContent
        block={block}
        draftId={draftId}
        editSignal={editSignal}
        onChange={onChange}
      />
    </div>
  );
}

function BlockContent({
  block,
  draftId,
  editSignal,
  onChange,
}: {
  block: ContentBlock;
  draftId: string;
  editSignal: number;
  onChange: (next: ContentBlock) => void;
}) {
  switch (block.type) {
    case 'heading':
      return (
        <EditableText
          as="h2"
          value={block.text}
          onChange={(text) => onChange({ ...block, text })}
          placeholder="Heading"
          className="font-ui text-h4 text-text"
          editSignal={editSignal}
        />
      );
    case 'paragraph':
      return (
        <EditableText
          as="p"
          multiline
          value={block.text}
          onChange={(text) => onChange({ ...block, text })}
          placeholder="Paragraph text…"
          className="whitespace-pre-wrap font-body text-body text-text"
          editSignal={editSignal}
        />
      );
    case 'paragraph_styled':
      return (
        <EditableText
          as="p"
          multiline
          value={block.text}
          onChange={(text) => onChange({ ...block, text })}
          placeholder="Styled paragraph text..."
          className="whitespace-pre-wrap rounded-md border-l-4 border-primary/50 bg-primary/5 px-3 py-2 font-body text-body text-text"
          editSignal={editSignal}
        />
      );
    case 'line':
      return (
        <EditableText
          as="p"
          value={block.text}
          onChange={(text) => onChange({ ...block, text })}
          placeholder="Line (emoji + short text)"
          className="font-ui text-body text-text"
          editSignal={editSignal}
        />
      );
    case 'image':
      return (
        <ImageBlockEditor
          block={block}
          draftId={draftId}
          editSignal={editSignal}
          onChange={onChange}
        />
      );
  }
}

function ImageBlockEditor({
  block,
  draftId,
  editSignal,
  onChange,
}: {
  block: Extract<ContentBlock, { type: 'image' }>;
  draftId: string;
  editSignal: number;
  onChange: (next: ContentBlock) => void;
}) {
  const url = useBlobUrl(block.localBlobId);
  if (block.imagePath && !block.localBlobId && !url) {
    return (
      <div className="overflow-hidden rounded-md border border-border bg-background">
        <div className="flex h-40 items-center justify-center text-bodySm text-disabled">
          [image: {block.imagePath}]
        </div>
      </div>
    );
  }
  return (
    <ImageCapture
      draftId={draftId}
      preset="block"
      blobId={block.localBlobId}
      onCaptured={(id) =>
        onChange({
          ...block,
          localBlobId: id,
          imagePath: `images/${id}.webp`,
        })
      }
      aspectClass="aspect-[4/3]"
      label="Tap to add a photo"
      captureSignal={editSignal}
    />
  );
}

function FieldElementActions({
  editLabel,
  aiLabel,
  onEdit,
}: {
  editLabel: string;
  aiLabel: string;
  onEdit: () => void;
}) {
  return (
    <div className="stq-native-element-actions" aria-label="Element actions">
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

function RowControls({
  onMoveUp,
  onMoveDown,
  onRemove,
  isFirst,
  isLast,
}: {
  onMoveUp: () => void;
  onMoveDown: () => void;
  onRemove: () => void;
  isFirst: boolean;
  isLast: boolean;
}) {
  return (
    <div
      className="pointer-events-none absolute right-3 top-12 z-10 flex gap-1
                 opacity-0 transition group-hover:pointer-events-auto
                 group-hover:opacity-100 group-focus-within:pointer-events-auto
                 group-focus-within:opacity-100"
    >
      <button
        type="button"
        className="rounded-full bg-white px-2 py-1 text-labelSm shadow
                   hover:bg-primary/10 disabled:opacity-40"
        onClick={onMoveUp}
        disabled={isFirst}
        aria-label="Move up"
      >
        ↑
      </button>
      <button
        type="button"
        className="rounded-full bg-white px-2 py-1 text-labelSm shadow
                   hover:bg-primary/10 disabled:opacity-40"
        onClick={onMoveDown}
        disabled={isLast}
        aria-label="Move down"
      >
        ↓
      </button>
      <button
        type="button"
        className="rounded-full bg-white px-2 py-1 text-labelSm text-error
                   shadow hover:bg-error/10"
        onClick={onRemove}
        aria-label="Remove block"
      >
        ✕
      </button>
    </div>
  );
}

function InsertDivider({
  onInsert,
}: {
  onInsert: (type: ContentBlockType) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <div className="group relative flex h-2 items-center px-4">
      <div
        className={[
          'flex w-full items-center gap-2 transition',
          open ? 'opacity-100' : 'opacity-0 group-hover:opacity-100',
        ].join(' ')}
      >
        <div className="h-px flex-1 bg-primary/30" />
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="rounded-full bg-primary px-2 py-0.5 text-labelSm text-white
                     shadow-sm"
        >
          + Add block
        </button>
        <div className="h-px flex-1 bg-primary/30" />
      </div>
      {open && (
        <div
          className="absolute left-1/2 top-full z-10 mt-1 -translate-x-1/2
                     rounded-md border border-border bg-white p-1 shadow-lg"
        >
          {CONTENT_BLOCK_TYPES.map((type) => (
            <button
              key={type}
              type="button"
              className="block w-full rounded-sm px-3 py-1.5 text-left
                         text-labelLg hover:bg-primary/10"
              onClick={() => {
                onInsert(type);
                setOpen(false);
              }}
            >
              {iconFor(type)} {type}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

function iconFor(type: ContentBlockType): string {
  switch (type) {
    case 'heading':
      return '🔤';
    case 'paragraph':
      return '📝';
    case 'paragraph_styled':
      return '▌';
    case 'image':
      return '📷';
    case 'line':
      return '•';
  }
}
