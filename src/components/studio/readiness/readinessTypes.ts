import type { StudioWorkflowSection } from '../workflow/workflowTypes';

/**
 * Author-facing readiness verdicts for a single check or aggregated scope.
 * `ready` and `draft` mean the value is present; `missing` means there is
 * nothing to show; `problem` means the value exists but is invalid.
 */
export type ReadinessStatus = 'ready' | 'draft' | 'missing' | 'problem';

export type LocalCheckSeverity = 'info' | 'warning' | 'error';

/**
 * A single local quality check derived from the draft. These are the building
 * blocks consumed by the Plan dashboard, the contextual sidebars, the export
 * blocker list, and (later) the assistant suggestions.
 */
export type LocalCheck = {
  id: string;
  label: string;
  status: ReadinessStatus;
  severity?: LocalCheckSeverity;
  message?: string;
  target?: {
    section: StudioWorkflowSection;
    stationId?: string;
    field?: string;
  };
};

/**
 * Worst-case rollup: a list is only `ready` when every check is ready, and
 * surfaces the most severe of `problem > missing > draft > ready` otherwise.
 */
export function getWorstStatus(checks: LocalCheck[]): ReadinessStatus {
  if (checks.some((c) => c.status === 'problem')) return 'problem';
  if (checks.some((c) => c.status === 'missing')) return 'missing';
  if (checks.some((c) => c.status === 'draft')) return 'draft';
  return 'ready';
}

export function countByStatus(
  checks: LocalCheck[],
): Record<ReadinessStatus, number> {
  const totals: Record<ReadinessStatus, number> = {
    ready: 0,
    draft: 0,
    missing: 0,
    problem: 0,
  };
  for (const check of checks) totals[check.status] += 1;
  return totals;
}

/**
 * Build a `ready ↔ missing` check from a boolean predicate. The missing
 * message is only attached when `present` is false; severity defaults to
 * `warning` since most presence checks are non-blocking.
 */
export function presenceCheck(args: {
  id: string;
  label: string;
  present: boolean;
  missingMessage: string;
  severity?: LocalCheckSeverity;
  target?: LocalCheck['target'];
}): LocalCheck {
  return {
    id: args.id,
    label: args.label,
    status: args.present ? 'ready' : 'missing',
    severity: args.severity ?? 'warning',
    message: args.present ? undefined : args.missingMessage,
    target: args.target,
  };
}

/**
 * Build an error-severity blocker with a pluralised "N stations missing X"
 * message. Returns `null` when `count` is 0, so callers can spread the
 * result into a list with `flatMap`/filter.
 */
export function pluralBlocker(args: {
  id: string;
  label: string;
  count: number;
  noun: string;
  missingWhat: string;
  status?: Extract<ReadinessStatus, 'missing' | 'problem'>;
  target?: LocalCheck['target'];
}): LocalCheck | null {
  if (args.count <= 0) return null;
  const plural = args.count === 1 ? args.noun : `${args.noun}s`;
  return {
    id: args.id,
    label: args.label,
    status: args.status ?? 'missing',
    severity: 'error',
    message: `${args.count} ${plural} ${args.missingWhat}.`,
    target: args.target,
  };
}
