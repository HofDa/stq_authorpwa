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
