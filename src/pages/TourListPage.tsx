import { Link, useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  createDraft,
  deleteDraft,
  duplicateDraft,
  listDrafts,
} from '@/storage';

export function TourListPage() {
  const navigate = useNavigate();
  const drafts = useLiveQuery(() => listDrafts(), []);

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

  return (
    <section className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-h4 font-ui">Tour drafts</h1>
        <button className="btn-primary" onClick={onNew}>
          + New tour
        </button>
      </div>

      {drafts === undefined ? (
        <p className="text-bodySm text-disabled">Loading…</p>
      ) : drafts.length === 0 ? (
        <EmptyState onNew={onNew} />
      ) : (
        <ul className="flex flex-col gap-3">
          {drafts.map((d) => (
            <li key={d.draftId} className="card flex flex-col gap-2">
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link
                    to={`/tours/${d.draftId}`}
                    className="block truncate text-h6 text-primary"
                  >
                    {d.tour.en.title || d.tour.de.title || d.tour.it.title || 'Untitled tour'}
                  </Link>
                  <p className="text-bodySm text-disabled">
                    {d.stations.length} station{d.stations.length === 1 ? '' : 's'}
                    {' · '}
                    updated {new Date(d.updatedAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Link to={`/tours/${d.draftId}`} className="btn-ghost">
                  Open
                </Link>
                <button
                  className="btn-ghost"
                  onClick={() => onDuplicate(d.draftId)}
                >
                  Duplicate
                </button>
                <button
                  className="btn-ghost text-error"
                  onClick={() => onDelete(d.draftId)}
                >
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function EmptyState({ onNew }: { onNew: () => void }) {
  return (
    <div className="card flex flex-col items-center gap-3 py-10 text-center">
      <p className="text-h6">No drafts yet.</p>
      <p className="text-bodySm text-disabled">
        Create a tour to start authoring.
      </p>
      <button className="btn-primary" onClick={onNew}>
        + New tour
      </button>
    </div>
  );
}
