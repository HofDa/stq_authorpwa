import { useState } from 'react';
import type { TourDraft } from '@/schema';
import { useStudioController } from '../useStudioController';
import { Icon } from '../Icon';
import { TourCardCanvas } from '../TourCardCanvas';
import { IntroPhonePreview } from '../workspaces/IntroPhonePreview';
import { MapPreviewWorkspace } from '../workspaces/MapPreviewWorkspace';
import { RouteWorkspace } from '../workspaces/RouteWorkspace';

export interface MobileStudioShellProps {
  draft: TourDraft;
  onChange: (
    patch: Partial<TourDraft> | ((prev: TourDraft) => TourDraft),
  ) => void;
  onCreateTour?: () => void | Promise<void>;
  onSelectDraft?: (draftId: string) => void;
}

export function MobileStudioShell({
  draft,
  onChange,
  onCreateTour,
  onSelectDraft,
}: MobileStudioShellProps) {
  const [editMode, setEditMode] = useState(false);
  const [overviewEditMode, setOverviewEditMode] = useState(false);
  const [introEditMode, setIntroEditMode] = useState(false);
  const [outroEditMode, setOutroEditMode] = useState(false);
  const [routeEditMode, setRouteEditMode] = useState(false);
  const [view, setView] = useState<'map' | 'overview' | 'intro' | 'outro'>('map');
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

  const mapEditMarkerCluster = editMode ? (
    <div className="stq-mobile-map-edit-actions">
      <button
        type="button"
        className={routeEditMode ? 'is-active' : ''}
        onClick={() => setRouteEditMode((value) => !value)}
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
      if (value) setRouteEditMode(false);
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
          <TourCardCanvas
            draft={draft}
            locale={locale}
            onChange={onChange}
            onCreateTour={onCreateTour}
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
        </section>
      ) : view === 'intro' || view === 'outro' ? (
        <section
          className="stq-mobile-studio__workspace"
          aria-label={view === 'outro' ? 'Outro-Seite' : 'Intro-Seite'}
        >
          <IntroPhonePreview
            draft={introDraft}
            locale={locale}
            onChange={introDraft.draftId === draft.draftId ? onChange : () => undefined}
            mode={view}
            editable={view === 'outro' ? outroEditMode : introEditMode}
            mobileSelectionFlow={view === 'outro' ? outroEditMode : introEditMode}
            onBack={() => {
              setIntroEditMode(false);
              setOutroEditMode(false);
              setView(view === 'outro' ? 'map' : 'overview');
            }}
            onStartTour={() => {
              setIntroEditMode(false);
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
        </section>
      ) : (
        <section className="stq-mobile-studio__workspace" aria-label="Mobile Studio Arbeitsbereich">
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
      className={`stq-mobile-studio__header-edit-toggle${
        active ? ' is-active' : ''
      }`}
      onClick={onClick}
      aria-label={active ? 'Bearbeiten beenden' : 'Bearbeiten'}
      aria-pressed={active}
    >
      <Icon name="edit" size={14} />
    </button>
  );
}
