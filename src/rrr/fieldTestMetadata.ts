import type { RrrFieldTestIssueTag, RrrFieldTestStatus } from '@/schema';

export const RRR_FIELD_TEST_STATUS_OPTIONS: Array<{
  value: RrrFieldTestStatus;
  label: string;
  dashboardLabel: string;
  compactLabel: string;
  emptyLabel: string;
}> = [
  {
    value: 'not_tested',
    label: 'Nicht getestet',
    dashboardLabel: 'Nicht getestet',
    compactLabel: 'Offen',
    emptyLabel: 'Keine ungetesteten Stationen',
  },
  {
    value: 'tested_ok',
    label: 'Getestet: OK',
    dashboardLabel: 'Getestet OK',
    compactLabel: 'OK',
    emptyLabel: 'Noch keine Stationen ohne Hinweise',
  },
  {
    value: 'tested_with_warnings',
    label: 'Getestet: mit Hinweisen',
    dashboardLabel: 'Mit Warnungen',
    compactLabel: 'Warnungen',
    emptyLabel: 'Keine Stationen mit Warnungen',
  },
  {
    value: 'needs_fix',
    label: 'Braucht Fix',
    dashboardLabel: 'Braucht Korrektur',
    compactLabel: 'Fix',
    emptyLabel: 'Keine Stationen mit Korrekturbedarf',
  },
];

export const RRR_FIELD_TEST_ISSUE_TAG_OPTIONS: Array<{
  value: RrrFieldTestIssueTag;
  label: string;
}> = [
  { value: 'gps_ungenau', label: 'GPS ungenau' },
  { value: 'kompass_instabil', label: 'Kompass instabil' },
  { value: 'qr_schlecht_lesbar', label: 'QR schlecht lesbar' },
  { value: 'aufgabe_unklar', label: 'Aufgabe unklar' },
  { value: 'ort_schwer_zugaenglich', label: 'Ort schwer zugänglich' },
  { value: 'ersatzloesung_noetig', label: 'Ersatzlösung nötig' },
  { value: 'sonstiges', label: 'Sonstiges' },
];

export function getRrrFieldTestStatusLabel(
  status: RrrFieldTestStatus,
): string {
  return getRrrFieldTestStatusOption(status).label;
}

export function getRrrFieldTestDashboardStatusLabel(
  status: RrrFieldTestStatus,
): string {
  return getRrrFieldTestStatusOption(status).dashboardLabel;
}

export function getRrrFieldTestCompactStatusLabel(
  status: RrrFieldTestStatus,
): string {
  return getRrrFieldTestStatusOption(status).compactLabel;
}

export function getRrrFieldTestEmptyStatusLabel(
  status: RrrFieldTestStatus,
): string {
  return getRrrFieldTestStatusOption(status).emptyLabel;
}

export function getRrrFieldTestStatusBadgeLabel(
  status: RrrFieldTestStatus,
  issueTagCount: number,
): string {
  const suffix = issueTagCount > 0 ? ` · ${issueTagCount}` : '';
  return `${getRrrFieldTestBadgeStatusLabel(status)}${suffix}`;
}

export function formatRrrFieldTestIssueTag(
  tag: RrrFieldTestIssueTag,
): string {
  return (
    RRR_FIELD_TEST_ISSUE_TAG_OPTIONS.find((option) => option.value === tag)
      ?.label ?? tag
  );
}

export function toRrrFieldTestDateTimeLocalValue(value: string): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());
  const hours = padDatePart(date.getHours());
  const minutes = padDatePart(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

export function fromRrrFieldTestDateTimeLocalValue(
  value: string,
): string | undefined {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function getRrrFieldTestStatusOption(status: RrrFieldTestStatus) {
  return (
    RRR_FIELD_TEST_STATUS_OPTIONS.find((option) => option.value === status) ??
    RRR_FIELD_TEST_STATUS_OPTIONS[0]
  );
}

function getRrrFieldTestBadgeStatusLabel(status: RrrFieldTestStatus): string {
  switch (status) {
    case 'tested_ok':
      return 'OK';
    case 'tested_with_warnings':
      return 'Hinweise';
    case 'needs_fix':
      return 'Fix';
    case 'not_tested':
      return 'Nicht getestet';
  }
}

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
}
