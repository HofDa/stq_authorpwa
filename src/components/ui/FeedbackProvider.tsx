/* eslint-disable react-refresh/only-export-components */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react';

type ToastTone = 'info' | 'success' | 'warning' | 'error';
type ConfirmTone = 'default' | 'danger';

interface ToastInput {
  title: string;
  message?: string;
  tone?: ToastTone;
  durationMs?: number;
}

interface ToastItem extends Required<Omit<ToastInput, 'message'>> {
  id: string;
  message?: string;
}

interface ConfirmInput {
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  tone?: ConfirmTone;
}

interface ConfirmRequest extends Required<ConfirmInput> {
  id: string;
  resolve: (confirmed: boolean) => void;
}

interface FeedbackContextValue {
  toast: (input: ToastInput) => void;
  confirm: (input: ConfirmInput) => Promise<boolean>;
}

const FeedbackContext = createContext<FeedbackContextValue | null>(null);

export function AppFeedbackProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [confirmRequest, setConfirmRequest] = useState<ConfirmRequest | null>(null);

  const dismissToast = useCallback((id: string) => {
    setToasts((current) => current.filter((toast) => toast.id !== id));
  }, []);

  const toast = useCallback(
    ({ title, message, tone = 'info', durationMs = 5200 }: ToastInput) => {
      const id = makeFeedbackId('toast');
      setToasts((current) => [...current, { id, title, message, tone, durationMs }]);
      window.setTimeout(() => dismissToast(id), durationMs);
    },
    [dismissToast],
  );

  const confirm = useCallback((input: ConfirmInput) => {
    return new Promise<boolean>((resolve) => {
      setConfirmRequest({
        id: makeFeedbackId('confirm'),
        title: input.title,
        message: input.message ?? '',
        confirmLabel: input.confirmLabel ?? 'Confirm',
        cancelLabel: input.cancelLabel ?? 'Cancel',
        tone: input.tone ?? 'default',
        resolve,
      });
    });
  }, []);

  const settleConfirm = useCallback(
    (confirmed: boolean) => {
      if (!confirmRequest) return;
      confirmRequest.resolve(confirmed);
      setConfirmRequest(null);
    },
    [confirmRequest],
  );

  const value = useMemo(() => ({ toast, confirm }), [toast, confirm]);

  return (
    <FeedbackContext.Provider value={value}>
      {children}
      <ToastRegion toasts={toasts} onDismiss={dismissToast} />
      {confirmRequest && (
        <ConfirmDialog
          request={confirmRequest}
          onCancel={() => settleConfirm(false)}
          onConfirm={() => settleConfirm(true)}
        />
      )}
    </FeedbackContext.Provider>
  );
}

export function useToast() {
  return useFeedback().toast;
}

export function useConfirm() {
  return useFeedback().confirm;
}

function useFeedback() {
  const context = useContext(FeedbackContext);
  if (!context) {
    throw new Error('Feedback hooks must be used inside AppFeedbackProvider.');
  }
  return context;
}

