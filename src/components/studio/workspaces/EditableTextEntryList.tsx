import { useEffect, useState } from 'react';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import { Icon } from '../Icon';

interface EditableTextEntryListProps {
  sourceEntries: string[];
  onCommit: (entries: string[]) => void;
  heading: string;
  placeholder: string;
  inputMode?: 'textarea' | 'input';
  rows?: number;
  rowClassName?: string;
}

export function EditableTextEntryList({
  sourceEntries,
  onCommit,
  heading,
  placeholder,
  inputMode = 'textarea',
  rows = 3,
  rowClassName,
}: EditableTextEntryListProps) {
  const { t } = useEditorLanguage();
  const [entries, setEntries] = useState(() => normalizeEntries(sourceEntries));

  useEffect(() => {
    setEntries(normalizeEntries(sourceEntries));
  }, [sourceEntries]);

  function commit(nextEntries: string[]) {
    setEntries(normalizeEntries(nextEntries));
    onCommit(nextEntries.map((text) => text.trim()).filter(Boolean));
  }

  function setEntry(index: number, value: string) {
    const next = entries.slice();
    next[index] = value;
    commit(next);
  }

  function addEntry() {
    setEntries([...entries, '']);
  }

  function deleteEntry(index: number) {
    commit(entries.filter((_, i) => i !== index));
  }

  function moveEntry(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= entries.length) return;
    const next = entries.slice();
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  }

  return (
    <>
      <div className="stq-textbody-panel-heading">{heading}</div>
      <div className="stq-textbody-list">
        {entries.map((entry, index) => (
          <div
            className={`stq-textbody-row${rowClassName ? ` ${rowClassName}` : ''}`}
            key={`${index}-${entries.length}`}
          >
            <div className="stq-textbody-index">{index + 1}</div>
            {inputMode === 'input' ? (
              <input
                className="stq-lines-input"
                value={entry}
                placeholder={placeholder}
                onChange={(event) => setEntry(index, event.target.value)}
              />
            ) : (
              <textarea
                className="stq-textbody-textarea"
                value={entry}
                placeholder={placeholder}
                rows={rows}
                onChange={(event) => setEntry(index, event.target.value)}
              />
            )}
            <div className="stq-textbody-actions">
              <button
                type="button"
                aria-label={t('studio.moveUp')}
                disabled={index === 0}
                onClick={() => moveEntry(index, -1)}
              >
                ↑
              </button>
              <button
                type="button"
                aria-label={t('studio.moveDown')}
                disabled={index === entries.length - 1}
                onClick={() => moveEntry(index, 1)}
              >
                ↓
              </button>
              <button
                type="button"
                aria-label={t('studio.deleteEntry')}
                disabled={entries.length === 1 && !entry.trim()}
                onClick={() => deleteEntry(index)}
              >
                <Icon name="trash" size={13} />
              </button>
            </div>
          </div>
        ))}
      </div>
      <button type="button" className="stq-textbody-add" onClick={addEntry}>
        <Icon name="plus" size={13} />
        {t('studio.addEntry')}
      </button>
    </>
  );
}

function normalizeEntries(entries: string[]): string[] {
  return entries.length > 0 ? entries : [''];
}
