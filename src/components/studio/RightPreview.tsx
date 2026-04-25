import { useState, type ReactNode } from 'react';
import type { Locale, RiddleEntry, TourDraft } from '@/schema';
import { InlineTourIntro } from '@/components/editable/InlineTourIntro';
import { InlineStationDrawer } from '@/components/editable/InlineStationDrawer';

interface Props {
  draft: TourDraft;
  selected: RiddleEntry | null;
  locale: Locale;
  onChange: (recipe: (prev: TourDraft) => TourDraft) => void;
}

type Mode = 'intro' | 'station';

export function RightPreview({ draft, selected, locale, onChange }: Props) {
  const [mode, setMode] = useState<Mode>(selected ? 'station' : 'intro');
  const effectiveMode: Mode = mode === 'station' && !selected ? 'intro' : mode;

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
          background: 'white',
          border: '1px solid var(--stq-border)',
          borderRadius: 18,
          padding: '12px 14px',
          boxShadow: 'var(--stq-shadow-soft)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
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
          <div className="studio-seg">
            <button
              className={effectiveMode === 'intro' ? 'active' : ''}
              onClick={() => setMode('intro')}
            >
              Intro
            </button>
            <button
              className={effectiveMode === 'station' ? 'active' : ''}
              onClick={() => setMode('station')}
              disabled={!selected}
            >
              Station
            </button>
          </div>
        </div>
      </div>

      <div
        style={{
          flex: 1,
          background:
            'linear-gradient(180deg, rgba(35,25,25,0.03), rgba(35,25,25,0.06))',
          border: '1px solid var(--stq-border)',
          borderRadius: 20,
          display: 'grid',
          placeItems: 'center',
          padding: 18,
          minHeight: 0,
          overflow: 'hidden',
          position: 'relative',
        }}
      >
        <PhoneFrame>
          {effectiveMode === 'intro' || !selected ? (
            <InlineTourIntro draft={draft} locale={locale} onChange={onChange} />
          ) : (
            <InlineStationDrawer
              draft={draft}
              station={selected}
              locale={locale}
              onChange={onChange}
            />
          )}
        </PhoneFrame>
      </div>
    </aside>
  );
}

function PhoneFrame({ children }: { children: ReactNode }) {
  return (
    <div
      className="studio-phone-shell"
      style={{ width: 320, maxHeight: '100%' }}
    >
      <div className="studio-phone-notch" />
      <div className="studio-phone-screen" style={{ height: 640 }}>
        <div
          className="studio-scroll"
          style={{ height: '100%', overflowY: 'auto', paddingTop: 38 }}
        >
          {children}
          <div style={{ height: 24 }} />
        </div>
      </div>
      <div className="studio-phone-home" />
    </div>
  );
}
