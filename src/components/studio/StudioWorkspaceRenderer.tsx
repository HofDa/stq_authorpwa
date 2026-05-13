import type { Locale, TourDraft } from '@/schema';
import type { AuthorMapCoordinate } from '@/components/map/mapTypes';
import type { StudioWorkflowSection } from './workflow/workflowTypes';
import { MapPreviewWorkspace } from './workspaces/MapPreviewWorkspace';
import { PlanWorkspace } from './workspaces/PlanWorkspace';
import { RouteWorkspace } from './workspaces/RouteWorkspace';
import { StoryWorkspace } from './workspaces/StoryWorkspace';

interface StudioWorkspaceRendererProps {
  activeSection: StudioWorkflowSection;
  draft: TourDraft;
  locale: Locale;
  selectedId: string | null;
  onChange: (
    patch: Partial<TourDraft> | ((prev: TourDraft) => TourDraft),
  ) => void;
  onSelectStation: (id: string) => void;
  onAddStation: (coordinate?: AuthorMapCoordinate) => void;
  onCreateTour?: () => void | Promise<void>;
  onDeleteTour?: () => void | Promise<void>;
  onSelectDraft?: (draftId: string) => void;
  drafts?: TourDraft[];
  onSelectTourOverview: () => void;
  routeEditMode?: boolean;
  stationsEditMode?: boolean;
  onDeleteStation?: (stationId: string) => void;
  onOpenOutro?: () => void;
}

export function StudioWorkspaceRenderer(props: StudioWorkspaceRendererProps) {
  if (props.activeSection === 'stations') {
    return (
      <MapPreviewWorkspace
        draft={props.draft}
        locale={props.locale}
        selectedId={props.selectedId}
        onSelectStation={props.onSelectStation}
        onAddStation={props.onAddStation}
        onChange={props.onChange}
        onOpenOutro={props.onOpenOutro}
        editMode
        markerEditMode={props.stationsEditMode ?? true}
        showAddStationFab={props.stationsEditMode ?? false}
        showDeleteStationFab={props.stationsEditMode ?? false}
        onDeleteStation={props.onDeleteStation}
        layout="desktop"
      />
    );
  }

  return (
    <div style={{ minWidth: 0, minHeight: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
      {renderWorkspaceBody(props)}
    </div>
  );
}

function renderWorkspaceBody(props: StudioWorkspaceRendererProps) {
  switch (props.activeSection) {
    case 'plan':
      return (
        <PlanWorkspace
          draft={props.draft}
          locale={props.locale}
          onChange={props.onChange}
          onCreateTour={props.onCreateTour}
          onDeleteTour={props.onDeleteTour}
          drafts={props.drafts}
          onSelectDraft={props.onSelectDraft}
        />
      );
    case 'story':
      return (
        <StoryWorkspace
          draft={props.draft}
          locale={props.locale}
          onChange={props.onChange}
          onSelectTourOverview={props.onSelectTourOverview}
        />
      );
    case 'outro':
      return (
        <StoryWorkspace
          draft={props.draft}
          locale={props.locale}
          onChange={props.onChange}
          mode="outro"
          onSelectTourOverview={props.onSelectTourOverview}
        />
      );
    case 'route':
      return (
        <RouteWorkspace
          draft={props.draft}
          locale={props.locale}
          selectedId={props.selectedId}
          onSelectStation={props.onSelectStation}
          onChange={props.onChange}
          editable={props.routeEditMode}
          layout="desktop"
        />
      );
    case 'stations':
      return null;
  }
}
