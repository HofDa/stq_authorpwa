import type { ReactNode } from 'react';

/**
 * Wraps a preview in an iPhone-ish phone frame so authors see roughly what
 * the tourist sees. Width/height are fixed; the author can scroll the
 * inner content.
 */
export function PhoneFramePreview({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[360px]">
      <div className="rounded-[36px] border border-border bg-black/80 p-3 shadow-lg">
        <div className="h-[640px] overflow-hidden rounded-[24px] bg-background">
          <div className="h-full overflow-y-auto">{children}</div>
        </div>
      </div>
    </div>
  );
}
