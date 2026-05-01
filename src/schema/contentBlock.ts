import { z } from 'zod';

/**
 * Content blocks supported by v1.
 *
 * The native app also understands `audio` and `chat` blocks. Those are
 * deferred to Phase 2.
 */
export const ParagraphBlockSchema = z.object({
  type: z.literal('paragraph'),
  text: z.string(),
});

export const StyledParagraphBlockSchema = z.object({
  type: z.literal('paragraph_styled'),
  text: z.string(),
});

export const HeadingBlockSchema = z.object({
  type: z.literal('heading'),
  text: z.string(),
});

export const LineBlockSchema = z.object({
  type: z.literal('line'),
  text: z.string().default(''),
});

/**
 * Image block.
 *
 * In the exported JSON, `imagePath` is a relative path the native app can
 * resolve (e.g. `my_tour/images/abc.webp`). While authoring, we also track
 * an optional `localBlobId` pointing at a Dexie blob for preview.
 */
export const ImageBlockSchema = z.object({
  type: z.literal('image'),
  imagePath: z.string(),
  localBlobId: z.string().optional(),
});

export const ContentBlockSchema = z.discriminatedUnion('type', [
  ParagraphBlockSchema,
  StyledParagraphBlockSchema,
  HeadingBlockSchema,
  LineBlockSchema,
  ImageBlockSchema,
]);

export type ContentBlock = z.infer<typeof ContentBlockSchema>;
export type ContentBlockType = ContentBlock['type'];

export const CONTENT_BLOCK_TYPES: readonly ContentBlockType[] = [
  'paragraph',
  'paragraph_styled',
  'heading',
  'image',
  'line',
] as const;

export function emptyBlock(type: ContentBlockType): ContentBlock {
  switch (type) {
    case 'paragraph':
      return { type, text: '' };
    case 'paragraph_styled':
      return { type, text: '' };
    case 'heading':
      return { type, text: '' };
    case 'image':
      return { type, imagePath: '' };
    case 'line':
      return { type, text: '' };
  }
}
