import {
  useCallback,
  useEffect,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  createId,
  emptyStation,
  type Locale,
  type TourDraft,
} from '@/schema';
import { StudioHeader } from './StudioHeader';
import { JumpPalette } from './JumpPalette';
import { StudioWorkspaceRenderer } from './StudioWorkspaceRenderer';
import { useExportTour } from '@/hooks/useExportTour';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import { listDrafts } from '@/storage';
import type { StudioWorkflowSection } from './workflow/workflowTypes';

interface Props {
  draft: TourDraft;
  onChange: (
    patch: Partial<TourDraft> | ((prev: TourDraft) => TourDraft),
  ) => void;
  onCreateTour?: () => void | Promise<void>;
  onSelectDraft?: (draftId: string) => void;
}

export function Studio({
  draft,
  onChange,
  onCreateTour,
  onSelectDraft,
}: Props) {
  const navigate = useNavigate();
  const { editorLanguage, setEditorLanguage, t } = useEditorLanguage();
  const [locale, setLocale] = useState<Locale>(editorLanguage);
  const [activeSection, setActiveSection] = useState<StudioWorkflowSection>(
    'plan',
  );
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [jumpOpen, setJumpOpen] = useState(false);
  const { exportingDraftId, exportError, runExport } = useExportTour();
  const exporting = exportingDraftId === draft.draftId;
  const drafts = useLiveQuery(() => listDrafts(), []);

  useEffect(() => {
    setLocale(editorLanguage);
  }, [editorLanguage]);

  const changeLanguage = useCallback(
    (nextLocale: Locale) => {
      setLocale(nextLocale);
      setEditorLanguage(nextLocale);
    },
    [setEditorLanguage],
  );

  useEffect(() => {
    if (
      selectedId &&
      !draft.stations.some((s) => s.id === selectedId)
    ) {
      setSelectedId(null);
    }
  }, [draft.stations, selectedId]);

  const selectByDelta = useCallback(
    (delta: -1 | 1) => {
      if (!selectedId) return;
      const idx = draft.stations.findIndex((s) => s.id === selectedId);
      const next = idx + delta;
      if (next < 0 || next >= draft.stations.length) return;
      setSelectedId(draft.stations[next].id);
    },
    [draft.stations, selectedId],
  );

  const addStation = useCallback(() => {
    const stationId = createId('stn');
    onChange((prev) => {
      const number = prev.stations.length + 1;
      const station = emptyStation(stationId, number);
      return { ...prev, stations: [...prev.stations, station] };
    });
    setSelectedId(stationId);
    setActiveSection('stations');
  }, [onChange]);

  const reorderStations = useCallback(
    (sourceId: string, targetId: string) => {
      onChange((prev) => {
        const list = [...prev.stations];
        const from = list.findIndex((s) => s.id === sourceId);
        const to = list.findIndex((s) => s.id === targetId);
        if (from < 0 || to < 0 || from === to) return prev;
        const [moved] = list.splice(from, 1);
        list.splice(to, 0, moved);
        return {
          ...prev,
          stations: list.map((s, i) => ({ ...s, number: i + 1 })),
        };
      });
    },
    [onChange],
  );

  // Keyboard shortcuts only apply while the Stations workspace is active —
  // ←/→ switch station, R toggles reorder, ⌘K / Ctrl+K opens jump palette.
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isTyping =
        target?.isContentEditable ||
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT';

      if (
        activeSection === 'stations' &&
        (e.metaKey || e.ctrlKey) &&
        e.key.toLowerCase() === 'k'
      ) {
        e.preventDefault();
        setJumpOpen(true);
        return;
      }
      if (e.key === 'Escape' && jumpOpen) {
        setJumpOpen(false);
        return;
      }
      if (isTyping) return;
      if (activeSection !== 'stations') return;
      if (e.key === 'ArrowLeft') {
        e.preventDefault();
        selectByDelta(-1);
      } else if (e.key === 'ArrowRight') {
        e.preventDefault();
        selectByDelta(1);
      } else if (e.key.toLowerCase() === 'r') {
        e.preventDefault();
        setReorderMode((v) => !v);
      }
    }
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [activeSection, jumpOpen, selectByDelta]);

  function onExport() {
    runExport(draft, { locale });
  }

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
        onBack={() => navigate('/tours')}
        onSelectTour={(draftId) => {
          if (draftId !== draft.draftId) {
            navigate(`/tours/${draftId}`);
          }
        }}
        onLocaleChange={changeLanguage}
        onViewChange={(next) => {
          setActiveSection(next);
          if (next === 'stations') {
            setSelectedId(null);
          }
        }}
        selectedStationId={selectedId}
        reorderMode={reorderMode}
        onSelectStation={(stationId) => {
          setSelectedId(stationId);
          setActiveSection('stations');
        }}
        onAddStation={addStation}
        onReorderStations={reorderStations}
        onToggleReorder={() => {
          setActiveSection('stations');
          setReorderMode((value) => !value);
        }}
        onExport={onExport}
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
        <StudioWorkspaceRenderer
          activeSection={activeSection}
          draft={draft}
          locale={locale}
          selectedId={selectedId}
          onChange={onChange}
          onSelectStation={setSelectedId}
          onAddStation={addStation}
          onCreateTour={onCreateTour}
          onSelectDraft={onSelectDraft}
          drafts={drafts}
          onSelectTourOverview={() => setActiveSection('plan')}
        />
      </div>
      {jumpOpen && (
        <JumpPalette
          stations={draft.stations}
          locale={locale}
          onClose={() => setJumpOpen(false)}
          onSelect={(id) => {
            setSelectedId(id);
            setJumpOpen(false);
          }}
        />
      )}
    </div>
  );
}
