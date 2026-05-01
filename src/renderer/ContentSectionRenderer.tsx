import type { ContentBlock } from '@/schema';
import { resolveRendererAssetPath } from './assetPaths';

interface Props {
  blocks: ContentBlock[];
  centeredLines?: boolean;
}

export function ContentSectionRenderer({ blocks, centeredLines = false }: Props) {
  return (
    <div className="stq-riddle-copy">
      {blocks.map((block, index) => {
        switch (block.type) {
          case 'heading':
            return (
              <h3 key={index} className="stq-riddle-subheading">
                {block.text}
              </h3>
            );
          case 'paragraph':
            return <p key={index}>{block.text}</p>;
          case 'paragraph_styled':
            return (
              <p key={index} className="stq-riddle-styled-paragraph">
                {block.text}
              </p>
            );
          case 'line':
            return (
              <p
                key={index}
                className={centeredLines ? 'stq-riddle-line-centered' : undefined}
              >
                {block.text}
              </p>
            );
          case 'image': {
            const imageUrl = resolveRendererAssetPath(block.imagePath);
            return imageUrl ? (
              <img key={index} className="stq-riddle-inline-image" src={imageUrl} alt="" />
            ) : null;
          }
        }
      })}
    </div>
  );
}

export function splitHeading(blocks: ContentBlock[], fallbackTitle: string) {
  const headingIndex = blocks.findIndex((block) => block.type === 'heading');
  const heading = headingIndex >= 0 ? blocks[headingIndex] : null;
  return {
    title: heading?.type === 'heading' && heading.text.trim() ? heading.text : fallbackTitle,
    body: headingIndex >= 0 ? blocks.filter((_, index) => index !== headingIndex) : blocks,
  };
}
