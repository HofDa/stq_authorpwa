import type { ReactNode } from 'react';
import { Icon } from '../Icon';

interface RouteWorkspaceToolbarProps {
  focusEnabled: boolean;
  focusDisabled: boolean;
  saveDisabled: boolean;
  undoDisabled: boolean;
  clearDisabled: boolean;
  onToggleFocus: () => void;
  onSaveSegment: () => void;
  onUndoLast: () => void;
  onClearSegment: () => void;
}

export function RouteWorkspaceToolbar({
  focusEnabled,
  focusDisabled,
  saveDisabled,
  undoDisabled,
  clearDisabled,
  onToggleFocus,
  onSaveSegment,
  onUndoLast,
  onClearSegment,
}: RouteWorkspaceToolbarProps) {
  return (
    <>
      <button
        type="button"
        className={focusEnabled ? 'is-active' : ''}
        onClick={onToggleFocus}
        disabled={focusDisabled}
        aria-label="Focus route"
        aria-pressed={focusEnabled}
      >
        <Icon name="compass" size={15} />
      </button>
      <button
        type="button"
        onClick={onSaveSegment}
        disabled={saveDisabled}
        aria-label="Save segment"
      >
        <Icon name="check" size={15} />
      </button>
      <button
        type="button"
        onClick={onUndoLast}
        disabled={undoDisabled}
        aria-label="Undo last point in this segment"
      >
        <Icon name="chevron-left" size={15} />
      </button>
      <button
        type="button"
        onClick={onClearSegment}
        disabled={clearDisabled}
        aria-label="Delete current segment"
      >
        <Icon name="trash" size={15} />
      </button>
    </>
  );
}

interface RouteWorkspaceEditPillContentProps {
  toolbar: ReactNode;
  trailing?: ReactNode;
  distanceLabel: string;
  pointCount: number;
  pointsLabel: string;
}

export function RouteWorkspaceEditPillContent({
  toolbar,
  trailing,
  distanceLabel,
  pointCount,
  pointsLabel,
}: RouteWorkspaceEditPillContentProps) {
  return (
    <div className="stq-phone-map-edit-pill__stack">
      <div className="stq-phone-map-edit-pill__row">
        <div className="stq-mobile-map-edit-actions stq-mobile-map-edit-actions--route">
          {toolbar}
        </div>
        {trailing}
      </div>
      <div className="stq-phone-map-edit-pill__stats">
        <strong>{distanceLabel}</strong>
        <small>
          · {pointCount} {pointsLabel}
        </small>
      </div>
    </div>
  );
}

interface RouteWorkspaceStatsProps {
  label: string;
  distanceLabel: string;
  fromLabel: string;
  toLabel: string;
  pointCount: number;
  pointsLabel: string;
}

export function RouteWorkspaceStats({
  label,
  distanceLabel,
  fromLabel,
  toLabel,
  pointCount,
  pointsLabel,
}: RouteWorkspaceStatsProps) {
  return (
    <div className="stq-phone-map-route-stats">
      <span>{label}</span>
      <strong>{distanceLabel}</strong>
      <small>
        {fromLabel} → {toLabel} · {pointCount} {pointsLabel}
      </small>
    </div>
  );
}
