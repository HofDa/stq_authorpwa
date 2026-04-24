import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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

export function TourListPage() {
  const navigate = useNavigate();
  const drafts = useLiveQuery(() => listDrafts(), []);
  const [exportingDraftId, setExportingDraftId] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

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
      if (result.missingBlobIds.length > 0) {
        alert(
          `Export complete (${result.fileName}).\n` +
            `${result.missingBlobIds.length} image(s) were missing in local storage ` +
            'and kept as existing imagePath values.',
        );
      }
    } catch (error) {
      setExportError(formatExportError(error));
    } finally {
      setExportingDraftId((current) => (current === draftId ? null : current));
    }
  }

  function formatExportError(error: unknown): string {
    if (error instanceof DraftExportValidationError) {
      const lines = error.errors
        .slice(0, 8)
        .map((e) => `• ${e.path}: ${e.message}`);
      const extra = error.errors.length > 8 ? `\n…and ${error.errors.length - 8} more` : '';
      return `Cannot export — please fix:\n${lines.join('\n')}${extra}`;
    }
    return error instanceof Error ? error.message : 'Could not export this draft.';
  }

  return (
    <section className="flex flex-col gap-5">
      <HeroCard onNew={onNew} />
      {exportError && <p className="text-bodySm text-error">{exportError}</p>}

      <div className="flex items-center justify-between">
        <div>
          <p className="text-labelSm uppercase tracking-[0.18em] text-primary/75">
            Local Drafts
          </p>
          <h1 className="text-h4">Choose a Tour</h1>
        </div>
        <button className="btn-primary" onClick={onNew}>
          + New tour
        </button>
      </div>

      {drafts === undefined ? (
        <p className="text-bodySm text-disabled">Loading…</p>
      ) : drafts.length === 0 ? (
        <EmptyState onNew={onNew} />
      ) : (
        <ul className="flex flex-col gap-4">
          {drafts.map((draft) => (
            <li key={draft.draftId}>
              <DraftCard
                draft={draft}
                exporting={exportingDraftId === draft.draftId}
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
    <section className="stq-home-hero card overflow-hidden p-0">
      <div className="p-6 sm:p-7">
        <div className="inline-flex rounded-full border border-border bg-white/80 px-3 py-2 text-labelSm uppercase tracking-[0.18em] text-primary">
          Field Authoring
        </div>
        <h1 className="mt-4 max-w-xl text-[30px] font-bold leading-[1.05] text-text">
          Build the tour on the street, not later at a desk.
        </h1>
        <p className="mt-3 max-w-2xl font-body text-body leading-7 text-text/90">
          Capture the place, write the story, test the riddle, and walk the route
          with the same visual language the tourist sees in the native app.
        </p>

        <div className="mt-5 flex flex-wrap gap-2">
          <span className="stq-chip">Photo capture</span>
          <span className="stq-chip">Live GPS</span>
          <span className="stq-chip">Route planning</span>
          <span className="stq-chip">Three languages</span>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <button className="btn-primary" onClick={onNew}>
            Start a new tour
          </button>
          <div className="rounded-[20px] border border-border bg-white/80 px-4 py-3 text-bodySm text-disabled">
            Installable PWA for field work on a phone.
          </div>
        </div>
      </div>
    </section>
  );
}

function DraftCard({
  draft,
  exporting,
  onDuplicate,
  onDelete,
  onExport,
}: {
  draft: Awaited<ReturnType<typeof listDrafts>>[number];
  exporting: boolean;
  onDuplicate: () => void;
  onDelete: () => void;
  onExport: () => void;
}) {
  const title =
    draft.tour.en.title || draft.tour.de.title || draft.tour.it.title || 'Untitled tour';
  const location =
    draft.tour.en.location || draft.tour.de.location || draft.tour.it.location || 'Location pending';
  const duration =
    draft.tour.en.duration || draft.tour.de.duration || draft.tour.it.duration || 'Duration pending';

  return (
    <article className="card overflow-hidden p-0">
      <div className="stq-draft-cover px-5 py-5 text-white">
        <div className="inline-flex rounded-full bg-white/18 px-3 py-1.5 text-labelSm uppercase tracking-[0.18em] text-white/90">
          Draft Tour
        </div>
        <Link to={`/tours/${draft.draftId}`} className="mt-3 block text-h4 text-white">
          {title}
        </Link>
        <div className="mt-3 flex flex-wrap gap-2 text-labelSm text-white/90">
          <span className="rounded-full border border-white/20 bg-black/10 px-2.5 py-1">
            {draft.stations.length} station{draft.stations.length === 1 ? '' : 's'}
          </span>
          <span className="rounded-full border border-white/20 bg-black/10 px-2.5 py-1">
            {location}
          </span>
          <span className="rounded-full border border-white/20 bg-black/10 px-2.5 py-1">
            {duration}
          </span>
        </div>
      </div>

      <div className="p-5">
        <div className="flex flex-wrap gap-2">
          <StatPill label="Updated" value={new Date(draft.updatedAt).toLocaleDateString()} />
          <StatPill label="Slug" value={draft.tour.id} />
          <StatPill
            label="Route"
            value={draft.recordedRoute.length > 1 ? `${draft.recordedRoute.length} pts` : 'Not recorded'}
          />
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <Link to={`/tours/${draft.draftId}`} className="btn-primary">
            Open
          </Link>
          <button className="btn-ghost" onClick={onDuplicate}>
            Duplicate
          </button>
          <button className="btn-ghost" onClick={onExport} disabled={exporting}>
            {exporting ? 'Exporting…' : 'Export ZIP'}
          </button>
          <button className="btn-ghost text-error" onClick={onDelete}>
            Delete
          </button>
        </div>
      </div>
    </article>
  );
}

function StatPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-full border border-border bg-background px-3 py-1.5 text-bodySm">
      <span className="text-disabled">{label}:</span> {value}
    </div>
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
