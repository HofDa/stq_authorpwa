import {
  DEFAULT_LOCALE,
  LOCALES,
  hasAcceptedAnswer,
  type ContentBlock,
  type Locale,
  type TourDraft,
  type TourEntry,
} from '@/schema';
import {
  hasUsableStationCoordinate,
  isPlaceholderCoordinate,
  isValidCoordinate,
} from '@/utils/coordinates';

export interface ExportValidationError {
  path: string;
  message: string;
}

export type ValidationSeverity = 'error' | 'warning';
export type PublishingValidationEntityType = 'tour' | 'station' | 'blob';

export interface DraftPublishingValidationIssue {
  severity: ValidationSeverity;
  entityType: PublishingValidationEntityType;
  path: string;
  stationId?: string;
  message: string;
}

export interface DraftPublishingValidationResult {
  issues: DraftPublishingValidationIssue[];
  errors: DraftPublishingValidationIssue[];
  warnings: DraftPublishingValidationIssue[];
}

export interface ValidateDraftForPublishingOptions {
  locale?: Locale;
  blobsById?: Pick<ReadonlyMap<string, unknown>, 'has'>;
}

export const SAFE_TOUR_ID_PATTERN = /^[a-z0-9][a-z0-9-_]*$/;

export function validateDraftForPublishing(
  draft: TourDraft,
  options: ValidateDraftForPublishingOptions = {},
): DraftPublishingValidationResult {
  const locale = options.locale ?? DEFAULT_LOCALE;
  const issues: DraftPublishingValidationIssue[] = [];
  const { id, riddlesPath } = draft.tour;

  const pushIssue = (
    severity: ValidationSeverity,
    entityType: PublishingValidationEntityType,
    path: string,
    message: string,
    stationId?: string,
  ) => {
    issues.push({
      severity,
      entityType,
      path,
      stationId,
      message,
    });
  };

  if (id === '') {
    pushIssue('error', 'tour', 'tour.id', 'Tour id is required for publishing.');
  } else if (!SAFE_TOUR_ID_PATTERN.test(id)) {
    pushIssue(
      'error',
      'tour',
      'tour.id',
      `Tour id must match ${SAFE_TOUR_ID_PATTERN}.`,
    );
  }

  const expectedRiddlesPath = `${id}/riddles.json`;
  if (riddlesPath !== expectedRiddlesPath) {
    pushIssue(
      'error',
      'tour',
      'tour.riddlesPath',
      `Riddles path must equal "${expectedRiddlesPath}".`,
    );
  }

  if (draft.stations.length === 0) {
    pushIssue(
      'error',
      'tour',
      'stations',
      'Add at least one station before publishing.',
    );
  }

  validateTourLocaleContent(draft.tour, locale, pushIssue);

  draft.stations.forEach((station, index) => {
    const expectedNumber = index + 1;

    if (station.number !== expectedNumber) {
      pushIssue(
        'error',
        'station',
        `stations.${index}.number`,
        `Station numbers must stay consecutive and match the list order. Expected ${expectedNumber}, got ${station.number}.`,
        station.id,
      );
    }

    if (isPlaceholderCoordinate(station.position_lat, station.position_lng)) {
      pushIssue(
        'error',
        'station',
        `stations.${index}.position_lat`,
        `Station ${station.number} still uses placeholder coordinates 0/0. Capture GPS before publishing.`,
        station.id,
      );
    } else if (!isValidCoordinate(station.position_lat, station.position_lng)) {
      pushIssue(
        'error',
        'station',
        `stations.${index}.position_lat`,
        `Station ${station.number} has invalid coordinates. Enter a latitude between -90 and 90 and a longitude between -180 and 180.`,
        station.id,
      );
    } else if (!hasUsableStationCoordinate(station)) {
      pushIssue(
        'error',
        'station',
        `stations.${index}.position_lat`,
        `Station ${station.number} needs usable coordinates before publishing.`,
        station.id,
      );
    }

    for (const answerLocale of LOCALES) {
      if (hasAcceptedAnswer(station.acceptedAnswers, answerLocale)) {
        continue;
      }
      pushIssue(
        'error',
        'station',
        `stations.${index}.acceptedAnswers.${answerLocale}`,
        `Accepted answers for ${answerLocale.toUpperCase()} are required for publishing.`,
        station.id,
      );
    }

    const localized = station[locale];
    validateRequiredText(
      localized.location,
      'error',
      'station',
      `stations.${index}.${locale}.location`,
      `Add a location label for station ${station.number} in ${locale.toUpperCase()}.`,
      pushIssue,
      station.id,
    );
    validateRequiredBlocks(
      localized.firstSection,
      'error',
      'station',
      `stations.${index}.${locale}.firstSection`,
      `Add intro content for station ${station.number} in ${locale.toUpperCase()}.`,
      pushIssue,
      station.id,
    );
    validateRequiredBlocks(
      localized.historySection,
      'error',
      'station',
      `stations.${index}.${locale}.historySection`,
      `Add history content for station ${station.number} in ${locale.toUpperCase()}.`,
      pushIssue,
      station.id,
    );
    validateRequiredBlocks(
      localized.riddleSection,
      'error',
      'station',
      `stations.${index}.${locale}.riddleSection`,
      `Add riddle content for station ${station.number} in ${locale.toUpperCase()}.`,
      pushIssue,
      station.id,
    );
    validateRequiredBlocks(
      localized.successSection,
      'error',
      'station',
      `stations.${index}.${locale}.successSection`,
      `Add success content for station ${station.number} in ${locale.toUpperCase()}.`,
      pushIssue,
      station.id,
    );

    const blobsById = options.blobsById;
    if (!blobsById) {
      return;
    }

    validateBlobReference(
      station.imageBlobId,
      station.imagePath,
      blobsById,
      {
        path: `stations.${index}.imageBlobId`,
        message: `Station ${station.number} photo blob is missing from local storage.`,
        stationId: station.id,
      },
      pushIssue,
    );

    for (const blockLocale of LOCALES) {
      validateContentBlockBlobs(
        station[blockLocale].firstSection,
        blobsById,
        `stations.${index}.${blockLocale}.firstSection`,
        station.id,
        pushIssue,
      );
      validateContentBlockBlobs(
        station[blockLocale].historySection,
        blobsById,
        `stations.${index}.${blockLocale}.historySection`,
        station.id,
        pushIssue,
      );
      validateContentBlockBlobs(
        station[blockLocale].riddleSection,
        blobsById,
        `stations.${index}.${blockLocale}.riddleSection`,
        station.id,
        pushIssue,
      );
      validateContentBlockBlobs(
        station[blockLocale].successSection,
        blobsById,
        `stations.${index}.${blockLocale}.successSection`,
        station.id,
        pushIssue,
      );
    }
  });

  if (options.blobsById) {
    validateBlobReference(
      draft.tour.coverBlobId,
      draft.tour.imagePath,
      options.blobsById,
      {
        path: 'tour.coverBlobId',
        message: 'Tour cover image blob is missing from local storage.',
      },
      pushIssue,
    );

    for (const contentLocale of LOCALES) {
      validateContentBlockBlobs(
        draft.tour[contentLocale].description,
        options.blobsById,
        `tour.${contentLocale}.description`,
        undefined,
        pushIssue,
      );
      validateContentBlockBlobs(
        draft.tour[contentLocale].introSection,
        options.blobsById,
        `tour.${contentLocale}.introSection`,
        undefined,
        pushIssue,
      );
      validateContentBlockBlobs(
        draft.tour[contentLocale].outroSection,
        options.blobsById,
        `tour.${contentLocale}.outroSection`,
        undefined,
        pushIssue,
      );
    }
  }

  return {
    issues,
    errors: issues.filter((issue) => issue.severity === 'error'),
    warnings: issues.filter((issue) => issue.severity === 'warning'),
  };
}

