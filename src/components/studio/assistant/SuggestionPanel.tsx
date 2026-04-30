import type { CSSProperties } from 'react';
import type { AssistantSuggestion } from './assistantTypes';

interface Props {
  suggestions: AssistantSuggestion[];
  emptyState?: React.ReactNode;
}

/**
 * Renders assistant suggestions with Apply/Dismiss buttons.
 *
 * In PR-18 this is a pure UI placeholder — no real suggestion source is
 * wired up. The shape is the contract later PRs will populate.
 */
export function SuggestionPanel({ suggestions, emptyState }: Props) {
  if (suggestions.length === 0) {
    return (
      <div
        style={{
          fontSize: 12,
          color: 'var(--stq-text-mute)',
          padding: '6px 4px',
        }}
      >
        {emptyState ?? 'No suggestions yet.'}
      </div>
    );
  }
  return (
    <ul style={listReset}>
      {suggestions.map((suggestion) => (
        <li key={suggestion.id} style={cardStyle}>
          <div style={{ fontWeight: 700, fontSize: 13 }}>{suggestion.title}</div>
          <div
            style={{
              fontSize: 12,
              color: 'var(--stq-text-mute)',
              marginTop: 4,
              lineHeight: 1.45,
            }}
          >
            {suggestion.reason}
          </div>
          {suggestion.proposedChange && (
            <pre style={diffStyle}>{suggestion.proposedChange}</pre>
          )}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 10,
              justifyContent: 'flex-end',
            }}
          >
            <button
              type="button"
              className="studio-btn-ghost"
              style={btnStyle}
              onClick={suggestion.onDismiss}
              disabled={!suggestion.onDismiss}
            >
              Dismiss
            </button>
            <button
              type="button"
              className="studio-btn-primary"
              style={btnStyle}
              onClick={suggestion.onApply}
              disabled={!suggestion.onApply}
            >
              Apply
            </button>
          </div>
        </li>
      ))}
    </ul>
  );
}

const listReset: CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 8,
};

const cardStyle: CSSProperties = {
  background: 'white',
  border: '1px solid var(--stq-border-soft)',
  borderRadius: 12,
  padding: 12,
};

const diffStyle: CSSProperties = {
  marginTop: 8,
  marginBottom: 0,
  padding: 8,
  fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
  fontSize: 11.5,
  background: 'var(--stq-bg)',
  borderRadius: 8,
  whiteSpace: 'pre-wrap',
  color: 'var(--stq-text)',
};

const btnStyle: CSSProperties = {
  minHeight: 28,
  padding: '0 10px',
  fontSize: 12,
};
