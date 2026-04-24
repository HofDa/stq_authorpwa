import { useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { useDraft } from '@/hooks/useDraft';
import { LocaleTabs } from '@/components/LocaleTabs';
import { PhoneFramePreview } from '@/components/preview/PhoneFramePreview';
import { InlineStationDrawer } from '@/components/editable/InlineStationDrawer';
import { OpenClawAssistantPanel } from '@/components/assistant/OpenClawAssistantPanel';
import type { Locale, RiddleEntry } from '@/schema';

export function StationEditorPage() {
  const { draftId, stationId } = useParams();
  const navigate = useNavigate();
  const { draft, update } = useDraft(draftId);
  const [locale, setLocale] = useState<Locale>('en');
  const [showAdvanced, setShowAdvanced] = useState(false);

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
  const stationIndex = draft.stations.findIndex((s) => s.id === station.id);
  const prevStation = stationIndex > 0 ? draft.stations[stationIndex - 1] : null;
  const nextStation =
    stationIndex >= 0 && stationIndex < draft.stations.length - 1
      ? draft.stations[stationIndex + 1]
      : null;

  function patchStation(patch: Partial<RiddleEntry>) {
    update((prev) => ({
      ...prev,
      stations: prev.stations.map((s) =>
        s.id === station!.id ? { ...s, ...patch } : s,
      ),
    }));
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

  return (
    <div className="flex flex-col gap-4">
      <header className="card flex flex-col gap-3">
        <Link to={`/tours/${draftId}`} className="text-bodySm text-disabled">
          ← Tour editor
        </Link>
        <div>
          <p className="text-labelSm uppercase tracking-[0.18em] text-primary/75">
            Station Authoring
          </p>
          <h1 className="text-h4">
            Station {station.number}: {station[locale].location || 'Untitled'}
          </h1>
          <p className="mt-1 text-bodySm text-disabled">
            {stationIndex + 1} of {draft.stations.length}. Fine-tune the place,
            route stop, and riddle content in the same mobile rhythm as the native app.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-2">
        <button
          className="btn-ghost justify-start"
          disabled={!prevStation}
          onClick={() => {
            if (!prevStation) return;
            navigate(`/tours/${draftId}/stations/${prevStation.id}`);
          }}
        >
          ← Previous
        </button>
        <button
          className="btn-ghost justify-end"
          disabled={!nextStation}
          onClick={() => {
            if (!nextStation) return;
            navigate(`/tours/${draftId}/stations/${nextStation.id}`);
          }}
        >
          Next →
        </button>
      </div>

      <LocaleTabs active={locale} onChange={setLocale} />

      <PhoneFramePreview>
        <InlineStationDrawer
          draft={draft}
          station={station}
          locale={locale}
          onChange={update}
        />
      </PhoneFramePreview>

      <OpenClawAssistantPanel draft={draft} locale={locale} station={station} />

      <section className="card flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <h2 className="text-h6">Location</h2>
          <button className="btn-ghost text-labelSm" onClick={fillGps}>
            Use current GPS
          </button>
        </div>
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
        </div>
      </section>

      <section className="card flex flex-col gap-2">
        <button
          className="btn-ghost self-start"
          onClick={() => setShowAdvanced((v) => !v)}
        >
          {showAdvanced ? '▼' : '▶'} Advanced metadata
        </button>
        {showAdvanced && (
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
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
                onChange={(e) =>
                  patchStation({ markerIconPath: e.target.value })
                }
              />
            </label>
          </div>
        )}
      </section>

      <div
        className="sticky bottom-2 z-10 grid grid-cols-3 gap-2 rounded-md
                   border border-border bg-background/95 p-2 shadow-sm
                   backdrop-blur"
      >
        <button
          className="btn-ghost"
          disabled={!prevStation}
          onClick={() => {
            if (!prevStation) return;
            navigate(`/tours/${draftId}/stations/${prevStation.id}`);
          }}
        >
          ← Prev
        </button>
        <button className="btn-primary" onClick={fillGps}>
          GPS
        </button>
        <button
          className="btn-ghost"
          disabled={!nextStation}
          onClick={() => {
            if (!nextStation) return;
            navigate(`/tours/${draftId}/stations/${nextStation.id}`);
          }}
        >
          Next →
        </button>
      </div>
    </div>
  );
}
