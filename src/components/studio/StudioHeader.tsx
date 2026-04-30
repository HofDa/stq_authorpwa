import { useMemo } from 'react';
import { LocaleTabs } from '@/components/LocaleTabs';
import type { Locale, TourDraft } from '@/schema';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import { Icon } from './Icon';
import { WorkflowNav } from './workflow/WorkflowNav';
import type {
  StudioWorkflowSection,
  WorkflowStatus,
} from './workflow/workflowTypes';

/**
 * Backwards-compatible aliases. The shared `StudioWorkflowSection` /
 * `WorkflowStatus` types in `./workflow/workflowTypes` are the source of
 * truth; these re-exports keep older imports working during the refactor.
 */
export type View = StudioWorkflowSection;
export type ViewStatus = WorkflowStatus;

interface Props {
  draft: TourDraft;
  locale: Locale;
  view: StudioWorkflowSection;
  exporting: boolean;
  /**
   * Optional per-section badge state. Wired up once the per-section
   * readiness model lands in PR-16.
   */
  viewStatus?: Partial<Record<StudioWorkflowSection, WorkflowStatus>>;
  onBack: () => void;
  onLocaleChange: (locale: Locale) => void;
  onViewChange: (view: StudioWorkflowSection) => void;
  onExport: () => void;
  onEnterField: () => void;
}

export function StudioHeader({
  draft,
  locale,
  view,
  exporting,
  viewStatus,
  onBack,
  onLocaleChange,
  onViewChange,
  onExport,
  onEnterField,
}: Props) {
  const { t } = useEditorLanguage();
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
        <button
          className="studio-btn-icon"
          onClick={onBack}
          aria-label={t('studio.backToTours')}
        >
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
              {draft.tour[locale].title || t('studio.untitledTour')}
            </div>
          </div>
        </div>
      </div>

      <WorkflowNav
        activeSection={view}
        onSectionChange={onViewChange}
        statusBySection={viewStatus}
      />

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
          {t('studio.savedLocally')} · {savedAgo}
        </div>
        <LocaleTabs active={locale} onChange={onLocaleChange} />
        <button
          className="studio-btn-ghost"
          onClick={onEnterField}
          style={{ minHeight: 36, fontSize: 13, padding: '0 12px' }}
        >
          <Icon name="phone" size={14} />
          {t('studio.fieldMode')}
        </button>
        <button
          className="studio-btn-primary"
          onClick={onExport}
          disabled={exporting}
        >
          <Icon name="download" size={14} />
          {exporting ? t('studio.exporting') : t('studio.exportZip')}
        </button>
      </div>
    </header>
  );
}

function useSavedAgo(updatedAt: number): string {
  const { t } = useEditorLanguage();
  return useMemo(() => {
    const diff = Date.now() - updatedAt;
    const minutes = Math.floor(diff / 60000);
    if (minutes < 1) return t('studio.justNow');
    if (minutes < 60) return `${minutes}${t('studio.minutesAgo')}`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}${t('studio.hoursAgo')}`;
    const days = Math.floor(hours / 24);
    return `${days}${t('studio.daysAgo')}`;
  }, [t, updatedAt]);
}
