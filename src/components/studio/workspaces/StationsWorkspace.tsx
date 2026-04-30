import { Suspense, lazy, useState } from 'react';
import type { Locale, RiddleEntry, TourDraft } from '@/schema';
import { InlineStationDrawer } from '@/components/editable/InlineStationDrawer';
import { Icon } from '../Icon';
import { LeftRail } from '../LeftRail';
import { RightPreview } from '../RightPreview';
import { Swimlane } from '../Swimlane';

const LiveRoutePlannerPanel = lazy(async () => {
  const module = await import('@/components/map/LiveRoutePlannerPanel');
  return { default: module.LiveRoutePlannerPanel };
});

interface Props {
  draft: TourDraft;
  locale: Locale;
  selected: RiddleEntry | null;
  selectedId: string | null;
  reorderMode: boolean;
  onChange: (
    patch: Partial<TourDraft> | ((prev: TourDraft) => TourDraft),
  ) => void;
  onSelectStation: (id: string) => void;
  onSelectPrev: () => void;
  onSelectNext: () => void;
  onAddStation: () => void;
  onReorderStations: (sourceId: string, targetId: string) => void;
  onToggleReorder: () => void;
  onOpenFullEditor: (stationId: string) => void;
}

type StationsMode = 'map' | 'edit';

/**
 * Stations workspace — answers "what happens on site?".
 *
 * Two modes share the same left rail (selection + checklist) so the
 * authoring context never disappears:
 *
 *   Map mode   → big map, station timeline, GPS/position work
 *   Edit mode  → shrunken map, expanded inline station editor
 *
 * The keyboard shortcuts (←/→, R, ⌘K) and add/reorder controls live in
 * Map mode; Edit mode focuses on the selected station's content.
 */
