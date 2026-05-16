import {
  buildMorseSymbolFeedbackPattern,
  normalizeMorseSymbolPattern,
} from '@/rrr/feedbackPatterns';
import { playSensoryFeedback } from './sensoryFeedback';

interface MorseCodeInputProps {
  value: string;
  expectedPattern: string;
  shortAudioUrl?: string;
  longAudioUrl?: string;
  onValueChange: (value: string) => void;
  title: string;
  eyebrow: string;
  playLabel: string;
  shortLabel: string;
  longLabel: string;
  clearLabel: string;
  submitLabel?: string;
  onSubmit?: () => void;
  error?: boolean;
  disabled?: boolean;
}

export function MorseCodeInput({
  value,
  expectedPattern,
  shortAudioUrl,
  longAudioUrl,
  onValueChange,
  title,
  eyebrow,
  playLabel,
  shortLabel,
  longLabel,
  clearLabel,
  submitLabel,
  onSubmit,
  error = false,
  disabled = false,
}: MorseCodeInputProps) {
  const normalizedValue = normalizeMorseSymbolPattern(value);
  const normalizedExpected = normalizeMorseSymbolPattern(expectedPattern);
  const canSubmit = Boolean(onSubmit) && normalizedValue.length > 0 && !disabled;
  const canPlay = normalizedExpected.length > 0 && !disabled;

  function appendSymbol(symbol: '.' | '-') {
    const nextValue = normalizeMorseSymbolPattern(`${normalizedValue}${symbol}`);
    onValueChange(nextValue);
    void playSymbolFeedback(symbol, shortAudioUrl, longAudioUrl);
  }

  function playChallenge() {
    if (!canPlay) return;
    void playMorseSequence(normalizedExpected, shortAudioUrl, longAudioUrl);
  }

  return (
    <form
      className={`stq-rrr-morse-code${error ? ' stq-rrr-morse-code--error' : ''}`}
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) onSubmit?.();
      }}
    >
      <div className="stq-rrr-morse-code__header">
        <div>
          <span>{eyebrow}</span>
          <strong>{title}</strong>
        </div>
        <span className="stq-rrr-morse-code__badge" aria-hidden>
          .-
        </span>
      </div>

      <button
        type="button"
        className="stq-rrr-morse-code__play"
        onClick={playChallenge}
        disabled={!canPlay}
      >
        {playLabel}
      </button>

      <div className="stq-rrr-morse-code__sequence" aria-live="polite">
        {normalizedValue ? (
          normalizedValue.split('').map((symbol, index) => (
            <span key={`${symbol}-${index}`}>{symbol}</span>
          ))
        ) : (
          <em>...</em>
        )}
      </div>

      <div className="stq-rrr-morse-code__keys">
        <button
          type="button"
          className="stq-rrr-morse-code__key"
          onClick={() => appendSymbol('.')}
          disabled={disabled}
        >
          <span>.</span>
          {shortLabel}
        </button>
        <button
          type="button"
          className="stq-rrr-morse-code__key stq-rrr-morse-code__key--long"
          onClick={() => appendSymbol('-')}
          disabled={disabled}
        >
          <span>-</span>
          {longLabel}
        </button>
      </div>

      <div className="stq-rrr-morse-code__actions">
        <button
          type="button"
          className="stq-rrr-editor__button stq-rrr-editor__button--ghost"
          onClick={() => onValueChange('')}
          disabled={!normalizedValue || disabled}
        >
          {clearLabel}
        </button>
        {submitLabel ? (
          <button
            type="submit"
            className="stq-rrr-morse-code__submit"
            disabled={!canSubmit}
          >
            {submitLabel}
          </button>
        ) : null}
      </div>
    </form>
  );
}

async function playMorseSequence(
  pattern: string,
  shortAudioUrl: string | undefined,
  longAudioUrl: string | undefined,
) {
  const feedbackPattern = buildMorseSymbolFeedbackPattern(pattern);
  if (!shortAudioUrl && !longAudioUrl) {
    playSensoryFeedback(feedbackPattern);
    return;
  }

  playSensoryFeedback(feedbackPattern, { audio: false });
  for (const symbol of pattern) {
    await playSymbolAudio(symbol === '.' ? shortAudioUrl : longAudioUrl);
  }
}

async function playSymbolFeedback(
  symbol: '.' | '-',
  shortAudioUrl: string | undefined,
  longAudioUrl: string | undefined,
) {
  const audioUrl = symbol === '.' ? shortAudioUrl : longAudioUrl;
  const feedbackPattern = buildMorseSymbolFeedbackPattern(symbol);
  if (!audioUrl) {
    playSensoryFeedback(feedbackPattern);
    return;
  }

  playSensoryFeedback(feedbackPattern, { audio: false });
  await playSymbolAudio(audioUrl);
}

function playSymbolAudio(src: string | undefined): Promise<void> {
  if (!src || typeof Audio === 'undefined') {
    return Promise.resolve();
  }

  return new Promise((resolve) => {
    const audio = new Audio(src);
    audio.addEventListener('ended', () => resolve(), { once: true });
    audio.addEventListener('error', () => resolve(), { once: true });
    void audio.play().catch(() => resolve());
  });
}
