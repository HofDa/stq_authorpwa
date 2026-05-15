import {
  useEffect,
  useRef,
  useState,
  type ReactNode,
} from 'react';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import { Icon } from './Icon';

export interface EditPanelField {
  id: string;
  label: string;
  type: 'text' | 'textarea';
  value: string;
  placeholder?: string;
  maxLength?: number;
  onChange: (value: string) => void | Promise<void>;
}

interface Props {
  title: string;
  fields: EditPanelField[];
  open: boolean;
  onClose: () => void;
  onCancel?: () => void;
  children?: ReactNode;
}

export function EditPanel({
  title,
  fields,
  open,
  onClose,
  onCancel,
  children,
}: Props) {
  const { t } = useEditorLanguage();
  const firstRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const wasOpenRef = useRef(false);
  const [draftValues, setDraftValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const justOpened = open && !wasOpenRef.current;

    if (justOpened) {
      setDraftValues(
        Object.fromEntries(fields.map((field) => [field.id, field.value])),
      );
    }

    wasOpenRef.current = open;
  }, [open, fields]);

  useEffect(() => {
    if (open) {
      setTimeout(() => firstRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    if (!open) return;

    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        onCancel?.();
        onClose();
      }
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose, onCancel]);

  function updateDraft(fieldId: string, value: string) {
    setDraftValues((current) => ({
      ...current,
      [fieldId]: value,
    }));
  }

  async function commitSave() {
    if (saving) return;

    setSaving(true);
    try {
      for (const field of fields) {
        await field.onChange(draftValues[field.id] ?? field.value ?? '');
      }
      onClose();
    } finally {
      setSaving(false);
    }
  }

  function commitCancel() {
    onCancel?.();
    onClose();
  }

  return (
    <>
      {open && (
        <div
          className="stq-edit-panel-backdrop"
          aria-hidden
          onClick={commitCancel}
        />
      )}

      <aside
        className={`stq-edit-panel${open ? ' stq-edit-panel--open' : ''}`}
        aria-label={title}
        role="dialog"
        aria-modal="true"
      >
        <div className="stq-edit-panel-header">
          <div className="stq-edit-panel-eyebrow">{t('studio.edit')}</div>

          <h2 className="stq-edit-panel-title">{title}</h2>

          <button
            type="button"
            className="stq-edit-panel-close"
            aria-label={t('studio.close')}
            onClick={commitCancel}
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="stq-edit-panel-body">
          {fields.map((field, index) => {
            const value = draftValues[field.id] ?? field.value ?? '';

            return (
              <div key={field.id} className="stq-edit-panel-field">
                <label
                  className="stq-edit-panel-label"
                  htmlFor={`ep-${field.id}`}
                >
                  {field.label}
                </label>

                {field.type === 'textarea' ? (
                  <textarea
                    ref={
                      index === 0
                        ? (el) => {
                            firstRef.current = el;
                          }
                        : undefined
                    }
                    id={`ep-${field.id}`}
                    className="stq-edit-panel-textarea"
                    value={value}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    disabled={saving}
                    onChange={(e) => updateDraft(field.id, e.target.value)}
                    rows={4}
                  />
                ) : (
                  <input
                    ref={
                      index === 0
                        ? (el) => {
                            firstRef.current = el;
                          }
                        : undefined
                    }
                    id={`ep-${field.id}`}
                    type="text"
                    className="stq-edit-panel-input"
                    value={value}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    disabled={saving}
                    onChange={(e) => updateDraft(field.id, e.target.value)}
                  />
                )}

                {typeof field.maxLength === 'number' && (
                  <div className="stq-edit-panel-count">
                    {value.length} / {field.maxLength}
                  </div>
                )}
              </div>
            );
          })}

          {children}
        </div>

        <div className="stq-edit-panel-footer">
          <button
            type="button"
            className="stq-edit-panel-button stq-edit-panel-button--ghost"
            onClick={commitCancel}
            disabled={saving}
          >
            {t('studio.cancel')}
          </button>

          <button
            type="button"
            className="stq-edit-panel-button stq-edit-panel-button--primary"
            onClick={() => {
              void commitSave();
            }}
            disabled={saving}
          >
            {t('studio.save')}
          </button>
        </div>
      </aside>
    </>
  );
}
