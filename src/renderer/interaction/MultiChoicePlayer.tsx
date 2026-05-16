import { useMemo, useState } from 'react';
import { ModuleFeedback } from '@/components/rrr-runtime/ModuleFeedback';

interface MultiChoicePlayerProps {
  question: string;
  options: string[];
  correctOptionIndexes: number[];
  allowMultiple: boolean;
  submitLabel: string;
  onCorrect: () => void;
  disabled?: boolean;
}

export function MultiChoicePlayer({
  question,
  options,
  correctOptionIndexes,
  allowMultiple,
  submitLabel,
  onCorrect,
  disabled = false,
}: MultiChoicePlayerProps) {
  const visibleOptions = options
    .map((option, index) => ({ option: option.trim(), index }))
    .filter(({ option }) => option.length > 0);
  const [selectedIndexes, setSelectedIndexes] = useState<number[]>([]);
  const [error, setError] = useState(false);
  const correctSet = useMemo(
    () => new Set(correctOptionIndexes),
    [correctOptionIndexes],
  );
  const canSubmit = selectedIndexes.length > 0 && !disabled;

  function toggleIndex(index: number, checked: boolean) {
    setError(false);
    if (!allowMultiple) {
      setSelectedIndexes([index]);
      return;
    }
    setSelectedIndexes((current) =>
      checked
        ? [...new Set([...current, index])]
        : current.filter((entry) => entry !== index),
    );
  }

  function submit() {
    if (disabled) return;
    const selectedSet = new Set(selectedIndexes);
    const correct =
      correctSet.size > 0 &&
      selectedSet.size === correctSet.size &&
      selectedIndexes.every((index) => correctSet.has(index));
    if (correct) {
      setError(false);
      onCorrect();
      return;
    }
    setError(true);
  }

  return (
    <div className="stq-riddle-multi-choice">
      <fieldset className="stq-rrr-multi-choice-preview">
        <legend>{question.trim() || 'Auswahlfrage'}</legend>
        {visibleOptions.map(({ option, index }) => (
          <label key={index} className="stq-rrr-check">
            <input
              type={allowMultiple ? 'checkbox' : 'radio'}
              name="stq-riddle-multi-choice"
              checked={selectedIndexes.includes(index)}
              disabled={disabled}
              onChange={(event) => toggleIndex(index, event.target.checked)}
            />
            <span>{option}</span>
          </label>
        ))}
      </fieldset>
      <button
        type="button"
        className="stq-rrr-text-answer-visual__submit"
        disabled={!canSubmit}
        onClick={submit}
      >
        {submitLabel}
      </button>
      <ModuleFeedback
        kind={error ? 'error' : 'idle'}
        message={error ? 'Auswahl passt nicht.' : undefined}
        sensoryFeedback={error ? { playKey: 'multi-choice-error' } : false}
      />
    </div>
  );
}
