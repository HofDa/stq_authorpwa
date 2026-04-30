import { Suspense, lazy, useMemo, type CSSProperties } from 'react';
import type { Locale, RiddleEntry, TourDraft } from '@/schema';
import { useDerivedStationRoutes } from '@/components/map/useDerivedStationRoutes';
import { buildAssistantAction } from '@/services/ai/agentActions';
import {
  formatDistanceMeters,
  formatStationLabel,
} from '@/components/map/liveRoutePlannerUtils';
import { Icon, type IconName } from '../Icon';
import {
  AssistantSlot,
  useAssistantSuggestions,
  type AssistantAction,
} from '../assistant';
import type { LocalCheck } from '../readiness';

const LiveRoutePlannerPanel = lazy(async () => {
  const module = await import('@/components/map/LiveRoutePlannerPanel');
  return { default: module.LiveRoutePlannerPanel };
});

interface Props {
  draft: TourDraft;
  locale: Locale;
  onChange: (
    patch: Partial<TourDraft> | ((prev: TourDraft) => TourDraft),
  ) => void;
}

/**
 * Route workspace — answers "does the path work?".
 *
 * Map dominates the left two-thirds. The right column lists derived
 * segments (one per station, sorted by station number), distance/point
 * stats, and any warnings from `deriveStationPathsFromRecordedRoute`. The
 * Route assistant slot is inert until the AI provider lands.
 *
 * Recording controls themselves still live in the Stations workspace
 * (Map mode); this view is for reviewing the route once it's been walked.
 */
