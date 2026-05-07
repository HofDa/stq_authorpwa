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
  variant?: 'compact' | 'wizard';
  onApply: (interaction: RrrInteraction) => void;
}

const REPLACE_PROMPT =
  'Das ersetzt die aktuellen Bausteine und die Lösungsregel. Fortfahren?';

export function RrrTemplatePicker({
  hasExistingInteraction,
  confirmReplace,
  variant = 'compact',
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

  function applyTemplate(template: RrrTemplate) {
    setError(null);
    const validation = RrrInteractionSchema.safeParse(template.interaction);
    if (!validation.success) {
      setError(
        `Vorlage "${template.label}" ist ungültig. ${
          validation.error.issues[0]?.message ??
          'Details stehen in der technischen Vorschau.'
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

  function applySelected() {
    applyTemplate(selected);
  }

  if (variant === 'wizard') {
    return (
      <div className="stq-rrr-template-wizard">
        <div className="stq-rrr-template-wizard__header">
          <strong>Mit Vorlage starten</strong>
          <span>Wähle einen einfachen Rätselablauf als Ausgangspunkt.</span>
        </div>
        <div className="stq-rrr-template-wizard__grid">
          {RRR_TEMPLATES.map((template) => (
            <button
              key={template.id}
              type="button"
              className="stq-rrr-template-wizard__card"
              onClick={() => applyTemplate(template)}
            >
              <strong>{template.label}</strong>
              <span>{template.description}</span>
            </button>
          ))}
        </div>
        {error && (
          <p className="stq-rrr-editor__template-error" role="alert">
            {error}
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="stq-rrr-editor__template">
      <label className="stq-edit-panel-label" htmlFor="rrr-template-picker">
        Vorlage wählen
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
          Übernehmen
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
