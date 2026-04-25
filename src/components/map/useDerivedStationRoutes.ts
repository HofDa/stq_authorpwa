import type { RecordedRoutePoint, RiddleEntry } from '@/schema';
import {
  calculateRouteLengthMeters,
  deriveStationPathsFromRecordedRoute,
  type StationRouteDerivation,
} from '@/map/routePlanning';
import { hasUsableStationCoordinate } from '@/utils/coordinates';

interface Props {
  stations: RiddleEntry[];
  recordedRoute: RecordedRoutePoint[];
  toleranceMeters: number;
  selectedStationId: string;
}

export interface DerivedRoutePlannerState {
  derivation: StationRouteDerivation;
  rawDistanceMeters: number;
  optimizedDistanceMeters: number;
  stationsWithCoordinates: RiddleEntry[];
  selectedStationPath: StationRouteDerivation['stationPaths'][number] | undefined;
}

export function buildDerivedRoutePlannerState({
  stations,
  recordedRoute,
  toleranceMeters,
  selectedStationId,
}: Props): DerivedRoutePlannerState {
  const derivation = deriveStationPathsFromRecordedRoute(
    stations,
    recordedRoute,
    toleranceMeters,
  );

  return {
    derivation,
    rawDistanceMeters: calculateRouteLengthMeters(recordedRoute),
    optimizedDistanceMeters: calculateRouteLengthMeters(
      derivation.optimizedRoute,
    ),
    stationsWithCoordinates: stations.filter(hasUsableStationCoordinate),
    selectedStationPath: derivation.stationPaths.find(
      (path) => path.stationId === selectedStationId,
    ),
  };
}

export function useDerivedStationRoutes(props: Props) {
  return buildDerivedRoutePlannerState(props);
}

