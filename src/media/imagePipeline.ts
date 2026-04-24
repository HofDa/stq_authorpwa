import { db, type StoredBlob } from '@/storage/db';
import { createId } from '@/schema';

/**
 * Target resolutions for captured images. Matches the defaults in
 * `docs/author_pwa_plan.md`. Adjust once the native app's exact
 * expectations are confirmed.
 */
export const IMAGE_PRESETS = {
  tourCover: { width: 1200, height: 800, quality: 0.85 },
  station: { width: 1080, height: 1080, quality: 0.85 },
  block: { width: 1200, height: 900, quality: 0.85 },
} as const;

export type ImagePreset = keyof typeof IMAGE_PRESETS;

/**
 * Load an arbitrary image file or camera-capture `File` into a blob that
 * has been center-cropped to the preset aspect ratio and encoded as WebP.
 */
export async function processImageFile(
  file: File,
  preset: ImagePreset,
): Promise<{ blob: Blob; width: number; height: number }> {
  const { width, height, quality } = IMAGE_PRESETS[preset];
  const bitmap = await createImageBitmap(file);
  try {
    return renderCropped(bitmap, width, height, quality);
  } finally {
    bitmap.close?.();
  }
}

function renderCropped(
  source: ImageBitmap,
  targetW: number,
  targetH: number,
  quality: number,
): Promise<{ blob: Blob; width: number; height: number }> {
  const canvas = document.createElement('canvas');
  canvas.width = targetW;
  canvas.height = targetH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('2D canvas not supported');

  const srcRatio = source.width / source.height;
  const targetRatio = targetW / targetH;

  let sx = 0;
  let sy = 0;
  let sw = source.width;
  let sh = source.height;
  if (srcRatio > targetRatio) {
    sw = Math.round(source.height * targetRatio);
    sx = Math.round((source.width - sw) / 2);
  } else if (srcRatio < targetRatio) {
    sh = Math.round(source.width / targetRatio);
    sy = Math.round((source.height - sh) / 2);
  }

  ctx.drawImage(source, sx, sy, sw, sh, 0, 0, targetW, targetH);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to encode image'));
          return;
        }
        resolve({ blob, width: targetW, height: targetH });
      },
      'image/webp',
      quality,
    );
  });
}

/**
 * Persist a processed image blob in IndexedDB and return the generated
 * `localBlobId`. The JSON currently stores `localBlobId`; on export, it
 * will be resolved to a relative path like `<slug>/images/<id>.webp`.
 */
export async function storeImageBlob(
  draftId: string,
  file: File,
  preset: ImagePreset,
): Promise<StoredBlob> {
  const { blob, width, height } = await processImageFile(file, preset);
  const stored: StoredBlob = {
    id: createId('img'),
    draftId,
    mime: 'image/webp',
    blob,
    width,
    height,
    createdAt: Date.now(),
  };
  await db.blobs.put(stored);
  return stored;
}

export async function getBlob(id: string): Promise<StoredBlob | undefined> {
  return db.blobs.get(id);
}
