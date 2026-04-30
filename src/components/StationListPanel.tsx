import { Link, useNavigate } from 'react-router-dom';
import {
  createId,
  DEFAULT_LOCALE,
  emptyStation,
  type RiddleEntry,
} from '@/schema';
import { StationIconPreview } from '@/components/stations/StationVisualPreview';
import { getStationLocationLabel } from '@/utils/localizedContent';
import { useConfirm } from '@/components/ui/FeedbackProvider';

interface Props {
  draftId: string;
  stations: RiddleEntry[];
  onChange: (stations: RiddleEntry[]) => void;
}

export function StationListPanel({ draftId, stations, onChange }: Props) {
  const navigate = useNavigate();
  const askConfirm = useConfirm();

  function addStation() {
    const id = createId('stn');
    const number = stations.length + 1;
    const station = emptyStation(id, number);
    onChange([...stations, station]);
    navigate(`/tours/${draftId}/stations/${id}`);
  }

  async function removeStation(id: string) {
    const confirmed = await askConfirm({
      title: 'Delete station?',
      message: 'This removes the station from the local draft.',
      confirmLabel: 'Delete',
      tone: 'danger',
    });
    if (!confirmed) return;
    onChange(
      stations
        .filter((s) => s.id !== id)
        .map((s, i) => ({ ...s, number: i + 1 })),
    );
  }

  function move(id: string, delta: -1 | 1) {
    const index = stations.findIndex((s) => s.id === id);
    const target = index + delta;
    if (index < 0 || target < 0 || target >= stations.length) return;
    const next = stations.slice();
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next.map((s, i) => ({ ...s, number: i + 1 })));
  }

  return (
    <section className="card flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-labelSm uppercase tracking-[0.18em] text-primary/75">
            Author Route
          </p>
          <h2 className="text-h5">Stations</h2>
        </div>
        <button className="btn-primary" onClick={addStation}>
          + Add station
        </button>
      </div>
      {stations.length === 0 ? (
        <div className="rounded-[20px] border border-dashed border-border bg-background px-4 py-6 text-center">
          <p className="text-h6">No stations yet.</p>
          <p className="mt-1 text-bodySm text-disabled">
            Add the first stop, then walk the route and capture it on the live map.
          </p>
        </div>
      ) : (
        <ul className="flex flex-col gap-2">
          {stations.map((station, index) => (
            <li
              key={station.id}
              className="flex items-center gap-3 rounded-[20px] border border-border bg-background/70 p-3"
            >
              <div className="relative h-12 w-12 shrink-0">
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-[16px]
                             border border-border bg-white shadow-[0_8px_18px_rgba(35,25,25,0.08)]"
                >
                  <StationIconPreview
                    station={station}
                    style={{ width: 38, height: 38 }}
                  />
                </div>
                <span
                  className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center
                             justify-center rounded-full border-2 border-background
                             bg-primary text-[10px] font-bold text-white"
                >
                  {station.number}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <Link
                  to={`/tours/${draftId}/stations/${station.id}`}
                  className="block truncate text-h6 text-primary"
                >
                  {getStationLocationLabel(
                    station,
                    DEFAULT_LOCALE,
                    'Untitled station',
                  )}
                </Link>
                <div className="mt-1 flex flex-wrap gap-2">
                  <span className="rounded-full border border-border bg-white px-2.5 py-1 text-labelSm text-disabled">
                    text
                  </span>
                  <span className="rounded-full border border-border bg-white px-2.5 py-1 text-labelSm text-disabled">
                    {isZeroCoordinate(station)
                      ? 'GPS pending'
                      : `${station.position_lat.toFixed(5)}, ${station.position_lng.toFixed(5)}`}
                  </span>
                </div>
              </div>
              <div className="flex gap-1">
                <button
                  className="btn-ghost min-h-[40px] px-3 text-labelSm"
                  onClick={() => move(station.id, -1)}
                  disabled={index === 0}
                >
                  ↑
                </button>
                <button
                  className="btn-ghost min-h-[40px] px-3 text-labelSm"
                  onClick={() => move(station.id, 1)}
                  disabled={index === stations.length - 1}
                >
                  ↓
                </button>
                <button
                  className="btn-ghost min-h-[40px] px-3 text-labelSm text-error"
                  onClick={() => removeStation(station.id)}
                >
                  ✕
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

function isZeroCoordinate(station: RiddleEntry) {
  return station.position_lat === 0 && station.position_lng === 0;
}
