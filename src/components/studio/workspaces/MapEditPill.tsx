import type { ReactNode } from 'react';
import { Icon } from '../Icon';

interface Props {
  content: ReactNode;
  active: boolean;
  onToggle: () => void;
}

export function MapEditPill({ content, active, onToggle }: Props) {
  return (
    <div
      className={`stq-phone-map-edit-pill__cluster${active ? ' is-active' : ''}`}
    >
      {content}
      <button
        type="button"
        className={`stq-phone-map-edit-pill__toggle${active ? ' is-active' : ''}`}
        onClick={onToggle}
        aria-label={active ? 'Bearbeiten beenden' : 'Bearbeiten'}
        aria-pressed={active}
        title={active ? 'Bearbeiten beenden' : 'Bearbeiten'}
      >
        <Icon name="pen" size={15} />
      </button>
    </div>
  );
}
