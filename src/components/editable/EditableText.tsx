import { useEffect, useRef, useState } from 'react';
import { Icon } from '@/components/studio/Icon';

interface Props {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  className?: string;
  multiline?: boolean;
  as?: 'h1' | 'h2' | 'h3' | 'p';
  editSignal?: number;
}

/**
 * Inline-editable text. Renders as the chosen element with app typography;
 * swaps to a sized textarea/input on click, commits on blur.
 */
export function EditableText({
  value,
  onChange,
  placeholder,
  className = '',
  multiline = false,
  as = 'p',
  editSignal = 0,
}: Props) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  const ref = useRef<HTMLTextAreaElement | HTMLInputElement | null>(null);

  useEffect(() => setDraft(value), [value]);

  useEffect(() => {
    if (editing) ref.current?.focus();
  }, [editing]);

  useEffect(() => {
    if (editSignal > 0) setEditing(true);
  }, [editSignal]);

  function commit() {
    setEditing(false);
    if (draft !== value) onChange(draft);
  }

  const shared =
    'w-full bg-transparent outline-none ring-1 ring-primary/40 rounded-sm ' +
    'px-1 -mx-1';

  if (editing) {
    return multiline ? (
      <textarea
        ref={ref as React.RefObject<HTMLTextAreaElement>}
        className={[shared, className, 'min-h-[4.5rem] resize-y'].join(' ')}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        placeholder={placeholder}
      />
    ) : (
      <input
        ref={ref as React.RefObject<HTMLInputElement>}
        className={[shared, className].join(' ')}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onBlur={commit}
        onKeyDown={(e) => {
          if (e.key === 'Enter') commit();
        }}
        placeholder={placeholder}
      />
    );
  }

  const Tag = as as keyof JSX.IntrinsicElements;
  const displayText = value || placeholder || '';
  const displayClass = [
    'stq-editable cursor-text',
    value ? '' : 'italic text-disabled',
    className,
  ].join(' ');

  return (
    <span className="stq-editable-wrap">
      <Tag onClick={() => setEditing(true)} className={displayClass}>
        {displayText || '\u00A0'}
      </Tag>
      <button
        type="button"
        className="stq-editable-pencil"
        aria-label="Edit"
        onClick={(e) => {
          e.stopPropagation();
          setEditing(true);
        }}
      >
        <Icon name="edit" size={12} />
      </button>
    </span>
  );
}
