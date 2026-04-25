import { useMemo } from 'react';
import { LocaleTabs } from '@/components/LocaleTabs';
import type { Locale, TourDraft } from '@/schema';
import { Icon } from './Icon';

type View = 'overview' | 'stations' | 'intro-outro' | 'route';

interface Props {
  draft: TourDraft;
  locale: Locale;
  view: View;
  exporting: boolean;
  onBack: () => void;
  onLocaleChange: (locale: Locale) => void;
  onViewChange: (view: View) => void;
  onExport: () => void;
  onEnterField: () => void;
}

export function StudioHeader({
  draft,
  locale,
  view,
  exporting,
  onBack,
  onLocaleChange,
  onViewChange,
  onExport,
  onEnterField,
}: Props) {
  const savedAgo = useSavedAgo(draft.updatedAt);

  return (
    <header
      style={{
        display: 'grid',
        gridTemplateColumns: 'auto 1fr auto',
        alignItems: 'center',
        gap: 14,
        padding: '0 20px',
        background: 'rgba(255,248,247,0.88)',
        backdropFilter: 'blur(14px)',
        borderBottom: '1px solid var(--stq-border)',
        boxShadow: '0 10px 24px rgba(35,25,25,0.05)',
        zIndex: 30,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <button className="studio-btn-icon" onClick={onBack} aria-label="Back to tours">
          <Icon name="chevron-left" size={16} />
        </button>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <img src="/favicon.svg" alt="" style={{ width: 28, height: 28, borderRadius: 8 }} />
          <div style={{ lineHeight: 1.1 }}>
            <div
              style={{
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: '0.14em',
                color: 'var(--stq-primary)',
                textTransform: 'uppercase',
              }}
            >
              SouthTyrolQuests · Author
            </div>
            <div style={{ fontSize: 14, fontWeight: 700 }}>
              {draft.tour[locale].title || 'Untitled tour'}
            </div>
          </div>
        </div>
      </div>

      <div
        style={{
          display: 'flex',
          gap: 6,
          justifyContent: 'center',
          fontSize: 12,
          color: 'var(--stq-text-mute)',
        }}
      >
        <ViewChip icon="grid" label="Overview" active={view === 'overview'} onClick={() => onViewChange('overview')} />
        <ViewChip icon="map-pin" label="Stations" active={view === 'stations'} onClick={() => onViewChange('stations')} />
        <ViewChip icon="type" label="Intro & Outro" active={view === 'intro-outro'} onClick={() => onViewChange('intro-outro')} />
        <ViewChip icon="route" label="Route" active={view === 'route'} onClick={() => onViewChange('route')} />
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div
          style={{
            display: 'inline-flex',
            gap: 6,
            alignItems: 'center',
            fontSize: 12,
            color: 'var(--stq-text-mute)',
          }}
        >
          <Icon name="check-circle" size={12} color="var(--stq-success)" />
          Saved locally · {savedAgo}
        </div>
        <LocaleTabs active={locale} onChange={onLocaleChange} />
        <button
          className="studio-btn-ghost"
          onClick={onEnterField}
          style={{ minHeight: 36, fontSize: 13, padding: '0 12px' }}
        >
          <Icon name="phone" size={14} />
          Field mode
        </button>
        <button
          className="studio-btn-primary"
          onClick={onExport}
          disabled={exporting}
        >
          <Icon name="download" size={14} />
          {exporting ? 'Exporting…' : 'Export ZIP'}
        </button>
      </div>
    </header>
  );
}

function ViewChip({
  icon,
  label,
  active,
  onClick,
}: {
  icon: 'grid' | 'map-pin' | 'type' | 'route';
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      className={`studio-chip${active ? ' active' : ''}`}
      onClick={onClick}
      style={active ? undefined : { background: 'white' }}
    >
      <Icon name={icon} size={12} />
      {label}
    </button>
  );
}

function useSavedAgo(updatedAt: number): string {
  return useMemo(() => {
    const diff = Date.now() - updatedAt;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    return `${days}d ago`;
  }, [updatedAt]);
}
