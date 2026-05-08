import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { RrrRuntimeDemo } from './RrrRuntimeDemo';

describe('RrrRuntimeDemo', () => {
  it('renders a sample modular interaction with mock controls', () => {
    const html = renderToStaticMarkup(<RrrRuntimeDemo />);

    expect(html).toContain('Demo für modulares Rätsel');
    expect(html).toContain('Beispielhafter Rätselablauf');
    expect(html).toContain('Nach Osten schauen');
    expect(html).toContain('Testvorschau');
    expect(html).toContain('Richtung simulieren: 0 Grad');
    expect(html).toContain('Test zurücksetzen');
  });
});
