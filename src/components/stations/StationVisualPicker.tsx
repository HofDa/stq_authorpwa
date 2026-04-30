import { useMemo, useState } from 'react';
import type { RiddleEntry } from '@/schema';
import {
  applyStationVisualSelection,
  getStationColorOption,
  normalizeStationVisualChoice,
  STATION_COLOR_OPTIONS,
  STATION_ICON_OPTIONS,
} from '@/stations/visuals';
import {
  StationIconPreview,
  StationMarkerPreview,
  StationRailPreview,
} from './StationVisualPreview';

interface Props {
  station: Pick<
    RiddleEntry,
    'id' | 'iconPath' | 'markerIconPath' | 'iconKey' | 'iconColorKey'
  >;
  stations?: ReadonlyArray<
    Pick<RiddleEntry, 'id' | 'iconPath' | 'markerIconPath' | 'iconKey' | 'iconColorKey'>
  >;
  onChange: (patch: Partial<RiddleEntry>) => void;
}

export function StationVisualPicker({ station, stations, onChange }: Props) {
  const choice = normalizeStationVisualChoice(station);
  const selectedColor = getStationColorOption(choice.iconColorKey);
  const [search, setSearch] = useState('');
  const filteredIcons = useMemo(() => {
    const query = normalizeSearch(search);
    if (!query) {
      return STATION_ICON_OPTIONS;
    }

    return STATION_ICON_OPTIONS.filter((option) =>
      normalizeSearch(`${option.label} ${option.key}`).includes(query),
    );
  }, [search]);

  function patch(partial: Partial<typeof choice>) {
    onChange(
      applyStationVisualSelection(station.id, {
        ...choice,
        ...partial,
      }),
    );
  }

  return (
    <div className="grid min-w-0 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
      <div className="min-w-0 rounded-[20px] border border-border bg-background px-4 py-4">
        <p className="text-labelSm uppercase tracking-[0.18em] text-primary/75">
          In App
        </p>
        <div
          className="mt-4 overflow-hidden rounded-[24px] border border-border"
          style={{
            background:
              'linear-gradient(180deg, #FCF8F9 0%, #F7F3F4 100%)',
          }}
        >
          <div
            style={{
              display: 'grid',
              placeItems: 'center',
              minHeight: 176,
              padding: 18,
              background:
                'linear-gradient(90deg, rgba(0,0,0,0.04) 0 2px, transparent 2px 58px), linear-gradient(180deg, rgba(0,0,0,0.035) 0 2px, transparent 2px 58px)',
              backgroundSize: '58px 58px',
            }}
          >
            <StationMarkerPreview
              station={station}
              style={{ width: 60, height: 92 }}
            />
          </div>
          <div className="p-3 pt-0">
            <StationRailPreview
              station={station}
              stations={stations}
              activeStationId={station.id}
            />
          </div>
        </div>
        <div
          className="mt-4 rounded-[16px] border border-border px-3 py-2 text-bodySm"
          style={{ backgroundColor: selectedColor.soft }}
        >
          {selectedColor.label} +{' '}
          {
            STATION_ICON_OPTIONS.find((option) => option.key === choice.iconKey)
              ?.label
          }
        </div>
      </div>

      <div className="flex min-w-0 flex-col gap-4">
        <div>
          <p className="text-labelSm uppercase tracking-[0.18em] text-primary/75">
            Theme
          </p>
          <div className="mt-2 flex flex-wrap gap-x-4 gap-y-2">
            {STATION_COLOR_OPTIONS.map((option) => {
              const selected = option.key === choice.iconColorKey;
              return (
                <button
                  key={option.key}
                  type="button"
                  className={[
                    'inline-flex items-center gap-2 text-labelSm',
                    selected
                      ? 'font-semibold text-text'
                      : 'text-disabled',
                  ].join(' ')}
                  onClick={() => patch({ iconColorKey: option.key })}
                >
                  <span
                    className={[
                      'h-3.5 w-3.5 rounded-full border',
                      selected ? 'border-text/25' : 'border-black/10',
                    ].join(' ')}
                    style={{ backgroundColor: option.ring }}
                    aria-hidden
                  />
                  {option.label}
                </button>
              );
            })}
          </div>
        </div>

        <div>
          <p className="text-labelSm uppercase tracking-[0.18em] text-primary/75">
            Icon
          </p>
          <div className="mt-2 flex items-center gap-2">
            <input
              type="search"
              className="input-field min-w-0"
              placeholder="Search icons"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
            />
            <span className="shrink-0 text-bodySm text-disabled">
              {filteredIcons.length}
            </span>
          </div>
          {filteredIcons.length === 0 ? (
            <div className="mt-2 rounded-[18px] border border-dashed border-border bg-background px-4 py-6 text-bodySm text-disabled">
              No icons match "{search.trim()}".
            </div>
          ) : (
            <div className="mt-2 grid grid-cols-2 gap-2 sm:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6">
              {filteredIcons.map((option) => {
                const selected = option.key === choice.iconKey;
                return (
                  <button
                    key={option.key}
                    type="button"
                    className={[
                      'flex h-[88px] flex-col items-center justify-center gap-2 rounded-[18px] border px-2 text-labelSm',
                      selected
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-border bg-white text-text',
                    ].join(' ')}
                    onClick={() => patch({ iconKey: option.key })}
                  >
                    <StationIconPreview
                      choice={{
                        iconKey: option.key,
                        iconColorKey: choice.iconColorKey,
                      }}
                      style={{ width: 36, height: 36 }}
                    />
                    <span>{option.label}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function normalizeSearch(value: string) {
  return value.trim().toLowerCase().replace(/\s+/g, ' ');
}
