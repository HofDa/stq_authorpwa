import { Icon } from '../../Icon';

export function StorylineTopBar({
  tourTitle,
  onClose,
}: {
  tourTitle: string;
  onClose: () => void;
}) {
  return (
    <div className="stq-storyline-topbar">
      <div className="stq-storyline-topbar-icon" aria-hidden>
        <Icon name="sparkles" size={14} color="var(--stq-primary)" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.16em',
            color: 'var(--stq-primary)',
            textTransform: 'uppercase',
          }}
        >
          Storyline draft · OpenClaw
        </div>
        <div
          style={{
            fontFamily: 'var(--stq-font-ui)',
            fontSize: 15,
            fontWeight: 700,
            lineHeight: 1.2,
            letterSpacing: '-0.005em',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
        >
          {tourTitle}
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        className="studio-btn-icon"
        aria-label="Close storyline"
      >
        <Icon name="x" size={16} />
      </button>
    </div>
  );
}
