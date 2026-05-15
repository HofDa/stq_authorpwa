import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createDraft, listDrafts } from '@/storage';
import type { TourDraft } from '@/schema';

type RedirectStatus = 'loading' | 'error';

export function TourRedirectPage() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<RedirectStatus>('loading');
  const [error, setError] = useState<Error | null>(null);
  const [reloadKey, setReloadKey] = useState(0);
  const creatingRef = useRef(false);

  useEffect(() => {
    let cancelled = false;
    setStatus('loading');
    setError(null);
    console.info('[TourRedirectPage] load started');

    async function run() {
      let drafts: TourDraft[];
      try {
        drafts = await listDrafts();
      } catch (err) {
        if (cancelled) return;
        console.error('[TourRedirectPage] listDrafts failed', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus('error');
        return;
      }

      if (cancelled) return;

      if (drafts.length > 0) {
        console.info('[TourRedirectPage] redirecting to existing draft', {
          tourId: drafts[0].draftId,
        });
        navigate(`/tours/${drafts[0].draftId}`, { replace: true });
        return;
      }

      if (creatingRef.current) return;
      creatingRef.current = true;
      try {
        const draft = await createDraft();
        if (cancelled) return;
        console.info('[TourRedirectPage] created new draft', {
          tourId: draft.draftId,
        });
        navigate(`/tours/${draft.draftId}`, { replace: true });
      } catch (err) {
        if (cancelled) return;
        console.error('[TourRedirectPage] createDraft failed', err);
        setError(err instanceof Error ? err : new Error(String(err)));
        setStatus('error');
      } finally {
        creatingRef.current = false;
      }
    }

    run();

    return () => {
      cancelled = true;
    };
  }, [navigate, reloadKey]);

  if (status === 'error') {
    return (
      <div
        role="alert"
        style={{
          minHeight: '100dvh',
          display: 'grid',
          placeItems: 'center',
          padding: 24,
        }}
      >
        <div style={{ maxWidth: 440, width: '100%', textAlign: 'center' }}>
          <h1 style={{ fontSize: 20, marginBottom: 12, fontWeight: 700 }}>
            Draft konnte nicht geladen werden
          </h1>
          <p style={{ fontSize: 14, lineHeight: 1.5, marginBottom: 16 }}>
            Der lokale Speicher konnte nicht gelesen werden. Das passiert manchmal
            im Privat-Modus oder wenn der Browser-Speicher voll ist.
          </p>
          {error?.message && (
            <pre
              style={{
                fontSize: 12,
                lineHeight: 1.4,
                padding: '8px 12px',
                marginBottom: 16,
                background: 'var(--stq-alpha-code-bg)',
                border: '1px solid var(--stq-alpha-code-border)',
                borderRadius: 'var(--stq-radius-sm)',
                whiteSpace: 'pre-wrap',
                textAlign: 'left',
                maxHeight: 160,
                overflow: 'auto',
              }}
            >
              {error.message}
            </pre>
          )}
          <button
            type="button"
            onClick={() => setReloadKey((v) => v + 1)}
            className="btn-primary"
          >
            Erneut versuchen
          </button>
        </div>
      </div>
    );
  }

  return <p className="text-bodySm text-disabled">Loading draft...</p>;
}
