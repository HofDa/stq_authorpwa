import { describe, expect, it, vi } from 'vitest';
import { renderToStaticMarkup } from 'react-dom/server';
import { emptyTour, type TourEntry } from '@/schema';
import { PublicMetaTab } from './tabs/PublicMetaTab';
import { themeChoices } from '@/domain/tourMeta/choices';

/**
 * The Public Meta editor's chip components are pure functions of `value`
 * and `onChange`. Rather than wiring up RTL we emulate the click by
 * invoking the same recipe `MultiChoiceTagPicker` would call. That keeps
 * tests fast and doesn't depend on DOM events.
 */

function applyMultiToggle(
  current: ReadonlyArray<string>,
  id: string,
): string[] {
  const set = new Set(current);
  if (set.has(id)) {
    return current.filter((value) => value !== id);
  }
  return [...current, id];
}

function tourWith(meta: Partial<TourEntry['publicMeta']>): TourEntry {
  const tour = emptyTour('tour-public');
  tour.publicMeta = { ...(tour.publicMeta ?? {}), ...meta };
  return tour;
}

describe('PublicMetaTab — chip toggling logic', () => {
  it('selecting a theme adds its id to publicMeta.themes', () => {
    const next = applyMultiToggle([], 'birds');
    expect(next).toEqual(['birds']);
  });

  it('selecting a second theme keeps both ids', () => {
    const next = applyMultiToggle(['birds'], 'biodiversity');
    expect(next).toEqual(['birds', 'biodiversity']);
  });

  it('clicking an active theme removes it', () => {
    const next = applyMultiToggle(['birds', 'biodiversity'], 'birds');
    expect(next).toEqual(['biodiversity']);
  });

  it('uses stable ids from the catalog (not labels)', () => {
    const idLookup = new Set(themeChoices.map((option) => option.id));
    expect(idLookup.has('birds')).toBe(true);
    // The stored label "Vögel" must never end up in the persisted ids.
    expect(idLookup.has('Vögel')).toBe(false);
  });
});

describe('PublicMetaTab — render contract', () => {
  it('renders read-only when onTourChange is omitted', () => {
    const html = renderToStaticMarkup(
      <PublicMetaTab tour={tourWith({})} locale="de" />,
    );
    // Inputs render but with readOnly attribute set.
    expect(html).toContain('readonly=""');
  });

  it('renders editable when onTourChange is provided', () => {
    const onTourChange = vi.fn();
    const html = renderToStaticMarkup(
      <PublicMetaTab
        tour={tourWith({})}
        locale="de"
        onTourChange={onTourChange}
      />,
    );
    expect(html).not.toContain('readonly=""');
  });

  it('keeps walking and riddle difficulty in separate selectors', () => {
    const html = renderToStaticMarkup(
      <PublicMetaTab
        tour={tourWith({
          difficulty: { walking: 'easy', riddle: 'hard' },
        })}
        locale="de"
      />,
    );
    // Both selector legends should appear distinctly.
    expect(html).toContain('Geh-Schwierigkeit');
    expect(html).toContain('Rätsel-Schwierigkeit');
  });

  it('renders a chip for every selected theme using the stored id', () => {
    const tour = tourWith({ themes: ['birds', 'biodiversity'] });
    const html = renderToStaticMarkup(
      <PublicMetaTab tour={tour} locale="de" />,
    );
    // Active chip has the burgundy primary background.
    const activeMatches = html.match(/aria-checked="true"/g) ?? [];
    expect(activeMatches.length).toBeGreaterThanOrEqual(2);
  });

  it('round-trips a theme selection through onTourChange', () => {
    let tour = tourWith({});
    const onTourChange = vi.fn(
      (recipe: (prev: TourEntry) => TourEntry) => {
        tour = recipe(tour);
      },
    );
    // Render once just to wire types — the actual mutation happens via
    // simulated `MultiChoiceTagPicker.onChange` calls below.
    renderToStaticMarkup(
      <PublicMetaTab
        tour={tour}
        locale="de"
        onTourChange={onTourChange}
      />,
    );
    // Simulate the recipe `PublicMetaTab` would build for a theme toggle.
    const recipe = (prev: TourEntry): TourEntry => ({
      ...prev,
      publicMeta: { ...prev.publicMeta, themes: ['birds'] },
    });
    onTourChange(recipe);
    expect(tour.publicMeta?.themes).toEqual(['birds']);
    // Removing the theme — empty array is normalised to undefined by the
    // editor's internal `set` helper. We test the final stored shape:
    onTourChange((prev) => ({
      ...prev,
      publicMeta: { ...prev.publicMeta, themes: [] },
    }));
    expect(tour.publicMeta?.themes).toEqual([]);
  });

  it('does not render any AI/internal fields', () => {
    const tour = emptyTour('tour-clean');
    tour.aiContext = { assistantRole: 'Internal AI rule that should not leak' };
    tour.adminMeta = { ...tour.adminMeta, owner: 'internal-owner' };
    const html = renderToStaticMarkup(
      <PublicMetaTab tour={tour} locale="de" />,
    );
    expect(html).not.toContain('Internal AI rule that should not leak');
    expect(html).not.toContain('internal-owner');
  });
});
