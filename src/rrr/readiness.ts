import type { RiddleEntry, TourDraft } from '@/schema';
import {
  getRrrWarnings,
  RRR_MODULE_PRESETS,
  type RrrInteraction,
  type RrrModule,
  type RrrWarning,
} from '@/rrr-core';

export type RrrReadinessIssueCode =
  | RrrWarning['code']
  | 'sensor_fallback_recommended'
  | 'gps_radius_missing'
  | 'gps_radius_large';

export interface RrrReadinessIssue {
  code: RrrReadinessIssueCode;
  message: string;
  moduleId?: string;
}

export interface RrrStationReadiness {
  stationId: string;
  stationNumber: number;
  stationLabel: string;
  issues: RrrReadinessIssue[];
}

export interface RrrTourReadiness {
  modularStationCount: number;
  issueCount: number;
  stations: RrrStationReadiness[];
}

const MAX_PLAUSIBLE_GPS_RADIUS_METERS = 200;

export function getRrrTourReadiness(draft: TourDraft): RrrTourReadiness {
  const modularStations = draft.stations.filter(isModularStation);
  const stations = modularStations
    .map((station) => {
      const interaction = station.interaction;
      const issues = interaction ? getInteractionIssues(interaction) : [];

      if (!interaction) {
        issues.unshift({
          code: 'no_modules',
          message: 'Modulares Rätsel hat noch keine Bausteine.',
        });
        issues.push({
          code: 'no_condition',
          message: 'Modulares Rätsel hat noch keine Lösungsregel.',
        });
      }

      return {
        stationId: station.id,
        stationNumber: station.number,
        stationLabel: getStationReadinessLabel(station),
        issues,
      };
    })
    .filter((station) => station.issues.length > 0);

  return {
    modularStationCount: modularStations.length,
    issueCount: stations.reduce(
      (total, station) => total + station.issues.length,
      0,
    ),
    stations,
  };
}

function isModularStation(station: RiddleEntry): boolean {
  return station.riddleType === 'modular';
}

function getInteractionIssues(interaction: RrrInteraction): RrrReadinessIssue[] {
  const warningIssues = getRrrWarnings(interaction).map((warning) => ({
    code: warning.code,
    message: warning.message,
    moduleId: warning.moduleId,
  }));

  return [
    ...warningIssues,
    ...interaction.modules.flatMap((module) =>
      getAdditionalModuleIssues(module),
    ),
  ];
}

function getAdditionalModuleIssues(module: RrrModule): RrrReadinessIssue[] {
  const issues: RrrReadinessIssue[] = [];
  const preset = RRR_MODULE_PRESETS[module.type];

  if (
    preset.needsFallback &&
    !module.fallbackModuleId &&
    preset.recommendedFallbackTypes.length > 0
  ) {
    issues.push({
      code: 'sensor_fallback_recommended',
      message: `Baustein "${module.label}" sollte eine optionale Ersatzlösung haben.`,
      moduleId: module.id,
    });
  }

  if (module.type === 'gps_enter') {
    const radiusMeters = readNumber(module.config.radiusMeters);
    if (radiusMeters <= 0) {
      issues.push({
        code: 'gps_radius_missing',
        message: `Baustein "${module.label}" braucht einen GPS-Radius.`,
        moduleId: module.id,
      });
    } else if (radiusMeters > MAX_PLAUSIBLE_GPS_RADIUS_METERS) {
      issues.push({
        code: 'gps_radius_large',
        message: `Baustein "${module.label}" hat einen sehr großen GPS-Radius (> ${MAX_PLAUSIBLE_GPS_RADIUS_METERS} m).`,
        moduleId: module.id,
      });
    }
  }

  return issues;
}

function getStationReadinessLabel(station: RiddleEntry): string {
  return (
    station.de.location ||
    station.en.location ||
    station.it.location ||
    `Station ${station.number}`
  );
}

function readNumber(value: unknown): number {
  if (typeof value === 'number' && Number.isFinite(value)) {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}