export function StationsWorkspace({
  draft,
  locale,
  selected,
  selectedId,
  reorderMode,
  onChange,
  onSelectStation,
  onSelectPrev,
  onSelectNext,
  onAddStation,
  onReorderStations,
  onToggleReorder,
  onOpenFullEditor,
}: Props) {
  const [mode, setMode] = useState<StationsMode>('map');
  const [previewCollapsed, setPreviewCollapsed] = useState(false);

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: previewCollapsed
          ? '260px minmax(0, 1fr) 44px'
          : '260px minmax(0, 1fr) 380px',
        gap: 12,
        minHeight: 0,
        minWidth: 0,
        width: '100%',
        height: '100%',
        overflow: 'hidden',
      }}
    >
      <LeftRail
        draft={draft}
        selected={selected}
        locale={locale}
        onSelectPrev={onSelectPrev}
        onSelectNext={onSelectNext}
      />

      <div
        style={{
          display: 'grid',
          gridTemplateRows: 'auto minmax(0, 1fr) auto',
          gridTemplateColumns: 'minmax(0, 1fr)',
          gap: 12,
          minHeight: 0,
          minWidth: 0,
        }}
      >
        <ModeBar
          mode={mode}
          onModeChange={setMode}
          stationCount={draft.stations.length}
          reorderMode={reorderMode}
          onToggleReorder={onToggleReorder}
          onAddStation={onAddStation}
        />

        {mode === 'map' ? (
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
            <Suspense fallback={<MapFallback />}>
              <LiveRoutePlannerPanel draft={draft} onChange={onChange} />
            </Suspense>
          </div>
        ) : (
          <div
            style={{
              display: 'grid',
              gridTemplateRows: '180px minmax(0, 1fr)',
              gap: 12,
              minHeight: 0,
            }}
          >
            <div
              style={{
                borderRadius: 16,
                overflow: 'hidden',
                position: 'relative',
                border: '1px solid var(--stq-border)',
                boxShadow: 'var(--stq-shadow-soft)',
              }}
            >
              <Suspense fallback={<MapFallback />}>
                <LiveRoutePlannerPanel draft={draft} onChange={onChange} />
              </Suspense>
            </div>
            <div
              style={{
                borderRadius: 16,
                background: 'white',
                border: '1px solid var(--stq-border)',
                boxShadow: 'var(--stq-shadow-soft)',
                overflow: 'hidden',
                minHeight: 0,
                display: 'flex',
                flexDirection: 'column',
              }}
            >
              <div
                style={{
                  padding: '10px 16px',
                  borderBottom: '1px solid var(--stq-border-soft)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: 12,
                }}
              >
                <div>
                  <div style={eyebrowStyle}>Stations · edit</div>
                  <h2
                    style={{
                      fontFamily: 'Lato, Georgia, serif',
                      fontSize: 15,
                      fontWeight: 700,
                      margin: '2px 0 0',
                    }}
                  >
                    {selected
                      ? selected[locale].location || `Station ${selected.number}`
                      : 'No station selected'}
                  </h2>
                </div>
                {selected && (
                  <button
                    type="button"
                    className="studio-btn-ghost"
                    style={{ minHeight: 30, padding: '0 12px', fontSize: 12 }}
                    onClick={() => onOpenFullEditor(selected.id)}
                  >
                    Open full editor
                  </button>
                )}
              </div>
              <div
                style={{
                  flex: 1,
                  minHeight: 0,
                  overflow: 'auto',
                  padding: 16,
                }}
              >
                {selected ? (
                  <InlineStationDrawer
                    draft={draft}
                    station={selected}
                    locale={locale}
                    onChange={onChange}
                  />
                ) : (
                  <div
                    style={{
                      display: 'grid',
                      placeItems: 'center',
                      height: '100%',
                      color: 'var(--stq-text-mute)',
                      fontSize: 13,
                      textAlign: 'center',
                      padding: 24,
                    }}
                  >
                    Select a station from the timeline to edit its content.
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

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
          <Swimlane
            stations={draft.stations}
            selectedId={selectedId}
            locale={locale}
            reorderMode={reorderMode}
            onSelect={onSelectStation}
            onAdd={onAddStation}
            onReorder={onReorderStations}
            onOpenFullEditor={onOpenFullEditor}
          />
        </div>
      </div>

      <RightPreview
        draft={draft}
        selected={selected}
        locale={locale}
        onChange={onChange}
        collapsed={previewCollapsed}
        onToggleCollapsed={() => setPreviewCollapsed((c) => !c)}
      />
    </div>
  );
}

function ModeBar({
  mode,
  onModeChange,
  stationCount,
  reorderMode,
  onToggleReorder,
  onAddStation,
}: {
  mode: StationsMode;
  onModeChange: (mode: StationsMode) => void;
  stationCount: number;
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
        gap: 12,
        flexWrap: 'wrap',
        padding: '4px 4px 0',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <div className="studio-seg" role="tablist" aria-label="Stations mode">
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'map'}
            className={mode === 'map' ? 'active' : ''}
            onClick={() => onModeChange('map')}
          >
            <Icon name="map-pin" size={12} />
            <span style={{ marginLeft: 4 }}>Map</span>
          </button>
          <button
            type="button"
            role="tab"
            aria-selected={mode === 'edit'}
            className={mode === 'edit' ? 'active' : ''}
            onClick={() => onModeChange('edit')}
          >
            <Icon name="edit" size={12} />
            <span style={{ marginLeft: 4 }}>Edit</span>
          </button>
        </div>
        <div style={{ fontSize: 12, color: 'var(--stq-text-mute)' }}>
          {stationCount} stop{stationCount === 1 ? '' : 's'} along the loop
        </div>
      </div>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 12,
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
        {mode === 'map' && (
          <>
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
          </>
        )}
      </div>
    </div>
  );
}

function MapFallback() {
  return (
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
  );
}

const eyebrowStyle: React.CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.14em',
  color: 'var(--stq-primary)',
  textTransform: 'uppercase',
};
