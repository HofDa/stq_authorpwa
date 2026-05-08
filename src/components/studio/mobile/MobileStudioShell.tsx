import { useState } from 'react';
import type { TourDraft } from '@/schema';
import { useStudioController } from '../useStudioController';
import { Icon } from '../Icon';
import { TourCardCanvas } from '../TourCardCanvas';
import { IntroPhonePreview } from '../workspaces/IntroPhonePreview';
import { MapPreviewWorkspace } from '../workspaces/MapPreviewWorkspace';

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
  const [view, setView] = useState<'map' | 'overview' | 'intro'>('map');
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
    setIntroDraftId(draftId);
    setView('intro');
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
          />
          <aside
            className="stq-mobile-studio__edit-drawer"
            data-state={overviewEditMode ? 'open' : 'closed'}
            aria-label="Bearbeiten"
          >
            <button
              type="button"
              className="stq-mobile-studio__edit-drawer-handle"
              onClick={() => setOverviewEditMode((value) => !value)}
              aria-label={overviewEditMode ? 'Bearbeiten beenden' : 'Bearbeiten'}
              aria-expanded={overviewEditMode}
              aria-pressed={overviewEditMode}
            >
              <Icon name="edit" size={17} />
            </button>
          </aside>
        </section>
      ) : view === 'intro' ? (
        <section
          className="stq-mobile-studio__workspace"
          aria-label="Intro-Seite"
        >
          <IntroPhonePreview
            draft={introDraft}
            locale={locale}
            onChange={introDraft.draftId === draft.draftId ? onChange : () => undefined}
            mode="intro"
            editable={introEditMode}
            mobileSelectionFlow={introEditMode}
            onBack={() => {
              setIntroEditMode(false);
              setView('overview');
            }}
            onStartTour={() => {
              setIntroEditMode(false);
              if (introDraft.draftId !== draft.draftId) {
                (onSelectDraft ?? actions.selectTour)(introDraft.draftId);
              }
              setView('map');
            }}
          />
          <aside
            className="stq-mobile-studio__edit-drawer"
            data-state={introEditMode ? 'open' : 'closed'}
            aria-label="Bearbeiten"
          >
            <button
              type="button"
              className="stq-mobile-studio__edit-drawer-handle"
              onClick={() => setIntroEditMode((value) => !value)}
              aria-label={introEditMode ? 'Bearbeiten beenden' : 'Bearbeiten'}
              aria-expanded={introEditMode}
              aria-pressed={introEditMode}
            >
              <Icon name="edit" size={17} />
            </button>
          </aside>
        </section>
      ) : (
        <section className="stq-mobile-studio__workspace" aria-label="Mobile Studio Arbeitsbereich">
        <MapPreviewWorkspace
          draft={draft}
          locale={locale}
          selectedId={selectedId}
          onSelectStation={actions.selectStationOnly}
          onAddStation={actions.addStation}
          onTitleBack={() => setView('overview')}
          onChange={onChange}
          editMode={editMode}
          onEditModeToggle={() => setEditMode((value) => !value)}
          mobileSelectionFlow={editMode}
        />
      </section>
      )}
    </main>
  );
}
