import type { CSSProperties, ReactNode } from 'react';
import type { Locale, RiddleEntry, TourDraft } from '@/schema';
import { Icon } from '../Icon';
import { LocalCheckList } from '../assistant/LocalCheckList';
import {
  getExportReadiness,
  getStationReadiness,
  getTourReadiness,
  getWorstStatus,
  type LocalCheck,
  type ReadinessStatus,
} from '../readiness';
import type { StudioWorkflowSection } from '../workflow/workflowTypes';

interface Props {
  section: StudioWorkflowSection;
  draft: TourDraft;
  locale: Locale;
  selectedStation: RiddleEntry | null;
  onOpenFullStationEditor?: (stationId: string) => void;
}

/**
 * Contextual left sidebar. Each workflow section renders a small panel
 * scoped to that workspace's main question:
 *
 *   Plan      → tour readiness & export blockers
 *   Story     → storyline / intro / outro / writing rules
 *   Stations  → selected-station checklist
 *   Route     → station count, distance, route review status
 *   Preview   → export readiness + language coverage
 *
 * Stations keeps its richer existing inspector (LeftRail) inside the
 * StationsWorkspace itself; this slim variant is used in workspaces that
 * don't already render a left rail.
 */
export function StudioSidebar({
  section,
  draft,
  locale,
  selectedStation,
  onOpenFullStationEditor,
}: Props) {
  return (
    <aside style={asideStyle}>
      {section === 'plan' && <PlanSidebar draft={draft} locale={locale} />}
      {section === 'story' && <StorySidebar draft={draft} locale={locale} />}
      {section === 'stations' && (
        <StationsSidebar
          draft={draft}
          locale={locale}
          selected={selectedStation}
          onOpenFullEditor={onOpenFullStationEditor}
        />
      )}
      {section === 'route' && <RouteSidebar draft={draft} locale={locale} />}
      {section === 'preview' && <PreviewSidebar draft={draft} locale={locale} />}
    </aside>
  );
}

function PlanSidebar({ draft, locale }: { draft: TourDraft; locale: Locale }) {
  const checks = getTourReadiness(draft, locale);
  const blockers = getExportReadiness(draft, locale);
  return (
    <>
      <Panel
        title="Tour readiness"
        eyebrow="Plan"
        status={getWorstStatus(checks)}
      >
        <LocalCheckList checks={checks} />
      </Panel>
      <Panel
        title="Export blockers"
        eyebrow="Plan"
        status={blockers.length === 0 ? 'ready' : 'problem'}
      >
        {blockers.length === 0 ? (
          <ReadyLine label="Ready to export" />
        ) : (
          <LocalCheckList
            checks={blockers}
            showReady={false}
            emptyState="Ready to export."
          />
        )}
      </Panel>
    </>
  );
}

function StorySidebar({ draft, locale }: { draft: TourDraft; locale: Locale }) {
  const localized = draft.tour[locale];
  const checks: LocalCheck[] = [
    {
      id: 'story.storyline',
      label: 'Storyline draft',
      status: draft.storyline.markdown.trim() ? 'ready' : 'missing',
      severity: 'info',
      message: draft.storyline.markdown.trim()
        ? undefined
        : 'No storyline notes yet.',
      target: { section: 'story', field: 'storyline' },
    },
    {
      id: 'story.intro',
      label: 'Intro',
      status: localized.introSection.length > 0 ? 'ready' : 'missing',
      severity: 'warning',
      message:
        localized.introSection.length > 0
          ? undefined
          : 'Add an intro for the active language.',
      target: { section: 'story', field: 'intro' },
    },
    {
      id: 'story.outro',
      label: 'Outro',
      status: localized.outroSection.length > 0 ? 'ready' : 'missing',
      severity: 'warning',
      message:
        localized.outroSection.length > 0
          ? undefined
          : 'Add an outro for the active language.',
      target: { section: 'story', field: 'outro' },
    },
    {
      id: 'story.tone',
      label: 'Tone & writing rules',
      status: 'missing',
      severity: 'info',
      message: 'Tone, voice and rules will move into structured fields later.',
      target: { section: 'story', field: 'tone' },
    },
  ];
  return (
    <Panel title="Story checklist" eyebrow="Story" status={getWorstStatus(checks)}>
      <LocalCheckList checks={checks} />
    </Panel>
  );
}

function StationsSidebar({
  draft,
  locale,
  selected,
  onOpenFullEditor,
}: {
  draft: TourDraft;
  locale: Locale;
  selected: RiddleEntry | null;
  onOpenFullEditor?: (stationId: string) => void;
}) {
  if (!selected) {
    return (
      <Panel
        title={`${draft.stations.length} stations`}
        eyebrow="Stations"
        status="draft"
      >
        <p
          style={{
            margin: 0,
            fontSize: 12.5,
            color: 'var(--stq-text-mute)',
            lineHeight: 1.5,
          }}
        >
          Select a station from the timeline to see its checklist here.
        </p>
      </Panel>
    );
  }
  const checks = getStationReadiness(selected, locale);
  return (
    <Panel
      title={selected[locale].location || 'Unnamed station'}
      eyebrow={`Station ${selected.number} / ${draft.stations.length}`}
      status={getWorstStatus(checks)}
    >
      <LocalCheckList checks={checks} />
      {onOpenFullEditor && (
        <button
          type="button"
          className="studio-btn-ghost"
          onClick={() => onOpenFullEditor(selected.id)}
          style={{ width: '100%', justifyContent: 'center', fontSize: 12 }}
        >
          Open full station editor
        </button>
      )}
    </Panel>
  );
}

