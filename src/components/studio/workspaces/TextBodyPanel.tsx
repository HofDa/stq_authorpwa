import { useMemo } from 'react';
import type { ContentBlock } from '@/schema';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import { EditableTextEntryList } from './EditableTextEntryList';

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
  const sourceEntries = useMemo(
    () => blocksToTextEntries(blocks, blockType),
    [blockType, blocks],
  );

  return (
    <div className="stq-textbody-panel">
      <EditableTextEntryList
        sourceEntries={sourceEntries}
        onCommit={(entries) =>
          onChange(entries.map((text) => ({ type: blockType, text })))
        }
        heading={t('studio.paragraphsOnePerEntry')}
        placeholder={placeholder}
      />
    </div>
  );
}

function blocksToTextEntries(
  blocks: ContentBlock[],
  blockType: 'paragraph' | 'line',
): string[] {
  return blocks
    .filter((block) =>
      blockType === 'paragraph'
        ? block.type === 'paragraph' || block.type === 'paragraph_styled'
        : block.type === blockType,
    )
    .map((block) => ('text' in block ? block.text : ''))
    .filter(Boolean)
    .map((text) => text.trim());
}
