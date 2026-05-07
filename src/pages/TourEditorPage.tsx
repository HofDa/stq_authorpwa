import { useNavigate, useParams } from 'react-router-dom';
import { useDraft } from '@/hooks/useDraft';
import { Studio } from '@/components/studio/Studio';
import { createDraft } from '@/storage';

export function TourEditorPage() {
  const { draftId } = useParams();
  const navigate = useNavigate();
  const { draft, update } = useDraft(draftId);

  async function handleCreateTour() {
    const next = await createDraft();
    navigate(`/tours/${next.draftId}`);
  }

  function handleSelectDraft(id: string) {
    navigate(`/tours/${id}`);
  }

  if (!draft) {
    return <p className="text-bodySm text-disabled">Loading draft…</p>;
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
