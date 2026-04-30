import { describe, expect, it } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { emptyTour } from '@/schema';
import { TourMetaPanel } from './TourMetaPanel';
import { TOUR_META_TAB_IDS } from './tabIds';

function renderPanel(tab: (typeof TOUR_META_TAB_IDS)[number]) {
  const tour = emptyTour('tour-test');
  return renderToStaticMarkup(
    <TourMetaPanel tour={tour} locale="de" activeTab={tab} />,
  );
}

/** Returns the inner HTML of the active tab's <tabpanel> div only. */
function extractTabPanel(html: string, tab: (typeof TOUR_META_TAB_IDS)[number]) {
  const marker = `id="tour-meta-tab-${tab}"`;
  const start = html.indexOf(marker);
  if (start === -1) {
    throw new Error(`Tab panel ${tab} not found in render output`);
  }
  return html.slice(start);
}

describe('TourMetaPanel', () => {
  it('renders with an empty tour without throwing', () => {
    const tour = emptyTour('tour-empty');
    expect(() =>
      renderToStaticMarkup(<TourMetaPanel tour={tour} locale="de" />),
    ).not.toThrow();
  });

  it('renders all five tab triggers in the strip', () => {
    const html = renderPanel('public');
    for (const tabId of TOUR_META_TAB_IDS) {
      expect(html).toContain(`tour-meta-tab-trigger-${tabId}`);
    }
  });

  it('marks exactly one tab as selected', () => {
    const html = renderPanel('aiContext');
    expect(html).toContain('id="tour-meta-tab-aiContext"');
    expect(html).toMatch(/aria-selected="true"/);
  });

  it('renders the public tab content by default', () => {
    const tour = emptyTour('tour-empty');
    const html = renderToStaticMarkup(
      <TourMetaPanel tour={tour} locale="de" />,
    );
    // Public tab section header — present in both read-only and editor modes.
    expect(html).toContain('Titel &amp; Beschreibung');
  });

  it('shows AI-Kontext content separately from Story content', () => {
    // AI tab renders the AI-Context body (with Sicherheitsregeln) and *not*
    // the Story body (no "Prämisse & Bogen" heading). The opposite holds
    // for the Story tab. We compare against the rendered tab panel rather
    // than the whole document so we don't pick up the static tab-strip
    // tooltips (which mention every tab, including the inactive ones).
    const aiPanel = extractTabPanel(renderPanel('aiContext'), 'aiContext');
    const storyPanel = extractTabPanel(renderPanel('story'), 'story');
    expect(aiPanel).toContain('Sicherheitsregeln');
    expect(aiPanel).not.toContain('Prämisse &amp; Bogen');
    expect(storyPanel).toContain('Prämisse &amp; Bogen');
    expect(storyPanel).not.toContain('Sicherheitsregeln');
  });

  it('switches between tabs when activeTab changes', () => {
    const tour = emptyTour('tour-switch');
    const publicHtml = renderToStaticMarkup(
      <TourMetaPanel tour={tour} locale="de" activeTab="public" />,
    );
    const aiHtml = renderToStaticMarkup(
      <TourMetaPanel tour={tour} locale="de" activeTab="aiContext" />,
    );
    expect(extractTabPanel(publicHtml, 'public')).toContain(
      'Titel &amp; Beschreibung',
    );
    expect(extractTabPanel(aiHtml, 'aiContext')).toContain(
      'Rolle &amp; Kernidee',
    );
  });

  it('renders meta blocks with full data without throwing', () => {
    const tour = emptyTour('tour-full');
    tour.publicMeta = {
      themes: ['birds'],
      audience: ['families'],
      difficulty: { walking: 'easy' },
    };
    tour.aiContext = {
      assistantRole: 'Test role',
      guardrails: ['do_not_invent_history'],
    };
    tour.storyMeta = {
      premise: 'Test premise',
      characters: [{ name: 'Test character' }],
    };
    expect(() =>
      renderToStaticMarkup(<TourMetaPanel tour={tour} locale="de" />),
    ).not.toThrow();
  });
});