function ToastRegion({
  toasts,
  onDismiss,
}: {
  toasts: ToastItem[];
  onDismiss: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div
      aria-live="polite"
      aria-relevant="additions text"
      style={{
        position: 'fixed',
        right: 18,
        bottom: 18,
        zIndex: 1000,
        display: 'grid',
        gap: 10,
        width: 'min(420px, calc(100vw - 32px))',
        pointerEvents: 'none',
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          role={toast.tone === 'error' ? 'alert' : 'status'}
          style={{
            pointerEvents: 'auto',
            borderRadius: 'var(--stq-radius-lg)',
            border: `1px solid ${toneBorder(toast.tone)}`,
            background: 'var(--stq-alpha-panel)',
            boxShadow: 'var(--stq-shadow-card)',
            padding: '12px 14px',
            color: 'var(--stq-text)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
            <span
              aria-hidden="true"
              style={{
                width: 9,
                height: 9,
                borderRadius: 'var(--stq-radius-pill)',
                background: toneColor(toast.tone),
                marginTop: 6,
                flex: '0 0 auto',
              }}
            />
            <div style={{ minWidth: 0, flex: 1 }}>
              <p style={{ margin: 0, fontSize: 13, fontWeight: 800 }}>{toast.title}</p>
              {toast.message && (
                <p
                  style={{
                    margin: '4px 0 0',
                    color: 'var(--stq-text-mute)',
                    fontSize: 12,
                    lineHeight: 1.45,
                    whiteSpace: 'pre-wrap',
                  }}
                >
                  {toast.message}
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => onDismiss(toast.id)}
              aria-label="Dismiss notification"
              style={{
                border: 0,
                background: 'transparent',
                color: 'var(--stq-text-mute)',
                cursor: 'pointer',
                fontSize: 18,
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

function ConfirmDialog({
  request,
  onCancel,
  onConfirm,
}: {
  request: ConfirmRequest;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const dialogRef = useRef<HTMLElement | null>(null);
  const cancelButtonRef = useRef<HTMLButtonElement | null>(null);
  const previousFocusRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    previousFocusRef.current = document.activeElement as HTMLElement | null;
    cancelButtonRef.current?.focus();

    return () => {
      previousFocusRef.current?.focus?.();
    };
  }, []);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === 'Escape') {
        event.preventDefault();
        onCancel();
        return;
      }

      if (event.key !== 'Tab') return;

      const dialog = dialogRef.current;
      if (!dialog) return;

      const focusable = getFocusableElements(dialog);
      if (focusable.length === 0) return;

      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      const active = document.activeElement;

      if (event.shiftKey && active === first) {
        event.preventDefault();
        last.focus();
        return;
      }

      if (!event.shiftKey && active === last) {
        event.preventDefault();
        first.focus();
      }
    }

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onCancel]);

  return (
    <div
      role="presentation"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1001,
        display: 'grid',
        placeItems: 'center',
        background: 'var(--stq-alpha-modal-backdrop)',
        padding: 18,
      }}
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onCancel();
      }}
    >
      <section
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={`${request.id}-title`}
        aria-describedby={request.message ? `${request.id}-message` : undefined}
        style={{
          width: 'min(440px, 100%)',
          borderRadius: 'var(--stq-radius-xl)',
          border: '1px solid var(--stq-border)',
          background: 'var(--stq-color-surface)',
          boxShadow: 'var(--stq-shadow-modal)',
          padding: 20,
        }}
      >
        <p
          id={`${request.id}-title`}
          style={{
            margin: 0,
            fontFamily: 'var(--stq-font-ui)',
            fontSize: 20,
            fontWeight: 800,
            color: 'var(--stq-text)',
          }}
        >
          {request.title}
        </p>
        {request.message && (
          <p
            id={`${request.id}-message`}
            style={{
              margin: '8px 0 0',
              color: 'var(--stq-text-mute)',
              fontSize: 14,
              lineHeight: 1.5,
              whiteSpace: 'pre-wrap',
            }}
          >
            {request.message}
          </p>
        )}
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 8,
            marginTop: 18,
          }}
        >
          <button
            ref={cancelButtonRef}
            type="button"
            className="studio-btn-ghost"
            onClick={onCancel}
          >
            {request.cancelLabel}
          </button>
          <button
            type="button"
            className={request.tone === 'danger' ? 'studio-btn-ghost' : 'studio-btn-primary'}
            style={
              request.tone === 'danger'
                ? { color: 'var(--stq-error)', borderColor: 'var(--stq-alpha-danger-border)' }
                : undefined
            }
            onClick={onConfirm}
          >
            {request.confirmLabel}
          </button>
        </div>
      </section>
    </div>
  );
}

function getFocusableElements(container: HTMLElement) {
  return Array.from(
    container.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])',
    ),
  ).filter(
    (element) =>
      !element.hasAttribute('disabled') &&
      element.getAttribute('aria-hidden') !== 'true',
  );
}

function toneColor(tone: ToastTone) {
  switch (tone) {
    case 'success':
      return 'var(--stq-success)';
    case 'warning':
      return 'var(--stq-amber)';
    case 'error':
      return 'var(--stq-error)';
    case 'info':
    default:
      return 'var(--stq-primary)';
  }
}

function toneBorder(tone: ToastTone) {
  switch (tone) {
    case 'success':
      return 'var(--stq-alpha-success)';
    case 'warning':
      return 'var(--stq-alpha-warning)';
    case 'error':
      return 'var(--stq-alpha-danger)';
    case 'info':
    default:
      return 'var(--stq-alpha-primary)';
  }
}

function makeFeedbackId(prefix: string) {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return `${prefix}-${crypto.randomUUID()}`;
  }
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}
