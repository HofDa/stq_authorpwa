import { useEffect, useState } from 'react';
import { RrrInteractionSchema } from '@/schema';
import type { RrrInteraction } from '@/rrr';

interface RrrInteractionJsonEditorProps {
  interaction: RrrInteraction;
  onApply: (interaction: RrrInteraction) => void;
}

export function RrrInteractionJsonEditor({
  interaction,
  onApply,
}: RrrInteractionJsonEditorProps) {
  const jsonPreview = JSON.stringify(interaction, null, 2);
  const [draftJson, setDraftJson] = useState(jsonPreview);
  const [status, setStatus] = useState<
    'idle' | 'copied' | 'copy-failed' | 'applied' | 'invalid'
  >('idle');
  const [errors, setErrors] = useState<string[]>([]);

  useEffect(() => {
    setDraftJson(jsonPreview);
    setErrors([]);
    setStatus('idle');
  }, [jsonPreview]);

  async function copyJson() {
    if (!navigator.clipboard) {
      setStatus('copy-failed');
      return;
    }
    try {
      await navigator.clipboard.writeText(jsonPreview);
      setStatus('copied');
    } catch {
      setStatus('copy-failed');
    }
  }

  function applyJson() {
    const parsed = parseInteractionJson(draftJson);
    if (!parsed.success) {
      setErrors(parsed.errors);
      setStatus('invalid');
      return;
    }

    setErrors([]);
    setStatus('applied');
    onApply(parsed.interaction);
  }

  return (
    <section className="stq-rrr-json-editor">
      <div className="stq-rrr-json-editor__header">
        <div>
          <h4>Interaction JSON</h4>
          <p>Paste a full interaction object and validate it before applying.</p>
        </div>
        <button
          type="button"
          className="stq-rrr-editor__button stq-rrr-editor__button--ghost"
          onClick={copyJson}
        >
          Copy JSON
        </button>
      </div>

      <textarea
        className="stq-rrr-json-editor__textarea"
        spellCheck={false}
        value={draftJson}
        onChange={(event) => {
          setDraftJson(event.target.value);
          setErrors([]);
          setStatus('idle');
        }}
        aria-label="Interaction JSON"
      />

      <div className="stq-rrr-json-editor__actions">
        <button
          type="button"
          className="stq-rrr-editor__button"
          onClick={applyJson}
        >
          Apply JSON
        </button>
        {status !== 'idle' && (
          <span className="stq-rrr-json-editor__status">
            {getStatusLabel(status)}
          </span>
        )}
      </div>

      {errors.length > 0 && (
        <ul className="stq-rrr-json-editor__errors">
          {errors.map((error) => (
            <li key={error}>{error}</li>
          ))}
        </ul>
      )}
    </section>
  );
}

function parseInteractionJson(
  value: string,
):
  | { success: true; interaction: RrrInteraction }
  | { success: false; errors: string[] } {
  let parsed: unknown;
  try {
    parsed = JSON.parse(value);
  } catch (error) {
    return {
      success: false,
      errors: [
        error instanceof Error ? `Invalid JSON: ${error.message}` : 'Invalid JSON.',
      ],
    };
  }

  const validation = RrrInteractionSchema.safeParse(parsed);
  if (!validation.success) {
    return {
      success: false,
      errors: validation.error.issues.slice(0, 5).map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
        return `${path}${issue.message}`;
      }),
    };
  }

  return {
    success: true,
    interaction: validation.data,
  };
}

function getStatusLabel(
  status: 'copied' | 'copy-failed' | 'applied' | 'invalid',
): string {
  switch (status) {
    case 'copied':
      return 'Copied';
    case 'copy-failed':
      return 'Copy unavailable';
    case 'applied':
      return 'Applied';
    case 'invalid':
      return 'Invalid JSON';
  }
}
