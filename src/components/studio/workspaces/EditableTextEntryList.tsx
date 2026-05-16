import { useEffect, useRef, useState, type MutableRefObject } from 'react';
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

interface EditableTextEntryRow {
  id: string;
  text: string;
}

export function EditableTextEntryList({
  sourceEntries,
  onCommit,
  heading,
  placeholder,
  inputMode = 'textarea',
  fixedEntryCount,
  maxEntries,
  rows: textareaRows = 3,
  rowClassName,
}: EditableTextEntryListProps) {
  const { t } = useEditorLanguage();
  const [entryRows, setEntryRows] = useState(() =>
    createInitialRows(normalizeEntries(sourceEntries, fixedEntryCount)),
  );
  const nextRowIdRef = useRef(entryRows.length);
  const rowsRef = useRef(entryRows);

  useEffect(() => {
    const nextRows = createRows(
      normalizeEntries(sourceEntries, fixedEntryCount),
      nextRowIdRef,
      rowsRef.current,
    );
    rowsRef.current = nextRows;
    setEntryRows(nextRows);
  }, [fixedEntryCount, sourceEntries]);

  function setOptimisticRows(nextRows: EditableTextEntryRow[]) {
    rowsRef.current = nextRows;
    setEntryRows(nextRows);
  }

  function commit(nextRows: EditableTextEntryRow[]) {
    const normalizedRows = createRows(
      normalizeEntries(
        nextRows.map((row) => row.text),
        fixedEntryCount,
      ),
      nextRowIdRef,
      nextRows,
    );
    setOptimisticRows(normalizedRows);
    onCommit(normalizedRows.map((row) => row.text.trim()).filter(Boolean));
  }

  function setEntry(index: number, value: string) {
    const next = rowsRef.current.slice();
    next[index] = { ...next[index], text: value };
    commit(next);
  }

  function addEntry() {
    const current = rowsRef.current;
    if (maxEntries !== undefined && current.length >= maxEntries) {
      return;
    }
    setOptimisticRows([...current, createRow('', nextRowIdRef)]);
  }

  function deleteEntry(index: number) {
    const current = rowsRef.current;
    if (fixedEntryCount !== undefined) {
      const next = current.slice();
      next[index] = { ...next[index], text: '' };
      commit(next);
      return;
    }
    commit(current.filter((_, i) => i !== index));
  }

  function moveEntry(index: number, direction: -1 | 1) {
    const target = index + direction;
    const current = rowsRef.current;
    if (target < 0 || target >= current.length) return;
    const next = current.slice();
    [next[index], next[target]] = [next[target], next[index]];
    commit(next);
  }

  return (
    <>
      <div className="stq-textbody-panel-heading">{heading}</div>
      <div className="stq-textbody-list">
        {entryRows.map((row, index) => (
          <div
            className={`stq-textbody-row${rowClassName ? ` ${rowClassName}` : ''}`}
            key={row.id}
          >
            <div className="stq-textbody-index">{index + 1}</div>
            {inputMode === 'input' ? (
              <input
                className="stq-lines-input"
                value={row.text}
                placeholder={resolvePlaceholder(placeholder, index)}
                onChange={(event) => setEntry(index, event.target.value)}
              />
            ) : (
              <textarea
                className="stq-textbody-textarea"
                value={row.text}
                placeholder={resolvePlaceholder(placeholder, index)}
                rows={textareaRows}
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
                disabled={index === entryRows.length - 1}
                onClick={() => moveEntry(index, 1)}
              >
                ↓
              </button>
              <button
                type="button"
                aria-label={t('studio.deleteEntry')}
                disabled={entryRows.length === 1 && !row.text.trim()}
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
          disabled={maxEntries !== undefined && entryRows.length >= maxEntries}
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

function createInitialRows(entries: string[]): EditableTextEntryRow[] {
  return entries.map((text, index) => ({
    id: `text-entry-${index}`,
    text,
  }));
}

function createRows(
  entries: string[],
  nextRowIdRef: MutableRefObject<number>,
  previousRows: EditableTextEntryRow[] = [],
): EditableTextEntryRow[] {
  return entries.map((text, index) => ({
    id: previousRows[index]?.id ?? createRowId(nextRowIdRef),
    text,
  }));
}

function createRow(
  text: string,
  nextRowIdRef: MutableRefObject<number>,
): EditableTextEntryRow {
  return {
    id: createRowId(nextRowIdRef),
    text,
  };
}

function createRowId(nextRowIdRef: MutableRefObject<number>): string {
  const id = `text-entry-${nextRowIdRef.current}`;
  nextRowIdRef.current += 1;
  return id;
}
