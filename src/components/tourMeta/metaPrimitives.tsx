import type { CSSProperties, ReactNode } from 'react';

/**
 * Small shared primitives every meta tab uses. Kept here so each tab
 * file stays focused on its own structure.
 */

export function DefList({ rows }: { rows: ReadonlyArray<[string, ReactNode]> }) {
  return (
    <dl
      style={{
        margin: 0,
        display: 'grid',
        gridTemplateColumns: 'auto 1fr',
        rowGap: 6,
        columnGap: 12,
        fontSize: 13,
        alignItems: 'baseline',
      }}
    >
      {rows.map(([label, value]) => (
        <DefRow key={label} label={label} value={value} />
      ))}
    </dl>
  );
}

function DefRow({ label, value }: { label: string; value: ReactNode }) {
  return (
    <>
      <dt
        style={{
          color: 'var(--stq-text-mute)',
          fontSize: 12,
          fontWeight: 600,
          letterSpacing: '0.02em',
        }}
      >
        {label}
      </dt>
      <dd
        style={{
          margin: 0,
          color: 'var(--stq-text)',
          fontSize: 12.5,
          lineHeight: 1.45,
          textAlign: 'left',
          minWidth: 0,
          wordBreak: 'break-word',
        }}
      >
        {value}
      </dd>
    </>
  );
}

export function ChipList({ items }: { items: ReadonlyArray<string> }) {
  return (
    <div style={chipListStyle}>
      {items.map((item) => (
        <span key={item} style={chipStyle}>
          {item}
        </span>
      ))}
    </div>
  );
}

export function Placeholder({ children }: { children: string }) {
  return (
    <span
      style={{
        color: 'var(--stq-text-mute)',
        fontStyle: 'italic',
      }}
    >
      {children}
    </span>
  );
}

/**
 * Convenience wrapper so call sites can write `placeholder('...')` instead
 * of `<Placeholder>...</Placeholder>` — fewer brackets in dense rows of
 * `DefList` rows. Returns a `<Placeholder>` element either way.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function placeholder(text: string): ReactNode {
  return <Placeholder>{text}</Placeholder>;
}

export function EmptyHint({ children }: { children: ReactNode }) {
  return (
    <div
      style={{
        padding: '10px 12px',
        border: '1px dashed var(--stq-border)',
        borderRadius: 12,
        background: 'var(--stq-bg)',
        fontSize: 12.5,
        color: 'var(--stq-text-mute)',
        lineHeight: 1.5,
      }}
    >
      {children}
    </div>
  );
}

const chipListStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 4,
};

const chipStyle: CSSProperties = {
  display: 'inline-flex',
  alignItems: 'center',
  fontSize: 11,
  fontWeight: 600,
  padding: '2px 8px',
  borderRadius: 999,
  background: 'rgba(144, 74, 72, 0.08)',
  color: 'var(--stq-primary)',
  border: '1px solid rgba(144, 74, 72, 0.18)',
};
