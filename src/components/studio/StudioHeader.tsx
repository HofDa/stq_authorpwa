import { useMemo, useRef, useState } from 'react';
import type { Locale, TourDraft } from '@/schema';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import {
  getStationLocationLabel,
  getTourLocationLabel,
  getTourTitleLabel,
} from '@/utils/localizedContent';
import { Icon, type IconName } from './Icon';
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
  drafts: TourDraft[];
  /**
   * Optional per-section badge state. Wired up once the per-section
   * readiness model lands in PR-16.
   */
  viewStatus?: Partial<Record<StudioWorkflowSection, WorkflowStatus>>;
  onBack: () => void;
  onSelectTour: (draftId: string) => void;
  onLocaleChange: (locale: Locale) => void;
  onViewChange: (view: StudioWorkflowSection) => void;
  selectedStationId: string | null;
  reorderMode: boolean;
  onSelectStation: (stationId: string) => void;
  onAddStation: () => void;
  onReorderStations: (sourceId: string, targetId: string) => void;
  onToggleReorder: () => void;
  onExport: () => void;
  onEnterField: () => void;
}

export function StudioHeader({
  draft,
  locale,
  view,
  exporting,
  drafts,
  viewStatus,
  onBack,
  onSelectTour,
  onLocaleChange,
  onViewChange,
  selectedStationId,
  reorderMode,
  onSelectStation,
  onAddStation,
  onReorderStations,
  onToggleReorder,
  onExport,
  onEnterField,
}: Props) {
  const { t } = useEditorLanguage();
  const savedAgo = useSavedAgo(draft.updatedAt);
  const draggingStationIdRef = useRef<string | null>(null);
  const [draggingStationId, setDraggingStationId] = useState<string | null>(null);
  const [dropTargetStationId, setDropTargetStationId] = useState<string | null>(null);
  const [manualLanguageOpen, setManualLanguageOpen] = useState(false);

  const localizedTour = draft.tour[locale];

  return (
    <aside
      className="stq-author-tool-header"
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 18,
        minHeight: 0,
        height: '100vh',
        padding: '28px 22px 18px',
        background: '#1a1614',
        borderRight: '1px solid #2c2520',
        boxShadow: 'none',
        color: '#e8d8c8',
        zIndex: 30,
        overflow: 'auto',
      }}
    >
      <div className="stq-author-sidebar-brand">
        <button
          type="button"
          className="stq-author-sidebar-brand-home"
          onClick={onBack}
          aria-label={t('studio.backToTours')}
        >
          <span className="stq-author-tool-brand-mark" aria-hidden>
            <svg width="20" height="20" viewBox="0 0 32 32">
              <circle
                cx="16"
                cy="16"
                r="14"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.4"
              />
              <path d="M16 5 L19 16 L16 27 L13 16 Z" fill="currentColor" />
            </svg>
          </span>
          <div style={{ lineHeight: 1.1, minWidth: 0 }}>
            <div
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: '#f4e6d7',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}
            >
              SouthTyrolQuests
            </div>
            <div
              style={{
                fontSize: 10.5,
                color: '#a89888',
                letterSpacing: '0.06em',
                textTransform: 'uppercase',
              }}
            >
              {t('studio.authorTool')}
            </div>
          </div>
        </button>
        <label
          className="stq-author-ui-lang"
          aria-label="UI language"
        >
          <select
            value={locale}
            onChange={(event) => onLocaleChange(event.target.value as Locale)}
          >
            <option value="de">DE</option>
            <option value="en">EN</option>
            <option value="it">IT</option>
          </select>
          <span aria-hidden>▾</span>
        </label>
      </div>

      <div className="stq-author-sidebar-section">
        <div className="stq-author-sidebar-heading">{t('studio.tour')}</div>
        <label className="stq-author-tour-select">
          <select
            value={draft.draftId}
            onChange={(event) => onSelectTour(event.target.value)}
            aria-label={t('list.chooseTour')}
          >
            {drafts.map((entry) => (
              <option key={entry.draftId} value={entry.draftId}>
                {getTourTitleLabel(
                  entry.tour,
                  locale,
                  t('studio.untitledTour'),
                )}
              </option>
            ))}
          </select>
          <span className="stq-author-tour-select__chev" aria-hidden>
            ▾
          </span>
          <span className="stq-author-tour-select__title">
            {localizedTour.title || t('studio.untitledTour')}
          </span>
          <span className="stq-author-tour-select__meta">
            {getTourLocationLabel(draft.tour, locale, t('studio.noLocation'))} ·{' '}
            {draft.stations.length} {stationCountLabel(draft.stations.length, t)}
          </span>
        </label>
      </div>

      <div className="stq-author-sidebar-section">
        <div className="stq-author-sidebar-heading">
          {t('studio.tourStructure')}
        </div>
        <nav className="stq-author-nav-group" aria-label={t('studio.tourStructure')}>
          <SidebarNavItem
            icon="grid"
            label={t('studio.tourOverview')}
            active={view === 'plan'}
            status={viewStatus?.plan}
            onClick={() => onViewChange('plan')}
          />
          <SidebarNavItem
            icon="sparkles"
            label={t('studio.introPage')}
            active={view === 'story'}
            status={viewStatus?.story}
            onClick={() => onViewChange('story')}
          />
          <SidebarNavItem
            icon="sparkles"
            label={t('studio.outroPage')}
            active={view === 'outro'}
            status={viewStatus?.outro}
            onClick={() => onViewChange('outro')}
          />
          <SidebarNavItem
            icon="map-pin"
            label={t('studio.map')}
            active={view === 'stations'}
            status={viewStatus?.stations}
            onClick={() => onViewChange('stations')}
          />
          <SidebarNavItem
            icon="route"
            label={t('workflow.route')}
            active={view === 'route'}
            status={viewStatus?.route}
            onClick={() => onViewChange('route')}
          />
        </nav>
      </div>

      <div className="stq-author-sidebar-section">
        <div className="stq-author-sidebar-heading">
          {t('studio.tourProfile')}
        </div>
        <nav className="stq-author-nav-group" aria-label={t('studio.tourProfile')}>
          <ProfileNavItem icon="book-open" label={t('workflow.story')} />
        </nav>
      </div>

      <div className="stq-author-sidebar-section stq-author-sidebar-section--stations">
        <div className="stq-author-sidebar-row">
          <div className="stq-author-sidebar-heading">{t('studio.stations')}</div>
          <button
            type="button"
            className={`stq-author-sidebar-mini-action${reorderMode ? ' is-active' : ''}`}
            onClick={onToggleReorder}
            aria-pressed={reorderMode}
          >
            <Icon name="drag" size={12} />
            {reorderMode ? t('studio.done') : t('studio.sort')}
          </button>
        </div>
        <div className="stq-author-station-nav" aria-label={t('studio.stations')}>
          {draft.stations.map((station) => {
            const active = station.id === selectedStationId;
            const dragging = draggingStationId === station.id;
            const dropTarget =
              dropTargetStationId === station.id && draggingStationId !== station.id;
            return (
              <button
                key={station.id}
                type="button"
                className={[
                  'stq-author-nav-item',
                  active ? 'is-active' : '',
                  reorderMode ? 'is-reorderable' : '',
                  dragging ? 'is-dragging' : '',
                  dropTarget ? 'is-drop-target' : '',
                ]
                  .filter(Boolean)
                  .join(' ')}
                draggable={reorderMode}
                onClick={() => onSelectStation(station.id)}
                onDragStart={(event) => {
                  if (!reorderMode) return;
                  event.dataTransfer.effectAllowed = 'move';
                  event.dataTransfer.setData('text/plain', station.id);
                  draggingStationIdRef.current = station.id;
                  setDraggingStationId(station.id);
                }}
                onDragOver={(event) => {
                  const sourceId = draggingStationIdRef.current;
                  if (!reorderMode || !sourceId) return;
                  event.preventDefault();
                  event.dataTransfer.dropEffect = 'move';
                  setDropTargetStationId(station.id);
                }}
                onDragLeave={() => {
                  if (dropTargetStationId === station.id) {
                    setDropTargetStationId(null);
                  }
                }}
                onDrop={(event) => {
                  const sourceId = draggingStationIdRef.current;
                  if (!reorderMode || !sourceId) return;
                  event.preventDefault();
                  if (sourceId !== station.id) {
                    onReorderStations(sourceId, station.id);
                  }
                  draggingStationIdRef.current = null;
                  setDraggingStationId(null);
                  setDropTargetStationId(null);
                }}
                onDragEnd={() => {
                  draggingStationIdRef.current = null;
                  setDraggingStationId(null);
                  setDropTargetStationId(null);
                }}
                aria-current={active ? 'true' : undefined}
              >
                <span className="stq-author-nav-item__num">{station.number}</span>
                <span className="stq-author-nav-item__label">
                  {getStationLocationLabel(
                    station,
                    locale,
                    `${t('studio.station')} ${station.number}`,
                  )}
                </span>
              </button>
            );
          })}
          <button
            type="button"
            className="stq-author-nav-item stq-author-nav-item--add"
            onClick={onAddStation}
          >
            <span className="stq-author-nav-item__plus">+</span>
            <span className="stq-author-nav-item__label">
              {t('studio.addStation')}
            </span>
          </button>
        </div>
      </div>

      <div className="stq-author-sidebar-section">
        <div className="stq-author-sidebar-heading">{t('studio.languages')}</div>
        <label className="stq-author-lang-check">
          <input type="checkbox" checked readOnly />
          <span className="stq-author-lang-check__box">
            <span className="stq-author-lang-check__tick">✓</span>
          </span>
          <span className="stq-author-lang-check__label">
            <span>{t('studio.autoTranslate')}</span>
            <span className="stq-author-lang-check__hint">
              {t('studio.autoTranslateHint')}
            </span>
          </span>
        </label>
        <div
          className={`stq-author-lang-manual${
            manualLanguageOpen ? ' is-open' : ''
          }`}
        >
          <button
            type="button"
            className="stq-author-lang-manual__head"
            onClick={() => setManualLanguageOpen((value) => !value)}
          >
            <span
              className={`stq-author-lang-manual__chev${
                manualLanguageOpen ? ' is-open' : ''
              }`}
              aria-hidden
            >
              ▾
            </span>
            <span>{t('studio.manualLanguage')}</span>
          </button>
          {manualLanguageOpen && (
            <div className="stq-author-lang-manual__body">
              <div className="stq-author-lang-manual__sublabel">
                {t('studio.chooseLanguage')}
              </div>
              <div className="stq-author-lang-manual__btns">
                {[
                  { code: 'de' as const, flag: 'DE', label: t('studio.german') },
                  { code: 'en' as const, flag: 'EN', label: t('studio.english') },
                  { code: 'it' as const, flag: 'IT', label: t('studio.italian') },
                ]
                  .filter((entry) => entry.code !== locale)
                  .map((entry) => (
                    <button
                      key={entry.code}
                      type="button"
                      className="stq-author-lang-pill"
                      onClick={() => onLocaleChange(entry.code)}
                    >
                      <span className="stq-author-lang-pill__flag">
                        {entry.flag}
                      </span>
                      {entry.label}
                    </button>
                  ))}
              </div>
            </div>
          )}
        </div>
      </div>

      <div style={{ flex: 1, minHeight: 12 }} />

      <div className="stq-author-sidebar-status">
        <Icon name="check-circle" size={13} color="var(--stq-success)" />
        <span>{t('studio.savedLocally')} · {savedAgo}</span>
      </div>

      <div className="stq-author-sidebar-actions">
        <button
          className="studio-btn-ghost"
          onClick={onEnterField}
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
    </aside>
  );
}

