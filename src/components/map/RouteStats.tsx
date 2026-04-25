import { formatDistanceMeters } from './liveRoutePlannerUtils';

interface Props {
  rawPointCount: number;
  optimizedPointCount: number;
  rawDistanceMeters: number;
  optimizedDistanceMeters: number;
}

export function RouteStats({
  rawPointCount,
  optimizedPointCount,
  rawDistanceMeters,
  optimizedDistanceMeters,
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
      <StatCard label="Raw points" value={String(rawPointCount)} />
      <StatCard label="Optimized" value={String(optimizedPointCount)} />
      <StatCard
        label="Raw distance"
        value={formatDistanceMeters(rawDistanceMeters)}
      />
      <StatCard
        label="Optimized"
        value={formatDistanceMeters(optimizedDistanceMeters)}
      />
    </div>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-sm border border-border bg-white px-3 py-2">
      <p className="text-labelSm uppercase tracking-wide text-disabled">{label}</p>
      <p className="mt-1 text-h6">{value}</p>
    </div>
  );
}

