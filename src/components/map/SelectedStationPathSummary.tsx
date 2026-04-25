import type { DerivedStationPath } from '@/map/routePlanning';
import type { RiddleEntry } from '@/schema';
import { formatDistanceMeters } from './liveRoutePlannerUtils';

interface Props {
  station: RiddleEntry | undefined;
  stationPath: DerivedStationPath | undefined;
}

export function SelectedStationPathSummary({ station, stationPath }: Props) {
  return (
    <section className="rounded-md border border-border bg-white p-3">
      <h3 className="text-h6">Selected Station Path</h3>
      {station && stationPath ? (
        <div className="mt-3 flex flex-col gap-2 text-bodySm">
          <p>
            Station {station.number} will receive a route with {stationPath.pointCount}{' '}
            point
            {stationPath.pointCount === 1 ? '' : 's'}.
          </p>
          <p>
            Estimated segment length:{' '}
            {formatDistanceMeters(stationPath.distanceMeters)}.
          </p>
          <p>
            Current stored polyline: {station.polylineString ? 'present' : 'empty'}
          </p>
        </div>
      ) : (
        <p className="mt-3 text-bodySm text-disabled">
          Select a station and record a route to preview the exported path.
        </p>
      )}
    </section>
  );
}

