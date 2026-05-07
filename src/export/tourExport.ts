import JSZip from 'jszip';
import type { ZodIssue } from 'zod';
import {
  DEFAULT_LOCALE,
  ExportRiddleEntrySchema,
  TourEntrySchema,
  getPrimaryAcceptedAnswer,
  type ContentBlock,
  type Locale,
  type RiddleEntry,
  type RiddleLocaleContent,
  type TourDraft,
  type TourEntry,
  type TourLocaleContent,
} from '@/schema';
import { RRR_INTERACTION_VERSION } from '@/rrr';
import { db } from '@/storage/db';
import {
  buildExportStationAssetPaths,
  normalizeStationVisualChoice,
  renderStationVisualPngs,
  shouldGenerateStationVisualAssets,
} from '@/stations/visuals';
import {
  collectReferencedBlobIds,
  validateDraftForPublishing,
  type DraftPublishingValidationIssue,
  type DraftPublishingValidationResult,
  type ExportValidationError,
} from './validateDraftForPublishing';

export type { ExportValidationError } from './validateDraftForPublishing';

export interface DraftExportReport {
  fileName: string;
  missingBlobIds: string[];
  validationErrors: ExportValidationError[];
  validationWarnings: DraftPublishingValidationIssue[];
  publishingValidation: DraftPublishingValidationResult;
}

export interface BuiltDraftExport {
  blob: Blob;
  missingBlobIds: string[];
  validationErrors: ExportValidationError[];
  validationWarnings: DraftPublishingValidationIssue[];
  publishingValidation: DraftPublishingValidationResult;
  tourJson: unknown;
  riddlesJson: unknown;
}

/**
 * Thrown when publish rules or serialized JSON validation block the ZIP.
 * Callers can catch this to show per-field errors before shipping the ZIP.
 */
export class DraftExportValidationError extends Error {
  constructor(public readonly errors: ExportValidationError[]) {
    super(
      `Draft export failed validation (${errors.length} issue${errors.length === 1 ? '' : 's'})`,
    );
    this.name = 'DraftExportValidationError';
  }
}

export async function downloadDraftExportZip(
  draft: TourDraft,
  options: ExportBuildOptions = {},
): Promise<DraftExportReport> {
  const result = await buildDraftExportZip(draft, options);
  if (result.validationErrors.length > 0) {
    throw new DraftExportValidationError(result.validationErrors);
  }
  const fileName = `${draft.tour.id}.zip`;
  downloadBlob(result.blob, fileName);
  return {
    fileName,
    missingBlobIds: result.missingBlobIds,
    validationErrors: result.validationErrors,
    validationWarnings: result.validationWarnings,
    publishingValidation: result.publishingValidation,
  };
}

