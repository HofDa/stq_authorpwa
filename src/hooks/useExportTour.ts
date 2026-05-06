import { useCallback, useState } from 'react';
import type { Locale, TourDraft } from '@/schema';
import { downloadDraftExportZip } from '@/export/tourExport';
import {
  formatExportError,
  formatSuccessfulExport,
} from '@/export/exportMessages';
import { useToast } from '@/components/ui/FeedbackProvider';

interface RunExportOptions {
  locale?: Locale;
}

/**
 * Wraps the export pipeline with the standard toast + error-banner UX.
 *
 * `exportingDraftId` is the id of the draft currently being exported, or
 * `null` when idle. Callers needing a boolean (e.g. a single-draft page)
 * can derive it via `exportingDraftId === draft.draftId`.
 */
export function useExportTour() {
  const toast = useToast();
  const [exportingDraftId, setExportingDraftId] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  const runExport = useCallback(
    async (draft: TourDraft, options: RunExportOptions = {}) => {
      setExportError(null);
      setExportingDraftId(draft.draftId);
      try {
        const result = await downloadDraftExportZip(draft, options);
        const notice = formatSuccessfulExport(result);
        toast({
          title: `Export complete (${result.fileName})`,
          message: notice ?? 'ZIP file downloaded successfully.',
          tone: notice ? 'warning' : 'success',
          durationMs: notice ? 9000 : 5200,
        });
      } catch (error) {
        setExportError(formatExportError(error));
      } finally {
        setExportingDraftId((current) =>
          current === draft.draftId ? null : current,
        );
      }
    },
    [toast],
  );

  return { exportingDraftId, exportError, runExport };
}
