import type { ContentBlock } from '@/schema';

export function splitHeading(blocks: ContentBlock[], fallbackTitle: string) {
  const headingIndex = blocks.findIndex((block) => block.type === 'heading');
  const heading = headingIndex >= 0 ? blocks[headingIndex] : null;
  return {
    title: heading?.type === 'heading' && heading.text.trim() ? heading.text : fallbackTitle,
    body: headingIndex >= 0 ? blocks.filter((_, index) => index !== headingIndex) : blocks,
  };
}