export async function buildDraftExportZip(
  draft: TourDraft,
  options: ExportBuildOptions = {},
): Promise<BuiltDraftExport> {
  const locale = options.locale ?? DEFAULT_LOCALE;
  const referencedBlobIds = collectReferencedBlobIds(draft);
  const blobsById = await loadBlobs(referencedBlobIds);
  const missingBlobIds = referencedBlobIds.filter((id) => !blobsById.has(id));
  const publishingValidation = validateDraftForPublishing(draft, {
    locale,
    blobsById,
  });
  if (publishingValidation.errors.length > 0) {
    return buildEmptyExportResult(
      missingBlobIds,
      publishingValidation,
      publishingIssuesToErrors(publishingValidation.errors),
    );
  }

  const slug = draft.tour.id;
  const exportPathByBlobId = new Map<string, string>(
    referencedBlobIds
      .filter((id) => blobsById.has(id))
      .map((id) => [id, `${slug}/images/${id}.webp`]),
  );
  const stationVisualAssets = await buildStationVisualAssets(draft.stations, slug);
  const iconPathByStationId = new Map(
    stationVisualAssets.map((asset) => [asset.stationId, asset.iconPath]),
  );
  const markerPathByStationId = new Map(
    stationVisualAssets.map((asset) => [asset.stationId, asset.markerIconPath]),
  );

  const tourEntry = serializeTourEntry(draft.tour, exportPathByBlobId);
  const stations = draft.stations.map((station) =>
    serializeRiddleEntry(
      station,
      exportPathByBlobId,
      iconPathByStationId,
      markerPathByStationId,
    ),
  );

  const validationErrors = validateSerialized(tourEntry, stations);

  const zip = new JSZip();
  zip.file('tours.json', JSON.stringify([tourEntry], null, 2));
  zip.file(tourEntry.riddlesPath, JSON.stringify(stations, null, 2));

  for (const [blobId, path] of exportPathByBlobId.entries()) {
    const stored = blobsById.get(blobId);
    if (stored) {
      zip.file(path, await stored.blob.arrayBuffer());
    }
  }
  for (const asset of stationVisualAssets) {
    zip.file(asset.iconPath, await asset.iconBlob.arrayBuffer());
    zip.file(asset.markerIconPath, await asset.markerBlob.arrayBuffer());
  }

  return {
    blob: await zip.generateAsync({ type: 'blob' }),
    missingBlobIds,
    validationErrors,
    validationWarnings: publishingValidation.warnings,
    publishingValidation,
    tourJson: [tourEntry],
    riddlesJson: stations,
  };
}

interface ExportBuildOptions {
  locale?: Locale;
}

async function buildEmptyExportResult(
  missingBlobIds: string[],
  publishingValidation: DraftPublishingValidationResult,
  validationErrors: ExportValidationError[],
): Promise<BuiltDraftExport> {
  return {
    blob: await new JSZip().generateAsync({ type: 'blob' }),
    missingBlobIds,
    validationErrors,
    validationWarnings: publishingValidation.warnings,
    publishingValidation,
    tourJson: [],
    riddlesJson: [],
  };
}

function publishingIssuesToErrors(
  issues: DraftPublishingValidationIssue[],
): ExportValidationError[] {
  return issues.map(({ path, message }) => ({
    path,
    message: message.replace('publishing', 'export'),
  }));
}

function validateSerialized(
  tourEntry: unknown,
  stations: unknown[],
): ExportValidationError[] {
  const errors: ExportValidationError[] = [];
  const tourResult = TourEntrySchema.safeParse(tourEntry);
  if (!tourResult.success) {
    errors.push(...issuesToErrors(tourResult.error.issues, ['tour']));
  }
  stations.forEach((station, index) => {
    const result = ExportRiddleEntrySchema.safeParse(station);
    if (!result.success) {
      errors.push(
        ...issuesToErrors(result.error.issues, ['stations', String(index)]),
      );
    }
  });
  return errors;
}

function issuesToErrors(
  issues: ZodIssue[],
  prefix: string[],
): ExportValidationError[] {
  return issues.map((issue) => ({
    path: [...prefix, ...issue.path.map(String)].join('.'),
    message: issue.message,
  }));
}

async function loadBlobs(blobIds: string[]) {
  const byId = new Map<string, { id: string; blob: Blob }>();
  if (blobIds.length === 0) {
    return byId;
  }
  const stored = await db.blobs.where('id').anyOf(blobIds).toArray();
  for (const item of stored) {
    byId.set(item.id, item);
  }
  return byId;
}

function serializeTourEntry(
  tour: TourEntry,
  exportPathByBlobId: Map<string, string>,
) {
  const coverPath = tour.coverBlobId
    ? exportPathByBlobId.get(tour.coverBlobId)
    : undefined;
  const { coverBlobId, ...base } = tour;
  return {
    ...base,
    imagePath: coverPath ?? tour.imagePath,
    en: serializeTourLocale(tour.en, exportPathByBlobId),
    de: serializeTourLocale(tour.de, exportPathByBlobId),
    it: serializeTourLocale(tour.it, exportPathByBlobId),
  };
}

