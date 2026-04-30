import { useEffect, useState, type CSSProperties } from 'react';
import type { Locale, RiddleEntry, TourDraft } from '@/schema';
import { LOCALES, LOCALE_LABELS } from '@/schema';
import { InlineStationDrawer } from '@/components/editable/InlineStationDrawer';
import { InlineTourIntro } from '@/components/editable/InlineTourIntro';
import { buildAssistantAction } from '@/services/ai/agentActions';
import { Icon } from '../Icon';
import {
  AssistantSlot,
  useAssistantSuggestions,
  type AssistantAction,
} from '../assistant';
import {
  getExportReadiness,
  getStationReadiness,
  getWorstStatus,
  type LocalCheck,
  type ReadinessStatus,
} from '../readiness';

interface Props {
  draft: TourDraft;
  locale: Locale;
  onLocaleChange: (locale: Locale) => void;
  onChange: (
    patch: Partial<TourDraft> | ((prev: TourDraft) => TourDraft),
  ) => void;
}

type PreviewView = 'intro' | 'station' | 'outro';

/**
 * Preview workspace — answers "does it work for the player?".
 *
 * Big centred phone preview, language switcher, view selector
 * (intro/station/outro), and a slim sidebar with export readiness and
 * per-language coverage. The phone surface reuses the same inline
 * editors as the Stations workspace so the WYSIWYG path stays consistent.
 */
