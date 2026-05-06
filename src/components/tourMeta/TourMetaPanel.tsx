import { useState, type CSSProperties } from 'react';
import type { Locale, TourEntry } from '@/schema';
import { LOCALES, LOCALE_LABELS, TOUR_META_STATUSES } from '@/schema';
import { TourMetaTabs } from './TourMetaTabs';
import type { TourMetaTabId } from './tabIds';
import { PublicMetaTab } from './tabs/PublicMetaTab';
import { InternalMetaTab } from './tabs/InternalMetaTab';
import { AuthoringMetaTab } from './tabs/AuthoringMetaTab';
import { AIContextMetaTab } from './tabs/AIContextMetaTab';
import { StoryMetaTab } from './tabs/StoryMetaTab';

interface Props {
  tour: TourEntry;
  locale: Locale;
  /**
   * Optional initial tab. The panel is uncontrolled by default — wire
   * `activeTab` + `onTabChange` if you want to remember the user's tab
   * across reloads.
   */
  initialTab?: TourMetaTabId;
  activeTab?: TourMetaTabId;
  onTabChange?: (next: TourMetaTabId) => void;
  /**
   * When provided, the Public tab becomes editable (PR-38). Other tabs
   * stay read-only until their respective editors land. Omit this prop
   * to render the panel in read-only mode (e.g. for previews/tests).
   */
  onTourChange?: (recipe: (prev: TourEntry) => TourEntry) => void;
}

/**
 * Tour-Meta Panel — answers "what kind of tour is this and what does the
 * AI need to know?". Five tabs map cleanly to the five meta blocks on
 * `TourEntry`. Editors land in PR-38..PR-41; this PR is structural so the
 * separation between Public / Internal / Authoring / AI-Context / Story
 * shows up in the UI as soon as the data exists.
 */
export function TourMetaPanel({
  tour,
  locale,
  initialTab = 'public',
  activeTab,
  onTabChange,
  onTourChange,
}: Props) {
  const [internalTab, setInternalTab] = useState<TourMetaTabId>(initialTab);
  const tab = activeTab ?? internalTab;
  const setTab = onTabChange ?? setInternalTab;

  return (
    <section
      aria-label="Tour-Metadaten"
      style={panelStyle}
    >
      <Header tour={tour} />
      <TourMetaTabs active={tab} onChange={setTab} />
      <div
        id={`tour-meta-tab-${tab}`}
        role="tabpanel"
        aria-labelledby={`tour-meta-tab-trigger-${tab}`}
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        {tab === 'public' && (
          <PublicMetaTab
            tour={tour}
            locale={locale}
            onTourChange={onTourChange}
          />
        )}
        {tab === 'internal' && <InternalMetaTab tour={tour} />}
        {tab === 'authoring' && <AuthoringMetaTab tour={tour} />}
        {tab === 'aiContext' && <AIContextMetaTab tour={tour} />}
        {tab === 'story' && <StoryMetaTab tour={tour} />}
      </div>
    </section>
  );
}

function Header({ tour }: { tour: TourEntry }) {
  const status = tour.adminMeta?.status;
  const languages = LOCALES.filter((locale) => tour[locale].title.trim());

  return (
    <header
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <div style={eyebrowStyle}>Tour Meta</div>
        <h2
          style={{
            fontFamily: 'var(--stq-font-ui)',
            fontSize: 18,
            fontWeight: 700,
            margin: '2px 0 0',
            lineHeight: 1.2,
          }}
        >
          Wie wird diese Tour gebaut?
        </h2>
        <p
          style={{
            margin: '4px 0 0',
            fontSize: 12.5,
            color: 'var(--stq-text-mute)',
            lineHeight: 1.5,
            maxWidth: 540,
          }}
        >
          Öffentliche Felder, interner Status, redaktionelle Steuerung und
          AI-Regeln liegen jeweils in einem eigenen Tab — Story bleibt
          bewusst getrennt vom AI-Kontext.
        </p>
      </div>
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'flex-end',
          gap: 6,
          fontSize: 11,
          color: 'var(--stq-text-mute)',
        }}
      >
        <StatusPill status={status} />
        <span>
          Sprachen:{' '}
          {languages.length === 0
            ? '—'
            : languages.map((locale) => LOCALE_LABELS[locale]).join(' · ')}
        </span>
      </div>
    </header>
  );
}

function StatusPill({ status }: { status: TourEntry['adminMeta'] extends infer T
  ? T extends { status?: infer S }
    ? S | undefined
    : undefined
  : undefined }) {
  const label = status ?? 'unset';
  const known = TOUR_META_STATUSES.includes(
    label as (typeof TOUR_META_STATUSES)[number],
  );
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        fontSize: 11,
        fontWeight: 700,
        textTransform: 'uppercase',
        letterSpacing: '0.06em',
        padding: '2px 8px',
        borderRadius: 999,
        background: known
          ? 'rgba(144, 74, 72, 0.08)'
          : 'var(--stq-bg)',
        color: known ? 'var(--stq-primary)' : 'var(--stq-text-mute)',
        border: `1px solid ${known ? 'rgba(144, 74, 72, 0.2)' : 'var(--stq-border)'}`,
      }}
    >
      {label}
    </span>
  );
}

const panelStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  padding: 16,
  background: 'var(--stq-author-surface, white)',
  border: '1px solid var(--stq-border)',
  borderRadius: 10,
  boxShadow: 'none',
  color: 'var(--stq-text)',
};

const eyebrowStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.14em',
  color: 'var(--stq-primary)',
  textTransform: 'uppercase',
};
