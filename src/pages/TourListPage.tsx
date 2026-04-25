import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  createDraft,
  deleteDraft,
  duplicateDraft,
  listDrafts,
} from '@/storage';
import {
  DraftExportValidationError,
  downloadDraftExportZip,
} from '@/export/tourExport';
import { DEFAULT_LOCALE, type TourDraft } from '@/schema';
import { Icon } from '@/components/studio/Icon';
import { tourCompleteness } from '@/components/studio/completeness';

type Filter = 'all' | 'in-progress' | 'draft' | 'published';

interface DraftStatusInfo {
  status: Exclude<Filter, 'all'>;
  label: string;
  color: string;
}

function statusFor(draft: TourDraft): DraftStatusInfo {
  const { percent } = tourCompleteness(draft, DEFAULT_LOCALE);
  if (percent === 100) {
    return { status: 'published', label: 'Ready', color: 'var(--stq-success)' };
  }
  if (percent >= 25) {
    return {
      status: 'in-progress',
      label: 'Drafting',
      color: 'var(--stq-amber)',
    };
  }
  return { status: 'draft', label: 'Draft', color: 'var(--stq-text-mute)' };
}

function pickContent(draft: TourDraft) {
  const title =
    draft.tour.en.title ||
    draft.tour.de.title ||
    draft.tour.it.title ||
    'Untitled tour';
  const location =
    draft.tour.en.location ||
    draft.tour.de.location ||
    draft.tour.it.location ||
    'Location pending';
  const duration =
    draft.tour.en.duration ||
    draft.tour.de.duration ||
    draft.tour.it.duration ||
    '—';
  return { title, location, duration };
}

function coverHueFor(draft: TourDraft): number {
  // Stable per-draft hue derived from id so cards look distinct but consistent.
  let h = 0;
  for (const ch of draft.draftId) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  return h % 360;
}

