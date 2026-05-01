import type { ContentBlock } from '@/schema';
import type { ReactNode } from 'react';
import { ContentSectionRenderer, splitHeading } from './ContentSectionRenderer';

interface Props {
  blocks: ContentBlock[];
  fallbackTitle: string;
  leadImageUrl?: string;
  leadImagePlaceholder?: boolean;
  centeredLines?: boolean;
  headingAction?: ReactNode;
}

export function StoryText({
  blocks,
  fallbackTitle,
  leadImageUrl,
  leadImagePlaceholder = false,
  centeredLines,
  headingAction,
}: Props) {
  const { title, body } = splitHeading(blocks, fallbackTitle);
  const hasBodyText = body.some(
    (block) => block.type !== 'image' && block.text.trim().length > 0,
  );

  return (
    <section className="stq-riddle-section">
      <div
        className={[
          'stq-riddle-heading-row',
          headingAction ? 'stq-riddle-heading-row--with-action' : '',
        ].join(' ')}
      >
        <h2 className="stq-riddle-heading">{title}</h2>
        {headingAction}
      </div>
      {leadImageUrl && (
        <img className="stq-riddle-story-image" src={leadImageUrl} alt="" />
      )}
      {!leadImageUrl && leadImagePlaceholder && (
        <div className="stq-riddle-story-image stq-riddle-story-image--placeholder">
          <span>Bild hinzufügen</span>
        </div>
      )}
      {leadImagePlaceholder && !hasBodyText && (
        <div className="stq-riddle-story-text-placeholder">
          <span>Storytext hinzufügen</span>
        </div>
      )}
      <ContentSectionRenderer blocks={body} centeredLines={centeredLines} />
    </section>
  );
}
