import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDraft } from '@/hooks/useDraft';
import { LocaleTabs } from '@/components/LocaleTabs';
import { ContentBlockEditor } from '@/components/ContentBlockEditor';
import { PhoneFramePreview } from '@/components/preview/PhoneFramePreview';
import { StationDrawerPreview } from '@/components/preview/StationDrawerPreview';
import type {
  Locale,
  RiddleEntry,
  RiddleLocaleContent,
  TourDraft,
} from '@/schema';

export function StationEditorPage() {
  const { draftId, stationId } = useParams();
  const { draft, update } = useDraft(draftId);
  const [locale, setLocale] = useState<Locale>('en');

  if (!draft) {
    return <p className="text-bodySm text-disabled">Loading draft…</p>;
  }

  const station = draft.stations.find((s) => s.id === stationId);
  if (!station) {
    return (
      <div className="flex flex-col gap-3">
        <p className="text-bodySm">Station not found.</p>
        <Link className="btn-ghost" to={`/tours/${draftId}`}>
          ← Back to tour
        </Link>
      </div>
    );
  }

  function patchStation(patch: Partial<RiddleEntry>) {
    update((prev) => applyStationPatch(prev, station!.id, (s) => ({ ...s, ...patch })));
  }

  function patchLocale(patch: Partial<RiddleLocaleContent>) {
    update((prev) =>
      applyStationPatch(prev, station!.id, (s) => ({
        ...s,
        [locale]: { ...s[locale], ...patch },
      })),
    );
  }

  async function fillGps() {
    if (!navigator.geolocation) {
      alert('Geolocation not supported on this device.');
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) =>
        patchStation({
          position_lat: pos.coords.latitude,
          position_lng: pos.coords.longitude,
        }),
      (err) => alert(`GPS error: ${err.message}`),
      { enableHighAccuracy: true, maximumAge: 0, timeout: 10_000 },
    );
  }

  const localeContent = station[locale];

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <Link to={`/tours/${draftId}`} className="text-bodySm text-disabled">
          ← Tour editor
        </Link>
        <h1 className="text-h4">
          Station {station.number}: {localeContent.location || 'Untitled'}
        </h1>
      </header>

      <section className="card flex flex-col gap-4">
        <h2 className="text-h5">Station metadata</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-labelSm">Latitude</span>
            <input
              className="input-field"
              type="number"
              step="any"
              value={station.position_lat}
              onChange={(e) =>
                patchStation({ position_lat: Number(e.target.value) || 0 })
              }
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-labelSm">Longitude</span>
            <input
              className="input-field"
              type="number"
              step="any"
              value={station.position_lng}
              onChange={(e) =>
                patchStation({ position_lng: Number(e.target.value) || 0 })
              }
            />
          </label>
          <div className="col-span-2">
            <button className="btn-ghost" onClick={fillGps}>
              📍 Use current GPS location
            </button>
          </div>
          <label className="flex flex-col gap-1">
            <span className="text-labelSm">Image path</span>
            <input
              className="input-field"
              value={station.imagePath}
              onChange={(e) => patchStation({ imagePath: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-labelSm">Icon path</span>
            <input
              className="input-field"
              value={station.iconPath}
              onChange={(e) => patchStation({ iconPath: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-labelSm">Marker icon path</span>
            <input
              className="input-field"
              value={station.markerIconPath}
              onChange={(e) => patchStation({ markerIconPath: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-labelSm">Riddle type</span>
            <select
              className="input-field"
              value={station.riddleType}
              onChange={(e) =>
                patchStation({ riddleType: e.target.value as 'text' })
              }
            >
              <option value="text">text</option>
            </select>
          </label>
          <label className="col-span-2 flex flex-col gap-1">
            <span className="text-labelSm">
              Solution (shared across locales)
            </span>
            <input
              className="input-field"
              value={station.solution ?? ''}
              onChange={(e) => patchStation({ solution: e.target.value })}
            />
          </label>
        </div>
      </section>

      <section className="card flex flex-col gap-4">
        <h2 className="text-h5">Localized content</h2>
        <LocaleTabs active={locale} onChange={setLocale} />

        <label className="flex flex-col gap-1">
          <span className="text-labelSm">Location name</span>
          <input
            className="input-field"
            value={localeContent.location}
            onChange={(e) => patchLocale({ location: e.target.value })}
          />
        </label>

        <ContentBlockEditor
          label="First section (intro story)"
          blocks={localeContent.firstSection}
          onChange={(blocks) => patchLocale({ firstSection: blocks })}
        />
        <ContentBlockEditor
          label="History section"
          blocks={localeContent.historySection}
          onChange={(blocks) => patchLocale({ historySection: blocks })}
        />
        <ContentBlockEditor
          label="Riddle section"
          blocks={localeContent.riddleSection}
          onChange={(blocks) => patchLocale({ riddleSection: blocks })}
        />
        <ContentBlockEditor
          label="Success section"
          blocks={localeContent.successSection}
          onChange={(blocks) => patchLocale({ successSection: blocks })}
        />

        <HintsEditor
          hints={localeContent.hints}
          onChange={(hints) => patchLocale({ hints })}
        />
      </section>

      <section className="card flex flex-col gap-3">
        <h2 className="text-h5">Preview</h2>
        <PhoneFramePreview>
          <StationDrawerPreview station={station} locale={locale} />
        </PhoneFramePreview>
      </section>
    </div>
  );
}

function applyStationPatch(
  draft: TourDraft,
  stationId: string,
  recipe: (s: RiddleEntry) => RiddleEntry,
): TourDraft {
  return {
    ...draft,
    stations: draft.stations.map((s) => (s.id === stationId ? recipe(s) : s)),
  };
}

function HintsEditor({
  hints,
  onChange,
}: {
  hints: string[];
  onChange: (next: string[]) => void;
}) {
  function updateAt(index: number, value: string) {
    const next = hints.slice();
    next[index] = value;
    onChange(next);
  }
  return (
    <fieldset className="flex flex-col gap-2">
      <legend className="text-labelLg">Hints (up to 3)</legend>
      {hints.map((hint, i) => (
        <div key={i} className="flex gap-2">
          <input
            className="input-field"
            placeholder={`Hint ${i + 1}`}
            value={hint}
            onChange={(e) => updateAt(i, e.target.value)}
          />
          <button
            type="button"
            className="btn-ghost text-labelSm text-error"
            onClick={() => onChange(hints.filter((_, idx) => idx !== i))}
          >
            ✕
          </button>
        </div>
      ))}
      {hints.length < 3 && (
        <button
          type="button"
          className="btn-ghost self-start text-labelSm"
          onClick={() => onChange([...hints, ''])}
        >
          + Add hint
        </button>
      )}
    </fieldset>
  );
}
