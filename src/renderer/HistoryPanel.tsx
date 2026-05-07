import type { ContentBlock } from '@/schema';
import type { ReactNode } from 'react';
import { Icon } from '@/components/studio/Icon';
import { ContentSectionRenderer } from './ContentSectionRenderer';
import { splitHeading } from './splitHeading';
import { LoremPlaceholder } from './StoryText';

interface Props {
  blocks: ContentBlock[];
  fallbackTitle: string;
  open: boolean;
  onToggle: () => void;
  headingAction?: ReactNode;
}

export function HistoryPanel({
  blocks,
  fallbackTitle,
  open,
  onToggle,
  headingAction,
}: Props) {
  const { title, body } = splitHeading(blocks, fallbackTitle);
  const hasBodyText = body.some(
    (block) => block.type !== 'image' && 'text' in block && block.text.trim().length > 0,
  );

  return (
    <section className="stq-riddle-history">
      <div className="stq-riddle-history-header">
        <button
          type="button"
          className="stq-riddle-history-trigger"
          onClick={(event) => {
            event.stopPropagation();
            onToggle();
          }}
          aria-expanded={open}
        >
          <span>Mehr Infos</span>
          <span className="stq-riddle-history-icon">
            <Icon name="chevron-right" size={24} />
          </span>
        </button>
        {headingAction && (
          <div className="stq-riddle-history-actions">{headingAction}</div>
        )}
      </div>
      {open && (
        <div className="stq-riddle-history-body">
          <div className="stq-riddle-heading-row">
            <h2 className="stq-riddle-heading">{title}</h2>
          </div>
          {hasBodyText ? (
            <ContentSectionRenderer blocks={body} />
          ) : (
            <LoremPlaceholder />
          )}
        </div>
      )}
    </section>
  );
}
