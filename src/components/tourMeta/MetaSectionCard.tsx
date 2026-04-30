import type { CSSProperties, ReactNode } from 'react';

interface Props {
  eyebrow: string;
  title: string;
  description?: string;
  /** Optional right-aligned slot — typically a chip or status pill. */
  trailing?: ReactNode;
  children: ReactNode;
  /** Surface tone — `muted` is used for placeholder cards. */
  tone?: 'default' | 'muted';
}

/**
 * Reusable card shell shared by every tour-meta tab. Keeps the burgundy /
 * paper visual language consistent with the rest of the Studio.
 */
export function MetaSectionCard({
  eyebrow,
  title,
  description,
  trailing,
  children,
  tone = 'default',
}: Props) {
  return (
    <section style={cardStyle(tone)}>
      <header
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'space-between',
          gap: 12,
          marginBottom: 10,
        }}
      >
        <div style={{ minWidth: 0 }}>
          <div style={eyebrowStyle}>{eyebrow}</div>
          <h3
            style={{
              fontFamily: 'Lato, Georgia, serif',
              fontSize: 15,
              fontWeight: 700,
              margin: '2px 0 0',
              lineHeight: 1.25,
            }}
          >
            {title}
          </h3>
          {description && (
            <p
              style={{
                margin: '4px 0 0',
                fontSize: 12.5,
                color: 'var(--stq-text-mute)',
                lineHeight: 1.5,
              }}
            >
              {description}
            </p>
          )}
        </div>
        {trailing && <div style={{ flexShrink: 0 }}>{trailing}</div>}
      </header>
      <div>{children}</div>
    </section>
  );
}

function cardStyle(tone: 'default' | 'muted'): CSSProperties {
  const base: CSSProperties = {
    background: 'white',
    border: '1px solid var(--stq-border)',
    borderRadius: 18,
    padding: 14,
    boxShadow: 'var(--stq-shadow-soft)',
  };
  if (tone === 'muted') {
    return { ...base, background: 'var(--stq-bg)' };
  }
  return base;
}

const eyebrowStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.14em',
  color: 'var(--stq-primary)',
  textTransform: 'uppercase',
};