export function RouteWorkspace({ draft, locale, onChange }: Props) {
  const { suggestions } = useAssistantSuggestions({
    section: 'route',
    draft,
    locale,
  });
  const derived = useDerivedStationRoutes({
    stations: draft.stations,
    recordedRoute: draft.recordedRoute,
    toleranceMeters: 12,
    selectedStationId: draft.stations[0]?.id ?? '',
  });

  const segmentRows = useMemo<SegmentRow[]>(() => {
    const byId = new Map(
      derived.derivation.stationPaths.map((path) => [path.stationId, path]),
    );
    return [...draft.stations]
      .sort((a, b) => a.number - b.number)
      .map((station) => {
        const path = byId.get(station.id);
        return {
          station,
          distanceMeters: path?.distanceMeters ?? null,
          pointCount: path?.pointCount ?? 0,
          longSegment:
            path?.distanceMeters != null && path.distanceMeters > 1500,
        };
      });
  }, [derived.derivation.stationPaths, draft.stations]);

  const checks = useMemo<LocalCheck[]>(() => {
    const result: LocalCheck[] = [];
    result.push({
      id: 'route.stations',
      label: 'Stations on the loop',
      status: draft.stations.length > 0 ? 'ready' : 'missing',
      severity: 'warning',
      message:
        draft.stations.length === 0
          ? 'Add a station before reviewing the route.'
          : `${draft.stations.length} station${
              draft.stations.length === 1 ? '' : 's'
            }.`,
      target: { section: 'route' },
    });
    result.push({
      id: 'route.recorded',
      label: 'Recorded GPS points',
      status:
        draft.recordedRoute.length > 0
          ? draft.recordedRoute.length >= 10
            ? 'ready'
            : 'draft'
          : 'missing',
      severity: 'warning',
      message:
        draft.recordedRoute.length > 0
          ? `${draft.recordedRoute.length} raw points / ${derived.derivation.optimizedRoute.length} optimized.`
          : 'No GPS track yet — walk or trace the route.',
      target: { section: 'route', field: 'recordedRoute' },
    });
    const longSegments = segmentRows.filter((row) => row.longSegment).length;
    result.push({
      id: 'route.longSegments',
      label: 'Long segments',
      status: longSegments === 0 ? 'ready' : 'problem',
      severity: longSegments === 0 ? 'info' : 'warning',
      message:
        longSegments === 0
          ? 'No segment exceeds the 1.5 km soft limit.'
          : `${longSegments} segment${longSegments === 1 ? '' : 's'} exceed 1.5 km.`,
      target: { section: 'route', field: 'segments' },
    });
    return result;
  }, [
    draft.stations.length,
    draft.recordedRoute.length,
    derived.derivation.optimizedRoute.length,
    segmentRows,
  ]);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1fr) 340px',
        gap: 14,
        height: '100%',
        minHeight: 0,
        minWidth: 0,
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
        <header style={{ padding: '4px 4px 0' }}>
          <div style={eyebrowStyle}>Route</div>
          <h1
            style={{
              fontFamily: 'Lato, Georgia, serif',
              fontSize: 22,
              fontWeight: 700,
              margin: '4px 0 0',
            }}
          >
            Does the path work?
          </h1>
          <p
            style={{
              margin: '4px 0 0',
              color: 'var(--stq-text-mute)',
              fontSize: 13,
            }}
          >
            Walk the loop in Stations · Map mode to record points; review the
            stitched-together segments here. Story order and distance review
            stay separate.
          </p>
        </header>
        <div
          style={{
            flex: 1,
            borderRadius: 20,
            overflow: 'hidden',
            position: 'relative',
            border: '1px solid var(--stq-border)',
            boxShadow: 'var(--stq-shadow-card)',
            minHeight: 0,
          }}
        >
          <Suspense fallback={<MapFallback />}>
            <LiveRoutePlannerPanel draft={draft} onChange={onChange} />
          </Suspense>
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
            icon="route"
            eyebrow="Route stats"
            title="Recording overview"
          />
          <StatsGrid
            rawPointCount={draft.recordedRoute.length}
            optimizedPointCount={derived.derivation.optimizedRoute.length}
            rawDistanceMeters={derived.rawDistanceMeters}
            optimizedDistanceMeters={derived.optimizedDistanceMeters}
          />
        </Card>

        <Card>
          <CardHeader
            icon="map-pin"
            eyebrow="Segments"
            title={`${segmentRows.length} stop${segmentRows.length === 1 ? '' : 's'} in story order`}
          />
          {segmentRows.length === 0 ? (
            <Empty>Add stations to see per-segment distances here.</Empty>
          ) : (
            <ol style={listReset}>
              {segmentRows.map((row) => (
                <li key={row.station.id} style={segmentRow}>
                  <span style={pinStyle}>{row.station.number}</span>
                  <span style={{ flex: 1, minWidth: 0 }}>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 12.5,
                        fontWeight: 600,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {formatStationLabel(row.station, locale)}
                    </span>
                    <span
                      style={{
                        display: 'block',
                        fontSize: 11,
                        color: 'var(--stq-text-mute)',
                      }}
                    >
                      {row.pointCount > 0
                        ? `${row.pointCount} points`
                        : 'No segment derived yet'}
                    </span>
                  </span>
                  <span
                    style={{
                      fontSize: 12,
                      fontWeight: 700,
                      color: row.longSegment
                        ? 'var(--stq-error)'
                        : 'var(--stq-text)',
                    }}
                  >
                    {row.distanceMeters != null
                      ? formatDistanceMeters(row.distanceMeters)
                      : '—'}
                  </span>
                </li>
              ))}
            </ol>
          )}
        </Card>

        {derived.derivation.warnings.length > 0 && (
          <Card>
            <CardHeader
              icon="wifi-off"
              eyebrow="Warnings"
              title="Things to double-check"
              tone="warning"
            />
            <ul style={listReset}>
              {derived.derivation.warnings.map((warning) => (
                <li key={warning} style={warningRow}>
                  <Icon name="x" size={11} color="var(--stq-error)" />
                  <span>{warning}</span>
                </li>
              ))}
            </ul>
          </Card>
        )}

        <AssistantSlot
          section="route"
          title="Route assistant"
          description="Will flag long segments, awkward backtracks and route-vs-story-order mismatches. Local checks plus offline suggestions until the AI provider is wired up."
          checks={checks}
          actions={ROUTE_ACTIONS}
          suggestions={suggestions}
        />
      </aside>
    </div>
  );
}