export function TourListPage() {
  const navigate = useNavigate();
  const drafts = useLiveQuery(() => listDrafts(), []);
  const [exportingDraftId, setExportingDraftId] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [filter, setFilter] = useState<Filter>('all');

  const filtered = useMemo(() => {
    if (!drafts) return undefined;
    return drafts.filter((draft) => {
      if (filter !== 'all' && statusFor(draft).status !== filter) return false;
      if (query) {
        const { title, location } = pickContent(draft);
        const haystack = (title + ' ' + location).toLowerCase();
        if (!haystack.includes(query.toLowerCase())) return false;
      }
      return true;
    });
  }, [drafts, filter, query]);

  async function onNew() {
    const draft = await createDraft();
    navigate(`/tours/${draft.draftId}`);
  }

  async function onDuplicate(draftId: string) {
    const copy = await duplicateDraft(draftId);
    if (copy) navigate(`/tours/${copy.draftId}`);
  }

  async function onDelete(draftId: string) {
    if (!confirm('Delete this draft? This cannot be undone.')) return;
    await deleteDraft(draftId);
  }

  async function onExport(draftId: string) {
    if (!drafts) return;
    const draft = drafts.find((entry) => entry.draftId === draftId);
    if (!draft) return;

    setExportError(null);
    setExportingDraftId(draftId);
    try {
      const result = await downloadDraftExportZip(draft);
      const notice = formatSuccessfulExport(result);
      if (notice) {
        alert(notice);
      }
    } catch (error) {
      setExportError(formatExportError(error));
    } finally {
      setExportingDraftId((current) =>
        current === draftId ? null : current,
      );
    }
  }

  return (
    <section className="flex flex-col gap-5">
      <HeroCard onNew={onNew} />

      {exportError && <p className="text-bodySm text-error">{exportError}</p>}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-labelSm uppercase tracking-[0.18em] text-primary/75">
            Local drafts
          </p>
          <h2
            style={{
              fontFamily: 'Lato, Georgia, serif',
              fontSize: 26,
              fontWeight: 700,
              letterSpacing: '-0.01em',
              margin: '2px 0 0',
            }}
          >
            Choose a tour
          </h2>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="stq-search">
            <span className="stq-search__icon">
              <Icon name="search" size={14} />
            </span>
            <input
              className="stq-search__input"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search places, titles…"
            />
          </div>
          <div className="studio-seg">
            {(
              [
                ['all', 'All'],
                ['in-progress', 'Drafting'],
                ['draft', 'Draft'],
                ['published', 'Done'],
              ] as const
            ).map(([key, label]) => (
              <button
                key={key}
                type="button"
                className={filter === key ? 'active' : ''}
                onClick={() => setFilter(key)}
              >
                {label}
              </button>
            ))}
          </div>
          <button className="studio-btn-primary" onClick={onNew}>
            <Icon name="plus" size={15} />
            New tour
          </button>
        </div>
      </div>

      {filtered === undefined ? (
        <p className="text-bodySm text-disabled">Loading…</p>
      ) : filtered.length === 0 ? (
        drafts && drafts.length === 0 ? (
          <EmptyState onNew={onNew} />
        ) : (
          <p className="text-bodySm text-disabled">
            No tours match the current search or filter.
          </p>
        )
      ) : (
        <ul className="stq-tour-grid">
          {filtered.map((draft, idx) => (
            <li key={draft.draftId} style={{ listStyle: 'none' }}>
              <DraftCard
                draft={draft}
                index={idx}
                exporting={exportingDraftId === draft.draftId}
                onOpen={() => navigate(`/tours/${draft.draftId}`)}
                onDuplicate={() => onDuplicate(draft.draftId)}
                onDelete={() => onDelete(draft.draftId)}
                onExport={() => onExport(draft.draftId)}
              />
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function HeroCard({ onNew }: { onNew: () => void }) {
  return (
    <section className="stq-list-hero">
      <div>
        <span className="studio-chip" style={{ background: 'white' }}>
          <span
            style={{
              width: 6,
              height: 6,
              borderRadius: 9999,
              background: 'var(--stq-primary)',
              display: 'inline-block',
            }}
          />
          Field Authoring · v0.1
        </span>
        <h1 className="stq-list-hero__title">
          Build the tour on the street,{' '}
          <em>not later at a desk.</em>
        </h1>
        <p className="stq-list-hero__lead">
          Capture a place, write the story, test the riddle, and walk the route
          — with the same visual language the tourist will see in the native
          app.
        </p>
        <div className="stq-list-hero__cta">
          <button className="studio-btn-primary" onClick={onNew}>
            <Icon name="plus" size={15} />
            Start a new tour
          </button>
          <span
            className="studio-chip"
            style={{ background: 'white', color: 'var(--stq-text-mute)' }}
          >
            <Icon name="wifi-off" size={12} />
            Works offline · installable PWA
          </span>
        </div>
      </div>
      <HeroMap />
    </section>
  );
}

function HeroMap() {
  // Decorative — abstract route polyline mirroring the design's preview.
  const points: Array<[number, number]> = [
    [22, 68],
    [31, 58],
    [39, 50],
    [50, 43],
    [60, 37],
    [69, 30],
    [78, 24],
    [86, 19],
  ];
  function smooth(p: typeof points): string {
    if (p.length < 2) return '';
    let d = `M ${p[0][0]} ${p[0][1]}`;
    for (let i = 1; i < p.length; i++) {
      const prev = p[i - 1];
      const curr = p[i];
      const mx = (prev[0] + curr[0]) / 2;
      const my = (prev[1] + curr[1]) / 2;
      d += ` Q ${prev[0]} ${prev[1]} ${mx} ${my}`;
    }
    d += ` T ${p[p.length - 1][0]} ${p[p.length - 1][1]}`;
    return d;
  }
  const route = smooth(points);
  return (
    <div className="stq-list-hero__map" aria-hidden>
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          overflow: 'visible',
        }}
      >
        <path
          d={route}
          stroke="var(--stq-primary)"
          strokeWidth="0.8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.4"
        />
        <path
          d={route}
          stroke="var(--stq-primary)"
          strokeWidth="0.8"
          fill="none"
          strokeLinecap="round"
          strokeLinejoin="round"
          opacity="0.95"
          strokeDasharray="10 6"
        />
      </svg>
      {points.map(([x, y], i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${x}%`,
            top: `${y}%`,
            transform: 'translate(-50%, -100%)',
            width: 22,
            height: 22,
            borderRadius: 9999,
            background: 'var(--stq-primary)',
            color: 'white',
            display: 'grid',
            placeItems: 'center',
            fontWeight: 700,
            fontSize: 11,
            border: '2px solid var(--stq-bg)',
            boxShadow: '0 6px 14px rgba(35,25,25,0.2)',
          }}
        >
          {i + 1}
        </div>
      ))}
    </div>
  );
}

function DraftCard({
  draft,
  index,
  exporting,
  onOpen,
  onDuplicate,
  onDelete,
  onExport,
}: {
  draft: TourDraft;
  index: number;
  exporting: boolean;
  onOpen: () => void;
  onDuplicate: () => void;
  onDelete: () => void;
  onExport: () => void;
}) {
  const { title, location, duration } = pickContent(draft);
  const status = statusFor(draft);
  const stats = tourCompleteness(draft, DEFAULT_LOCALE);
  const updated = new Date(draft.updatedAt).toLocaleDateString();
  const hue = coverHueFor(draft);
  const stations = draft.stations.length;
  const distance = draft.tour.distance || '—';
  const tourNumber = draft.tour.number ?? index + 1;

  return (
    <article className="stq-tour-card">
      <button
        type="button"
        onClick={onOpen}
        className="stq-tour-card__cover"
        style={{
          appearance: 'none',
          border: 0,
          padding: 0,
          width: '100%',
          cursor: 'pointer',
          background: `
            radial-gradient(circle at 30% 30%, oklch(0.85 0.08 ${hue}), transparent 55%),
            radial-gradient(circle at 75% 70%, oklch(0.55 0.09 ${hue}), transparent 50%),
            linear-gradient(135deg, oklch(0.65 0.10 ${hue}) 0%, oklch(0.40 0.11 ${hue}) 100%)
          `,
        }}
        aria-label={`Open ${title}`}
      >
        <span className="stq-tour-card__cover-status">
          <span
            className="studio-chip"
            style={{
              padding: '3px 9px',
              fontSize: 10.5,
              background: 'rgba(255,255,255,0.95)',
            }}
          >
            <span
              className="studio-dot"
              style={{ background: status.color }}
            />
            {status.label}
          </span>
        </span>
        <span className="stq-tour-card__cover-eyebrow">
          TOUR · {String(tourNumber).padStart(2, '0')}
        </span>
        <span
          className="stq-tour-card__cover-label"
          style={{ left: 'auto', right: 12, bottom: 10 }}
        >
          {location}
        </span>
      </button>
      <div className="stq-tour-card__body">
        <h3 className="stq-tour-card__title">{title}</h3>
        <div className="stq-tour-card__meta">
          <span>
            <Icon name="compass" size={11} />
            {duration}
          </span>
          <span>
            <Icon name="route" size={11} />
            {distance}
          </span>
          <span>
            <Icon name="map-pin" size={11} />
            {stations} stop{stations === 1 ? '' : 's'}
          </span>
        </div>

        <div className="studio-progress" style={{ marginTop: 8 }}>
          <div style={{ width: `${stats.percent}%` }} />
        </div>
        <div className="stq-tour-card__progress-row">
          <span>{stats.percent}% complete</span>
          <span>Updated {updated}</span>
        </div>

        <div className="stq-tour-card__actions">
          <button className="btn-primary" onClick={onOpen}>
            Open
          </button>
          <button
            className="stq-icon-btn"
            type="button"
            title="Duplicate"
            onClick={onDuplicate}
          >
            <Icon name="copy" size={14} />
          </button>
          <button
            className="stq-icon-btn"
            type="button"
            title="Export ZIP"
            onClick={onExport}
            disabled={exporting}
          >
            <Icon name="download" size={14} />
          </button>
          <button
            className="stq-icon-btn stq-icon-btn--danger"
            type="button"
            title="Delete"
            onClick={onDelete}
          >
            <Icon name="trash" size={14} />
          </button>
        </div>
      </div>
    </article>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="card flex flex-col items-center gap-3 py-12 text-center">
      <div className="rounded-full border border-border bg-background px-4 py-2 text-labelLg text-primary">
        No drafts yet
      </div>
      <p className="max-w-md font-body text-body text-text/90">
        Start the first tour draft and use the phone workflow to capture places,
        stories, riddles, and the walked route.
      </p>
      <button className="btn-primary" onClick={onNew}>
        + New tour
      </button>
    </div>
  );
}

function formatExportError(error: unknown): string {
  if (error instanceof DraftExportValidationError) {
    const lines = error.errors.slice(0, 8).map((e) => `• ${e.path}: ${e.message}`);
    const extra =
      error.errors.length > 8 ? `\n…and ${error.errors.length - 8} more` : '';
    return `Cannot export — please fix:\n${lines.join('\n')}${extra}`;
  }
  return error instanceof Error ? error.message : 'Could not export this draft.';
}

function formatSuccessfulExport(result: Awaited<ReturnType<typeof downloadDraftExportZip>>) {
  const notes: string[] = [];

  if (result.missingBlobIds.length > 0) {
    notes.push(
      `${result.missingBlobIds.length} image(s) were missing in local storage and kept as existing imagePath values.`,
    );
  }

  if (result.validationWarnings.length > 0) {
    const lines = result.validationWarnings
      .slice(0, 4)
      .map((warning) => `• ${warning.message}`);
    const extra =
      result.validationWarnings.length > 4
        ? `\n…and ${result.validationWarnings.length - 4} more warning(s)`
        : '';
    notes.push(`Warnings:\n${lines.join('\n')}${extra}`);
  }

  if (notes.length === 0) {
    return null;
  }

  return `Export complete (${result.fileName}).\n${notes.join('\n\n')}`;
}
