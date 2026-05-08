import {
  getRrrWarnings,
  type RrrInteraction,
  type RrrInteractionResult,
  type RrrRuntimeStatus,
  type RrrWarning,
} from '@/rrr-core';
import type { RrrFieldTestIssueTag } from '@/schema';
import type { RrrSensorAvailability } from '@/rrr-sensors';

export interface RrrFieldTestReportStation {
  id: string;
  title: string;
}

export interface RrrFieldTestReportSensorSnapshot {
  gps?: RrrSensorAvailability;
  orientation?: RrrSensorAvailability;
  motion?: RrrSensorAvailability;
  gpsAccuracyMeters?: number;
}

export interface RrrFieldTestReportInput {
  station: RrrFieldTestReportStation;
  interaction: RrrInteraction;
  finalResult: RrrRuntimeStatus;
  result?: RrrInteractionResult;
  testedAt?: Date;
  sensors?: RrrFieldTestReportSensorSnapshot;
  notes?: string;
  issueTags?: RrrFieldTestIssueTag[];
  warnings?: RrrWarning[];
}

export interface RrrFieldTestReport {
  station: RrrFieldTestReportStation;
  interactionVersion: number;
  moduleTypes: string[];
  conditionType: string;
  testedAt: string;
  sensors?: RrrFieldTestReportSensorSnapshot;
  warnings: Array<Pick<RrrWarning, 'code' | 'message' | 'severity' | 'moduleId'>>;
  finalResult: RrrRuntimeStatus;
  moduleResults: Array<{
    id: string;
    label: string;
    type: string;
    status: RrrRuntimeStatus;
    message: string;
  }>;
  issueTags: RrrFieldTestIssueTag[];
  notes?: string;
}

export function createRrrFieldTestReport({
  station,
  interaction,
  finalResult,
  result,
  testedAt = new Date(),
  sensors,
  notes,
  issueTags = [],
  warnings = getRrrWarnings(interaction),
}: RrrFieldTestReportInput): RrrFieldTestReport {
  return {
    station,
    interactionVersion: interaction.schemaVersion,
    moduleTypes: interaction.modules.map((module) => module.type),
    conditionType: interaction.condition?.type ?? 'none',
    testedAt: testedAt.toISOString(),
    sensors: normalizeSensors(sensors),
    warnings: warnings.map((warning) => ({
      code: warning.code,
      message: warning.message,
      severity: warning.severity,
      moduleId: warning.moduleId,
    })),
    finalResult,
    moduleResults: result
      ? Object.values(result.modules).map((module) => ({
          id: module.id,
          label: module.label,
          type: module.type,
          status: module.status,
          message: module.message,
        }))
      : [],
    issueTags,
    notes: normalizeNotes(notes),
  };
}

export function formatRrrFieldTestReportMarkdown(
  report: RrrFieldTestReport,
): string {
  const lines = [
    '# RRR Field-Test Report',
    '',
    `- Station: ${report.station.title}`,
    `- Station ID: ${report.station.id}`,
    `- Interaction version: ${report.interactionVersion}`,
    `- Test date/time: ${report.testedAt}`,
    `- Final result: ${report.finalResult}`,
    `- Condition type: ${report.conditionType}`,
    `- Module types: ${report.moduleTypes.length > 0 ? report.moduleTypes.join(', ') : 'none'}`,
    '',
    '## Sensors',
    '',
    `- GPS availability: ${report.sensors?.gps ?? 'not tested'}`,
    `- Orientation availability: ${report.sensors?.orientation ?? 'not tested'}`,
    `- Motion availability: ${report.sensors?.motion ?? 'not tested'}`,
    `- GPS accuracy: ${
      isFiniteNumber(report.sensors?.gpsAccuracyMeters)
        ? `${Math.round(report.sensors.gpsAccuracyMeters)} m`
        : 'not available'
    }`,
    '',
    '## Warnings',
    '',
    ...(report.warnings.length > 0
      ? report.warnings.map(
          (warning) =>
            `- ${warning.severity}: ${warning.message}${
              warning.moduleId ? ` (${warning.moduleId})` : ''
            }`,
        )
      : ['- none']),
    '',
    '## Module Results',
    '',
    ...(report.moduleResults.length > 0
      ? report.moduleResults.map(
          (module) =>
            `- ${module.label} [${module.type}, ${module.id}]: ${module.status} - ${module.message}`,
        )
      : ['- none recorded']),
    '',
    '## Issue Tags',
    '',
    report.issueTags.length > 0 ? `- ${report.issueTags.map(formatIssueTag).join(', ')}` : '- none',
    '',
    '## Notes',
    '',
    report.notes ?? '-',
    '',
  ];

  return lines.join('\n');
}

export function formatRrrFieldTestIssueTag(
  tag: RrrFieldTestIssueTag,
): string {
  return formatIssueTag(tag);
}

export function downloadRrrFieldTestReport(
  report: RrrFieldTestReport,
  format: 'markdown' | 'json' = 'markdown',
) {
  if (typeof document === 'undefined') {
    return;
  }

  const isMarkdown = format === 'markdown';
  const content = isMarkdown
    ? formatRrrFieldTestReportMarkdown(report)
    : JSON.stringify(report, null, 2);
  const extension = isMarkdown ? 'md' : 'json';
  const mime = isMarkdown ? 'text/markdown' : 'application/json';
  const blob = new Blob([content], { type: `${mime};charset=utf-8` });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `rrr-field-test-${slugify(report.station.id)}.${extension}`;
  document.body.append(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function normalizeSensors(
  sensors: RrrFieldTestReportSensorSnapshot | undefined,
): RrrFieldTestReportSensorSnapshot | undefined {
  if (!sensors) {
    return undefined;
  }

  return {
    gps: sensors.gps,
    orientation: sensors.orientation,
    motion: sensors.motion,
    gpsAccuracyMeters: isFiniteNumber(sensors.gpsAccuracyMeters)
      ? sensors.gpsAccuracyMeters
      : undefined,
  };
}

function normalizeNotes(notes: string | undefined): string | undefined {
  const trimmed = notes?.trim();
  return trimmed ? trimmed : undefined;
}

function formatIssueTag(tag: RrrFieldTestIssueTag): string {
  switch (tag) {
    case 'gps_ungenau':
      return 'GPS ungenau';
    case 'kompass_instabil':
      return 'Kompass instabil';
    case 'qr_schlecht_lesbar':
      return 'QR schlecht lesbar';
    case 'aufgabe_unklar':
      return 'Aufgabe unklar';
    case 'ort_schwer_zugaenglich':
      return 'Ort schwer zugänglich';
    case 'ersatzloesung_noetig':
      return 'Ersatzlösung nötig';
    case 'sonstiges':
      return 'Sonstiges';
  }
}

function slugify(value: string): string {
  const normalized = value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
  return normalized || 'station';
}

function isFiniteNumber(value: unknown): value is number {
  return typeof value === 'number' && Number.isFinite(value);
}
