import type { TourDraft } from '@/schema';
import { StudioHeader } from './StudioHeader';
import { JumpPalette } from './JumpPalette';
import { StudioWorkspaceRenderer } from './StudioWorkspaceRenderer';
import { RrrFieldTestDashboard } from '@/components/rrr-author/RrrFieldTestDashboard';
import { RrrTourReadinessChecklist } from '@/components/rrr-author/RrrTourReadinessChecklist';
import { useStudioController } from './useStudioController';

export interface DesktopStudioShellProps {
  draft: TourDraft;
  onChange: (
    patch: Partial<TourDraft> | ((prev: TourDraft) => TourDraft),
  ) => void;
  onCreateTour?: () => void | Promise<void>;
  onSelectDraft?: (draftId: string) => void;
}

export function DesktopStudioShell({
  draft,
  onChange,
  onCreateTour,
  onSelectDraft,
}: DesktopStudioShellProps) {
  const {
    locale,
    activeSection,
    selectedId,
    reorderMode,
    jumpOpen,
    exporting,
    exportError,
    drafts,
    rrrReadiness,
    t,
    actions,
  } = useStudioController({ draft, onChange });

  return (
    <div
      className="stq-author-tool-shell"
      style={{
        height: '100vh',
        width: '100%',
        display: 'grid',
        gridTemplateColumns: '280px minmax(0, 1fr)',
        background:
          'radial-gradient(circle at 20% 0%, #2c2724 0%, #16130f 60%)',
        overflow: 'hidden',
      }}
    >
      <StudioHeader
        draft={draft}
        locale={locale}
        view={activeSection}
        exporting={exporting}
        drafts={drafts ?? [draft]}
        onBack={actions.backToTours}
        onSelectTour={actions.selectTour}
        onLocaleChange={actions.changeLanguage}
        onViewChange={actions.changeSection}
        selectedStationId={selectedId}
        reorderMode={reorderMode}
        onSelectStation={actions.selectStation}
        onAddStation={actions.addStation}
        onReorderStations={actions.reorderStations}
        onToggleReorder={actions.toggleReorder}
        onExport={actions.exportDraft}
      />

      {exportError && (
        <div
          role="alert"
          style={{
            position: 'absolute',
            top: 24,
            left: 304,
            maxWidth: 720,
            width: 'calc(100% - 328px)',
            background: '#1f1a17',
            border: '1px solid var(--stq-error)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 12,
            color: 'var(--stq-error)',
            whiteSpace: 'pre-wrap',
            zIndex: 40,
            boxShadow: 'none',
          }}
        >
          {exportError}
        </div>
      )}

      <div
        className="stq-author-tool-canvas"
        style={{
          padding: '56px 32px 80px',
          minHeight: 0,
          minWidth: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <div className="stq-author-canvas-hint">
          <span className="stq-author-canvas-hint__dot" aria-hidden />
          {t('studio.canvasHint')}
        </div>
        <div className="stq-rrr-tour-overlays">
          <RrrFieldTestDashboard
            draft={draft}
            onSelectStation={actions.selectStation}
          />
          <RrrTourReadinessChecklist
            readiness={rrrReadiness}
            onSelectStation={actions.selectStation}
          />
        </div>
        <StudioWorkspaceRenderer
          activeSection={activeSection}
          draft={draft}
          locale={locale}
          selectedId={selectedId}
          onChange={onChange}
          onSelectStation={actions.selectStationOnly}
          onAddStation={actions.addStation}
          onCreateTour={onCreateTour}
          onSelectDraft={onSelectDraft}
          drafts={drafts}
          onSelectTourOverview={actions.selectTourOverview}
        />
      </div>
      {jumpOpen && (
        <JumpPalette
          stations={draft.stations}
          locale={locale}
          onClose={actions.closeJumpPalette}
          onSelect={actions.selectJumpStation}
        />
      )}
    </div>
  );
}
