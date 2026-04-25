import { DEFAULT_LOCALE, type TourDraft } from '@/schema';
import { validateDraftForPublishing } from './validateDraftForPublishing';

export interface ExportValidationError {
  path: string;
  message: string;
}

export { SAFE_TOUR_ID_PATTERN } from './validateDraftForPublishing';

export function validateDraftForExport(
  draft: TourDraft,
): ExportValidationError[] {
  return validateDraftForPublishing(draft, { locale: DEFAULT_LOCALE }).errors.map(
    ({ path, message }) => ({
      path,
      message: message.replace('publishing', 'export'),
    }),
  );
}
