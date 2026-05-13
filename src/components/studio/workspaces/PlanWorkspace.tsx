import type { TourDraft } from '@/schema';
import type { BaseWorkspaceProps } from './workspaceTypes';
import { TourCardCanvas } from '../TourCardCanvas';

type Props = Partial<Pick<BaseWorkspaceProps, 'onChange'>> &
  Omit<BaseWorkspaceProps, 'onChange'> & {
    onCreateTour?: () => void | Promise<void>;
    onDeleteTour?: () => void | Promise<void>;
    drafts?: TourDraft[];
    onSelectDraft?: (draftId: string) => void;
  };

export function PlanWorkspace({
  draft,
  locale,
  onChange,
  onCreateTour,
  onDeleteTour,
  drafts,
  onSelectDraft,
}: Props) {
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <TourCardCanvas
        draft={draft}
        locale={locale}
        onChange={
          onChange ??
          (() => {
            /* read-only when no onChange provided */
          })
        }
        onCreateTour={onCreateTour}
        onDeleteTour={onDeleteTour}
        otherDrafts={drafts?.filter((d) => d.draftId !== draft.draftId)}
        onSelectDraft={onSelectDraft}
      />
    </div>
  );
}
