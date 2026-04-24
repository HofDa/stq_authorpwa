import type { ReactNode } from 'react';

/**
 * Wraps content in a phone-shaped frame so the author sees the tourist
 * view. Dimensions are a bit larger than a real iPhone so inline editing
 * (textareas, popovers) has room to breathe.
 */
export function PhoneFramePreview({ children }: { children: ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-[400px]">
      <div
        className="rounded-[40px] border border-border bg-black p-3 shadow-xl"
      >
        <div className="relative overflow-hidden rounded-[28px] bg-background">
          <div className="absolute left-1/2 top-2 z-10 h-6 w-36 -translate-x-1/2 rounded-full bg-black" />
          <div className="h-[min(78vh,720px)] overflow-y-auto pt-10">
            {children}
            <div className="h-6" />
          </div>
          <div className="pointer-events-none absolute inset-x-0 bottom-2 z-10 flex justify-center">
            <div className="h-1.5 w-28 rounded-full bg-black/70" />
          </div>
        </div>
      </div>
    </div>
  );
}
