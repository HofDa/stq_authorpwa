import { Icon } from '../Icon';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import type { StudioWorkflowSection, WorkflowStatus } from './workflowTypes';

interface SectionDef {
  key: StudioWorkflowSection;
  labelKey:
    | 'workflow.plan'
    | 'workflow.story'
    | 'workflow.stations'
    | 'workflow.route'
    | 'studio.outroPage';
  icon: 'grid' | 'map-pin' | 'sparkles' | 'route';
}

/**
 * Visual order matches the natural authoring flow: shape the plan, write the
 * story, lay down the stations, review the route, then close with the outro.
 */
const SECTIONS: SectionDef[] = [
  { key: 'plan', labelKey: 'workflow.plan', icon: 'grid' },
  { key: 'story', labelKey: 'workflow.story', icon: 'sparkles' },
  { key: 'outro', labelKey: 'studio.outroPage', icon: 'sparkles' },
  { key: 'stations', labelKey: 'workflow.stations', icon: 'map-pin' },
  { key: 'route', labelKey: 'workflow.route', icon: 'route' },
];

interface Props {
  activeSection: StudioWorkflowSection;
  onSectionChange: (section: StudioWorkflowSection) => void;
  /**
   * Optional per-section badge. Wired up in later PRs once the per-section
   * readiness model lands.
   */
  statusBySection?: Partial<Record<StudioWorkflowSection, WorkflowStatus>>;
}

export function WorkflowNav({
  activeSection,
  onSectionChange,
  statusBySection,
}: Props) {
  const { t } = useEditorLanguage();

  return (
    <nav
      role="tablist"
      aria-label="Studio workflow"
      className="studio-view-nav"
    >
      {SECTIONS.map((def) => (
        <SectionChip
          key={def.key}
          icon={def.icon}
          label={t(def.labelKey)}
          active={activeSection === def.key}
          status={statusBySection?.[def.key] ?? 'none'}
          onClick={() => onSectionChange(def.key)}
        />
      ))}
    </nav>
  );
}

function SectionChip({
  icon,
  label,
  active,
  status,
  onClick,
}: {
  icon: SectionDef['icon'];
  label: string;
  active: boolean;
  status: WorkflowStatus;
  onClick: () => void;
}) {
  const { t } = useEditorLanguage();

  return (
    <button
      type="button"
      role="tab"
      aria-selected={active}
      onClick={onClick}
      className={`studio-view-chip${active ? ' studio-view-chip--active' : ''}`}
    >
      <Icon name={icon} size={13} />
      <span>{label}</span>
      {status !== 'none' && (
        <span
          className={`studio-view-chip-dot studio-view-chip-dot--${status}`}
          aria-label={statusLabel(status, t)}
        />
      )}
    </button>
  );
}

function statusLabel(
  status: Exclude<WorkflowStatus, 'none'>,
  t: ReturnType<typeof useEditorLanguage>['t'],
): string {
  switch (status) {
    case 'ready':
      return t('workflow.ready');
    case 'attention':
      return t('workflow.attention');
    case 'empty':
      return t('workflow.empty');
  }
}
