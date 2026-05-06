import type { ReactNode } from 'react';
import { Icon, type IconName } from '../Icon';

interface Props {
  icon: IconName;
  eyebrow: string;
  title: string;
  description: string;
  children?: ReactNode;
}

/**
 * Visually calm card used by workspaces that haven't been built out yet.
 * Keeps the burgundy/paper styling language and avoids feeling broken or
 * empty during the refactor — actual content lands in later PRs.
 */
export function WorkspacePlaceholder({
  icon,
  eyebrow,
  title,
  description,
  children,
}: Props) {
  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        height: '100%',
        width: '100%',
        padding: 24,
      }}
    >
      <div
        style={{
          width: 'min(560px, 100%)',
          background: 'var(--stq-author-surface, white)',
          border: '1px solid var(--stq-border)',
          borderRadius: 10,
          boxShadow: 'none',
          padding: '28px 28px 26px',
          textAlign: 'center',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: 12,
          color: 'var(--stq-text)',
        }}
      >
        <span
          style={{
            display: 'inline-grid',
            placeItems: 'center',
            width: 44,
            height: 44,
            borderRadius: 8,
            background: 'rgba(144, 74, 72, 0.08)',
            color: 'var(--stq-primary)',
          }}
        >
          <Icon name={icon} size={20} />
        </span>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.14em',
            color: 'var(--stq-primary)',
            textTransform: 'uppercase',
          }}
        >
          {eyebrow}
        </div>
        <h2
          style={{
            fontFamily: 'var(--stq-font-ui)',
            fontSize: 20,
            fontWeight: 700,
            margin: 0,
          }}
        >
          {title}
        </h2>
        <p
          style={{
            margin: 0,
            fontSize: 13,
            lineHeight: 1.5,
            color: 'var(--stq-text-mute)',
            maxWidth: 440,
          }}
        >
          {description}
        </p>
        {children}
      </div>
    </div>
  );
}
