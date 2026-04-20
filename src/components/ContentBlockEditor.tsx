import {
  CONTENT_BLOCK_TYPES,
  emptyBlock,
  type ContentBlock,
  type ContentBlockType,
} from '@/schema';

interface Props {
  blocks: ContentBlock[];
  onChange: (next: ContentBlock[]) => void;
  label?: string;
}

/**
 * Reusable editor for an array of content blocks.
 *
 * v1 supports only `paragraph`, `heading`, `image`, and `line`. Image
 * editing is a placeholder until the camera pipeline lands.
 */
export function ContentBlockEditor({ blocks, onChange, label }: Props) {
  function updateAt(index: number, next: ContentBlock) {
    const copy = blocks.slice();
    copy[index] = next;
    onChange(copy);
  }

  function removeAt(index: number) {
    onChange(blocks.filter((_, i) => i !== index));
  }

  function moveUp(index: number) {
    if (index === 0) return;
    const copy = blocks.slice();
    [copy[index - 1], copy[index]] = [copy[index], copy[index - 1]];
    onChange(copy);
  }

  function moveDown(index: number) {
    if (index === blocks.length - 1) return;
    const copy = blocks.slice();
    [copy[index], copy[index + 1]] = [copy[index + 1], copy[index]];
    onChange(copy);
  }

  function add(type: ContentBlockType) {
    onChange([...blocks, emptyBlock(type)]);
  }

  return (
    <fieldset className="flex flex-col gap-2">
      {label && <legend className="text-labelLg">{label}</legend>}
      <div className="flex flex-col gap-2">
        {blocks.map((block, index) => (
          <BlockRow
            key={index}
            block={block}
            onChange={(next) => updateAt(index, next)}
            onRemove={() => removeAt(index)}
            onMoveUp={() => moveUp(index)}
            onMoveDown={() => moveDown(index)}
            isFirst={index === 0}
            isLast={index === blocks.length - 1}
          />
        ))}
        {blocks.length === 0 && (
          <p className="text-bodySm text-disabled">No blocks yet.</p>
        )}
      </div>
      <div className="flex flex-wrap gap-2">
        {CONTENT_BLOCK_TYPES.map((type) => (
          <button
            key={type}
            type="button"
            className="btn-ghost text-labelSm"
            onClick={() => add(type)}
          >
            + {type}
          </button>
        ))}
      </div>
    </fieldset>
  );
}

interface RowProps {
  block: ContentBlock;
  onChange: (next: ContentBlock) => void;
  onRemove: () => void;
  onMoveUp: () => void;
  onMoveDown: () => void;
  isFirst: boolean;
  isLast: boolean;
}

function BlockRow({
  block,
  onChange,
  onRemove,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: RowProps) {
  return (
    <div className="flex flex-col gap-2 rounded-sm border border-border bg-white p-3">
      <div className="flex items-center justify-between">
        <span className="text-labelSm uppercase text-disabled">
          {block.type}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            className="btn-ghost text-labelSm"
            onClick={onMoveUp}
            disabled={isFirst}
          >
            ↑
          </button>
          <button
            type="button"
            className="btn-ghost text-labelSm"
            onClick={onMoveDown}
            disabled={isLast}
          >
            ↓
          </button>
          <button
            type="button"
            className="btn-ghost text-labelSm text-error"
            onClick={onRemove}
          >
            Remove
          </button>
        </div>
      </div>
      <BlockFields block={block} onChange={onChange} />
    </div>
  );
}

function BlockFields({
  block,
  onChange,
}: {
  block: ContentBlock;
  onChange: (next: ContentBlock) => void;
}) {
  switch (block.type) {
    case 'paragraph':
      return (
        <textarea
          className="input-field min-h-[6rem]"
          placeholder="Paragraph text"
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
        />
      );
    case 'heading':
      return (
        <input
          className="input-field"
          placeholder="Heading"
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
        />
      );
    case 'line':
      return (
        <input
          className="input-field"
          placeholder="Line text (can be empty for spacing)"
          value={block.text}
          onChange={(e) => onChange({ ...block, text: e.target.value })}
        />
      );
    case 'image':
      return (
        <div className="flex flex-col gap-2">
          <input
            className="input-field"
            placeholder="imagePath (e.g. my_tour/images/foo.webp)"
            value={block.imagePath}
            onChange={(e) => onChange({ ...block, imagePath: e.target.value })}
          />
          <p className="text-bodySm text-disabled">
            Camera capture + WebP resize will land in the next iteration. For
            now, enter a relative path that will exist in the exported ZIP.
          </p>
        </div>
      );
  }
}
