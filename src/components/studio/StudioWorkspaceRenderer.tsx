import { lazy, Suspense } from 'react';
import type { Locale, TourDraft } from '@/schema';
import type { AuthorMapCoordinate } from '@/components/map/mapTypes';
import type { StudioWorkflowSection } from './workflow/workflowTypes';

const MapPreviewWorkspace = lazy(() =>
  import('./workspaces/MapPreviewWorkspace').then((module) => ({
    default: module.MapPreviewWorkspace,
  })),
);

const PlanWorkspace = lazy(() =>
  import('./workspaces/PlanWorkspace').then((module) => ({
    default: module.PlanWorkspace,
  })),
);

const RouteWorkspace = lazy(() =>
  import('./workspaces/RouteWorkspace').then((module) => ({
    default: module.RouteWorkspace,
  })),
);

const StoryWorkspace = lazy(() =>
  import('./workspaces/StoryWorkspace').then((module) => ({
    default: module.StoryWorkspace,
  })),
);

interface StudioWorkspaceRendererProps {
  activeSection: StudioWorkflowSection;
  draft: TourDraft;
  locale: Locale;
  selectedId: string | null;
  onChange: (
    patch: Partial<TourDraft> | ((prev: TourDraft) => TourDraft),
  ) => void | Promise<void>;
  onSelectStation: (id: string) => void;
  onAddStation: (coordinate?: AuthorMapCoordinate) => void;
  onCreateTour?: () => void | Promise<void>;
  onDuplicateTour?: () => void | Promise<void>;
  onDeleteTour?: () => void | Promise<void>;
  onSelectDraft?: (draftId: string) => void;
  drafts?: TourDraft[];
  onLocaleChange?: (locale: Locale) => void;
  onSelectTourOverview: () => void;
  routeEditMode?: boolean;
  stationsEditMode?: boolean;
  onDeleteStation?: (stationId: string) => void;
  onOpenOutro?: () => void;
}

export function StudioWorkspaceRenderer(props: StudioWorkspaceRendererProps) {
  if (props.activeSection === 'stations') {
    return (
      <Suspense
        fallback={<WorkspaceLoadingState label="Loading map workspace..." />}
      >
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
      </Suspense>
    );
  }

  return (
    <div
      style={{
        minWidth: 0,
        minHeight: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <Suspense
        fallback={
          <WorkspaceLoadingState
            label={getWorkspaceLoadingLabel(props.activeSection)}
          />
        }
      >
        {renderWorkspaceBody(props)}
      </Suspense>
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
          onDuplicateTour={props.onDuplicateTour}
          onDeleteTour={props.onDeleteTour}
          drafts={props.drafts}
          onSelectDraft={props.onSelectDraft}
          onLocaleChange={props.onLocaleChange}
        />
      );
    case 'story':
      return (
        <StoryWorkspace
          draft={props.draft}
          locale={props.locale}
          onChange={props.onChange}
          onSelectTourOverview={props.onSelectTourOverview}
          onLocaleChange={props.onLocaleChange}
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
          onLocaleChange={props.onLocaleChange}
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

function WorkspaceLoadingState({ label }: { label: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minWidth: 0,
        minHeight: 0,
        width: '100%',
        height: '100%',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        color: 'var(--stq-color-text-muted)',
      }}
    >
      <p className="text-bodySm text-disabled">{label}</p>
    </div>
  );
}

function getWorkspaceLoadingLabel(section: StudioWorkflowSection): string {
  switch (section) {
    case 'plan':
      return 'Loading tour workspace...';
    case 'story':
      return 'Loading story workspace...';
    case 'outro':
      return 'Loading outro workspace...';
    case 'route':
      return 'Loading route workspace...';
    case 'stations':
      return 'Loading map workspace...';
  }
}