function SidebarNavItem({
  icon,
  label,
  active,
  status,
  onClick,
}: {
  icon: IconName;
  label: string;
  active: boolean;
  status?: WorkflowStatus;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`stq-author-sidebar-nav-item${active ? ' is-active' : ''}`}
      aria-current={active ? 'page' : undefined}
      onClick={onClick}
    >
      <span className="stq-author-sidebar-nav-item__icon">
        <Icon name={icon} size={14} />
      </span>
      <span className="stq-author-sidebar-nav-item__label">{label}</span>
      {status && status !== 'none' && (
        <span
          className={`stq-author-sidebar-nav-dot stq-author-sidebar-nav-dot--${status}`}
          aria-hidden
        />
      )}
    </button>
  );
}

function ProfileNavItem({
  icon,
  label,
}: {
  icon: IconName;
  label: string;
}) {
  return (
    <button
      type="button"
      className="stq-author-sidebar-nav-item stq-author-sidebar-nav-item--profile"
      disabled
    >
      <span className="stq-author-sidebar-nav-item__icon">
        <Icon name={icon} size={14} />
      </span>
      <span className="stq-author-sidebar-nav-item__label">{label}</span>
    </button>
  );
}

function stationCountLabel(
  count: number,
  t: ReturnType<typeof useEditorLanguage>['t'],
): string {
  return count === 1 ? t('studio.station') : t('studio.stations');
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
