import JSZip from 'jszip';
import type { ZodIssue } from 'zod';
import {
  LOCALES,
  RiddleEntrySchema,
  TourEntrySchema,
  type ContentBlock,
  type RiddleEntry,
  type RiddleLocaleContent,
  type TourDraft,
  type TourEntry,
  type TourLocaleContent,
} from '@/schema';
import { db } from '@/storage/db';

export interface ExportValidationError {
  path: string;
  message: string;
}

export interface DraftExportReport {
  fileName: string;
  missingBlobIds: string[];
  validationErrors: ExportValidationError[];
}

export interface BuiltDraftExport {
  blob: Blob;
  missingBlobIds: string[];
  validationErrors: ExportValidationError[];
  tourJson: unknown;
  riddlesJson: unknown;
}

/**
 * Thrown when the serialized JSON fails Flutter-contract validation.
 * Callers can catch this to show per-field errors before shipping the ZIP.
 */
export class DraftExportValidationError extends Error {
  constructor(public readonly errors: ExportValidationError[]) {
    super(
      `Draft export failed schema validation (${errors.length} issue${errors.length === 1 ? '' : 's'})`,
    );
    this.name = 'DraftExportValidationError';
  }
}

export async function downloadDraftExportZip(
  draft: TourDraft,
): Promise<DraftExportReport> {
  const slug = draft.tour.id || draft.draftId;
  const fileName = `${slug}.zip`;
  const result = await buildDraftExportZip(draft);
  if (result.validationErrors.length > 0) {
    throw new DraftExportValidationError(result.validationErrors);
  }
  downloadBlob(result.blob, fileName);
  return {
    fileName,
    missingBlobIds: result.missingBlobIds,
    validationErrors: result.validationErrors,
  };
}

export async function buildDraftExportZip(
  draft: TourDraft,
): Promise<BuiltDraftExport> {
  const slug = draft.tour.id || draft.draftId;
  const referencedBlobIds = collectReferencedBlobIds(draft);
  const blobsById = await loadBlobs(referencedBlobIds);
  const missingBlobIds = referencedBlobIds.filter((id) => !blobsById.has(id));
  const exportPathByBlobId = new Map<string, string>(
    referencedBlobIds
      .filter((id) => blobsById.has(id))
      .map((id) => [id, `${slug}/images/${id}.webp`]),
  );

  const tourEntry = serializeTourEntry(draft.tour, exportPathByBlobId);
  const stations = draft.stations.map((station) =>
    serializeRiddleEntry(station, exportPathByBlobId),
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

  return {
    blob: await zip.generateAsync({ type: 'blob' }),
    missingBlobIds,
    validationErrors,
    tourJson: [tourEntry],
    riddlesJson: stations,
  };
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
    const result = RiddleEntrySchema.safeParse(station);
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

function collectReferencedBlobIds(draft: TourDraft): string[] {
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
) {
  const imagePath = station.imageBlobId
    ? exportPathByBlobId.get(station.imageBlobId)
    : undefined;
  const { imageBlobId, ...base } = station;
  return {
    ...base,
    imagePath: imagePath ?? station.imagePath,
    en: serializeRiddleLocale(station.en, exportPathByBlobId),
    de: serializeRiddleLocale(station.de, exportPathByBlobId),
    it: serializeRiddleLocale(station.it, exportPathByBlobId),
  };
}

function serializeRiddleLocale(
  locale: RiddleLocaleContent,
  exportPathByBlobId: Map<string, string>,
) {
  return {
    ...locale,
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
