import type { ContentBlock } from '@/schema';
import type { ReactNode } from 'react';
import { ContentSectionRenderer } from './ContentSectionRenderer';
import { splitHeading } from './splitHeading';
import { Icon } from '@/components/studio/Icon';

interface InlineEditable {
  label: string;
  active?: boolean;
  selected?: boolean;
  onSelect?: () => void;
  onEdit: () => void;
}

interface Props {
  blocks: ContentBlock[];
  fallbackTitle: string;
  leadImageUrl?: string;
  leadImagePlaceholder?: boolean;
  centeredLines?: boolean;
  headingAction?: ReactNode;
  headingEditable?: InlineEditable;
  bodyEditable?: InlineEditable;
}

export function StoryText({
  blocks,
  fallbackTitle,
  leadImageUrl,
  leadImagePlaceholder = false,
  centeredLines,
  headingAction,
  headingEditable,
  bodyEditable,
}: Props) {
  const { title, body } = splitHeading(blocks, fallbackTitle);
  const hasBodyText = body.some(
    (block) => block.type !== 'image' && block.text.trim().length > 0,
  );

  function activateEditable(editable: InlineEditable) {
    if (editable.onSelect && !editable.selected && !editable.active) {
      editable.onSelect();
      return;
    }

    editable.onEdit();
  }

  const headingRow = (
    <div
      className={[
        'stq-riddle-heading-row',
        headingAction ? 'stq-riddle-heading-row--with-action' : '',
      ].join(' ')}
    >
      <h2 className="stq-riddle-heading">{title}</h2>
      {headingAction}
    </div>
  );

  return (
    <section className="stq-riddle-section">
      {headingEditable ? (
        <div
          className={`stq-editable-region${headingEditable.active ? ' stq-editable-region--active' : ''}${
            headingEditable.selected ? ' stq-editable-region--selected' : ''
          }`}
          role="button"
          tabIndex={0}
          aria-label={headingEditable.label}
          aria-pressed={headingEditable.active || headingEditable.selected || undefined}
          onClick={(event) => {
            event.stopPropagation();
            activateEditable(headingEditable);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              event.stopPropagation();
              activateEditable(headingEditable);
            }
          }}
        >
          {headingRow}
          <span className="stq-editable-pen" aria-hidden>
            <Icon name="pen" size={12} />
          </span>
        </div>
      ) : (
        headingRow
      )}
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
      {bodyEditable ? (
        <div
          className={`stq-editable-region${bodyEditable.active ? ' stq-editable-region--active' : ''}${
            bodyEditable.selected ? ' stq-editable-region--selected' : ''
          }`}
          role="button"
          tabIndex={0}
          aria-label={bodyEditable.label}
          aria-pressed={bodyEditable.active || bodyEditable.selected || undefined}
          onClick={(event) => {
            event.stopPropagation();
            activateEditable(bodyEditable);
          }}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              event.stopPropagation();
              activateEditable(bodyEditable);
            }
          }}
        >
          {hasBodyText ? (
            <ContentSectionRenderer blocks={body} centeredLines={centeredLines} />
          ) : (
            <LoremPlaceholder />
          )}
          <span className="stq-editable-pen" aria-hidden>
            <Icon name="pen" size={12} />
          </span>
        </div>
      ) : hasBodyText ? (
        <ContentSectionRenderer blocks={body} centeredLines={centeredLines} />
      ) : (
        <LoremPlaceholder />
      )}
    </section>
  );
}

const LOREM_PARAGRAPHS = [
  'Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua.',
  'Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat.',
  'Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur.',
];

export function LoremPlaceholder() {
  return (
    <div className="stq-story-lorem">
      {LOREM_PARAGRAPHS.map((text, index) => (
        <p key={index}>{text}</p>
      ))}
    </div>
  );
}