export function collectReferencedBlobIds(draft: TourDraft): string[] {
  const ids = new Set<string>();
  if (draft.tour.coverBlobId) {
    ids.add(draft.tour.coverBlobId);
  }

  for (const station of draft.stations) {
    if (station.imageBlobId) {
      ids.add(station.imageBlobId);
    }
    for (const locale of LOCALES) {
      collectContentBlockBlobIds(station[locale].firstSection, ids);
      collectContentBlockBlobIds(station[locale].historySection, ids);
      collectContentBlockBlobIds(station[locale].riddleSection, ids);
      collectContentBlockBlobIds(station[locale].successSection, ids);
    }
  }

  for (const locale of LOCALES) {
    collectContentBlockBlobIds(draft.tour[locale].description, ids);
    collectContentBlockBlobIds(draft.tour[locale].introSection, ids);
    collectContentBlockBlobIds(draft.tour[locale].outroSection, ids);
  }

  return Array.from(ids);
}

function collectContentBlockBlobIds(blocks: ContentBlock[], ids: Set<string>) {
  for (const block of blocks) {
    if (block.type === 'image' && block.localBlobId) {
      ids.add(block.localBlobId);
    }
  }
}

function validateTourLocaleContent(
  tour: TourEntry,
  locale: Locale,
  pushIssue: (
    severity: ValidationSeverity,
    entityType: PublishingValidationEntityType,
    path: string,
    message: string,
    stationId?: string,
  ) => void,
) {
  const localized = tour[locale];
  validateRequiredText(
    localized.title,
    'error',
    'tour',
    `tour.${locale}.title`,
    `Add a tour title in ${locale.toUpperCase()} before publishing.`,
    pushIssue,
  );
  validateRequiredText(
    localized.location,
    'error',
    'tour',
    `tour.${locale}.location`,
    `Add a tour location in ${locale.toUpperCase()} before publishing.`,
    pushIssue,
  );
  validateRequiredBlocks(
    localized.description,
    'error',
    'tour',
    `tour.${locale}.description`,
    `Add a tour description in ${locale.toUpperCase()} before publishing.`,
    pushIssue,
  );
}

