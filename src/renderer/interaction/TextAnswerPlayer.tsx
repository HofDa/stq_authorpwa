import { useState } from 'react';
import { ModuleFeedback } from './ModuleFeedback';

interface TextAnswerPlayerProps {
  acceptedAnswers: string[];
  submitLabel: string;
  onCorrect: () => void;
  disabled?: boolean;
}

export function TextAnswerPlayer({
  acceptedAnswers,
  submitLabel,
  onCorrect,
  disabled = false,
}: TextAnswerPlayerProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);

  const normalizedAnswers = acceptedAnswers
    .map((answer) => answer.trim().toLocaleLowerCase())
    .filter(Boolean);
  const canSubmit = value.trim().length > 0 && !disabled;

  function submit() {
    if (disabled) return;
    const normalized = value.trim().toLocaleLowerCase();
    const correct =
      normalizedAnswers.length === 0 || normalizedAnswers.includes(normalized);
    if (correct) {
      setError(false);
      onCorrect();
      return;
    }
    setError(true);
  }

  return (
    <div className="stq-riddle-text-answer">
      <input
        className={`stq-riddle-text-answer__field${
          error ? ' stq-riddle-text-answer__field--error' : ''
        }`}
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          if (error) setError(false);
        }}
        onKeyDown={(event) => {
          if (event.key === 'Enter' && canSubmit) {
            event.preventDefault();
            submit();
          }
        }}
        disabled={disabled}
        aria-invalid={error || undefined}
      />
      <button
        type="button"
        className="stq-riddle-text-answer__submit"
        disabled={!canSubmit}
        onClick={submit}
      >
        {submitLabel}
      </button>
      <ModuleFeedback
        kind={error ? 'error' : 'idle'}
        message={error ? 'Nicht ganz — versuch es noch einmal' : undefined}
      />
    </div>
  );
}
