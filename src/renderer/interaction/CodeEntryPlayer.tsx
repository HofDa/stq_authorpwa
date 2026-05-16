import { useState } from 'react';
import { CodeEntryVisual } from '@/components/rrr-runtime/CodeEntryVisual';
import { ModuleFeedback } from '@/components/rrr-runtime/ModuleFeedback';

type CodeEntryVariant = 'code_word' | 'sequential_code';

const COPY = {
  code_word: {
    eyebrow: 'Codewort',
    title: 'Codewort eingeben',
    placeholder: 'Gefundenes Codewort',
    error: 'Das Codewort passt nicht.',
  },
  sequential_code: {
    eyebrow: 'Sammelcode',
    title: 'Gesammelten Code eingeben',
    placeholder: 'Gesammelter Code',
    error: 'Der gesammelte Code passt nicht.',
  },
} as const;

interface CodeEntryPlayerProps {
  expectedCode: string;
  fallbackAnswers?: string[];
  caseSensitive?: boolean;
  variant: CodeEntryVariant;
  submitLabel: string;
  onCorrect: () => void;
  disabled?: boolean;
}

export function CodeEntryPlayer({
  expectedCode,
  fallbackAnswers = [],
  caseSensitive = false,
  variant,
  submitLabel,
  onCorrect,
  disabled = false,
}: CodeEntryPlayerProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const copy = COPY[variant];
  const acceptedCodes = [expectedCode, ...fallbackAnswers]
    .map((code) => code.trim())
    .filter(Boolean);
  const canSubmit = value.trim().length > 0 && !disabled;

  function submit() {
    if (disabled) return;
    const correct =
      acceptedCodes.length === 0 ||
      acceptedCodes.some((code) => codesMatch(value, code, caseSensitive));
    if (correct) {
      setError(false);
      onCorrect();
      return;
    }
    setError(true);
  }

  return (
    <div className="stq-riddle-code-entry">
      <CodeEntryVisual
        value={value}
        onValueChange={(nextValue) => {
          setValue(nextValue);
          if (error) setError(false);
        }}
        title={copy.title}
        eyebrow={copy.eyebrow}
        placeholder={copy.placeholder}
        disabled={disabled}
        error={error}
        submitLabel={submitLabel}
        onSubmit={canSubmit ? submit : undefined}
      />
      <ModuleFeedback
        kind={error ? 'error' : 'idle'}
        message={error ? copy.error : undefined}
        sensoryFeedback={
          error ? { playKey: `${variant}-error-${value.trim()}` } : false
        }
      />
    </div>
  );
}

function codesMatch(actual: string, expected: string, caseSensitive: boolean) {
  if (caseSensitive) {
    return actual.trim() === expected.trim();
  }
  return actual.trim().toLocaleLowerCase() === expected.trim().toLocaleLowerCase();
}
