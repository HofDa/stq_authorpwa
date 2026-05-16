import { Icon } from '@/components/studio/Icon';

export type ModuleFeedbackKind = 'idle' | 'running' | 'success' | 'error';

interface ModuleFeedbackProps {
  kind: ModuleFeedbackKind;
  message?: string;
  detail?: string;
}

export function ModuleFeedback({ kind, message, detail }: ModuleFeedbackProps) {
  if (kind === 'idle' || (!message && !detail)) return null;

  return (
    <div
      className={`stq-module-feedback stq-module-feedback--${kind}`}
      role={kind === 'error' ? 'alert' : 'status'}
    >
      <span className="stq-module-feedback__badge" aria-hidden>
        {kind === 'success' ? (
          <Icon name="check" size={16} stroke={2.4} />
        ) : kind === 'error' ? (
          <Icon name="x" size={16} stroke={2.4} />
        ) : null}
      </span>
      <div className="stq-module-feedback__body">
        {message && <strong>{message}</strong>}
        {detail && <small>{detail}</small>}
      </div>
    </div>
  );
}
