import {
  useEffect,
  useRef,
  type MouseEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import { Icon } from '../Icon';
import type { EditPanelField } from '../EditPanel';

export type RightEditDrawerState = 'closed' | 'peek' | 'half' | 'open';

interface Props {
  title: string;
  fields: EditPanelField[];
  state: RightEditDrawerState;
  onStateChange: (state: RightEditDrawerState) => void;
  onClose: () => void;
  onCancel?: () => void;
  children?: ReactNode;
}

export function RightEditDrawer({
  title,
  fields,
  state,
  onStateChange,
  onClose,
  onCancel,
  children,
}: Props) {
  const { t } = useEditorLanguage();
  const firstRef = useRef<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const gestureRef = useRef<{
    pointerId: number;
    startX: number;
    startY: number;
    lastX: number;
    lastY: number;
  } | null>(null);
  const gestureDidSwipeRef = useRef(false);
  const expanded = state === 'half' || state === 'open';

  useEffect(() => {
    if (expanded) {
      setTimeout(() => firstRef.current?.focus(), 50);
    }
  }, [expanded, title]);

  useEffect(() => {
    function onKey(event: KeyboardEvent) {
      if (event.key !== 'Escape') return;
      if (expanded) {
        onStateChange('peek');
        return;
      }
      onClose();
    }

    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [expanded, onClose, onStateChange]);

  function commitClose() {
    onStateChange('closed');
    onClose();
  }

  function commitCancel() {
    onCancel?.();
    commitClose();
  }

  function expandState(current: RightEditDrawerState): RightEditDrawerState {
    if (current === 'closed') return 'peek';
    if (current === 'peek') return 'half';
    if (current === 'half') return 'open';
    return 'open';
  }

  function reduceState(current: RightEditDrawerState): RightEditDrawerState {
    if (current === 'open') return 'half';
    if (current === 'half') return 'peek';
    return 'closed';
  }

  function setDrawerState(next: RightEditDrawerState) {
    if (next === 'closed') {
      commitClose();
      return;
    }

    onStateChange(next);
  }

  function expandDrawer() {
    setDrawerState(expandState(state));
  }

  function collapseDrawer() {
    setDrawerState(reduceState(state));
  }

  function nextHandleState(): RightEditDrawerState {
    if (state === 'closed') return 'peek';
    if (state === 'peek') return 'half';
    if (state === 'half') return 'open';
    return 'peek';
  }

  function beginGesture(event: PointerEvent<HTMLElement>) {
    if (event.pointerType === 'mouse' && event.button !== 0) return;

    gestureDidSwipeRef.current = false;
    gestureRef.current = {
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      lastX: event.clientX,
      lastY: event.clientY,
    };
    event.currentTarget.setPointerCapture?.(event.pointerId);
  }

  function updateGesture(event: PointerEvent<HTMLElement>) {
    if (gestureRef.current?.pointerId !== event.pointerId) return;

    gestureRef.current.lastX = event.clientX;
    gestureRef.current.lastY = event.clientY;
  }

  function finishGesture(event: PointerEvent<HTMLElement>) {
    const gesture = gestureRef.current;
    if (!gesture || gesture.pointerId !== event.pointerId) return;

    event.currentTarget.releasePointerCapture?.(event.pointerId);
    gestureRef.current = null;

    const deltaX = gesture.lastX - gesture.startX;
    const deltaY = gesture.lastY - gesture.startY;
    const horizontal = Math.abs(deltaX);
    const vertical = Math.abs(deltaY);

    if (horizontal < 36 || horizontal < vertical * 1.2) return;

    gestureDidSwipeRef.current = true;
    if (deltaX < 0) {
      expandDrawer();
      return;
    }

    collapseDrawer();
  }

  function cancelGesture(event: PointerEvent<HTMLElement>) {
    if (gestureRef.current?.pointerId === event.pointerId) {
      gestureRef.current = null;
    }
  }

  function onHandleClick(event: MouseEvent<HTMLButtonElement>) {
    if (gestureDidSwipeRef.current) {
      gestureDidSwipeRef.current = false;
      event.preventDefault();
      return;
    }

    setDrawerState(nextHandleState());
  }

  return (
    <aside
      className="stq-right-edit-drawer"
      data-state={state}
      aria-label={title}
      aria-expanded={expanded}
    >
      <button
        type="button"
        className="stq-right-edit-drawer__handle"
        aria-label={expanded ? 'Editor einklappen' : 'Editor öffnen'}
        aria-expanded={expanded}
        onPointerDown={beginGesture}
        onPointerMove={updateGesture}
        onPointerUp={finishGesture}
        onPointerCancel={cancelGesture}
        onClick={onHandleClick}
      >
        <Icon name={expanded ? 'chevron-right' : 'chevron-left'} size={18} />
      </button>

      <div className="stq-right-edit-drawer__panel">
        <div className="stq-right-edit-drawer__content" aria-hidden={!expanded}>
          <div className="stq-right-edit-drawer__header">
            <div
              className="stq-right-edit-drawer__title"
              onPointerDown={beginGesture}
              onPointerMove={updateGesture}
              onPointerUp={finishGesture}
              onPointerCancel={cancelGesture}
            >
              <div className="stq-edit-panel-eyebrow">{t('studio.edit')}</div>
              <h2 className="stq-edit-panel-title">{title}</h2>
            </div>
            <div className="stq-right-edit-drawer__actions">
              <button
                type="button"
                aria-label="Editor erweitern"
                disabled={state === 'open'}
                onClick={expandDrawer}
              >
                <Icon name="chevron-left" size={15} />
              </button>
              <button
                type="button"
                aria-label="Editor einklappen"
                disabled={state === 'peek' || state === 'closed'}
                onClick={collapseDrawer}
              >
                <Icon name="chevron-right" size={15} />
              </button>
              <button
                type="button"
                aria-label={t('studio.close')}
                onClick={commitClose}
              >
                <Icon name="x" size={15} />
              </button>
            </div>
          </div>

          <div className="stq-right-edit-drawer__body">
            {fields.map((field, index) => (
              <div key={field.id} className="stq-edit-panel-field">
                <label
                  className="stq-edit-panel-label"
                  htmlFor={`red-${field.id}`}
                >
                  {field.label}
                </label>
                {field.type === 'textarea' ? (
                  <textarea
                    ref={index === 0 ? (el) => { firstRef.current = el; } : undefined}
                    id={`red-${field.id}`}
                    className="stq-edit-panel-textarea"
                    value={field.value}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    onChange={(event) => field.onChange(event.target.value)}
                    rows={4}
                  />
                ) : (
                  <input
                    ref={index === 0 ? (el) => { firstRef.current = el; } : undefined}
                    id={`red-${field.id}`}
                    type="text"
                    className="stq-edit-panel-input"
                    value={field.value}
                    placeholder={field.placeholder}
                    maxLength={field.maxLength}
                    onChange={(event) => field.onChange(event.target.value)}
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

          <div className="stq-right-edit-drawer__footer">
            <button
              type="button"
              className="stq-edit-panel-button stq-edit-panel-button--ghost"
              onClick={commitCancel}
            >
              {t('studio.cancel')}
            </button>
            <button
              type="button"
              className="stq-edit-panel-button stq-edit-panel-button--primary"
              onClick={commitClose}
            >
              {t('studio.save')}
            </button>
          </div>
        </div>
      </div>
    </aside>
  );
}
