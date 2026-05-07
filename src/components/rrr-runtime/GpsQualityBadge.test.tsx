import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { GpsQualityBadge } from './GpsQualityBadge';

describe('GpsQualityBadge', () => {
  it('renders current accuracy and suggested radius', () => {
    const html = renderToStaticMarkup(
      <GpsQualityBadge accuracyMeters={12} configuredRadiusMeters={20} />,
    );

    expect(html).toContain('GPS ok');
    expect(html).toContain('12 m');
    expect(html).toContain('Empfohlener Radius');
    expect(html).toContain('20 m');
  });

  it('warns when configured radius is smaller than current accuracy', () => {
    const html = renderToStaticMarkup(
      <GpsQualityBadge accuracyMeters={30} configuredRadiusMeters={20} />,
    );

    expect(html).toContain('GPS schwach');
    expect(html).toContain('kleiner als die aktuelle GPS-Genauigkeit');
    expect(html).toContain('45 m');
  });
});
