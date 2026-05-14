import { useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useDraft } from '@/hooks/useDraft';
import { Studio } from '@/components/studio/Studio';
import { createDraft } from '@/storage';

export function TourEditorPage() {
  const { draftId } = useParams();
  const navigate = useNavigate();
  const { draft, update, status, error, reload } = useDraft(draftId);

  useEffect(() => {
    console.info('[TourEditorPage] route mounted', { tourId: draftId });
  }, [draftId]);

  async function handleCreateTour() {
    const next = await createDraft();
    navigate(`/tours/${next.draftId}`);
  }

  function handleSelectDraft(id: string) {
    navigate(`/tours/${id}`);
  }

  if (status === 'loading') {
    return <DraftLoadingState />;
  }

  if (status === 'not_found' || status === 'error' || !draft) {
    return (
      <DraftErrorState
        variant={status === 'not_found' ? 'not_found' : 'error'}
        error={error}
        tourId={draftId}
        onRetry={reload}
        onBack={() => navigate('/tours')}
      />
    );
  }

  return (
    <Studio
      draft={draft}
      onChange={update}
      onCreateTour={handleCreateTour}
      onSelectDraft={handleSelectDraft}
    />
  );
}

function DraftLoadingState() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
      }}
    >
      <p className="text-bodySm text-disabled">Loading draft…</p>
    </div>
  );
}

interface DraftErrorStateProps {
  variant: 'not_found' | 'error';
  error: Error | null;
  tourId: string | undefined;
  onRetry: () => void;
  onBack: () => void;
}

function DraftErrorState({
  variant,
  error,
  tourId,
  onRetry,
  onBack,
}: DraftErrorStateProps) {
  const title =
    variant === 'not_found'
      ? 'Tour nicht gefunden'
      : 'Draft konnte nicht geladen werden';
  const description =
    variant === 'not_found'
      ? `Es existiert keine Tour mit der ID „${tourId ?? ''}". Sie wurde möglicherweise gelöscht oder noch nicht auf diesem Gerät erstellt.`
      : 'Beim Laden des Drafts ist ein Fehler aufgetreten. Das passiert manchmal, wenn der Browser den lokalen Speicher blockiert (z. B. im Privat-Modus).';

  return (
    <div
      role="alert"
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: 'var(--stq-color-bg, #fff8f7)',
        color: 'var(--stq-color-text, #2b1f1c)',
      }}
    >
      <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
        <h1 style={{ fontSize: 20, marginBottom: 12, fontWeight: 700 }}>
          {title}
        </h1>
        <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 16 }}>
          {description}
        </p>
        {error?.message && variant === 'error' && (
          <pre
            style={{
              fontSize: 12,
              lineHeight: 1.4,
              padding: '8px 12px',
              marginBottom: 16,
              background: 'rgba(0,0,0,0.04)',
              border: '1px solid rgba(0,0,0,0.08)',
              borderRadius: 8,
              whiteSpace: 'pre-wrap',
              textAlign: 'left',
              maxHeight: 160,
              overflow: 'auto',
            }}
          >
            {error.message}
          </pre>
        )}
        <div
          style={{
            display: 'flex',
            gap: 10,
            justifyContent: 'center',
            flexWrap: 'wrap',
          }}
        >
          {variant === 'error' && (
            <button
              type="button"
              onClick={onRetry}
              className="btn-primary"
              style={{ minWidth: 140 }}
            >
              Erneut versuchen
            </button>
          )}
          <button
            type="button"
            onClick={onBack}
            className="btn-ghost"
            style={{ minWidth: 140 }}
          >
            Zurück zur Übersicht
          </button>
        </div>
      </div>
    </div>
  );
}
