import { useEffect, useState } from 'react';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import { Icon } from '../Icon';

interface EditableTextEntryListProps {
  sourceEntries: string[];
  onCommit: (entries: string[]) => void;
  heading: string;
  placeholder: string | string[];
  inputMode?: 'textarea' | 'input';
  fixedEntryCount?: number;
  maxEntries?: number;
  rows?: number;
  rowClassName?: string;
}

export function EditableTextEntryList({
  sourceEntries,
  onCommit,
  heading,
  placeholder,
  inputMode = 'textarea',
  fixedEntryCount,
  maxEntries,
  rows = 3,
  rowClassName,
}: EditableTextEntryListProps) {
  const { t } = useEditorLanguage();
  const [entries, setEntries] = useState(() =>
    normalizeEntries(sourceEntries, fixedEntryCount),
  );

  useEffect(() => {
    setEntries(normalizeEntries(sourceEntries, fixedEntryCount));
  }, [fixedEntryCount, sourceEntries]);

  function commit(nextEntries: string[]) {
    setEntries(normalizeEntries(nextEntries, fixedEntryCount));
    onCommit(nextEntries.map((text) => text.trim()).filter(Boolean));
  }

  function setEntry(index: number, value: string) {
    const next = entries.slice();
    next[index] = value;
    commit(next);
  }

  function addEntry() {
    if (maxEntries !== undefined && entries.length >= maxEntries) {
      return;
    }
    setEntries([...entries, '']);
  }

  function deleteEntry(index: number) {
    if (fixedEntryCount !== undefined) {
      const next = entries.slice();
      next[index] = '';
      commit(next);
      return;
    }
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
                placeholder={resolvePlaceholder(placeholder, index)}
                onChange={(event) => setEntry(index, event.target.value)}
              />
            ) : (
              <textarea
                className="stq-textbody-textarea"
                value={entry}
                placeholder={resolvePlaceholder(placeholder, index)}
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
      {fixedEntryCount === undefined && (
        <button
          type="button"
          className="stq-textbody-add"
          disabled={maxEntries !== undefined && entries.length >= maxEntries}
          onClick={addEntry}
        >
          <Icon name="plus" size={13} />
          {t('studio.addEntry')}
        </button>
      )}
    </>
  );
}

function resolvePlaceholder(placeholder: string | string[], index: number): string {
  if (Array.isArray(placeholder)) {
    return placeholder[index] ?? placeholder[placeholder.length - 1] ?? '';
  }
  return placeholder;
}

function normalizeEntries(entries: string[], fixedEntryCount?: number): string[] {
  if (fixedEntryCount !== undefined) {
    return [...entries, ...Array<string>(fixedEntryCount).fill('')].slice(
      0,
      fixedEntryCount,
    );
  }
  return entries.length > 0 ? entries : [''];
}