const ROUTE_ACTIONS: AssistantAction[] = [
  buildAssistantAction('route.reviewRoute', {
    description: 'Disabled until the AI provider is connected.',
    disabled: true,
  }),
];

interface SegmentRow {
  station: RiddleEntry;
  distanceMeters: number | null;
  pointCount: number;
  longSegment: boolean;
}

function StatsGrid({
  rawPointCount,
  optimizedPointCount,
  rawDistanceMeters,
  optimizedDistanceMeters,
}: {
  rawPointCount: number;
  optimizedPointCount: number;
  rawDistanceMeters: number;
  optimizedDistanceMeters: number;
}) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 1fr',
        gap: 8,
      }}
    >
      <Stat label="Raw points" value={String(rawPointCount)} />
      <Stat label="Optimized" value={String(optimizedPointCount)} />
      <Stat
        label="Raw distance"
        value={formatDistanceMeters(rawDistanceMeters)}
      />
      <Stat
        label="Optimized distance"
        value={formatDistanceMeters(optimizedDistanceMeters)}
      />
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div
      style={{
        background: 'var(--stq-bg)',
        borderRadius: 10,
        padding: '6px 10px',
      }}
    >
      <div
        style={{
          fontSize: 10,
          fontWeight: 700,
          letterSpacing: '0.08em',
          color: 'var(--stq-text-mute)',
          textTransform: 'uppercase',
        }}
      >
        {label}
      </div>
      <div style={{ fontSize: 14, fontWeight: 700, marginTop: 2 }}>{value}</div>
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
  icon,
  eyebrow,
  title,
  tone = 'default',
}: {
  icon: IconName;
  eyebrow: string;
  title: string;
  tone?: 'default' | 'warning';
}) {
  const accent =
    tone === 'warning' ? 'var(--stq-error)' : 'var(--stq-primary)';
  return (
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
          color: accent,
        }}
      >
        <Icon name={icon} size={14} />
      </span>
      <div>
        <div style={{ ...eyebrowStyle, color: accent }}>{eyebrow}</div>
        <div
          style={{
            fontFamily: 'Lato, Georgia, serif',
            fontSize: 14.5,
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        padding: 10,
        border: '1px dashed var(--stq-border)',
        borderRadius: 12,
        background: 'var(--stq-bg)',
        fontSize: 12.5,
        color: 'var(--stq-text-mute)',
        lineHeight: 1.5,
        fontStyle: 'italic',
      }}
    >
      {children}
    </div>
  );
}

function MapFallback() {
  return (
    <div
      style={{
        display: 'grid',
        placeItems: 'center',
        height: '100%',
        color: 'var(--stq-text-mute)',
        fontSize: 12,
      }}
    >
      Loading map…
    </div>
  );
}

const eyebrowStyle: CSSProperties = {
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

const segmentRow: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 10,
  padding: '6px 8px',
  borderRadius: 10,
  border: '1px solid var(--stq-border-soft)',
  background: 'var(--stq-bg)',
};

const pinStyle: CSSProperties = {
  display: 'inline-grid',
  placeItems: 'center',
  width: 24,
  height: 24,
  borderRadius: 999,
  background: 'rgba(144, 74, 72, 0.1)',
  color: 'var(--stq-primary)',
  fontSize: 11,
  fontWeight: 700,
  flexShrink: 0,
};

const warningRow: CSSProperties = {
  display: 'flex',
  alignItems: 'flex-start',
  gap: 8,
  fontSize: 12.5,
  color: 'var(--stq-text)',
  lineHeight: 1.45,
};
