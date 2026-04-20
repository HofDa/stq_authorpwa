import type { ContentBlock } from '@/schema';

interface Props {
  blocks: ContentBlock[];
}

/**
 * React mirror of `ContentSection` in the Flutter app.
 *
 * Renders the v1 block types: `paragraph`, `heading`, `image`, `line`.
 * Aim is ~95% visual fidelity with the native renderer, not pixel-perfect.
 */
export function ContentSectionPreview({ blocks }: Props) {
  return (
    <div className="flex flex-col gap-3 px-4 py-4">
      {blocks.map((block, i) => (
        <BlockView key={i} block={block} />
      ))}
    </div>
  );
}

function BlockView({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'heading':
      return <h2 className="font-ui text-h4 text-text">{block.text}</h2>;
    case 'paragraph':
      return (
        <p className="whitespace-pre-wrap font-body text-body text-text">
          {block.text}
        </p>
      );
    case 'line':
      return (
        <p className="font-ui text-body text-text">
          {block.text || '\u00A0'}
        </p>
      );
    case 'image':
      return (
        <div className="flex items-center justify-center overflow-hidden rounded-md border border-border bg-background">
          {block.imagePath ? (
            <div className="flex h-40 w-full items-center justify-center text-bodySm text-disabled">
              [image: {block.imagePath}]
            </div>
          ) : (
            <div className="flex h-40 w-full items-center justify-center text-bodySm text-disabled">
              (no image set)
            </div>
          )}
        </div>
      );
  }
}
