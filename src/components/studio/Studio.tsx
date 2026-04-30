import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';
import { useNavigate } from 'react-router-dom';
import {
  DEFAULT_LOCALE,
  createId,
  emptyStation,
  type Locale,
  type RiddleEntry,
  type TourDraft,
} from '@/schema';
import {
  DraftExportValidationError,
  downloadDraftExportZip,
} from '@/export/tourExport';
import { StudioHeader } from './StudioHeader';
import { useToast } from '@/components/ui/FeedbackProvider';
import type { StudioWorkflowSection } from './workflow/workflowTypes';
import { PlanWorkspace } from './workspaces/PlanWorkspace';
import { StoryWorkspace } from './workspaces/StoryWorkspace';
import { StationsWorkspace } from './workspaces/StationsWorkspace';
import { RouteWorkspace } from './workspaces/RouteWorkspace';
import { PreviewWorkspace } from './workspaces/PreviewWorkspace';
import { StudioSidebar } from './sidebar/StudioSidebar';

interface Props {
  draft: TourDraft;
  onChange: (
    patch: Partial<TourDraft> | ((prev: TourDraft) => TourDraft),
  ) => void;
}

export function Studio({ draft, onChange }: Props) {
  const navigate = useNavigate();
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [activeSection, setActiveSection] = useState<StudioWorkflowSection>(
    'stations',
  );
  const [selectedId, setSelectedId] = useState<string | null>(
    draft.stations[0]?.id ?? null,
  );
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [jumpOpen, setJumpOpen] = useState(false);
  const toast = useToast();

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
    onChange((prev) => {
      const number = prev.stations.length + 1;
      const station = emptyStation(createId('stn'), number);
      return { ...prev, stations: [...prev.stations, station] };
    });
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

  async function onExport() {
    setExportError(null);
    setExporting(true);
    try {
      const result = await downloadDraftExportZip(draft, { locale });
      const notice = formatSuccessfulExport(result);
      toast({
        title: `Export complete (${result.fileName})`,
        message: notice ?? 'ZIP file downloaded successfully.',
        tone: notice ? 'warning' : 'success',
        durationMs: notice ? 9000 : 5200,
      });
    } catch (error) {
      setExportError(formatExportError(error));
    } finally {
      setExporting(false);
    }
  }

  return (
    <div
      style={{
        height: '100vh',
        width: '100%',
        display: 'grid',
        gridTemplateRows: '56px minmax(0, 1fr)',
        background: 'transparent',
        overflow: 'hidden',
      }}
    >
      <StudioHeader
        draft={draft}
        locale={locale}
        view={activeSection}
        exporting={exporting}
        onBack={() => navigate('/tours')}
        onLocaleChange={setLocale}
        onViewChange={setActiveSection}
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
            top: 64,
            left: '50%',
            transform: 'translateX(-50%)',
            maxWidth: 720,
            width: 'calc(100% - 32px)',
            background: 'white',
            border: '1px solid var(--stq-error)',
            borderRadius: 12,
            padding: '10px 14px',
            fontSize: 12,
            color: 'var(--stq-error)',
            whiteSpace: 'pre-wrap',
            zIndex: 40,
            boxShadow: 'var(--stq-shadow-card)',
          }}
        >
          {exportError}
        </div>
      )}

      <div
        style={{
          padding: '12px 16px 16px',
          minHeight: 0,
          minWidth: 0,
          width: '100%',
          height: '100%',
          overflow: 'hidden',
        }}
      >
        {renderWorkspace({
          activeSection,
          draft,
          locale,
          selected,
          selectedId,
          reorderMode,
          onChange,
          onLocaleChange: setLocale,
          onSelectStation: setSelectedId,
          onSelectPrev: () => selectByDelta(-1),
          onSelectNext: () => selectByDelta(1),
          onAddStation: addStation,
          onReorderStations: reorderStations,
          onToggleReorder: () => setReorderMode((v) => !v),
          onOpenFullEditor: (stationId) =>
            navigate(`/tours/${draft.draftId}/stations/${stationId}`),
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
}

function renderWorkspace(args: RenderWorkspaceArgs) {
  // The Stations workspace ships its own three-column layout (LeftRail +
  // map/swimlane + RightPreview), so we render it raw. The other four
  // workspaces are paired with the contextual `StudioSidebar` here.
  if (args.activeSection === 'stations') {
    return (
      <StationsWorkspace
        draft={args.draft}
        locale={args.locale}
        selected={args.selected}
        selectedId={args.selectedId}
        reorderMode={args.reorderMode}
        onChange={args.onChange}
        onSelectStation={args.onSelectStation}
        onSelectPrev={args.onSelectPrev}
        onSelectNext={args.onSelectNext}
        onAddStation={args.onAddStation}
        onReorderStations={args.onReorderStations}
        onToggleReorder={args.onToggleReorder}
        onOpenFullEditor={args.onOpenFullEditor}
      />
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
        />
      );
    case 'story':
      return (
        <StoryWorkspace
          draft={args.draft}
          locale={args.locale}
          onChange={args.onChange}
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
    case 'preview':
      return (
        <PreviewWorkspace
          draft={args.draft}
          locale={args.locale}
          onLocaleChange={args.onLocaleChange}
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

function formatExportError(error: unknown): string {
  if (error instanceof DraftExportValidationError) {
    const lines = error.errors
      .slice(0, 8)
      .map((e) => `• ${e.path}: ${e.message}`);
    const extra =
      error.errors.length > 8 ? `\n…and ${error.errors.length - 8} more` : '';
    return `Cannot export — please fix:\n${lines.join('\n')}${extra}`;
  }
  return error instanceof Error ? error.message : 'Could not export this draft.';
}

function formatSuccessfulExport(result: Awaited<ReturnType<typeof downloadDraftExportZip>>) {
  const notes: string[] = [];

  if (result.missingBlobIds.length > 0) {
    notes.push(
      `${result.missingBlobIds.length} image(s) were missing in local storage and kept as existing imagePath values.`,
    );
  }

  if (result.validationWarnings.length > 0) {
    const lines = result.validationWarnings
      .slice(0, 4)
      .map((warning) => `• ${warning.message}`);
    const extra =
      result.validationWarnings.length > 4
        ? `\n…and ${result.validationWarnings.length - 4} more warning(s)`
        : '';
    notes.push(`Warnings:\n${lines.join('\n')}${extra}`);
  }

  if (notes.length === 0) {
    return null;
  }

  return notes.join('\n\n');
}
