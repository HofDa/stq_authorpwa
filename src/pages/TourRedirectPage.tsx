import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import { createDraft, listDrafts } from '@/storage';

export function TourRedirectPage() {
  const navigate = useNavigate();
  const drafts = useLiveQuery(() => listDrafts(), []);
  const creatingRef = useRef(false);

  useEffect(() => {
    if (!drafts) return;

    if (drafts.length > 0) {
      navigate(`/tours/${drafts[0].draftId}`, { replace: true });
      return;
    }

    if (creatingRef.current) return;
    creatingRef.current = true;
    createDraft()
      .then((draft) => {
        navigate(`/tours/${draft.draftId}`, { replace: true });
      })
      .finally(() => {
        creatingRef.current = false;
      });
  }, [drafts, navigate]);

  return <p className="text-bodySm text-disabled">Loading draft...</p>;
}
