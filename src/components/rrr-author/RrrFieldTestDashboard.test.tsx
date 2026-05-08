import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import { emptyDraft, emptyStation } from '@/schema';
import { RrrFieldTestDashboard } from './RrrFieldTestDashboard';

describe('RrrFieldTestDashboard', () => {
  it('does not render for tours without modular stations', () => {
    const draft = emptyDraft();
    draft.stations = [emptyStation('station-1', 1)];

    const html = renderToStaticMarkup(
      <RrrFieldTestDashboard draft={draft} />,
    );

    expect(html).toBe('');
  });

  it('summarizes modular field-test statuses and groups stations', () => {
    const draft = emptyDraft();
    const untested = emptyStation('station-1', 1);
    untested.riddleType = 'modular';
    untested.de.location = 'Piazza';
    untested.fieldTestStatus = 'not_tested';

    const ok = emptyStation('station-2', 2);
    ok.riddleType = 'modular';
    ok.de.location = 'Tor';
    ok.fieldTestStatus = 'tested_ok';

    const warnings = emptyStation('station-3', 3);
    warnings.riddleType = 'modular';
    warnings.de.location = 'Brunnen';
    warnings.fieldTestStatus = 'tested_with_warnings';
    warnings.fieldTestIssueTags = ['gps_ungenau', 'ersatzloesung_noetig'];

    const needsFix = emptyStation('station-4', 4);
    needsFix.riddleType = 'modular';
    needsFix.de.location = 'Museum';
    needsFix.fieldTestStatus = 'needs_fix';

    const textOnly = emptyStation('station-5', 5);
    textOnly.de.location = 'Textstation';

    draft.stations = [untested, ok, warnings, needsFix, textOnly];

    const html = renderToStaticMarkup(
      <RrrFieldTestDashboard draft={draft} onSelectStation={() => {}} />,
    );

    expect(html).toContain('RRR-Feldtest-Status');
    expect(html).toContain('4 modulare Stationen');
    expect(html).toContain('Nicht getestet');
    expect(html).toContain('Getestet OK');
    expect(html).toContain('Mit Warnungen');
    expect(html).toContain('Braucht Korrektur');
    expect(html).toContain('Station 1: Piazza');
    expect(html).toContain('Station 3: Brunnen');
    expect(html).toContain('GPS ungenau');
    expect(html).toContain('Ersatzlösung nötig');
    expect(html).not.toContain('Textstation');
  });
});