function serializeTourLocale(
  locale: TourLocaleContent,
  exportPathByBlobId: Map<string, string>,
) {
  return {
    ...locale,
    description: serializeBlocks(locale.description, exportPathByBlobId),
    introSection: serializeBlocks(locale.introSection, exportPathByBlobId),
    outroSection: serializeBlocks(locale.outroSection, exportPathByBlobId),
  };
}

function serializeRiddleEntry(
  station: RiddleEntry,
  exportPathByBlobId: Map<string, string>,
  iconPathByStationId: Map<string, string>,
  markerPathByStationId: Map<string, string>,
) {
  const imagePath = station.imageBlobId
    ? exportPathByBlobId.get(station.imageBlobId)
    : undefined;
  const generatedIconPath = iconPathByStationId.get(station.id);
  const generatedMarkerPath = markerPathByStationId.get(station.id);
  const {
    imageBlobId,
    iconKey,
    iconColorKey,
    acceptedAnswers,
    interaction,
    ...base
  } = station;
  return {
    ...base,
    ...(station.riddleType === 'modular'
      ? { interactionVersion: RRR_INTERACTION_VERSION, interaction }
      : {}),
    imagePath: imagePath ?? station.imagePath,
    iconPath: generatedIconPath ?? station.iconPath,
    markerIconPath: generatedMarkerPath ?? station.markerIconPath,
    en: serializeRiddleLocale(
      station.en,
      exportPathByBlobId,
      getPrimaryAcceptedAnswer(acceptedAnswers, 'en'),
    ),
    de: serializeRiddleLocale(
      station.de,
      exportPathByBlobId,
      getPrimaryAcceptedAnswer(acceptedAnswers, 'de'),
    ),
    it: serializeRiddleLocale(
      station.it,
      exportPathByBlobId,
      getPrimaryAcceptedAnswer(acceptedAnswers, 'it'),
    ),
  };
}

function serializeRiddleLocale(
  locale: RiddleLocaleContent,
  exportPathByBlobId: Map<string, string>,
  solution: string,
) {
  return {
    ...locale,
    solution,
    firstSection: serializeBlocks(locale.firstSection, exportPathByBlobId),
    historySection: serializeBlocks(locale.historySection, exportPathByBlobId),
    riddleSection: serializeBlocks(locale.riddleSection, exportPathByBlobId),
    successSection: serializeBlocks(locale.successSection, exportPathByBlobId),
  };
}

function serializeBlocks(
  blocks: ContentBlock[],
  exportPathByBlobId: Map<string, string>,
) {
  return blocks.map((block) => {
    if (block.type !== 'image') {
      return block;
    }
    const path = block.localBlobId
      ? exportPathByBlobId.get(block.localBlobId)
      : undefined;
    return {
      type: 'image' as const,
      imagePath: path ?? block.imagePath,
    };
  });
}

function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  setTimeout(() => URL.revokeObjectURL(url), 0);
}

interface StationVisualAsset {
  stationId: string;
  iconPath: string;
  markerIconPath: string;
  iconBlob: Blob;
  markerBlob: Blob;
}

async function buildStationVisualAssets(
  stations: RiddleEntry[],
  slug: string,
): Promise<StationVisualAsset[]> {
  const assets = await Promise.all(
    stations.map(async (station) => {
      if (!shouldGenerateStationVisualAssets(station)) {
        return null;
      }

      const { iconPath, markerIconPath } = buildExportStationAssetPaths(
        slug,
        station.id,
      );
      const { iconBlob, markerBlob } = await renderStationVisualPngs(
        normalizeStationVisualChoice(station),
      );

      return {
        stationId: station.id,
        iconPath,
        markerIconPath,
        iconBlob,
        markerBlob,
      };
    }),
  );

  return assets.filter(
    (asset): asset is StationVisualAsset => asset !== null,
  );
}