function RouteSidebar({ draft, locale: _locale }: { draft: TourDraft; locale: Locale }) {
  const stationCount = draft.stations.length;
  const recordedPoints = draft.recordedRoute.length;
  const checks: LocalCheck[] = [
    {
      id: 'route.stations',
      label: 'Stations',
      status: stationCount > 0 ? 'ready' : 'missing',
      severity: 'warning',
      message:
        stationCount > 0
          ? `${stationCount} station${stationCount === 1 ? '' : 's'} on the loop.`
          : 'Add at least one station before you plan a route.',
      target: { section: 'stations' },
    },
    {
      id: 'route.distance',
      label: 'Distance',
      status: draft.tour.distance.trim() ? 'ready' : 'missing',
      severity: 'info',
      message: draft.tour.distance.trim()
        ? `Set to "${draft.tour.distance}".`
        : 'Distance is not set yet.',
      target: { section: 'route', field: 'distance' },
    },
    {
      id: 'route.reviewed',
      label: 'Route reviewed',
      status: recordedPoints > 0 ? 'ready' : 'missing',
      severity: 'warning',
      message:
        recordedPoints > 0
          ? `${recordedPoints} GPS points recorded.`
          : 'Walk or trace the route before exporting.',
      target: { section: 'route', field: 'recordedRoute' },
    },
    {
      id: 'route.longSegments',
      label: 'Long-segment warnings',
      status: 'missing',
      severity: 'info',
      message: 'Segment-length warnings land in a later PR.',
      target: { section: 'route', field: 'segments' },
    },
  ];
  return (
    <Panel title="Route checklist" eyebrow="Route" status={getWorstStatus(checks)}>
      <LocalCheckList checks={checks} />
    </Panel>
  );
}

function PreviewSidebar({ draft, locale }: { draft: TourDraft; locale: Locale }) {
  const blockers = getExportReadiness(draft, locale);
  const checks: LocalCheck[] = [
    {
      id: 'preview.languages',
      label: 'Language coverage',
      status: 'draft',
      severity: 'info',
      message: 'Per-language completeness lands with the preview workspace.',
    },
    {
      id: 'preview.tested',
      label: 'Preview tested',
      status: 'missing',
      severity: 'info',
      message: 'Run through the tour from the Preview workspace.',
    },
  ];
  return (
    <>
      <Panel
        title="Export readiness"
        eyebrow="Preview"
        status={blockers.length === 0 ? 'ready' : 'problem'}
      >
        {blockers.length === 0 ? (
          <ReadyLine label="Ready to export" />
        ) : (
          <LocalCheckList checks={blockers} showReady={false} />
        )}
      </Panel>
      <Panel title="Preview checks" eyebrow="Preview" status="draft">
        <LocalCheckList checks={checks} />
      </Panel>
    </>
  );
}

function Panel({
  title,
  eyebrow,
  status,
  children,
}: {
  title: string;
  eyebrow: string;
  status: ReadinessStatus;
  children: ReactNode;
}) {
  const tone = panelTone(status);
  return (
    <section style={panelStyle}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <div style={eyebrowStyle}>{eyebrow}</div>
        <span
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 4,
            fontSize: 10.5,
            fontWeight: 700,
            padding: '1px 8px',
            borderRadius: 999,
            background: tone.bg,
            color: tone.fg,
            border: `1px solid ${tone.border}`,
          }}
        >
          {labelFor(status)}
        </span>
      </div>
      <h3
        style={{
          fontFamily: 'Lato, Georgia, serif',
          fontSize: 15,
          fontWeight: 700,
          margin: '0 0 8px',
        }}
      >
        {title}
      </h3>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {children}
      </div>
    </section>
  );
}

function ReadyLine({ label }: { label: string }) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        fontSize: 12.5,
        color: 'var(--stq-success)',
        fontWeight: 600,
      }}
    >
      <Icon name="check" size={12} color="var(--stq-success)" />
      {label}
    </div>
  );
}

function labelFor(status: ReadinessStatus): string {
  switch (status) {
    case 'ready':
      return 'Ready';
    case 'draft':
      return 'Draft';
    case 'missing':
      return 'Missing';
    case 'problem':
      return 'Issue';
  }
}

function panelTone(status: ReadinessStatus) {
  switch (status) {
    case 'ready':
      return {
        bg: 'rgba(65,104,52,0.08)',
        fg: 'var(--stq-success)',
        border: 'rgba(65,104,52,0.2)',
      };
    case 'draft':
      return {
        bg: 'rgba(144,74,72,0.08)',
        fg: 'var(--stq-primary)',
        border: 'rgba(144,74,72,0.2)',
      };
    case 'missing':
      return {
        bg: 'var(--stq-bg)',
        fg: 'var(--stq-text-mute)',
        border: 'var(--stq-border)',
      };
    case 'problem':
      return {
        bg: 'rgba(176,49,49,0.08)',
        fg: 'var(--stq-error)',
        border: 'rgba(176,49,49,0.22)',
      };
  }
}

const asideStyle: CSSProperties = {
  display: 'flex',
  flexDirection: 'column',
  gap: 12,
  minHeight: 0,
  overflow: 'auto',
};

const panelStyle: CSSProperties = {
  background: 'white',
  border: '1px solid var(--stq-border)',
  borderRadius: 18,
  padding: 14,
  boxShadow: 'var(--stq-shadow-soft)',
};

const eyebrowStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.14em',
  color: 'var(--stq-primary)',
  textTransform: 'uppercase',
};
