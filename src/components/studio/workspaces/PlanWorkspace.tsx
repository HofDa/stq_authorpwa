import { useCallback, useMemo, useState, type CSSProperties } from 'react';
import type { Locale, TourDraft } from '@/schema';
import { LOCALES, LOCALE_LABELS } from '@/schema';
import { buildAssistantAction, getAiAgentAction } from '@/services/ai/agentActions';
import { getAiClient } from '@/services/ai/aiConfig';
import { buildTourContext } from '@/services/ai/promptBuilder';
import { Icon, type IconName } from '../Icon';
import { TourMetaPanel } from '@/components/tourMeta';
import {
  AssistantSlot,
  useAssistantSuggestions,
  type AssistantAction,
  type AssistantSuggestion,
} from '../assistant';
import {
  getExportReadiness,
  getReadyStationCount,
  getTourReadiness,
  getWorstStatus,
  type ReadinessStatus,
} from '../readiness';

interface Props {
  draft: TourDraft;
  locale: Locale;
  /**
   * Optional draft mutator. Wired from `Studio.tsx`; when present the
   * embedded `TourMetaPanel` becomes editable (PR-38). Tests/previews
   * may omit it for a read-only render.
   */
  onChange?: (
    patch: Partial<TourDraft> | ((prev: TourDraft) => TourDraft),
  ) => void;
}

/**
 * Plan dashboard — answers "what are we building?".
 *
 * No big map, no station timeline, no reorder controls. Cards summarise the
 * tour basics, audience/theme/goal placeholders, readiness, export blockers
 * and a tiny route summary. The "Plan assistant" slot is an inert placeholder
 * for now; PR-18 swaps it for the real `AssistantSlot`.
 */
