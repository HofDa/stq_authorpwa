import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  createId,
  emptyStation,
  type Locale,
  type RiddleEntry,
  type TourDraft,
} from '@/schema';
import { StudioHeader } from './StudioHeader';
import { useExportTour } from '@/hooks/useExportTour';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import { listDrafts } from '@/storage';
import type { StudioWorkflowSection } from './workflow/workflowTypes';
import { PlanWorkspace } from './workspaces/PlanWorkspace';
import { StoryWorkspace } from './workspaces/StoryWorkspace';
import { MapPreviewWorkspace } from './workspaces/MapPreviewWorkspace';
import { RouteWorkspace } from './workspaces/RouteWorkspace';
import { StudioSidebar } from './sidebar/StudioSidebar';

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
  const [selectedId, setSelectedId] = useState<string | null>(
    draft.stations[0]?.id ?? null,
  );
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
    if (!selectedId && draft.stations.length > 0) {
      setSelectedId(draft.stations[0].id);
    }
    if (
      selectedId &&
      !draft.stations.some((s) => s.id === selectedId)
    ) {
      setSelectedId(draft.stations[0]?.id ?? null);
    }
  }, [draft.stations, selectedId]);

  const selected = useMemo(
    () => draft.stations.find((s) => s.id === selectedId) ?? null,
    [draft.stations, selectedId],
  );

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
        onViewChange={setActiveSection}
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
        onEnterField={() =>
          navigate(`/tours/${draft.draftId}/field`, {
            state: { selectedStationId: selectedId },
          })
        }
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
        {renderWorkspace({
          activeSection,
          draft,
          locale,
          selected,
          selectedId,
          reorderMode,
          onChange,
          onLocaleChange: changeLanguage,
          onSelectStation: setSelectedId,
          onSelectPrev: () => selectByDelta(-1),
          onSelectNext: () => selectByDelta(1),
          onAddStation: addStation,
          onReorderStations: reorderStations,
          onToggleReorder: () => setReorderMode((v) => !v),
          onOpenFullEditor: (stationId) =>
            navigate(`/tours/${draft.draftId}/stations/${stationId}`),
          onCreateTour,
          onSelectDraft,
          drafts,
          onSelectTourOverview: () => setActiveSection('plan'),
        })}
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

interface RenderWorkspaceArgs {
  activeSection: StudioWorkflowSection;
  draft: TourDraft;
  locale: Locale;
  selected: RiddleEntry | null;
  selectedId: string | null;
  reorderMode: boolean;
  onChange: (
    patch: Partial<TourDraft> | ((prev: TourDraft) => TourDraft),
  ) => void;
  onLocaleChange: (locale: Locale) => void;
  onSelectStation: (id: string) => void;
  onSelectPrev: () => void;
  onSelectNext: () => void;
  onAddStation: () => void;
  onReorderStations: (sourceId: string, targetId: string) => void;
  onToggleReorder: () => void;
  onOpenFullEditor: (stationId: string) => void;
  onCreateTour?: () => void | Promise<void>;
  onSelectDraft?: (draftId: string) => void;
  drafts?: TourDraft[];
  onSelectTourOverview: () => void;
}

function renderWorkspace(args: RenderWorkspaceArgs) {
  // Top-level mockup views ship their own full-canvas layout.
  if (args.activeSection === 'stations') {
    return (
      <MapPreviewWorkspace
        draft={args.draft}
        locale={args.locale}
        selectedId={args.selectedId}
        onSelectStation={args.onSelectStation}
        onAddStation={args.onAddStation}
        onChange={args.onChange}
      />
    );
  }

  if (
    args.activeSection === 'plan' ||
    args.activeSection === 'story' ||
    args.activeSection === 'route' ||
    args.activeSection === 'outro'
  ) {
    return (
      <div style={{ minWidth: 0, minHeight: 0, width: '100%', height: '100%', overflow: 'hidden' }}>
        {renderWorkspaceBody(args)}
      </div>
    );
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: '260px minmax(0, 1fr)',
        gap: 12,
        minHeight: 0,
        minWidth: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <StudioSidebar
        section={args.activeSection}
        draft={args.draft}
        locale={args.locale}
        selectedStation={args.selected}
        onOpenFullStationEditor={args.onOpenFullEditor}
      />
      <div style={{ minWidth: 0, minHeight: 0, overflow: 'hidden' }}>
        {renderWorkspaceBody(args)}
      </div>
    </div>
  );
}

