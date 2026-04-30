import type { ReactNode } from 'react';

interface Props {
  imageUrl?: string;
  title: string;
  children: ReactNode;
}

export function HeroImage({ imageUrl, title, children }: Props) {
  return (
    <section className="stq-riddle-hero" aria-label={title}>
      {imageUrl ? (
        <img className="stq-riddle-hero-image" src={imageUrl} alt="" />
      ) : (
        <div className="stq-riddle-hero-placeholder" />
      )}
      <div className="stq-riddle-hero-overlay" />
      <div className="stq-riddle-center-icon">{children}</div>
    </section>
  );
}
