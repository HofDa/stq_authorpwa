import { useEffect, useMemo, useState } from 'react';
import type { Locale, RiddleEntry } from '@/schema';

interface JumpPaletteProps {
  stations: RiddleEntry[];
  locale: Locale;
  onClose: () => void;
  onSelect: (id: string) => void;
}

export function JumpPalette({
  stations,
  locale,
  onClose,
  onSelect,
}: JumpPaletteProps) {
  const [query, setQuery] = useState('');
  const [activeIdx, setActiveIdx] = useState(0);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return stations;
    return stations.filter((station) => {
      const fields = [
        station[locale].location,
        summarize(station, locale),
        String(station.number),
      ];
      return fields.some((field) =>
        (field ?? '').toString().toLowerCase().includes(q),
      );
    });
  }, [stations, locale, query]);

  useEffect(() => {
    setActiveIdx(0);
  }, [query]);

  function handleKey(event: React.KeyboardEvent<HTMLInputElement>) {
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      setActiveIdx((index) => Math.min(matches.length - 1, index + 1));
    } else if (event.key === 'ArrowUp') {
      event.preventDefault();
      setActiveIdx((index) => Math.max(0, index - 1));
    } else if (event.key === 'Enter') {
      event.preventDefault();
      const target = matches[activeIdx];
      if (target) onSelect(target.id);
    } else if (event.key === 'Escape') {
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
      <div className="studio-jump-panel" onClick={(event) => event.stopPropagation()}>
        <input
          autoFocus
          className="studio-jump-input"
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          onKeyDown={handleKey}
          placeholder="Jump to station..."
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
          {matches.map((station, index) => (
            <button
              key={station.id}
              type="button"
              className={`studio-jump-row${index === activeIdx ? ' active' : ''}`}
              onMouseEnter={() => setActiveIdx(index)}
              onClick={() => onSelect(station.id)}
            >
              <span className="studio-pin" style={{ width: 26, height: 26, fontSize: 11 }}>
                {station.number}
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
                  {station[locale].location || 'Unnamed station'}
                </span>
                {summarize(station, locale) && (
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
                    {summarize(station, locale)}
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
    (block) =>
      block.type === 'paragraph' ||
      block.type === 'heading' ||
      block.type === 'line',
  ) as { text?: string } | undefined;
  return (first?.text ?? '').trim();
}
