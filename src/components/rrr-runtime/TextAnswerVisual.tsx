interface TextAnswerVisualProps {
  value: string;
  onValueChange: (value: string) => void;
  title: string;
  eyebrow: string;
  placeholder: string;
  disabled?: boolean;
  error?: boolean;
  helperText?: string;
  submitLabel?: string;
  onSubmit?: () => void;
}

export function TextAnswerVisual({
  value,
  onValueChange,
  title,
  eyebrow,
  placeholder,
  disabled = false,
  error = false,
  helperText,
  submitLabel,
  onSubmit,
}: TextAnswerVisualProps) {
  const canSubmit = Boolean(onSubmit) && value.trim().length > 0 && !disabled;

  return (
    <form
      className={`stq-rrr-text-answer-visual${
        error ? ' stq-rrr-text-answer-visual--error' : ''
      }`}
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) {
          onSubmit?.();
        }
      }}
    >
      <div className="stq-rrr-text-answer-visual__header">
        <div>
          <span>{eyebrow}</span>
          <strong>{title}</strong>
        </div>
        <span className="stq-rrr-text-answer-visual__badge" aria-hidden>
          Aa
        </span>
      </div>

      <label className="stq-rrr-text-answer-visual__field">
        <span className="stq-rrr-text-answer-visual__field-label">
          {placeholder}
        </span>
        <input
          type="text"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          disabled={disabled}
          aria-invalid={error || undefined}
        />
      </label>

      {helperText ? (
        <small className="stq-rrr-text-answer-visual__helper">
          {helperText}
        </small>
      ) : null}

      {submitLabel ? (
        <button
          type="submit"
          className="stq-rrr-text-answer-visual__submit"
          disabled={!canSubmit}
        >
          {submitLabel}
        </button>
      ) : null}
    </form>
  );
}