function renderWorkspaceBody(args: RenderWorkspaceArgs) {
  switch (args.activeSection) {
    case 'plan':
      return (
        <PlanWorkspace
          draft={args.draft}
          locale={args.locale}
          onChange={args.onChange}
          onCreateTour={args.onCreateTour}
          drafts={args.drafts}
          onSelectDraft={args.onSelectDraft}
        />
      );
    case 'story':
      return (
        <StoryWorkspace
          draft={args.draft}
          locale={args.locale}
          onChange={args.onChange}
          onSelectTourOverview={args.onSelectTourOverview}
        />
      );
    case 'outro':
      return (
        <StoryWorkspace
          draft={args.draft}
          locale={args.locale}
          onChange={args.onChange}
          mode="outro"
          onSelectTourOverview={args.onSelectTourOverview}
        />
      );
    case 'route':
      return (
        <RouteWorkspace
          draft={args.draft}
          locale={args.locale}
          onChange={args.onChange}
        />
      );
    case 'stations':
      return null;
  }
}

function JumpPalette({
  stations,
  locale,
  onClose,
  onSelect,
}: {
  stations: RiddleEntry[];
  locale: Locale;
  onClose: () => void;
  onSelect: (id: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stations;
    return stations.filter((s) => {
      const fields = [s[locale].location, summarize(s, locale), String(s.number)];
      return fields.some((f) =>
        (f ?? '').toString().toLowerCase().includes(q),
      );
    });
  }, [stations, locale, query]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  function handleKey(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActiveIdx((i) => Math.min(matches.length - 1, i + 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = matches[activeIdx];
      if (target) onSelect(target.id);
    } else if (e.key === 'Escape') {
      onClose();
    }
  }

  return (
    <div
      role="dialog"
      aria-label="Jump to station"
      className="studio-jump-backdrop"
      onClick={onClose}
    >
      <div className="studio-jump-panel" onClick={(e) => e.stopPropagation()}>
        <input
          autoFocus
          className="studio-jump-input"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Jump to station…"
        />
        <div className="studio-jump-list">
          {matches.length === 0 && (
            <div
              style={{
                padding: 16,
                fontSize: 13,
                color: 'var(--stq-text-mute)',
                textAlign: 'center',
              }}
            >
              No matching stations.
            </div>
          )}
          {matches.map((s, i) => (
            <button
              key={s.id}
              type="button"
              className={`studio-jump-row${i === activeIdx ? ' active' : ''}`}
              onMouseEnter={() => setActiveIdx(i)}
              onClick={() => onSelect(s.id)}
            >
              <span className="studio-pin" style={{ width: 26, height: 26, fontSize: 11 }}>
                {s.number}
              </span>
              <span style={{ flex: 1, minWidth: 0 }}>
                <span
                  style={{
                    display: 'block',
                    fontWeight: 700,
                    fontSize: 13,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {s[locale].location || 'Unnamed station'}
                </span>
                {summarize(s, locale) && (
                  <span
                    style={{
                      display: 'block',
                      fontSize: 11,
                      color: 'var(--stq-text-mute)',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {summarize(s, locale)}
                  </span>
                )}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function summarize(station: RiddleEntry, locale: Locale): string {
  const first = station[locale].firstSection.find(
    (b) => b.type === 'paragraph' || b.type === 'heading' || b.type === 'line',
  ) as { text?: string } | undefined;
  return (first?.text ?? '').trim();
}
