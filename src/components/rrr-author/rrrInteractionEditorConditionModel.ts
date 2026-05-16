import type { EditorTextKey } from '@/i18n/editorLanguage';
import type { RrrFlatConditionType } from '@/rrr';
import type { EditorT } from './rrrInteractionEditorFormat';

export type FlatConditionType = RrrFlatConditionType;

export const CONDITION_TYPE_LABEL_KEYS: Record<
  FlatConditionType,
  EditorTextKey
> = {
  none: 'rrr.editor.condition.none',
  module: 'rrr.editor.condition.module',
  sequence: 'rrr.editor.condition.sequence',
  all_of: 'rrr.editor.condition.allOf',
  any_of: 'rrr.editor.condition.anyOf',
};

export function getConditionTypeLabel(
  type: FlatConditionType,
  t: EditorT,
): string {
  return t(CONDITION_TYPE_LABEL_KEYS[type]);
}
