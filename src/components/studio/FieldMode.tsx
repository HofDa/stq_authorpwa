import type { TourDraft } from '@/schema';
import { FieldApp } from '@/field/FieldApp';

interface Props {
  draft: TourDraft;
  initialStationId: string | null;
  onChange: (recipe: (prev: TourDraft) => TourDraft) => void;
  onExit: () => void;
  onDeleteTour?: (draftId: string) => Promise<void> | void;
  embedded?: boolean;
  exitLabel?: string;
}

export function FieldMode({
  draft,
  initialStationId,
  onChange,
  onDeleteTour,
}: Props) {
  return (
    <div className="stq-field-page">
      <div className="stq-field-screen stq-field-screen--embedded">
        <FieldApp
          drafts={[draft]}
          initialTourId={draft.draftId}
          initialStationId={initialStationId}
          onChange={(_draftId, recipe) => onChange(recipe)}
          onDeleteTour={onDeleteTour}
        />
      </div>
    </div>
  );
}
