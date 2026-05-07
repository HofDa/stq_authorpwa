import { useMemo, useState } from 'react';
import {
  RRR_TEMPLATES,
  getRrrTemplate,
  type RrrInteraction,
  type RrrTemplate,
  type RrrTemplateId,
} from '@/rrr';
import { RrrInteractionSchema } from '@/schema';

interface Props {
  /** True when the editor already has author-entered content. */
  hasExistingInteraction: boolean;
  /** Confirm prompt before overwriting; defaults to window.confirm. */
  confirmReplace?: (message: string) => boolean;
  onApply: (interaction: RrrInteraction) => void;
}

const REPLACE_PROMPT =
  'This replaces the current RRR modules and condition. Continue?';

export function RrrTemplatePicker({
  hasExistingInteraction,
  confirmReplace,
  onApply,
}: Props) {
  const [selectedId, setSelectedId] = useState<RrrTemplateId>(
    RRR_TEMPLATES[0].id,
  );
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo<RrrTemplate>(
    () => getRrrTemplate(selectedId),
    [selectedId],
  );

  function applySelected() {
    setError(null);
    const validation = RrrInteractionSchema.safeParse(selected.interaction);
    if (!validation.success) {
      setError(
        `Template "${selected.label}" failed validation. ${
          validation.error.issues[0]?.message ?? 'See JSON preview for details.'
        }`,
      );
      return;
    }

    if (hasExistingInteraction) {
      const confirmFn = confirmReplace ?? window.confirm.bind(window);
      if (!confirmFn(REPLACE_PROMPT)) return;
    }

    // Deep clone so editor mutations don't leak back into the template constant.
    onApply(JSON.parse(JSON.stringify(validation.data)) as RrrInteraction);
  }

  return (
    <div className="stq-rrr-editor__template">
      <label className="stq-edit-panel-label" htmlFor="rrr-template-picker">
        Start from template
      </label>
      <div className="stq-rrr-editor__template-row">
        <select
          id="rrr-template-picker"
          className="stq-rrr-editor__select"
          value={selectedId}
          onChange={(event) => {
            setSelectedId(event.target.value as RrrTemplateId);
            setError(null);
          }}
        >
          {RRR_TEMPLATES.map((template) => (
            <option key={template.id} value={template.id}>
              {template.label}
            </option>
          ))}
        </select>
        <button
          type="button"
          className="stq-rrr-editor__button stq-rrr-editor__button--ghost"
          onClick={applySelected}
        >
          Apply
        </button>
      </div>
      <p className="stq-rrr-editor__template-description">
        {selected.description}
      </p>
      {error && (
        <p className="stq-rrr-editor__template-error" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
