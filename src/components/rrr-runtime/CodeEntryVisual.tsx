interface CodeEntryVisualProps {
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

export function CodeEntryVisual({
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
}: CodeEntryVisualProps) {
  const canSubmit = Boolean(onSubmit) && value.trim().length > 0 && !disabled;

  return (
    <form
      className={`stq-rrr-code-entry${
        error ? ' stq-rrr-code-entry--error' : ''
      }`}
      onSubmit={(event) => {
        event.preventDefault();
        if (canSubmit) {
          onSubmit?.();
        }
      }}
    >
      <div className="stq-rrr-code-entry__header">
        <div>
          <span>{eyebrow}</span>
          <strong>{title}</strong>
        </div>
        <span className="stq-rrr-code-entry__badge" aria-hidden>
          #1
        </span>
      </div>

      <label className="stq-rrr-code-entry__field">
        <span>{placeholder}</span>
        <input
          type="text"
          value={value}
          onChange={(event) => onValueChange(event.target.value)}
          disabled={disabled}
          aria-invalid={error || undefined}
          autoCapitalize="characters"
          spellCheck={false}
        />
      </label>

      {helperText ? (
        <small className="stq-rrr-code-entry__helper">{helperText}</small>
      ) : null}

      {submitLabel ? (
        <button
          type="submit"
          className="stq-rrr-code-entry__submit"
          disabled={!canSubmit}
        >
          {submitLabel}
        </button>
      ) : null}
    </form>
  );
}
