import { useState } from 'react';
import { ModuleFeedback } from '@/components/rrr-runtime/ModuleFeedback';
import { MorseCodeInput } from '@/components/rrr-runtime/MorseCodeInput';
import { normalizeMorseSymbolPattern } from '@/rrr/feedbackPatterns';

interface MorseCodePlayerProps {
  expectedPattern: string;
  shortAudioUrl: string;
  longAudioUrl: string;
  submitLabel: string;
  onCorrect: () => void;
  disabled?: boolean;
}

export function MorseCodePlayer({
  expectedPattern,
  shortAudioUrl,
  longAudioUrl,
  submitLabel,
  onCorrect,
  disabled = false,
}: MorseCodePlayerProps) {
  const [value, setValue] = useState('');
  const [error, setError] = useState(false);
  const normalizedExpected = normalizeMorseSymbolPattern(expectedPattern);
  const normalizedValue = normalizeMorseSymbolPattern(value);
  const canSubmit = normalizedValue.length > 0 && !disabled;

  function submit() {
    if (disabled) return;
    if (normalizedExpected && normalizedValue === normalizedExpected) {
      setError(false);
      onCorrect();
      return;
    }
    setError(true);
  }

  return (
    <div className="stq-riddle-code-entry">
      <MorseCodeInput
        value={value}
        expectedPattern={expectedPattern}
        shortAudioUrl={shortAudioUrl}
        longAudioUrl={longAudioUrl}
        onValueChange={(nextValue) => {
          setValue(nextValue);
          if (error) setError(false);
        }}
        title="Morsecode nachbauen"
        eyebrow="Morsecode"
        playLabel="Code abspielen"
        shortLabel="Kurz"
        longLabel="Lang"
        clearLabel="Leeren"
        submitLabel={submitLabel}
        onSubmit={canSubmit ? submit : undefined}
        error={error}
        disabled={disabled}
      />
      <ModuleFeedback
        kind={error ? 'error' : 'idle'}
        message={
          error
            ? normalizedExpected
              ? 'Der Morsecode passt nicht.'
              : 'Für diese Station ist noch kein Morsecode hinterlegt.'
            : undefined
        }
        sensoryFeedback={
          error ? { playKey: `morse-error-${normalizedValue}` } : false
        }
      />
    </div>
  );
}
