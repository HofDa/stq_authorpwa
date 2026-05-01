import type { ReactNode } from 'react';
import type { ContentBlock } from '@/schema';
import { ContentSectionRenderer } from './ContentSectionRenderer';

interface Props {
  imageUrl?: string;
  title: string;
  location: string;
  description: ContentBlock[];
  onStart: () => void;
  heroAction?: ReactNode;
  titleHeadingAction?: ReactNode;
}

export function TourIntro({
  imageUrl,
  title,
  location,
  description,
  onStart,
  heroAction,
  titleHeadingAction,
}: Props) {
  return (
    <main className="stq-tour-intro">
      <div className="stq-render-target stq-tour-intro-hero">
        {imageUrl ? <img src={imageUrl} alt="" /> : <div className="stq-tour-intro-placeholder" />}
        {heroAction}
      </div>
      <section className="stq-tour-intro-body">
        <div
          className={[
            'stq-render-target',
            'stq-tour-intro-title-block',
            titleHeadingAction ? 'stq-tour-intro-title-block--with-action' : '',
          ].join(' ')}
        >
          {titleHeadingAction}
          <h1>{title}</h1>
          <p className="stq-tour-intro-location">{location}</p>
        </div>
        <div className="stq-render-target stq-tour-intro-copy">
          <ContentSectionRenderer blocks={description} />
        </div>
        <button type="button" className="stq-tour-start-btn" onClick={onStart}>
          Tour starten
        </button>
      </section>
    </main>
  );
}
