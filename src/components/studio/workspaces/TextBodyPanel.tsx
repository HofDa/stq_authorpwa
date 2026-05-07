import { useEffect, useState } from 'react';
import type { ContentBlock } from '@/schema';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import { Icon } from '../Icon';

interface Props {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  placeholder: string;
  blockType?: 'paragraph' | 'line';
}

export function TextBodyPanel({
  blocks,
  onChange,
  placeholder,
  blockType = 'paragraph',
}: Props) {
  const { t } = useEditorLanguage();
  const [entries, setEntries] = useState(() => {
    const textEntries = blocksToTextEntries(blocks);
    return textEntries.length > 0 ? textEntries : [''];
  });

  useEffect(() => {
    const textEntries = blocksToTextEntries(blocks);
    setEntries(textEntries.length > 0 ? textEntries : ['']);
  }, [blocks]);

  function commit(nextEntries: string[]) {
    setEntries(nextEntries.length > 0 ? nextEntries : ['']);
    onChange(
      nextEntries
        .map((text) => text.trim())
        .filter(Boolean)
        .map((text) => ({ type: blockType, text })),
    );
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
    <div className="stq-textbody-panel">
      <div className="stq-textbody-panel-heading">
        {t('studio.paragraphsOnePerEntry')}
      </div>
      <div className="stq-textbody-list">
        {entries.map((entry, index) => (
          <div className="stq-textbody-row" key={`${index}-${entries.length}`}>
            <div className="stq-textbody-index">{index + 1}</div>
            <textarea
              className="stq-textbody-textarea"
              value={entry}
              placeholder={placeholder}
              rows={3}
              onChange={(e) => setEntry(index, e.target.value)}
            />
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
    </div>
  );
}

function blocksToTextEntries(blocks: ContentBlock[]): string[] {
  return blocks
    .map((block) => ('text' in block ? block.text : ''))
    .filter(Boolean)
    .map((text) => text.trim());
}