export function PreviewWorkspace({
  draft,
  locale,
  onLocaleChange,
  onChange,
}: Props) {
  const [view, setView] = useState<PreviewView>('intro');
  const [stationId, setStationId] = useState<string | null>(
    draft.stations[0]?.id ?? null,
  );
  const { suggestions } = useAssistantSuggestions({
    section: 'preview',
    draft,
    locale,
  });

  useEffect(() => {
    if (
      stationId &&
      !draft.stations.some((station) => station.id === stationId)
    ) {
      setStationId(draft.stations[0]?.id ?? null);
    }
  }, [draft.stations, stationId]);

  const station =
    draft.stations.find((entry) => entry.id === stationId) ?? null;
  const blockers = getExportReadiness(draft, locale);
  const stationCoverage = computeStationCoverage(draft);
  const languageCoverage = computeLanguageCoverage(draft);

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 320px',
        gap: 14,
        minHeight: 0,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          minHeight: 0,
          minWidth: 0,
        }}
      >
        <Toolbar
          view={view}
          onViewChange={setView}
          locale={locale}
          onLocaleChange={onLocaleChange}
          stations={draft.stations}
          stationId={stationId}
          onStationChange={setStationId}
        />
        <div style={stageStyle}>
          <PhoneFrame>
            {view === 'station' && station ? (
              <InlineStationDrawer
                draft={draft}
                station={station}
                locale={locale}
                onChange={onChange}
              />
            ) : view === 'station' && !station ? (
              <EmptyPhone label="Add a station to preview it." />
            ) : (
              <InlineTourIntro
                key={view}
                draft={draft}
                locale={locale}
                onChange={onChange}
                initialTab={view === 'outro' ? 'outro' : 'intro'}
              />
            )}
          </PhoneFrame>
        </div>
      </div>

      <aside
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 12,
          minHeight: 0,
          overflow: 'auto',
          padding: '4px 4px 24px',
        }}
      >
        <Card>
          <CardHeader
            eyebrow="Export readiness"
            title={blockers.length === 0 ? 'Ready to export' : 'Blockers'}
            tone={blockers.length === 0 ? 'success' : 'warning'}
          />
          {blockers.length === 0 ? (
            <ReadyLine label="No blockers detected." />
          ) : (
            <ul style={listReset}>
              {blockers.map((blocker) => (
                <li key={blocker.id} style={blockerRow}>
                  <Icon name="x" size={11} color="var(--stq-error)" />
                  <span>{blocker.message ?? blocker.label}</span>
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card>
          <CardHeader
            eyebrow="Languages"
            title="Title coverage"
            tone={
              languageCoverage.every((c) => c.status === 'ready')
                ? 'success'
                : 'default'
            }
          />
          <ul style={listReset}>
            {languageCoverage.map((row) => (
              <li key={row.locale} style={coverageRow}>
                <span>{LOCALE_LABELS[row.locale]}</span>
                <StatusPill status={row.status} />
              </li>
            ))}
          </ul>
        </Card>

        <Card>
          <CardHeader
            eyebrow="Stations"
            title={`${stationCoverage.ready}/${stationCoverage.total} ready`}
            tone={
              stationCoverage.total > 0 &&
              stationCoverage.ready === stationCoverage.total
                ? 'success'
                : 'default'
            }
          />
          <p
            style={{
              margin: 0,
              fontSize: 12,
              color: 'var(--stq-text-mute)',
              lineHeight: 1.5,
            }}
          >
            Walk every station from the picker above to confirm photos,
            riddles, hints and success messages all read the way you want.
          </p>
        </Card>

        <AssistantSlot
          section="preview"
          title="QA assistant"
          description="Will run language audits and spot-check tone, riddles and success messages. Local checks plus offline suggestions until the AI provider is wired up."
          checks={previewChecks(blockers, stationCoverage, languageCoverage)}
          actions={PREVIEW_ACTIONS}
          suggestions={suggestions}
        />
      </aside>
    </div>
  );
}

const PREVIEW_ACTIONS: AssistantAction[] = [
  buildAssistantAction('preview.runQA', {
    description: 'Disabled until the AI provider is connected.',
    disabled: true,
  }),
  buildAssistantAction('translation.checkCompleteness', {
    description: 'Disabled until the AI provider is connected.',
    disabled: true,
  }),
];

function previewChecks(
  blockers: LocalCheck[],
  stationCoverage: { ready: number; total: number },
  languageCoverage: ReturnType<typeof computeLanguageCoverage>,
): LocalCheck[] {
  const checks: LocalCheck[] = [];
  checks.push({
    id: 'preview.export',
    label: 'Export readiness',
    status: blockers.length === 0 ? 'ready' : 'problem',
    severity: blockers.length === 0 ? 'info' : 'error',
    message:
      blockers.length === 0
        ? undefined
        : `${blockers.length} blocker${blockers.length === 1 ? '' : 's'}.`,
  });
  checks.push({
    id: 'preview.stations',
    label: 'Stations ready',
    status:
      stationCoverage.total === 0
        ? 'missing'
        : stationCoverage.ready === stationCoverage.total
          ? 'ready'
          : 'draft',
    severity: 'info',
    message:
      stationCoverage.total === 0
        ? 'No stations yet.'
        : `${stationCoverage.ready}/${stationCoverage.total} stations ready.`,
  });
  const incompleteLanguages = languageCoverage.filter(
    (row) => row.status !== 'ready',
  );
  checks.push({
    id: 'preview.languages',
    label: 'Languages',
    status: incompleteLanguages.length === 0 ? 'ready' : 'draft',
    severity: 'info',
    message:
      incompleteLanguages.length === 0
        ? undefined
        : `Title missing in: ${incompleteLanguages
            .map((row) => LOCALE_LABELS[row.locale])
            .join(', ')}`,
  });
  return checks;
}

function Toolbar({
  view,
  onViewChange,
  locale,
  onLocaleChange,
  stations,
  stationId,
  onStationChange,
}: {
  view: PreviewView;
  onViewChange: (next: PreviewView) => void;
  locale: Locale;
  onLocaleChange: (next: Locale) => void;
  stations: RiddleEntry[];
  stationId: string | null;
  onStationChange: (id: string) => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 10,
        padding: '4px 4px 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
        <div className="studio-seg" role="tablist" aria-label="Preview view">
          <button
            type="button"
            role="tab"
            aria-selected={view === 'intro'}
            className={view === 'intro' ? 'active' : ''}
            onClick={() => onViewChange('intro')}
          >
            Intro
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'station'}
            className={view === 'station' ? 'active' : ''}
            onClick={() => onViewChange('station')}
            disabled={stations.length === 0}
          >
            Station
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={view === 'outro'}
            className={view === 'outro' ? 'active' : ''}
            onClick={() => onViewChange('outro')}
          >
            Outro
          </button>
        </div>
        {view === 'station' && stations.length > 0 && (
          <select
            value={stationId ?? ''}
            onChange={(event) => onStationChange(event.target.value)}
            style={selectStyle}
            aria-label="Pick station to preview"
          >
            {stations.map((station) => (
              <option key={station.id} value={station.id}>
                {station.number}. {station[locale].location || 'Unnamed station'}
              </option>
            ))}
          </select>
        )}
      </div>
      <div className="studio-seg" role="tablist" aria-label="Preview language">
        {LOCALES.map((available) => (
          <button
            key={available}
            type="button"
            role="tab"
            aria-selected={locale === available}
            className={locale === available ? 'active' : ''}
            onClick={() => onLocaleChange(available)}
          >
            {LOCALE_LABELS[available]}
          </button>
        ))}
      </div>
    </div>
  );
}

function PhoneFrame({ children }: { children: React.ReactNode }) {
  return (
    <div
      className="studio-phone-shell"
      style={{ width: 360, maxHeight: '100%' }}
    >
      <div className="studio-phone-notch" />
      <div className="studio-phone-screen" style={{ height: 720 }}>
        <div
          className="studio-scroll"
          style={{ height: '100%', overflowY: 'auto', paddingTop: 38 }}
        >
          {children}
          <div style={{ height: 24 }} />
        </div>
      </div>
      <div className="studio-phone-home" />
    </div>
  );
}

function EmptyPhone({ label }: { label: string }) {
  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        height: '100%',
        padding: 24,
        color: 'var(--stq-text-mute)',
        fontSize: 13,
        textAlign: 'center',
      }}
    >
      {label}
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section
      style={{
        background: 'white',
        border: '1px solid var(--stq-border)',
        borderRadius: 18,
        padding: 14,
        boxShadow: 'var(--stq-shadow-soft)',
      }}
    >
      {children}
    </section>
  );
}

