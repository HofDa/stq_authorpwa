import type { CSSProperties } from 'react';
import { Icon } from '../Icon';
import type { LocalCheck, ReadinessStatus } from '../readiness';

interface Props {
  checks: LocalCheck[];
  /**
   * When `true` (default), `ready` checks are rendered too. Sidebars usually
   * keep them; compact assistant lists hide them to focus on what's missing.
   */
  showReady?: boolean;
  emptyState?: React.ReactNode;
}

/**
 * Compact, presentational renderer for `LocalCheck[]`. Used by the
 * assistant slot today; reusable from the contextual sidebar later.
 */
export function LocalCheckList({ checks, showReady = true, emptyState }: Props) {
  const filtered = showReady ? checks : checks.filter((c) => c.status !== 'ready');
  if (filtered.length === 0) {
    return (
      <div
        style={{
          fontSize: 12,
          color: 'var(--stq-text-mute)',
          padding: '6px 4px',
        }}
      >
        {emptyState ?? 'Nothing to flag right now.'}
      </div>
    );
  }
  return (
    <ul style={listReset}>
      {filtered.map((check) => (
        <li key={check.id} style={rowStyle(check.status)}>
          <span style={{ display: 'inline-flex', flexShrink: 0 }}>
            <StatusGlyph status={check.status} />
          </span>
          <span style={{ flex: 1, minWidth: 0 }}>
            <span style={{ display: 'block', fontWeight: 600, fontSize: 12 }}>
              {check.label}
            </span>
            {check.message && (
              <span
                style={{
                  display: 'block',
                  fontSize: 11.5,
                  color: 'var(--stq-text-mute)',
                  lineHeight: 1.4,
                }}
              >
                {check.message}
              </span>
            )}
          </span>
        </li>
      ))}
    </ul>
  );
}

function StatusGlyph({ status }: { status: ReadinessStatus }) {
  const color = colorFor(status);
  if (status === 'ready') {
    return <Icon name="check" size={12} color={color} />;
  }
  if (status === 'problem') {
    return <Icon name="x" size={12} color={color} />;
  }
  return (
    <span
      aria-hidden
      style={{
        display: 'inline-block',
        width: 8,
        height: 8,
        borderRadius: 999,
        background: color,
        marginTop: 4,
      }}
    />
  );
}

function colorFor(status: ReadinessStatus): string {
  switch (status) {
    case 'ready':
      return 'var(--stq-success)';
    case 'draft':
      return 'var(--stq-primary)';
    case 'missing':
      return 'var(--stq-text-mute)';
    case 'problem':
      return 'var(--stq-error)';
  }
}

function rowStyle(status: ReadinessStatus): CSSProperties {
  return {
    display: 'flex',
    alignItems: 'flex-start',
    gap: 8,
    padding: '6px 8px',
    borderRadius: 8,
    border: `1px solid ${status === 'ready'
      ? 'rgba(65,104,52,0.18)'
      : 'var(--stq-border-soft)'}`,
    background:
      status === 'ready' ? 'rgba(65,104,52,0.05)' : 'var(--stq-bg)',
  };
}

const listReset: CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};
