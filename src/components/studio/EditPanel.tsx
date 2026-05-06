import { useEffect, useRef, type ReactNode } from 'react';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import { Icon } from './Icon';

export interface EditPanelField {
  id: string;
  label: string;
  type: 'text' | 'textarea';
  value: string;
  placeholder?: string;
  maxLength?: number;
  onChange: (value: string) => void;
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

  return (
    <>
      {open && (
        <div
          className="stq-edit-panel-backdrop"
          aria-hidden
          onClick={() => {
            onCancel?.();
            onClose();
          }}
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
            onClick={onClose}
          >
            <Icon name="x" size={16} />
          </button>
        </div>

        <div className="stq-edit-panel-body">
          {fields.map((field, index) => (
            <div key={field.id} className="stq-edit-panel-field">
              <label className="stq-edit-panel-label" htmlFor={`ep-${field.id}`}>
                {field.label}
              </label>
              {field.type === 'textarea' ? (
                <textarea
                  ref={index === 0 ? (el) => { firstRef.current = el; } : undefined}
                  id={`ep-${field.id}`}
                  className="stq-edit-panel-textarea"
                  value={field.value}
                  placeholder={field.placeholder}
                  maxLength={field.maxLength}
                  onChange={(e) => field.onChange(e.target.value)}
                  rows={4}
                />
              ) : (
                <input
                  ref={index === 0 ? (el) => { firstRef.current = el; } : undefined}
                  id={`ep-${field.id}`}
                  type="text"
                  className="stq-edit-panel-input"
                  value={field.value}
                  placeholder={field.placeholder}
                  maxLength={field.maxLength}
                  onChange={(e) => field.onChange(e.target.value)}
                />
              )}
              {typeof field.maxLength === 'number' && (
                <div className="stq-edit-panel-count">
                  {field.value.length} / {field.maxLength}
                </div>
              )}
            </div>
          ))}
          {children}
        </div>

        <div className="stq-edit-panel-footer">
          <button
            type="button"
            className="stq-edit-panel-button stq-edit-panel-button--ghost"
            onClick={() => {
              onCancel?.();
              onClose();
            }}
          >
            {t('studio.cancel')}
          </button>
          <button
            type="button"
            className="stq-edit-panel-button stq-edit-panel-button--primary"
            onClick={onClose}
          >
            {t('studio.save')}
          </button>
        </div>
      </aside>
    </>
  );
}
