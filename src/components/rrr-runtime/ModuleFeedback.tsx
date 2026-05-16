import type { ReactNode } from 'react';
import { Icon } from '@/components/studio/Icon';
import type { ModuleFeedbackKind } from './moduleFeedbackTypes';
import {
  useSensoryFeedbackCue,
  type ModuleSensoryFeedbackSetting,
} from './useSensoryFeedbackCue';

export type { ModuleFeedbackKind } from './moduleFeedbackTypes';

interface ModuleFeedbackProps {
  kind: ModuleFeedbackKind;
  message?: string;
  detail?: string;
  eyebrow?: string;
  action?: ReactNode;
  className?: string;
  sensoryFeedback?: ModuleSensoryFeedbackSetting;
}

export function ModuleFeedback({
  kind,
  message,
  detail,
  eyebrow,
  action,
  className,
  sensoryFeedback,
}: ModuleFeedbackProps) {
  useSensoryFeedbackCue(kind, sensoryFeedback);

  if (kind === 'idle' || (!message && !detail && !action)) return null;

  const classes = [
    'stq-module-feedback',
    `stq-module-feedback--${kind}`,
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return (
    <div className={classes} role={kind === 'error' ? 'alert' : 'status'}>
      <span className="stq-module-feedback__badge" aria-hidden>
        <FeedbackIcon kind={kind} />
      </span>
      <div className="stq-module-feedback__body">
        {eyebrow ? (
          <span className="stq-module-feedback__eyebrow">{eyebrow}</span>
        ) : null}
        {message ? <strong>{message}</strong> : null}
        {detail ? <small>{detail}</small> : null}
      </div>
      {action ? <div className="stq-module-feedback__action">{action}</div> : null}
    </div>
  );
}

function FeedbackIcon({ kind }: { kind: ModuleFeedbackKind }) {
  if (kind === 'success') {
    return <Icon name="check" size={16} stroke={2.4} />;
  }
  if (kind === 'error') {
    return <Icon name="x" size={16} stroke={2.4} />;
  }
  return null;
}
