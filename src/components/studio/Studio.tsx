import {
  Suspense,
  lazy,
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
import { Icon } from './Icon';
import { LeftRail } from './LeftRail';
import { RightPreview } from './RightPreview';
import { StudioHeader } from './StudioHeader';
import { Swimlane } from './Swimlane';

const LiveRoutePlannerPanel = lazy(async () => {
  const module = await import('@/components/map/LiveRoutePlannerPanel');
  return { default: module.LiveRoutePlannerPanel };
});

type View = 'overview' | 'stations' | 'intro-outro' | 'route';

interface Props {
  draft: TourDraft;
  onChange: (
    patch: Partial<TourDraft> | ((prev: TourDraft) => TourDraft),
  ) => void;
}

export function Studio({ draft, onChange }: Props) {
  const navigate = useNavigate();
  const [locale, setLocale] = useState<Locale>(DEFAULT_LOCALE);
  const [view, setView] = useState<View>('stations');
  const [selectedId, setSelectedId] = useState<string | null>(
    draft.stations[0]?.id ?? null,
  );
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);
  const [reorderMode, setReorderMode] = useState(false);
  const [jumpOpen, setJumpOpen] = useState(false);

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

  // Keyboard shortcuts: ←/→ switch, R reorder, ⌘K / Ctrl+K jump.
  useEffect(() => {
    function handler(e: KeyboardEvent) {
      const target = e.target as HTMLElement | null;
      const tag = target?.tagName;
      const isTyping =
        target?.isContentEditable ||
        tag === 'INPUT' ||
        tag === 'TEXTAREA' ||
        tag === 'SELECT';

      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setJumpOpen(true);
        return;
      }
      if (e.key === 'Escape' && jumpOpen) {
        setJumpOpen(false);
        return;
      }
      if (isTyping) return;
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
  }, [jumpOpen, selectByDelta]);

  async function onExport() {
    setExportError(null);
    setExporting(true);
    try {
      const result = await downloadDraftExportZip(draft, { locale });
      const notice = formatSuccessfulExport(result);
      if (notice) {
        alert(notice);
      }
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
        view={view}
        exporting={exporting}
        onBack={() => navigate('/tours')}
        onLocaleChange={setLocale}
        onViewChange={setView}
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
          display: 'grid',
          gridTemplateColumns: '260px minmax(0, 1fr) 380px',
          gap: 12,
          padding: '12px 16px 16px',
          minHeight: 0,
          minWidth: 0,
          width: '100%',
          overflow: 'hidden',
        }}
      >
        <LeftRail
          draft={draft}
          selected={selected}
          locale={locale}
          onSelectPrev={() => selectByDelta(-1)}
          onSelectNext={() => selectByDelta(1)}
          onOpenFullEditor={(stationId) =>
            navigate(`/tours/${draft.draftId}/stations/${stationId}`)
          }
        />

        <div
          style={{
            display: 'grid',
            gridTemplateRows: '1fr auto',
            gridTemplateColumns: 'minmax(0, 1fr)',
            gap: 14,
            minHeight: 0,
            minWidth: 0,
          }}
        >
          <div
            style={{
              borderRadius: 20,
              overflow: 'hidden',
              position: 'relative',
              border: '1px solid var(--stq-border)',
              boxShadow: 'var(--stq-shadow-card)',
              minHeight: 0,
            }}
          >
            <Suspense
              fallback={
                <div
                  style={{
                    display: 'grid',
                    placeItems: 'center',
                    height: '100%',
                    color: 'var(--stq-text-mute)',
                    fontSize: 12,
                  }}
                >
                  Loading map…
                </div>
              }
            >
              <LiveRoutePlannerPanel draft={draft} onChange={onChange} />
            </Suspense>
          </div>

          <div
            style={{
              borderRadius: 20,
              background: 'white',
              border: '1px solid var(--stq-border)',
              boxShadow: 'var(--stq-shadow-card)',
              overflow: 'hidden',
              minWidth: 0,
            }}
          >
            <SwimlaneHeader
              total={draft.stations.length}
              reorderMode={reorderMode}
              onToggleReorder={() => setReorderMode((v) => !v)}
              onAddStation={addStation}
            />
            <Swimlane
              stations={draft.stations}
              selectedId={selectedId}
              locale={locale}
              reorderMode={reorderMode}
              onSelect={setSelectedId}
              onAdd={addStation}
              onReorder={reorderStations}
              onOpenFullEditor={(stationId) =>
                navigate(`/tours/${draft.draftId}/stations/${stationId}`)
              }
            />
          </div>
        </div>

        <RightPreview
          draft={draft}
          selected={selected}
          locale={locale}
          onChange={onChange}
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

function SwimlaneHeader({
  total,
  reorderMode,
  onToggleReorder,
  onAddStation,
}: {
  total: number;
  reorderMode: boolean;
  onToggleReorder: () => void;
  onAddStation: () => void;
}) {
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '12px 20px 0',
        gap: 12,
        flexWrap: 'wrap',
      }}
    >
      <div>
        <div
          style={{
            fontSize: 10,
            fontWeight: 700,
            letterSpacing: '0.14em',
            color: 'var(--stq-primary)',
            textTransform: 'uppercase',
          }}
        >
          Stations · timeline
        </div>
        <h2
          style={{
            fontFamily: 'Lato, Georgia, serif',
            fontSize: 17,
            fontWeight: 700,
            margin: '2px 0 0',
          }}
        >
          {total} stop{total === 1 ? '' : 's'} along the loop
        </h2>
      </div>
      <div
        style={{
          display: 'flex',
          gap: 12,
          alignItems: 'center',
          flexWrap: 'wrap',
        }}
      >
        <span className="studio-kbd-hint" aria-hidden>
          <kbd className="studio-kbd">←</kbd>
          <kbd className="studio-kbd">→</kbd>
          <span>switch</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <kbd className="studio-kbd">R</kbd>
          <span>reorder</span>
          <span style={{ opacity: 0.5 }}>·</span>
          <kbd className="studio-kbd">⌘K</kbd>
          <span>jump</span>
        </span>
        <button
          type="button"
          className={`studio-btn-ghost studio-reorder-toggle${
            reorderMode ? ' active' : ''
          }`}
          style={{ minHeight: 32, padding: '0 12px', fontSize: 12 }}
          onClick={onToggleReorder}
          aria-pressed={reorderMode}
        >
          <Icon name="drag" size={13} />
          {reorderMode ? 'Done' : 'Reorder'}
        </button>
        <button
          type="button"
          className="studio-btn-primary"
          style={{ minHeight: 32, padding: '0 12px', fontSize: 12 }}
          onClick={onAddStation}
        >
          <Icon name="plus" size={13} />
          New station
        </button>
      </div>
    </div>
  );
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

  return `Export complete (${result.fileName}).\n${notes.join('\n\n')}`;
}