function CardHeader({
  eyebrow,
  title,
  tone,
}: {
  eyebrow: string;
  title: string;
  tone: 'default' | 'success' | 'warning';
}) {
  const accent =
    tone === 'success'
      ? 'var(--stq-success)'
      : tone === 'warning'
        ? 'var(--stq-error)'
        : 'var(--stq-primary)';
  return (
    <div style={{ marginBottom: 8 }}>
      <div style={{ ...eyebrowStyle, color: accent }}>{eyebrow}</div>
      <div
        style={{
          fontFamily: 'Lato, Georgia, serif',
          fontSize: 15,
          fontWeight: 700,
          marginTop: 2,
        }}
      >
        {title}
      </div>
    </div>
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

function StatusPill({ status }: { status: ReadinessStatus }) {
  const tone = pillTone(status);
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '1px 8px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        background: tone.bg,
        color: tone.fg,
        border: `1px solid ${tone.border}`,
      }}
    >
      {labelFor(status)}
    </span>
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

function pillTone(status: ReadinessStatus) {
  switch (status) {
    case 'ready':
      return {
        bg: 'rgba(65,104,52,0.08)',
        fg: 'var(--stq-success)',
        border: 'rgba(65,104,52,0.2)',
      };
    case 'draft':
      return {
        bg: 'rgba(144,74,72,0.06)',
        fg: 'var(--stq-primary)',
        border: 'rgba(144,74,72,0.18)',
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
        border: 'rgba(176,49,49,0.2)',
      };
  }
}

function computeStationCoverage(draft: TourDraft) {
  const total = draft.stations.length;
  if (total === 0) return { ready: 0, total: 0 };
  const ready = draft.stations.filter((station) => {
    const checks = getStationReadiness(station);
    return getWorstStatus(checks) === 'ready';
  }).length;
  return { ready, total };
}

function computeLanguageCoverage(draft: TourDraft) {
  return LOCALES.map((available) => {
    const hasTitle = draft.tour[available].title.trim().length > 0;
    const status: ReadinessStatus = hasTitle ? 'ready' : 'missing';
    return { locale: available, status };
  });
}

const eyebrowStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.14em',
  color: 'var(--stq-primary)',
  textTransform: 'uppercase',
};

const stageStyle: CSSProperties = {
  flex: 1,
  background:
    'linear-gradient(180deg, rgba(35,25,25,0.03), rgba(35,25,25,0.06))',
  border: '1px solid var(--stq-border)',
  borderRadius: 20,
  display: 'grid',
  placeItems: 'center',
  padding: 18,
  minHeight: 0,
  overflow: 'hidden',
  position: 'relative',
};

const selectStyle: CSSProperties = {
  fontSize: 12,
  padding: '6px 10px',
  borderRadius: 8,
  border: '1px solid var(--stq-border)',
  background: 'white',
  color: 'var(--stq-text)',
  minWidth: 200,
  maxWidth: 280,
};

const listReset: CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const blockerRow: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  fontSize: 12.5,
  color: 'var(--stq-text)',
  lineHeight: 1.45,
};

const coverageRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: 12.5,
};
