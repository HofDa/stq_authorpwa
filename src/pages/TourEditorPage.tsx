import { useNavigate, useParams } from 'react-router-dom';
import { useDraft } from '@/hooks/useDraft';
import { useIsDesktop } from '@/hooks/useIsDesktop';
import { Studio } from '@/components/studio/Studio';
import { FieldMode } from '@/components/studio/FieldMode';

export function TourEditorPage() {
  const { draftId } = useParams();
  const navigate = useNavigate();
  const { draft, update } = useDraft(draftId);
  const isDesktop = useIsDesktop();

  if (!draft) {
    return <p className="text-bodySm text-disabled">Loading draft…</p>;
  }

  if (isDesktop) {
    return <Studio draft={draft} onChange={update} />;
  }

  // Mobile: Field Mode is the primary editor.
  return (
    <FieldMode
      draft={draft}
      initialStationId={draft.stations[0]?.id ?? null}
      onChange={update}
      onExit={() => navigate('/tours')}
      exitLabel="Tours"
      embedded
    />
  );
}
