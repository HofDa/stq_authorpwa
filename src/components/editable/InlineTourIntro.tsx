import { useState } from 'react';
import type { Locale, TourDraft, TourLocaleContent } from '@/schema';
import { EditableText } from './EditableText';
import { EditableContentSection } from './EditableContentSection';
import { ImageCapture } from '@/components/ImageCapture';
import { CaptureButton } from '@/components/CaptureButton';
import { useBlobUrl } from '@/hooks/useBlobUrl';

interface Props {
  draft: TourDraft;
  locale: Locale;
  onChange: (recipe: (prev: TourDraft) => TourDraft) => void;
}

type TourTab = 'description' | 'intro' | 'outro';

const TOUR_TAB_LABELS: Record<TourTab, string> = {
  description: 'Card',
  intro: 'Intro',
  outro: 'Outro',
};

/**
 * Visual twin of the native `TourIntro` screen, with every visible field
 * editable in place.
 */
export function InlineTourIntro({ draft, locale, onChange }: Props) {
  const [tab, setTab] = useState<TourTab>('intro');
  const content = draft.tour[locale];
  const coverUrl = useBlobUrl(draft.tour.coverBlobId);

  function patchLocale(patch: Partial<TourLocaleContent>) {
    onChange((prev) => ({
      ...prev,
      tour: { ...prev.tour, [locale]: { ...prev.tour[locale], ...patch } },
    }));
  }

  function setCoverBlob(blobId: string) {
    onChange((prev) => ({
      ...prev,
      tour: {
        ...prev.tour,
        imagePath: `images/${blobId}.webp`,
        coverBlobId: blobId,
      },
    }));
  }

  const blocksForTab = (() => {
    switch (tab) {
      case 'description':
        return content.description;
      case 'intro':
        return content.introSection;
      case 'outro':
        return content.outroSection;
    }
  })();

  function setBlocksForTab(blocks: TourLocaleContent['introSection']) {
    switch (tab) {
      case 'description':
        patchLocale({ description: blocks });
        return;
      case 'intro':
        patchLocale({ introSection: blocks });
        return;
      case 'outro':
        patchLocale({ outroSection: blocks });
        return;
    }
  }

  return (
    <article className="flex flex-col">
      <div className="relative">
        {coverUrl ? (
          <>
            <img
              src={coverUrl}
              alt=""
              className="aspect-[3/2] w-full object-cover"
            />
            <div
              className="absolute inset-x-0 bottom-0 bg-gradient-to-t
                         from-black/70 to-transparent px-4 pb-4 pt-10
                         text-white"
            >
              <p className="font-ui text-labelSm uppercase tracking-wide opacity-90">
                <EditableText
                  value={content.location}
                  onChange={(location) => patchLocale({ location })}
                  placeholder="Location"
                  className="text-white"
                />
              </p>
              <h1 className="mt-1 font-ui text-h3">
                <EditableText
                  value={content.title}
                  onChange={(title) => patchLocale({ title })}
                  placeholder="Tour title"
                  className="text-white"
                />
              </h1>
            </div>
            <div className="absolute right-2 top-2">
              <CaptureButton
                draftId={draft.draftId}
                preset="tourCover"
                onCaptured={setCoverBlob}
              />
            </div>
          </>
        ) : (
          <>
            <ImageCapture
              draftId={draft.draftId}
              preset="tourCover"
              onCaptured={setCoverBlob}
              aspectClass="aspect-[3/2]"
              label="Tap to take the tour cover photo"
              rounded="none"
            />
            <div className="bg-primary px-4 py-4 text-white">
              <p className="font-ui text-labelSm uppercase tracking-wide opacity-80">
                <EditableText
                  value={content.location}
                  onChange={(location) => patchLocale({ location })}
                  placeholder="Location"
                  className="text-white"
                />
              </p>
              <h1 className="mt-1 font-ui text-h3">
                <EditableText
                  value={content.title}
                  onChange={(title) => patchLocale({ title })}
                  placeholder="Tour title"
                  className="text-white"
                />
              </h1>
            </div>
          </>
        )}
      </div>

      <div className="flex gap-4 border-b border-border bg-white px-4 py-2
                      font-ui text-labelSm">
        <span className="flex items-center gap-1">
          ⏳{' '}
          <EditableText
            value={content.duration}
            onChange={(duration) => patchLocale({ duration })}
            placeholder="duration"
          />
        </span>
        <span className="flex items-center gap-1">
          📏{' '}
          <EditableText
            value={draft.tour.distance}
            onChange={(distance) =>
              onChange((prev) => ({
                ...prev,
                tour: { ...prev.tour, distance },
              }))
            }
            placeholder="distance"
          />
        </span>
      </div>

      <nav className="flex border-b border-border bg-white">
        {(Object.keys(TOUR_TAB_LABELS) as TourTab[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={[
              'flex-1 px-2 py-2 text-labelSm',
              tab === key
                ? 'border-b-2 border-primary font-ui text-primary'
                : 'text-disabled',
            ].join(' ')}
          >
            {TOUR_TAB_LABELS[key]}
          </button>
        ))}
      </nav>

      <EditableContentSection
        draftId={draft.draftId}
        blocks={blocksForTab}
        onChange={setBlocksForTab}
      />
    </article>
  );
}
