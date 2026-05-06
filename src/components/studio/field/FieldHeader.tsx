import type { Locale } from '@/schema';
import { LocaleTabs } from '@/components/LocaleTabs';
import { Icon } from '../Icon';
import type { FieldView } from './types';

interface Props {
  /** Kept for API compatibility; no longer affects rendering. */
  embedded?: boolean;
  exitLabel: string;
  onExit: () => void;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  view: FieldView;
  onViewChange: (view: FieldView) => void;
  tourLabel: string;
  selectedLabel: string;
  storylineExists: boolean;
  onOpenStoryline: () => void;
}

export function FieldHeader({
  exitLabel,
  onExit,
  locale,
  onLocaleChange,
  view,
  onViewChange,
  tourLabel,
  selectedLabel,
  storylineExists,
  onOpenStoryline,
}: Props) {
  return (
    <>
      <div className="stq-field-topbar">
        <button
          className="studio-btn-ghost"
          onClick={onExit}
          style={{ minHeight: 36, fontSize: 12 }}
        >
          <Icon name="chevron-left" size={14} />
          {exitLabel}
        </button>
        <button
          type="button"
          className="studio-btn-ghost stq-storyline-trigger"
          onClick={onOpenStoryline}
          aria-label="Open storyline draft"
          style={{ minHeight: 36, fontSize: 12 }}
        >
          <Icon name="sparkles" size={14} color="var(--stq-primary)" />
          Storyline
          {storylineExists && (
            <span className="stq-storyline-trigger-dot" aria-hidden />
          )}
        </button>
      </div>

      <div className="stq-field-header">
        <div
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 10,
          }}
        >
          <div style={{ minWidth: 0, flex: 1 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.14em',
                color: 'var(--stq-primary)',
                textTransform: 'uppercase',
              }}
            >
              Field · {tourLabel}
            </div>
            <div
              style={{
                fontFamily: 'var(--stq-font-ui)',
                fontSize: 15,
                fontWeight: 700,
                marginTop: 2,
                letterSpacing: '-0.005em',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              {selectedLabel}
            </div>
          </div>
          <LocaleTabs active={locale} onChange={onLocaleChange} variant="compact" />
        </div>

        <div className="stq-field-tabs" role="tablist">
          <FieldTab
            icon="map-pin"
            label="Map"
            active={view === 'map'}
            onClick={() => onViewChange('map')}
          />
          <FieldTab
            icon="type"
            label="Station"
            active={view === 'station'}
            onClick={() => onViewChange('station')}
          />
          <FieldTab
            icon="grid"
            label="All"
            active={view === 'list'}
            onClick={() => onViewChange('list')}
          />
        </div>
      </div>
    </>
  );
}

function FieldTab({
  icon,
  label,
  active,
  onClick,
}: {
  icon: 'map-pin' | 'type' | 'grid';
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`stq-field-tab${active ? ' active' : ''}`}
    >
      <Icon name={icon} size={12} />
      {label}
    </button>
  );
}
