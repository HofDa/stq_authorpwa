import type { Locale, TourEntry } from '@/schema';
import { ContentSectionPreview } from './ContentSectionPreview';

interface Props {
  tour: TourEntry;
  locale: Locale;
}

export function TourIntroPreview({ tour, locale }: Props) {
  const content = tour[locale];
  return (
    <article className="flex flex-col">
      <div className="bg-primary px-4 py-5 text-white">
        <p className="font-ui text-labelSm uppercase tracking-wide opacity-80">
          {content.location || 'Location'}
        </p>
        <h1 className="mt-1 font-ui text-h3">
          {content.title || 'Untitled tour'}
        </h1>
        <div className="mt-2 flex gap-4 text-labelSm opacity-90">
          <span>⏳ {content.duration || '—'}</span>
          <span>📏 {tour.distance || '—'}</span>
        </div>
      </div>
      <ContentSectionPreview blocks={content.introSection} />
    </article>
  );
}

export function TourOutroPreview({ tour, locale }: Props) {
  const content = tour[locale];
  return (
    <article className="flex flex-col">
      <div className="bg-success px-4 py-5 text-white">
        <h1 className="font-ui text-h3">🏁 {content.title}</h1>
      </div>
      <ContentSectionPreview blocks={content.outroSection} />
    </article>
  );
}
