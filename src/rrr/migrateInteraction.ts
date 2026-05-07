import { RrrInteractionSchema, type RrrInteraction } from '@/schema';

export const SUPPORTED_RRR_INTERACTION_VERSIONS = [1] as const;
export type SupportedRrrInteractionVersion =
  (typeof SUPPORTED_RRR_INTERACTION_VERSIONS)[number];

export interface RrrInteractionMigrationInput {
  interaction: unknown;
  interactionVersion?: number;
}

export interface RrrInteractionMigrationResult {
  interactionVersion: SupportedRrrInteractionVersion;
  interaction: RrrInteraction;
}

/**
 * Thrown by `migrateRrrInteraction` when the input cannot be coerced to a
 * supported RRR interaction version. Callers can pattern-match on the
 * `code` field to distinguish unsupported versions from invalid payloads.
 */
export class RrrInteractionMigrationError extends Error {
  readonly code: 'unsupported_version' | 'invalid_interaction' | 'invalid_input';
  readonly issues?: unknown;

  constructor(
    code: 'unsupported_version' | 'invalid_interaction' | 'invalid_input',
    message: string,
    issues?: unknown,
  ) {
    super(message);
    this.name = 'RrrInteractionMigrationError';
    this.code = code;
    this.issues = issues;
  }
}

export function isSupportedRrrInteractionVersion(
  value: unknown,
): value is SupportedRrrInteractionVersion {
  return (
    typeof value === 'number' &&
    (SUPPORTED_RRR_INTERACTION_VERSIONS as readonly number[]).includes(value)
  );
}

/**
 * Normalize a stored or imported RRR interaction blob to the current
 * interaction version. Missing version is treated as v1. Missing
 * `modules` on an otherwise object-shaped input becomes `[]`; missing
 * `condition` stays `undefined`. Anything else is rejected with a typed
 * `RrrInteractionMigrationError`.
 */
export function migrateRrrInteraction(
  input: RrrInteractionMigrationInput,
): RrrInteractionMigrationResult {
  const version = resolveVersion(input.interactionVersion);
  const candidate = normalizeInteractionShape(input.interaction);
  // Force the schema literal to match the resolved version so that any
  // stored `schemaVersion` mismatch is caught by validation rather than
  // silently coerced.
  const withSchemaVersion = { ...candidate, schemaVersion: version };

  const parsed = RrrInteractionSchema.safeParse(withSchemaVersion);
  if (!parsed.success) {
    throw new RrrInteractionMigrationError(
      'invalid_interaction',
      'RRR interaction failed validation.',
      parsed.error.issues,
    );
  }

  return {
    interactionVersion: version,
    interaction: parsed.data,
  };
}

function resolveVersion(
  rawVersion: unknown,
): SupportedRrrInteractionVersion {
  if (rawVersion === undefined || rawVersion === null) {
    // Unversioned legacy RRR interactions are always treated as V1.
    return 1;
  }
  if (!isSupportedRrrInteractionVersion(rawVersion)) {
    throw new RrrInteractionMigrationError(
      'unsupported_version',
      `Unsupported RRR interaction version: ${String(rawVersion)}.`,
    );
  }
  return rawVersion;
}

function normalizeInteractionShape(value: unknown): {
  modules: unknown;
  condition?: unknown;
  schemaVersion?: unknown;
} {
  if (value === undefined || value === null) {
    return { modules: [], condition: undefined };
  }
  if (typeof value !== 'object' || Array.isArray(value)) {
    throw new RrrInteractionMigrationError(
      'invalid_input',
      'RRR interaction must be an object.',
    );
  }
  const record = value as Record<string, unknown>;
  return {
    modules: 'modules' in record ? record.modules : [],
    condition: 'condition' in record ? record.condition : undefined,
    schemaVersion: 'schemaVersion' in record ? record.schemaVersion : undefined,
  };
}
