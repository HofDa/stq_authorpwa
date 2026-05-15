import { useEffect, useRef, useState } from 'react';
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
  ) => void | Promise<void>;
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

  const SIDEBAR_MIN = 220;
  const SIDEBAR_MAX = 560;
  const [sidebarWidth, setSidebarWidth] = useState<number>(() => {
    if (typeof window === 'undefined') return 280;
    try {
      const stored = Number(window.localStorage.getItem('stq.studio.sidebarWidth'));
      return Number.isFinite(stored) && stored >= SIDEBAR_MIN && stored <= SIDEBAR_MAX
        ? stored
        : 280;
    } catch {
      return 280;
    }
  });
  useEffect(() => {
    if (typeof window === 'undefined') return;
    try {
      window.localStorage.setItem('stq.studio.sidebarWidth', String(sidebarWidth));
    } catch {
      // Private mode / quota — non-fatal.
    }
  }, [sidebarWidth]);
  const draggingRef = useRef(false);
  function startResize(event: React.PointerEvent<HTMLDivElement>) {
    draggingRef.current = true;
    event.currentTarget.setPointerCapture(event.pointerId);
    const onMove = (moveEvent: PointerEvent) => {
      if (!draggingRef.current) return;
      const next = Math.max(
        SIDEBAR_MIN,
        Math.min(SIDEBAR_MAX, moveEvent.clientX),
      );
      setSidebarWidth(next);
    };
    const onUp = () => {
      draggingRef.current = false;
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onUp);
    };
    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onUp);
  }

  return (
    <div
      className="stq-author-tool-shell stq-author-tool-shell--fullheight"
      style={{
        width: '100%',
        display: 'grid',
        gridTemplateColumns: `${sidebarWidth}px 6px minmax(0, 1fr)`,
        background: 'var(--stq-color-bg)',
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
        onReorderStations={actions.reorderStations}
        onToggleReorder={actions.toggleReorder}
        onDeleteStation={actions.deleteStation}
        onExport={actions.exportDraft}
      />

      <div
        role="separator"
        aria-orientation="vertical"
        aria-label="Seitenleiste vergrößern"
        onPointerDown={startResize}
        onDoubleClick={() => setSidebarWidth(280)}
        style={{
          cursor: 'col-resize',
          background: 'var(--stq-alpha-warm-tint)',
          touchAction: 'none',
          userSelect: 'none',
        }}
      />

      {exportError && (
        <div
          role="alert"
          style={{
            position: 'absolute',
            top: 24,
            left: sidebarWidth + 24,
            maxWidth: 720,
            width: `calc(100% - ${sidebarWidth + 48}px)`,
            background: 'var(--stq-color-surface)',
            border: '1px solid var(--stq-color-danger)',
            borderRadius: 8,
            padding: '10px 14px',
            fontSize: 12,
            color: 'var(--stq-color-danger)',
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
          onDuplicateTour={actions.duplicateCurrentTour}
          onDeleteTour={actions.deleteCurrentTour}
          onSelectDraft={onSelectDraft}
          drafts={drafts}
          onSelectTourOverview={actions.selectTourOverview}
          routeEditMode
          stationsEditMode
          onDeleteStation={actions.deleteStation}
          onOpenOutro={() => actions.changeSection('outro')}
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
