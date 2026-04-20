import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDraft } from '@/hooks/useDraft';
import { LocaleTabs } from '@/components/LocaleTabs';
import { ContentBlockEditor } from '@/components/ContentBlockEditor';
import { StationListPanel } from '@/components/StationListPanel';
import { PhoneFramePreview } from '@/components/preview/PhoneFramePreview';
import { TourIntroPreview } from '@/components/preview/TourIntroPreview';
import type { Locale, TourEntry, TourLocaleContent } from '@/schema';

export function TourEditorPage() {
  const { draftId } = useParams();
  const { draft, update } = useDraft(draftId);
  const [locale, setLocale] = useState<Locale>('en');

  if (!draft) {
    return <p className="text-bodySm text-disabled">Loading draft…</p>;
  }

  const localeContent = draft.tour[locale];

  function patchTour(patch: Partial<TourEntry>) {
    update((prev) => ({ ...prev, tour: { ...prev.tour, ...patch } }));
  }

  function patchLocale(patch: Partial<TourLocaleContent>) {
    update((prev) => ({
      ...prev,
      tour: {
        ...prev.tour,
        [locale]: { ...prev.tour[locale], ...patch },
      },
    }));
  }

  return (
    <div className="flex flex-col gap-5">
      <header className="flex flex-col gap-2">
        <Link to="/tours" className="text-bodySm text-disabled">
          ← All tours
        </Link>
        <h1 className="text-h4">
          {localeContent.title || 'Untitled tour'}
        </h1>
      </header>

      <section className="card flex flex-col gap-4">
        <h2 className="text-h5">Tour metadata</h2>
        <div className="grid grid-cols-2 gap-3">
          <label className="flex flex-col gap-1">
            <span className="text-labelSm">ID (slug)</span>
            <input
              className="input-field"
              value={draft.tour.id}
              onChange={(e) =>
                patchTour({
                  id: e.target.value,
                  riddlesPath: `${e.target.value}/${e.target.value}.json`,
                })
              }
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-labelSm">Number</span>
            <input
              className="input-field"
              type="number"
              min={0}
              value={draft.tour.number}
              onChange={(e) =>
                patchTour({ number: Number(e.target.value) || 0 })
              }
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-labelSm">Cover imagePath</span>
            <input
              className="input-field"
              value={draft.tour.imagePath}
              onChange={(e) => patchTour({ imagePath: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-labelSm">Distance</span>
            <input
              className="input-field"
              value={draft.tour.distance}
              placeholder="e.g. 2 km"
              onChange={(e) => patchTour({ distance: e.target.value })}
            />
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={draft.tour.unlocked}
              onChange={(e) => patchTour({ unlocked: e.target.checked })}
            />
            <span className="text-labelSm">Unlocked by default</span>
          </label>
          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={draft.tour.hideUnsolvedRiddles ?? false}
              onChange={(e) =>
                patchTour({ hideUnsolvedRiddles: e.target.checked })
              }
            />
            <span className="text-labelSm">Hide unsolved riddles</span>
          </label>
        </div>
      </section>

      <section className="card flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-h5">Localized content</h2>
        </div>
        <LocaleTabs active={locale} onChange={setLocale} />
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1">
            <span className="text-labelSm">Title</span>
            <input
              className="input-field"
              value={localeContent.title}
              onChange={(e) => patchLocale({ title: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-labelSm">Location</span>
            <input
              className="input-field"
              value={localeContent.location}
              onChange={(e) => patchLocale({ location: e.target.value })}
            />
          </label>
          <label className="flex flex-col gap-1">
            <span className="text-labelSm">Duration</span>
            <input
              className="input-field"
              value={localeContent.duration}
              placeholder="e.g. ca. 2h"
              onChange={(e) => patchLocale({ duration: e.target.value })}
            />
          </label>
        </div>

        <ContentBlockEditor
          label="Description"
          blocks={localeContent.description}
          onChange={(blocks) => patchLocale({ description: blocks })}
        />
        <ContentBlockEditor
          label="Intro section"
          blocks={localeContent.introSection}
          onChange={(blocks) => patchLocale({ introSection: blocks })}
        />
        <ContentBlockEditor
          label="Outro section"
          blocks={localeContent.outroSection}
          onChange={(blocks) => patchLocale({ outroSection: blocks })}
        />
      </section>

      <StationListPanel
        draftId={draft.draftId}
        stations={draft.stations}
        onChange={(stations) => update({ stations })}
      />

      <section className="card flex flex-col gap-3">
        <h2 className="text-h5">Preview</h2>
        <p className="text-bodySm text-disabled">
          Renders the intro section as the mobile app would.
        </p>
        <PhoneFramePreview>
          <TourIntroPreview tour={draft.tour} locale={locale} />
        </PhoneFramePreview>
      </section>
    </div>
  );
}
