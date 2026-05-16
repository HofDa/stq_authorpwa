interface MapLibreErrorOverlayProps {
  visible: boolean;
}

export function MapLibreErrorOverlay({ visible }: MapLibreErrorOverlayProps) {
  if (!visible) {
    return null;
  }

  return (
    <div
      className="pointer-events-none absolute inset-x-3 top-3 z-[500] rounded-2xl border border-amber-200 bg-amber-50/95 px-3 py-2 text-xs font-semibold text-amber-900 shadow-sm"
      role="status"
    >
      Map tiles could not be loaded. Check the map style URL or network
      connection.
    </div>
  );
}
