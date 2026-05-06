/**
 * The top-level workflow sections of the Studio editor.
 *
 * Each section answers exactly one question for the author:
 *   plan      → What are we building?
 *   story     → How does it begin?
 *   stations  → What happens on site?
 *   route     → Does the path work?
 *   outro     → How does it end?
 */
export type StudioWorkflowSection =
  | 'plan'
  | 'story'
  | 'stations'
  | 'route'
  | 'outro';

/**
 * Per-section readiness signal, surfaced as a small dot on the workflow nav.
 * Wired up in later PRs once the per-section content lands.
 */
export type WorkflowStatus = 'ready' | 'attention' | 'empty' | 'none';
