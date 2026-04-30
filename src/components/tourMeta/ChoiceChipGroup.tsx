import type { CSSProperties } from 'react';
import type { ChoiceOption } from '@/domain/tourMeta/choices';

interface SingleProps {
  options: ReadonlyArray<ChoiceOption>;
  value: string | undefined;
  onChange: (next: string | undefined) => void;
  /** When true, clicking the active chip clears the selection. */
  allowClear?: boolean;
  /** Optional aria label for the group. */
  ariaLabel?: string;
}

/**
 * Single-select chip group. Used for things like primary audience,
 * walking-difficulty, or default language — anywhere "exactly one" is
 * the intent. Click the active chip to clear if `allowClear` is set.
 */
export function ChoiceChipGroup({
  options,
  value,
  onChange,
  allowClear,
  ariaLabel,
}: SingleProps) {
  return (
    <div role="radiogroup" aria-label={ariaLabel} style={listStyle}>
      {options.map((option) => {
        const active = option.id === value;
        return (
          <button
            key={option.id}
            type="button"
            role="radio"
            aria-checked={active}
            title={option.description}
            onClick={() => {
              if (active && allowClear) onChange(undefined);
              else onChange(option.id);
            }}
            style={chipStyle(active, option.recommended === true)}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

interface MultiProps {
  options: ReadonlyArray<ChoiceOption>;
  /** Selected ids. The component never sorts — caller controls order. */
  value: ReadonlyArray<string>;
  onChange: (next: string[]) => void;
  /** Optional cap. `undefined` means unlimited. */
  max?: number;
  ariaLabel?: string;
}

/**
 * Multi-select chip group. Used for themes, audience, guardrails — any
 * field that's an `id[]`. Selection is toggled by clicking; respects an
 * optional `max` cap (further clicks on unselected chips are no-ops).
 */
export function MultiChoiceTagPicker({
  options,
  value,
  onChange,
  max,
  ariaLabel,
}: MultiProps) {
  const selected = new Set(value);
  return (
    <div
      role="group"
      aria-label={ariaLabel}
      style={listStyle}
    >
      {options.map((option) => {
        const active = selected.has(option.id);
        const blocked = !active && max !== undefined && value.length >= max;
        return (
          <button
            key={option.id}
            type="button"
            role="checkbox"
            aria-checked={active}
            aria-disabled={blocked}
            title={option.description}
            onClick={() => {
              if (blocked) return;
              if (active) {
                onChange(value.filter((id) => id !== option.id));
              } else {
                onChange([...value, option.id]);
              }
            }}
            style={{
              ...chipStyle(active, option.recommended === true),
              opacity: blocked ? 0.5 : 1,
              cursor: blocked ? 'not-allowed' : 'pointer',
            }}
          >
            {option.label}
          </button>
        );
      })}
    </div>
  );
}

const listStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
};

function chipStyle(active: boolean, recommended: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 4,
    padding: '4px 10px',
    fontSize: 12,
    fontWeight: 600,
    letterSpacing: '0.01em',
    borderRadius: 999,
    cursor: 'pointer',
    background: active ? 'var(--stq-primary)' : 'white',
    color: active
      ? 'white'
      : recommended
        ? 'var(--stq-primary)'
        : 'var(--stq-text)',
    border: `1px solid ${
      active
        ? 'var(--stq-primary)'
        : recommended
          ? 'rgba(144, 74, 72, 0.35)'
          : 'var(--stq-border)'
    }`,
    boxShadow: active ? 'var(--stq-shadow-soft)' : 'none',
    transition: 'background 0.12s ease, color 0.12s ease',
  };
}
