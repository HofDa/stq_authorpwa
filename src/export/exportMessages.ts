import {
  DraftExportValidationError,
  type downloadDraftExportZip,
} from './tourExport';

type ExportResult = Awaited<ReturnType<typeof downloadDraftExportZip>>;

/**
 * Render an export error as a multi-line string suitable for display in
 * an error banner or toast.
 */
export function formatExportError(error: unknown): string {
  if (error instanceof DraftExportValidationError) {
    const lines = error.errors
      .slice(0, 8)
      .map((e) => `• ${e.path}: ${e.message}`);
    const extra =
      error.errors.length > 8
        ? `\n…and ${error.errors.length - 8} more`
        : '';
    return `Cannot export — please fix:\n${lines.join('\n')}${extra}`;
  }
  return error instanceof Error ? error.message : 'Could not export this draft.';
}

/**
 * Render any non-fatal warnings about a successful export (missing blobs,
 * publishing-validation warnings). Returns `null` when the export is clean.
 */
export function formatSuccessfulExport(result: ExportResult): string | null {
  const notes: string[] = [];

  if (result.missingBlobIds.length > 0) {
    notes.push(
      `${result.missingBlobIds.length} image(s) were missing in local storage and kept as existing imagePath values.`,
    );
  }

  if (result.validationWarnings.length > 0) {
    const lines = result.validationWarnings
      .slice(0, 4)
      .map((warning) => `• ${warning.message}`);
    const extra =
      result.validationWarnings.length > 4
        ? `\n…and ${result.validationWarnings.length - 4} more warning(s)`
        : '';
    notes.push(`Warnings:\n${lines.join('\n')}${extra}`);
  }

  return notes.length === 0 ? null : notes.join('\n\n');
}
