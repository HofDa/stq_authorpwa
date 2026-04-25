import type { RiddleEntry } from '@/schema';
import { formatStationLabel } from './liveRoutePlannerUtils';

interface Props {
  stations: RiddleEntry[];
  selectedStationId: string;
  toleranceMeters: number;
  tracking: boolean;
  canAssignCurrentPosition: boolean;
  canWriteOptimizedPaths: boolean;
  canClearTrack: boolean;
  onSelectedStationChange: (stationId: string) => void;
  onToleranceChange: (toleranceMeters: number) => void;
  onToggleTracking: () => void;
  onAssignCurrentPosition: () => void;
  onWriteOptimizedPaths: () => void;
  onClearTrack: () => void;
}

export function RoutePlannerControls({
  stations,
  selectedStationId,
  toleranceMeters,
  tracking,
  canAssignCurrentPosition,
  canWriteOptimizedPaths,
  canClearTrack,
  onSelectedStationChange,
  onToleranceChange,
  onToggleTracking,
  onAssignCurrentPosition,
  onWriteOptimizedPaths,
  onClearTrack,
}: Props) {
  return (
    <>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="flex flex-col gap-1">
          <span className="text-labelSm">Selected station</span>
          <select
            className="input-field"
            value={selectedStationId}
            onChange={(event) => onSelectedStationChange(event.target.value)}
          >
            {stations.length === 0 ? (
              <option value="">No stations yet</option>
            ) : (
              stations.map((station) => (
                <option key={station.id} value={station.id}>
                  {station.number}. {formatStationLabel(station)}
                </option>
              ))
            )}
          </select>
        </label>

        <label className="flex flex-col gap-1">
          <span className="text-labelSm">Optimize tolerance (meters)</span>
          <input
            className="input-field"
            type="number"
            min={1}
            max={100}
            value={toleranceMeters}
            onChange={(event) =>
              onToleranceChange(Math.max(1, Number(event.target.value) || 1))
            }
          />
        </label>
      </div>

      <div className="mt-3 flex flex-wrap gap-2">
        <button
          className={tracking ? 'btn-primary' : 'btn-ghost'}
          onClick={onToggleTracking}
        >
          {tracking ? 'Pause Tracking' : 'Start Tracking'}
        </button>
        <button
          className="btn-ghost"
          onClick={onAssignCurrentPosition}
          disabled={!canAssignCurrentPosition}
        >
          Use Current GPS For Station
        </button>
        <button
          className="btn-primary"
          onClick={onWriteOptimizedPaths}
          disabled={!canWriteOptimizedPaths}
        >
          Write Optimized Paths
        </button>
        <button
          className="btn-ghost"
          onClick={onClearTrack}
          disabled={!canClearTrack}
        >
          Clear Track
        </button>
      </div>
    </>
  );
}