function validateRequiredText(
  value: string,
  severity: ValidationSeverity,
  entityType: PublishingValidationEntityType,
  path: string,
  message: string,
  pushIssue: (
    severity: ValidationSeverity,
    entityType: PublishingValidationEntityType,
    path: string,
    message: string,
    stationId?: string,
  ) => void,
  stationId?: string,
) {
  if (value.trim() !== '') {
    return;
  }
  pushIssue(severity, entityType, path, message, stationId);
}

function validateRequiredBlocks(
  blocks: ContentBlock[],
  severity: ValidationSeverity,
  entityType: PublishingValidationEntityType,
  path: string,
  message: string,
  pushIssue: (
    severity: ValidationSeverity,
    entityType: PublishingValidationEntityType,
    path: string,
    message: string,
    stationId?: string,
  ) => void,
  stationId?: string,
) {
  if (hasMeaningfulBlocks(blocks)) {
    return;
  }
  pushIssue(severity, entityType, path, message, stationId);
}

function hasMeaningfulBlocks(blocks: ContentBlock[]): boolean {
  return blocks.some((block) => {
    if (block.type === 'image') {
      return Boolean(block.localBlobId || block.imagePath.trim());
    }
    return block.text.trim() !== '';
  });
}

function validateContentBlockBlobs(
  blocks: ContentBlock[],
  blobsById: Pick<ReadonlyMap<string, unknown>, 'has'>,
  pathPrefix: string,
  stationId: string | undefined,
  pushIssue: (
    severity: ValidationSeverity,
    entityType: PublishingValidationEntityType,
    path: string,
    message: string,
    stationId?: string,
  ) => void,
) {
  blocks.forEach((block, index) => {
    if (block.type !== 'image') {
      return;
    }
    validateBlobReference(
      block.localBlobId,
      block.imagePath,
      blobsById,
      {
        path: `${pathPrefix}.${index}.localBlobId`,
        message: `Image block ${index + 1} references a missing local blob.`,
        stationId,
      },
      pushIssue,
    );
  });
}

function validateBlobReference(
  blobId: string | undefined,
  fallbackPath: string,
  blobsById: Pick<ReadonlyMap<string, unknown>, 'has'>,
  target: {
    path: string;
    message: string;
    stationId?: string;
  },
  pushIssue: (
    severity: ValidationSeverity,
    entityType: PublishingValidationEntityType,
    path: string,
    message: string,
    stationId?: string,
  ) => void,
) {
  if (!blobId || blobsById.has(blobId)) {
    return;
  }

  const detail =
    fallbackPath.trim() === ''
      ? ' Export will keep the current empty imagePath.'
      : ' Export will fall back to the existing imagePath.';

  pushIssue(
    'warning',
    'blob',
    target.path,
    `${target.message}${detail}`,
    target.stationId,
  );
}