export function PlanWorkspace({ draft, locale, onChange }: Props) {
  const tourChecks = getTourReadiness(draft, locale);
  const exportBlockers = getExportReadiness(draft, locale);
  const stationCount = getReadyStationCount(draft, locale);
  const { suggestions } = useAssistantSuggestions({
    section: 'plan',
    draft,
    locale,
  });
  const aiClient = useMemo(() => getAiClient(), []);
  const [aiSuggestions, setAiSuggestions] = useState<AssistantSuggestion[]>([]);
  const [aiNotice, setAiNotice] = useState<string | null>(null);
  const [isAiRunning, setIsAiRunning] = useState(false);
  const tour = draft.tour;
  const localized = tour[locale];

  const tourStatus = getWorstStatus(tourChecks);
  const runImproveConcept = useCallback(async () => {
    const action = getAiAgentAction('plan.improveConcept');
    setIsAiRunning(true);
    setAiNotice(null);
    try {
      const response = await aiClient.runAction({
        agentId: action.agentId,
        actionId: action.id,
        section: 'plan',
        locale,
        tourContext: buildTourContext({ draft, locale }),
        timestamp: new Date().toISOString(),
      });
      setAiSuggestions(
        response.suggestions.map((suggestion) => ({
          ...suggestion,
          onDismiss: () => {
            setAiSuggestions((current) =>
              current.filter((item) => item.id !== suggestion.id),
            );
          },
        })),
      );
      setAiNotice(response.notice ?? null);
    } finally {
      setIsAiRunning(false);
    }
  }, [aiClient, draft, locale]);

  const assistantActions = useMemo<AssistantAction[]>(
    () => [
      buildAssistantAction('plan.improveConcept', {
        onTrigger: runImproveConcept,
        disabled: isAiRunning,
        description: isAiRunning
          ? 'Mock provider is preparing a suggestion.'
          : 'Run the mock provider boundary for one plan suggestion.',
      }),
      buildAssistantAction('translation.checkCompleteness', {
        disabled: true,
        description: 'Disabled until more PR-25 action wiring is needed.',
      }),
    ],
    [isAiRunning, runImproveConcept],
  );
  const assistantSuggestions = useMemo(
    () => [...aiSuggestions, ...suggestions],
    [aiSuggestions, suggestions],
  );

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        overflow: 'auto',
        padding: '4px 4px 24px',
      }}
    >
      <header style={{ marginBottom: 16 }}>
        <div style={eyebrow}>Plan</div>
        <h1
          style={{
            fontFamily: 'Lato, Georgia, serif',
            fontSize: 22,
            fontWeight: 700,
            margin: '4px 0 0',
          }}
        >
          {localized.title || 'Untitled tour'}
        </h1>
        <p
          style={{
            margin: '4px 0 0',
            color: 'var(--stq-text-mute)',
            fontSize: 13,
          }}
        >
          A calm overview of what you are building. Use the other tabs to fill
          in the details.
        </p>
      </header>

      <div style={{ marginBottom: 16 }}>
        <TourMetaPanel
          tour={tour}
          locale={locale}
          onTourChange={
            onChange
              ? (recipe) =>
                  onChange((prev) => ({ ...prev, tour: recipe(prev.tour) }))
              : undefined
          }
        />
      </div>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: 14,
          alignItems: 'start',
        }}
      >
        <Card icon="grid" eyebrow="Tour basics" tone="default">
          <DefList>
            <DefRow
              label="Title"
              value={localized.title || placeholder('Not set yet')}
            />
            <DefRow label="Status" value={statusLabel(tourStatus)} />
            <DefRow label="Version" value="v0.1 draft" />
            <DefRow label="Languages" value={languagesSummary(tour)} />
            <DefRow
              label="Duration"
              value={localized.duration || placeholder('Not set yet')}
            />
            <DefRow
              label="Distance"
              value={tour.distance || placeholder('Not set yet')}
            />
          </DefList>
        </Card>

        <Card icon="sparkles" eyebrow="Audience & theme" tone="default">
          <DefList>
            <DefRow label="Target audience" value={placeholder('Not set yet')} />
            <DefRow label="Theme" value={placeholder('Not set yet')} />
            <DefRow label="Difficulty" value={placeholder('Not set yet')} />
            <DefRow label="Tour type" value={placeholder('Not set yet')} />
          </DefList>
          <Hint>
            These will move into structured tour metadata in a later PR.
          </Hint>
        </Card>

        <Card icon="compass" eyebrow="Tour goal" tone="default">
          <p
            style={{
              margin: 0,
              fontSize: 13,
              color: 'var(--stq-text)',
              lineHeight: 1.5,
            }}
          >
            What should players experience, learn or find?
          </p>
          <div
            style={{
              marginTop: 10,
              padding: 12,
              border: '1px dashed var(--stq-border)',
              borderRadius: 12,
              background: 'var(--stq-bg)',
              fontSize: 13,
              color: 'var(--stq-text-mute)',
              fontStyle: 'italic',
            }}
          >
            Not defined yet
          </div>
          <Hint>
            A clear goal keeps the story, stations and later assistant
            suggestions aligned.
          </Hint>
        </Card>

        <Card icon="check-circle" eyebrow="Readiness" tone={tonefor(tourStatus)}>
          <ul style={listReset}>
            <li style={readinessLine}>
              <span>Stations</span>
              <strong>
                {stationCount.ready}/{stationCount.total} ready
              </strong>
            </li>
            {tourChecks
              .filter((c) => c.id !== 'tour.stations')
              .map((check) => (
                <li key={check.id} style={readinessLine}>
                  <span>{check.label}</span>
                  <StatusPill status={check.status} />
                </li>
              ))}
          </ul>
        </Card>

        <Card
          icon="download"
          eyebrow="Export blockers"
          tone={exportBlockers.length === 0 ? 'success' : 'warning'}
        >
          {exportBlockers.length === 0 ? (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                fontSize: 13,
                color: 'var(--stq-success)',
                fontWeight: 600,
              }}
            >
              <Icon name="check" size={14} color="var(--stq-success)" />
              Ready to export
            </div>
          ) : (
            <>
              <div
                style={{
                  fontSize: 12,
                  color: 'var(--stq-text-mute)',
                  marginBottom: 6,
                }}
              >
                Cannot export yet:
              </div>
              <ul style={listReset}>
                {exportBlockers.map((check) => (
                  <li key={check.id} style={blockerLine}>
                    <Icon
                      name="x"
                      size={11}
                      color="var(--stq-error)"
                    />
                    <span>{check.message ?? check.label}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </Card>

        <Card icon="route" eyebrow="Route summary" tone="default">
          <DefList>
            <DefRow
              label="Stations"
              value={`${draft.stations.length} station${draft.stations.length === 1 ? '' : 's'}`}
            />
            <DefRow
              label="Distance"
              value={tour.distance || placeholder('Not measured')}
            />
            <DefRow
              label="Recorded route"
              value={
                draft.recordedRoute.length > 0
                  ? `${draft.recordedRoute.length} GPS points`
                  : placeholder('No route reviewed yet')
              }
            />
          </DefList>
        </Card>

        <AssistantSlot
          section="plan"
          title="Plan assistant"
          description={
            aiNotice ??
            'Mock boundary enabled for concept suggestions. Output stays reviewable and is never auto-applied.'
          }
          checks={tourChecks}
          actions={assistantActions}
          suggestions={assistantSuggestions}
        />
      </div>
    </div>
  );
}

type CardTone = 'default' | 'muted' | 'success' | 'warning';

function Card({
  icon,
  eyebrow: eyebrowText,
  tone,
  children,
}: {
  icon: IconName;
  eyebrow: string;
  tone: CardTone;
  children: React.ReactNode;
}) {
  return (
    <section style={cardStyle(tone)}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          marginBottom: 10,
        }}
      >
        <span
          style={{
            display: 'inline-grid',
            placeItems: 'center',
            width: 26,
            height: 26,
            borderRadius: 8,
            background: 'rgba(144, 74, 72, 0.08)',
            color: 'var(--stq-primary)',
          }}
        >
          <Icon name={icon} size={14} />
        </span>
        <div style={eyebrow}>{eyebrowText}</div>
      </div>
      {children}
    </section>
  );
}

