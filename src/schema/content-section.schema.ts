export type NativeContentBlock =
  | { type: 'heading'; text: string }
  | { type: 'paragraph'; text: string }
  | { type: 'line'; text: string }
  | { type: 'image'; imagePath: string; localBlobId?: string };

export interface ContentSection {
  title: string;
  blocks: NativeContentBlock[];
}
