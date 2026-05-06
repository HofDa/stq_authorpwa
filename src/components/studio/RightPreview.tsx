import { useState } from 'react';
import type { Locale, RiddleEntry, TourDraft } from '@/schema';
import { InlineTourIntro } from '@/components/editable/InlineTourIntro';
import { InlineStationDrawer } from '@/components/editable/InlineStationDrawer';
import { Icon } from './Icon';
import { DeviceMockup } from './DeviceMockup';

interface Props {
  draft: TourDraft;
  selected: RiddleEntry | null;
  locale: Locale;
  onChange: (recipe: (prev: TourDraft) => TourDraft) => void;
  /**
   * When `true`, the preview collapses to a 36px rail with an "Open" button.
   * The Stations workspace toggles this so the right column doesn't compete
   * with the Edit-mode editor for screen real estate.
   */
  collapsed?: boolean;
  onToggleCollapsed?: () => void;
  /** Lock the inner mode (intro/station/outro). Used by Story workspace. */
  forcedMode?: Mode;
}

type Mode = 'intro' | 'station' | 'outro';

export function RightPreview({
  draft,
  selected,
  locale,
  onChange,
  collapsed,
  onToggleCollapsed,
  forcedMode,
}: Props) {
  const [mode, setMode] = useState<Mode>(
    forcedMode ?? (selected ? 'station' : 'intro'),
  );
  const activeMode = forcedMode ?? mode;
  const effectiveMode: Mode = activeMode === 'station' && !selected ? 'intro' : activeMode;

  if (collapsed) {
    return (
      <aside
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          paddingTop: 12,
        }}
      >
        <button
          type="button"
          className="studio-btn-ghost"
          onClick={onToggleCollapsed}
          style={{
            writingMode: 'vertical-rl',
            transform: 'rotate(180deg)',
            minHeight: 0,
            padding: '12px 6px',
            fontSize: 11,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
          }}
          aria-label="Show tourist preview"
        >
          <Icon name="phone" size={12} />
          <span style={{ marginTop: 6 }}>Show preview</span>
        </button>
      </aside>
    );
  }

  return (
    <aside
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
        minHeight: 0,
      }}
    >
      <div
        style={{
          background: 'var(--stq-author-surface, white)',
          border: '1px solid var(--stq-border)',
          borderRadius: 10,
          padding: '12px 14px',
          boxShadow: 'none',
          color: 'var(--stq-text)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
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
              Tourist preview
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 2 }}>
              What they'll see
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            {!forcedMode && (
              <div className="studio-seg">
                <button
                  type="button"
                  className={effectiveMode === 'intro' ? 'active' : ''}
                  onClick={() => setMode('intro')}
                >
                  Intro
                </button>
                <button
                  type="button"
                  className={effectiveMode === 'station' ? 'active' : ''}
                  onClick={() => setMode('station')}
                  disabled={!selected}
                >
                  Station
                </button>
                <button
                  type="button"
                  className={effectiveMode === 'outro' ? 'active' : ''}
                  onClick={() => setMode('outro')}
                >
                  Outro
                </button>
              </div>
            )}
            {onToggleCollapsed && (
              <button
                type="button"
                className="studio-btn-icon"
                style={{ width: 28, height: 28 }}
                onClick={onToggleCollapsed}
                aria-label="Collapse tourist preview"
              >
                <Icon name="chevron-right" size={13} />
              </button>
            )}
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          display: 'grid',
          placeItems: 'center',
          padding: 0,
          minHeight: 0,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <DeviceMockup
          label="Tourist preview"
          detail={previewDetail(effectiveMode, selected, locale)}
          width={402}
          height={870}
        >
          {effectiveMode === 'station' && selected ? (
            <InlineStationDrawer
              draft={draft}
              station={selected}
              locale={locale}
              onChange={onChange}
            />
          ) : (
            <InlineTourIntro
              key={effectiveMode === 'outro' ? 'outro' : 'intro'}
              draft={draft}
              locale={locale}
              onChange={onChange}
              initialTab={effectiveMode === 'outro' ? 'outro' : 'intro'}
            />
          )}
        </DeviceMockup>
      </div>
    </aside>
  );
}

function previewDetail(
  mode: Mode,
  selected: RiddleEntry | null,
  locale: Locale,
): string {
  if (mode === 'intro') return 'Intro screen';
  if (mode === 'outro') return 'Outro screen';
  if (!selected) return 'No station selected';
  return `Station ${selected.number}: ${selected[locale].location || 'Unnamed station'}`;
}
