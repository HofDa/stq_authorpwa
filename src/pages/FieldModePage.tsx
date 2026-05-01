import { useLocation, useNavigate, useParams } from 'react-router-dom';
import { useDraft } from '@/hooks/useDraft';
import { FieldMode } from '@/components/studio/FieldMode';
import { deleteDraft } from '@/storage';

interface FieldRouteState {
  selectedStationId?: string;
}

export function FieldModePage() {
  const { draftId } = useParams();
  const navigate = useNavigate();
  const { state } = useLocation();
  const { draft, update } = useDraft(draftId);

  if (!draft) {
    return (
      <div
        style={{
          minHeight: '100vh',
          display: 'grid',
          placeItems: 'center',
          color: 'var(--stq-text-mute)',
          fontSize: 13,
        }}
      >
        Loading draft…
      </div>
    );
  }

  const initialId =
    (state as FieldRouteState | null)?.selectedStationId ??
    draft.stations[0]?.id ??
    null;

  return (
    <FieldMode
      draft={draft}
      initialStationId={initialId}
      onChange={update}
      onDeleteTour={async (id) => {
        await deleteDraft(id);
        navigate('/tours');
      }}
      onExit={() => navigate(`/tours/${draft.draftId}`)}
    />
  );
}
