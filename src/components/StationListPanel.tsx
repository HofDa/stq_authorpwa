import { Link, useNavigate } from 'react-router-dom';
import { createId, emptyStation, type RiddleEntry } from '@/schema';

interface Props {
  draftId: string;
  stations: RiddleEntry[];
  onChange: (stations: RiddleEntry[]) => void;
}

export function StationListPanel({ draftId, stations, onChange }: Props) {
  const navigate = useNavigate();

  function addStation() {
    const id = createId('stn');
    const number = stations.length + 1;
    const station = emptyStation(id, number);
    onChange([...stations, station]);
    navigate(`/tours/${draftId}/stations/${id}`);
  }

  function removeStation(id: string) {
    if (!confirm('Delete this station?')) return;
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
        <h2 className="text-h5">Stations</h2>
        <button className="btn-primary" onClick={addStation}>
          + Add station
        </button>
      </div>
      {stations.length === 0 ? (
        <p className="text-bodySm text-disabled">No stations yet.</p>
      ) : (
        <ul className="flex flex-col gap-2">
          {stations.map((station, index) => (
            <li
              key={station.id}
              className="flex items-center gap-3 rounded-sm border border-border bg-white p-3"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-labelLg text-white">
                {station.number}
              </span>
              <div className="min-w-0 flex-1">
                <Link
                  to={`/tours/${draftId}/stations/${station.id}`}
                  className="block truncate text-h6 text-primary"
                >
                  {station.en.location || station.de.location || station.it.location || 'Untitled station'}
                </Link>
                <p className="text-bodySm text-disabled">
                  text · {station.position_lat.toFixed(5)},{' '}
                  {station.position_lng.toFixed(5)}
                </p>
              </div>
              <div className="flex gap-1">
                <button
                  className="btn-ghost text-labelSm"
                  onClick={() => move(station.id, -1)}
                  disabled={index === 0}
                >
                  ↑
                </button>
                <button
                  className="btn-ghost text-labelSm"
                  onClick={() => move(station.id, 1)}
                  disabled={index === stations.length - 1}
                >
                  ↓
                </button>
                <button
                  className="btn-ghost text-labelSm text-error"
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
