import { lazy, Suspense, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import type { TourDraft } from '@/schema';
import { useStudioController } from '../useStudioController';
import { Icon } from '../Icon';

const TourCardCanvas = lazy(() =>
  import('../TourCardCanvas').then((module) => ({
    default: module.TourCardCanvas,
  })),
);

const IntroPhonePreview = lazy(() =>
  import('../workspaces/IntroPhonePreview').then((module) => ({
    default: module.IntroPhonePreview,
  })),
);

const MapPreviewWorkspace = lazy(() =>
  import('../workspaces/MapPreviewWorkspace').then((module) => ({
    default: module.MapPreviewWorkspace,
  })),
);

const RouteWorkspace = lazy(() =>
  import('../workspaces/RouteWorkspace').then((module) => ({
    default: module.RouteWorkspace,
  })),
);

export interface MobileStudioShellProps {
  draft: TourDraft;
  onChange: (
    patch: Partial<TourDraft> | ((prev: TourDraft) => TourDraft),
  ) => void | Promise<void>;
  onCreateTour?: () => void | Promise<void>;
  onSelectDraft?: (draftId: string) => void;
}

export function MobileStudioShell({
  draft,
  onChange,
  onCreateTour,
  onSelectDraft,
}: MobileStudioShellProps) {
  const [searchParams] = useSearchParams();
  const [editMode, setEditMode] = useState(false);
  const [overviewEditMode, setOverviewEditMode] = useState(false);
  const [introEditMode, setIntroEditMode] = useState(false);
  const [outroEditMode, setOutroEditMode] = useState(false);
  const [routeEditMode, setRouteEditMode] = useState(false);
  const [view, setView] = useState<'map' | 'overview' | 'intro' | 'outro'>(
    () => (searchParams.get('view') === 'map' ? 'map' : 'overview'),
  );
  const [introDraftId, setIntroDraftId] = useState<string | null>(null);
  const { locale, selectedId, drafts, actions } = useStudioController({
    draft,
    onChange,
  });
  const otherDrafts = drafts?.filter((entry) => entry.draftId !== draft.draftId);
  const introDraft =
    introDraftId === draft.draftId || !introDraftId
      ? draft
      : drafts?.find((entry) => entry.draftId === introDraftId) ?? draft;

  function openIntro(draftId: string) {
    setOverviewEditMode(false);
    setIntroEditMode(false);
    setOutroEditMode(false);
    setIntroDraftId(draftId);
    setView('intro');
  }

  function openOutro() {
    setEditMode(false);
    setRouteEditMode(false);
    setOutroEditMode(false);
    setView('outro');
  }

  function toggleRouteEditMode() {
    setRouteEditMode((value) => {
      // Closing route editing should not leave a stale station selection
      // around that would otherwise pop the station card on the map.
      if (value) actions.clearSelection();
      return !value;
    });
  }

  const mapEditMarkerCluster = editMode ? (
    <div className="stq-mobile-map-edit-actions">
      <button
        type="button"
        className={routeEditMode ? 'is-active' : ''}
        onClick={toggleRouteEditMode}
        aria-label={
          routeEditMode ? 'Route bearbeiten beenden' : 'Route bearbeiten'
        }
        aria-pressed={routeEditMode}
        title={routeEditMode ? 'Route bearbeiten beenden' : 'Route bearbeiten'}
      >
        <Icon name="flag" size={15} />
      </button>
    </div>
  ) : undefined;

  function toggleMapEditMode() {
    setEditMode((value) => {
      if (value) {
        setRouteEditMode(false);
        actions.clearSelection();
      }
      return !value;
    });
  }

  return (
    <main
      className={`stq-mobile-studio stq-mobile-studio--${view}`}
      aria-label="Mobile Studio"
    >
      {view === 'overview' ? (
        <section
          className="stq-mobile-studio__workspace"
          aria-label="Tour Übersicht"
        >
          <Suspense
            fallback={
              <MobileWorkspaceLoadingState label="Loading tour overview..." />
            }
          >
            <TourCardCanvas
              draft={draft}
              locale={locale}
              onChange={onChange}
              onCreateTour={onCreateTour}
              onDuplicateTour={actions.duplicateCurrentTour}
              onDeleteTour={() =>
                actions.deleteCurrentTour({ redirectSearch: '?view=overview' })
              }
              otherDrafts={otherDrafts}
              onSelectDraft={
                overviewEditMode
                  ? onSelectDraft ?? actions.selectTour
                  : (draftId) => openIntro(draftId)
              }
              onOpenCurrentTour={() => openIntro(draft.draftId)}
              editable={overviewEditMode}
              mobileSelectionFlow={overviewEditMode}
              floatingEditToggle={
                <HeaderEditToggle
                  active={overviewEditMode}
                  onClick={() => setOverviewEditMode((value) => !value)}
                />
              }
            />
          </Suspense>
        </section>
      ) : view === 'intro' || view === 'outro' ? (
        <section
          className="stq-mobile-studio__workspace"
          aria-label={view === 'outro' ? 'Outro-Seite' : 'Intro-Seite'}
        >
          <Suspense
            fallback={
              <MobileWorkspaceLoadingState
                label={
                  view === 'outro'
                    ? 'Loading outro page...'
                    : 'Loading intro page...'
                }
              />
            }
          >
            <IntroPhonePreview
              draft={introDraft}
              locale={locale}
              onChange={
                introDraft.draftId === draft.draftId ? onChange : () => undefined
              }
              mode={view}
              editable={view === 'outro' ? outroEditMode : introEditMode}
              mobileSelectionFlow={
                view === 'outro' ? outroEditMode : introEditMode
              }
              onBack={() => {
                setIntroEditMode(false);
                setOutroEditMode(false);
                setView(view === 'outro' ? 'map' : 'overview');
              }}
              onStartTour={() => {
                setIntroEditMode(false);
                setRouteEditMode(false);
                actions.clearSelection();
                if (introDraft.stations.length === 0) {
                  setEditMode(true);
                }
                if (introDraft.draftId !== draft.draftId) {
                  (onSelectDraft ?? actions.selectTour)(introDraft.draftId);
                }
                setView('map');
              }}
              onSelectTourOverview={() => {
                setOutroEditMode(false);
                setView('overview');
              }}
              floatingEditToggle={
                <HeaderEditToggle
                  active={view === 'outro' ? outroEditMode : introEditMode}
                  onClick={() =>
                    view === 'outro'
                      ? setOutroEditMode((value) => !value)
                      : setIntroEditMode((value) => !value)
                  }
                />
              }
            />
          </Suspense>
        </section>
      ) : (
        <section
          className="stq-mobile-studio__workspace"
          aria-label="Mobile Studio Arbeitsbereich"
        >
          <Suspense
            fallback={
              <MobileWorkspaceLoadingState
                label={
                  editMode && routeEditMode
                    ? 'Loading route workspace...'
                    : 'Loading map workspace...'
                }
              />
            }
          >
            {editMode && routeEditMode ? (
              <RouteWorkspace
                draft={draft}
                locale={locale}
                selectedId={selectedId}
                onSelectStation={actions.selectStationOnly}
                onChange={onChange}
                topRightPill={mapEditMarkerCluster}
                mapEditMode={editMode}
                onToggleMapEditMode={toggleMapEditMode}
              />
            ) : (
              <MapPreviewWorkspace
                draft={draft}
                locale={locale}
                selectedId={selectedId}
                onSelectStation={actions.selectStationOnly}
                onAddStation={actions.addStation}
                onTitleBack={() => setView('overview')}
                onOpenOutro={openOutro}
                onChange={onChange}
                markerEditMode={editMode}
                topRightPill={mapEditMarkerCluster}
                mapEditMode={editMode}
                onToggleMapEditMode={toggleMapEditMode}
                showAddStationFab={editMode && !routeEditMode}
                showDeleteStationFab={editMode && !routeEditMode}
                onDeleteStation={actions.deleteStation}
              />
            )}
          </Suspense>
        </section>
      )}
    </main>
  );
}

function HeaderEditToggle({
  active,
  onClick,
}: {
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={`stq-mobile-studio__header-edit-toggle stq-mobile-studio__major-edit-toggle${
        active ? ' is-active' : ''
      }`}
      onClick={onClick}
      aria-label={active ? 'Bearbeiten beenden' : 'Bearbeiten'}
      aria-pressed={active}
    >
      <Icon name="edit" size={18} />
    </button>
  );
}

function MobileWorkspaceLoadingState({ label }: { label: string }) {
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
        background: 'var(--stq-color-bg)',
        color: 'var(--stq-color-text-muted)',
      }}
    >
      <p className="text-bodySm text-disabled">{label}</p>
    </div>
  );
}
