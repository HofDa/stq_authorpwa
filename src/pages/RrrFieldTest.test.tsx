import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RrrFieldTest } from './RrrFieldTest';

describe('RrrFieldTest', () => {
  it('renders the isolated mobile field-test page', () => {
    const html = renderToStaticMarkup(<RrrFieldTest />);

    expect(html).toContain('RRR Field-Test');
    expect(html).toContain('Activate sensors');
    expect(html).toContain('Zum Testpunkt gehen');
    expect(html).toContain('Nach Osten schauen');
    expect(html).toContain('Handy ruhig halten');
    expect(html).toContain('Live-Sensorwerte');
    expect(html).toContain('GPS-Genauigkeit');
    expect(html).toContain('GPS unbekannt');
    expect(html).toContain('Empfohlener Radius');
    expect(html).toContain('Reset');
  });
});
