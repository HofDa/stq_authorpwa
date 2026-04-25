import { Icon } from '../Icon';

interface Props {
  isFirst: boolean;
  isLast: boolean;
  assistantOpen: boolean;
  onPrev: () => void;
  onNext: () => void;
  onOpenAssistant: () => void;
}

export function FieldBottomNav({
  isFirst,
  isLast,
  assistantOpen,
  onPrev,
  onNext,
  onOpenAssistant,
}: Props) {
  return (
    <div className="stq-field-bottombar">
      <button
        className="studio-btn-ghost"
        style={{
          minHeight: 44,
          justifyContent: 'center',
          padding: '0 8px',
          fontSize: 12,
        }}
        onClick={onPrev}
        disabled={isFirst}
      >
        <Icon name="chevron-left" size={14} />
        Prev
      </button>
      <button
        className="studio-btn-primary"
        style={{
          minHeight: 44,
          justifyContent: 'center',
          padding: '0 8px',
          fontSize: 13,
        }}
        onClick={onOpenAssistant}
        aria-haspopup="dialog"
        aria-expanded={assistantOpen}
      >
        <Icon name="sparkles" size={15} />
        Assistant
      </button>
      <button
        className="studio-btn-ghost"
        style={{
          minHeight: 44,
          justifyContent: 'center',
          padding: '0 8px',
          fontSize: 12,
        }}
        onClick={onNext}
        disabled={isLast}
      >
        Next
        <Icon name="chevron-right" size={14} />
      </button>
    </div>
  );
}
