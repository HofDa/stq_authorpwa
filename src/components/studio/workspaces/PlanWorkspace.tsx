import type { TourDraft } from '@/schema';
import type { BaseWorkspaceProps } from './workspaceTypes';
import { TourCardCanvas } from '../TourCardCanvas';

type Props = Partial<Pick<BaseWorkspaceProps, 'onChange'>> &
  Omit<BaseWorkspaceProps, 'onChange'> & {
    onCreateTour?: () => void | Promise<void>;
    onDuplicateTour?: () => void | Promise<void>;
    onDeleteTour?: () => void | Promise<void>;
    drafts?: TourDraft[];
    onSelectDraft?: (draftId: string) => void;
    onLocaleChange?: (locale: BaseWorkspaceProps['locale']) => void;
  };

export function PlanWorkspace({
  draft,
  locale,
  onChange,
  onCreateTour,
  onDuplicateTour,
  onDeleteTour,
  drafts,
  onSelectDraft,
  onLocaleChange,
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
        onDuplicateTour={onDuplicateTour}
        onDeleteTour={onDeleteTour}
        otherDrafts={drafts?.filter((d) => d.draftId !== draft.draftId)}
        onSelectDraft={onSelectDraft}
        onLocaleChange={onLocaleChange}
      />
    </div>
  );
}