function DefList({ children }: { children: React.ReactNode }) {
  return (
    <dl
      style={{
        margin: 0,
        display: 'grid',
        gridTemplateColumns: '1fr auto',
        rowGap: 6,
        columnGap: 12,
        fontSize: 13,
      }}
    >
      {children}
    </dl>
  );
}

function DefRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <>
      <dt style={{ color: 'var(--stq-text-mute)' }}>{label}</dt>
      <dd style={{ margin: 0, fontWeight: 600, textAlign: 'right' }}>{value}</dd>
    </>
  );
}

function StatusPill({ status }: { status: ReadinessStatus }) {
  const tone = readinessTone(status);
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
      {statusLabel(status)}
    </span>
  );
}

function Hint({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: 10,
        fontSize: 11,
        color: 'var(--stq-text-mute)',
      }}
    >
      {children}
    </div>
  );
}

function placeholder(text: string) {
  return (
    <span
      style={{
        color: 'var(--stq-text-mute)',
        fontStyle: 'italic',
        fontWeight: 400,
      }}
    >
      {text}
    </span>
  );
}

function languagesSummary(tour: TourDraft['tour']): string {
  const ready = LOCALES.filter((l) => tour[l].title.trim()).map(
    (l) => LOCALE_LABELS[l],
  );
  if (ready.length === 0) return 'None set yet';
  if (ready.length === LOCALES.length) return 'All three';
  return ready.join(', ');
}

function statusLabel(status: ReadinessStatus): string {
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

function tonefor(status: ReadinessStatus): CardTone {
  if (status === 'problem' || status === 'missing') return 'warning';
  if (status === 'draft') return 'default';
  return 'success';
}

function readinessTone(status: ReadinessStatus) {
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

function cardStyle(tone: CardTone): CSSProperties {
  const base: CSSProperties = {
    background: 'white',
    border: '1px solid var(--stq-border)',
    borderRadius: 18,
    padding: 16,
    boxShadow: 'var(--stq-shadow-soft)',
  };
  if (tone === 'muted') {
    return { ...base, background: 'var(--stq-bg)' };
  }
  if (tone === 'warning') {
    return {
      ...base,
      borderColor: 'rgba(176,49,49,0.25)',
      background: 'rgba(176,49,49,0.03)',
    };
  }
  if (tone === 'success') {
    return {
      ...base,
      borderColor: 'rgba(65,104,52,0.25)',
      background: 'rgba(65,104,52,0.04)',
    };
  }
  return base;
}

const eyebrow: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.14em',
  color: 'var(--stq-primary)',
  textTransform: 'uppercase',
};

const listReset: CSSProperties = {
  margin: 0,
  padding: 0,
  listStyle: 'none',
  display: 'flex',
  flexDirection: 'column',
  gap: 6,
};

const readinessLine: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'space-between',
  fontSize: 13,
};

const blockerLine: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  fontSize: 12.5,
  color: 'var(--stq-text)',
  lineHeight: 1.45,
};
