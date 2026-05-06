import type { CSSProperties } from 'react';
import type { TourMetaTabId } from './tabIds';

interface TabDef {
  id: TourMetaTabId;
  label: string;
  hint: string;
}

/**
 * Tab order matches the spec: from "what the player sees" on the left to
 * "internal AI rules" and "the actual narrative" on the right. This
 * separation is deliberate — story and aiContext must never live in the
 * same tab.
 */
const TABS: TabDef[] = [
  { id: 'public', label: 'Öffentlich', hint: 'Was Endnutzer:innen sehen' },
  { id: 'internal', label: 'Intern', hint: 'Status, Rechte, Freigabe' },
  { id: 'authoring', label: 'Authoring', hint: 'Zielgruppe, Ton, Lernziele' },
  { id: 'aiContext', label: 'AI-Kontext', hint: 'Regeln für die KI' },
  { id: 'story', label: 'Story', hint: 'Prämisse & Figuren' },
];

interface Props {
  active: TourMetaTabId;
  onChange: (next: TourMetaTabId) => void;
}

export function TourMetaTabs({ active, onChange }: Props) {
  return (
    <nav
      role="tablist"
      aria-label="Tour-Metadaten"
      style={navStyle}
    >
      {TABS.map((tab) => {
        const selected = tab.id === active;
        return (
          <button
            key={tab.id}
            type="button"
            role="tab"
            aria-selected={selected}
            aria-controls={`tour-meta-tab-${tab.id}`}
            id={`tour-meta-tab-trigger-${tab.id}`}
            title={tab.hint}
            onClick={() => onChange(tab.id)}
            className={`studio-view-chip${selected ? ' studio-view-chip--active' : ''}`}
            style={chipStyle(selected)}
          >
            <span>{tab.label}</span>
          </button>
        );
      })}
    </nav>
  );
}

const navStyle: CSSProperties = {
  display: 'flex',
  gap: 6,
  flexWrap: 'wrap',
  background: 'var(--stq-author-surface-raised, var(--stq-bg))',
  borderRadius: 8,
  padding: 4,
  border: '1px solid var(--stq-border)',
};

function chipStyle(active: boolean): CSSProperties {
  return {
    padding: '6px 12px',
    fontSize: 12,
    fontWeight: 700,
    letterSpacing: '0.04em',
    borderRadius: 6,
    border: 'none',
    cursor: 'pointer',
    background: active ? 'var(--stq-primary)' : 'transparent',
    color: active ? 'white' : 'var(--stq-text-mute)',
    boxShadow: 'none',
  };
}
