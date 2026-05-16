import { useState } from 'react';
import { ModuleFeedback } from '@/components/rrr-runtime/ModuleFeedback';
import { TextAnswerVisual } from '@/components/rrr-runtime/TextAnswerVisual';

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
      <TextAnswerVisual
        value={value}
        onValueChange={(nextValue) => {
          setValue(nextValue);
          if (error) setError(false);
        }}
        title="Antwort eingeben"
        eyebrow="Textantwort"
        placeholder="Deine Antwort"
        disabled={disabled}
        error={error}
        submitLabel={submitLabel}
        onSubmit={canSubmit ? submit : undefined}
      />
      <ModuleFeedback
        kind={error ? 'error' : 'idle'}
        message={error ? 'Nicht ganz — versuch es noch einmal' : undefined}
        sensoryFeedback={
          error ? { playKey: `text-error-${value.trim()}` } : false
        }
      />
    </div>
  );
}
