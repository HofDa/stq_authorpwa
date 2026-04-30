import type { Locale, RiddleEntry, TourDraft } from '@/schema';
import {
  getExportReadiness,
  getStationReadiness,
  getTourReadiness,
  type LocalCheck,
} from '../readiness';
import type { StudioWorkflowSection } from '../workflow/workflowTypes';
import type { AssistantSuggestion } from './assistantTypes';

interface BuildArgs {
  draft: TourDraft;
  locale: Locale;
  /** Suggestion ids the user has dismissed in this session. */
  dismissed?: ReadonlySet<string>;
  /** Cap to keep the panel calm. Defaults to 3. */
  limit?: number;
}

/**
 * Deterministic, AI-free suggestion generator. Turns missing/problem checks
 * into concrete `AssistantSuggestion`s so the UI can exercise the Apply /
 * Dismiss flow without any provider wired up.
 *
 * Each call returns the same suggestions for the same inputs — that's the
 * contract later real-AI suggestions will replace, not the shape itself.
 */
export function buildMockSuggestions(
  section: StudioWorkflowSection,
  args: BuildArgs,
): AssistantSuggestion[] {
  switch (section) {
    case 'plan':
      return capped(buildPlanSuggestions(args), args);
    case 'story':
      return capped(buildStorySuggestions(args), args);
    case 'stations':
      return capped(buildStationsSuggestions(args), args);
    case 'route':
      return capped(buildRouteSuggestions(args), args);
    case 'preview':
      return capped(buildPreviewSuggestions(args), args);
  }
}

function capped(
  suggestions: AssistantSuggestion[],
  { dismissed, limit = 3 }: BuildArgs,
): AssistantSuggestion[] {
  const filtered = dismissed
    ? suggestions.filter((suggestion) => !dismissed.has(suggestion.id))
    : suggestions;
  return filtered.slice(0, limit);
}

function buildPlanSuggestions({ draft, locale }: BuildArgs) {
  const tourChecks = getTourReadiness(draft, locale);
  const blockers = getExportReadiness(draft, locale);
  const out: AssistantSuggestion[] = [];

  const titleCheck = tourChecks.find((c) => c.id === 'tour.title');
  if (titleCheck && titleCheck.status === 'missing') {
    out.push({
      id: 'mock.plan.title',
      title: 'Pick a working title',
      reason:
        'A working title makes Plan, Story and the export pipeline easier to navigate. You can always rename it later.',
      proposedChange: `tour.${locale}.title := "Untitled tour"`,
      target: { section: 'plan', field: 'title' },
    });
  }

  if (blockers.length > 0) {
    const summary = blockers
      .slice(0, 3)
      .map((blocker) => `• ${blocker.message ?? blocker.label}`)
      .join('\n');
    out.push({
      id: 'mock.plan.blockers',
      title: `Resolve ${blockers.length} export blocker${
        blockers.length === 1 ? '' : 's'
      }`,
      reason:
        'Walking the blockers in order keeps the dashboard, sidebar and export readiness in sync.',
      proposedChange: summary,
      target: { section: 'plan', field: 'blockers' },
    });
  }

  if (!draft.tour[locale].duration.trim()) {
    out.push({
      id: 'mock.plan.duration',
      title: 'Estimate the tour duration',
      reason:
        'A rough duration helps players self-select and gives the QA workspace a target to test against.',
      proposedChange: `tour.${locale}.duration := "≈ 90 min"`,
      target: { section: 'plan', field: 'duration' },
    });
  }

  return out;
}

function buildStorySuggestions({ draft, locale }: BuildArgs) {
  const localized = draft.tour[locale];
  const out: AssistantSuggestion[] = [];

  if (!draft.storyline.markdown.trim()) {
    out.push({
      id: 'mock.story.storyline',
      title: 'Draft a one-paragraph story core',
      reason:
        'The narrative bible is what later per-station suggestions will reference. Even a paragraph keeps tone consistent.',
      proposedChange:
        '# Story core\nA single hook — who the player is, what they\'re chasing, and the twist they\'ll only see at the end.',
      target: { section: 'story', field: 'storyline' },
    });
  }

  if (localized.introSection.length === 0) {
    out.push({
      id: 'mock.story.intro',
      title: 'Sketch a 2-block intro',
      reason:
        'A short heading + paragraph at the top of the tour gives players context before they start walking.',
      proposedChange:
        'heading := "Welcome to <tour name>"\nparagraph := "You\'re standing where it all starts. Look around — the first clue is closer than you think."',
      target: { section: 'story', field: 'intro' },
    });
  }

  if (localized.outroSection.length === 0) {
    out.push({
      id: 'mock.story.outro',
      title: 'Add a closing outro',
      reason:
        'Players need a clear sign-off so the tour feels complete. One paragraph is enough.',
      proposedChange:
        'paragraph := "Thanks for walking with us. The story you just unlocked has been here for centuries — see if you can spot it from the bus on the way home."',
      target: { section: 'story', field: 'outro' },
    });
  }

  return out;
}

function buildStationsSuggestions({ draft, locale }: BuildArgs) {
  const out: AssistantSuggestion[] = [];

  for (const station of draft.stations) {
    if (out.length >= 4) break;
    const checks = getStationReadiness(station, locale);
    const missingGps = checks.find(
      (c) => c.id === `${station.id}.gps` && c.status !== 'ready',
    );
    if (missingGps) {
      out.push(stationSuggestion(station, locale, 'gps'));
      continue;
    }
    const missingSuccess = checks.find(
      (c) => c.id === `${station.id}.success` && c.status !== 'ready',
    );
    if (missingSuccess) {
      out.push(stationSuggestion(station, locale, 'success'));
      continue;
    }
    const riddleProblem = checks.find(
      (c) => c.id === `${station.id}.riddle` && c.status === 'problem',
    );
    if (riddleProblem) {
      out.push(stationSuggestion(station, locale, 'answer'));
    }
  }

  return out;
}

function stationSuggestion(
  station: RiddleEntry,
  locale: Locale,
  kind: 'gps' | 'success' | 'answer',
): AssistantSuggestion {
  const label = station[locale].location || `Station ${station.number}`;
  switch (kind) {
    case 'gps':
      return {
        id: `mock.station.${station.id}.gps`,
        title: `Drop a GPS pin for "${label}"`,
        reason:
          'Without coordinates this station can\'t be unlocked in the field, and the route stitch step will skip it.',
        proposedChange: `station[${station.number}].position := <capture from device>`,
        target: { section: 'stations', stationId: station.id, field: 'gps' },
      };
    case 'success':
      return {
        id: `mock.station.${station.id}.success`,
        title: `Write a success message for "${label}"`,
        reason:
          'Players need to know what they unlocked. A single sentence is enough.',
        proposedChange: `paragraph := "Nice — the next clue waits a short walk away."`,
        target: { section: 'stations', stationId: station.id, field: 'success' },
      };
    case 'answer':
      return {
        id: `mock.station.${station.id}.answer`,
        title: `Add an accepted answer for "${label}"`,
        reason:
          'The riddle text is in place, but no answer is registered, so players can\'t solve it.',
        proposedChange: `acceptedAnswers.${locale} += [<canonical answer>]`,
        target: { section: 'stations', stationId: station.id, field: 'riddle' },
      };
  }
}

function buildRouteSuggestions({ draft, locale }: BuildArgs) {
  const out: AssistantSuggestion[] = [];

  if (draft.recordedRoute.length === 0) {
    out.push({
      id: 'mock.route.record',
      title: 'Record a GPS track for the loop',
      reason:
        'Without a track we can\'t derive per-station segments or surface long-segment warnings.',
      proposedChange:
        'Open Stations · Map mode → walk the loop → the recorder appends to draft.recordedRoute.',
      target: { section: 'route', field: 'recordedRoute' },
    });
  } else if (draft.recordedRoute.length < 10) {
    out.push({
      id: 'mock.route.record-more',
      title: 'Record more GPS points',
      reason:
        `${draft.recordedRoute.length} points isn't enough to derive station segments reliably.`,
      proposedChange: 'Walk a longer stretch with the recorder still active.',
      target: { section: 'route', field: 'recordedRoute' },
    });
  }

  if (!draft.tour[locale].duration.trim()) {
    out.push({
      id: 'mock.route.duration',
      title: 'Note an estimated duration',
      reason: 'Distance alone doesn\'t tell players how long the loop takes.',
      proposedChange: `tour.${locale}.duration := "≈ <minutes> min"`,
      target: { section: 'route', field: 'duration' },
    });
  }

  return out;
}

function buildPreviewSuggestions({ draft, locale }: BuildArgs) {
  const out: AssistantSuggestion[] = [];
  const blockers = getExportReadiness(draft, locale);

  if (blockers.length > 0) {
    out.push({
      id: 'mock.preview.blockers',
      title: 'Walk export blockers in Preview',
      reason:
        'Switch the language picker through every locale and use the station picker — blockers are usually obvious in the phone frame.',
      proposedChange: blockers
        .slice(0, 3)
        .map((blocker) => `• ${blocker.message ?? blocker.label}`)
        .join('\n'),
      target: { section: 'preview' },
    });
  } else {
    out.push({
      id: 'mock.preview.smoke',
      title: 'Run a final smoke test',
      reason:
        'No blockers right now — a quick walk-through across all three languages catches the last typos before export.',
      proposedChange: 'Switch DE → EN → IT and tap Intro · Station · Outro for each.',
      target: { section: 'preview' },
    });
  }

  return out;
}

/**
 * Convenience helper: derive suggestions from a precomputed `LocalCheck[]`
 * when a workspace already has the checks at hand. Used internally for
 * tests; workspaces should still call `buildMockSuggestions` directly.
 */
export function pickActionableChecks(
  checks: LocalCheck[],
  limit = 3,
): LocalCheck[] {
  return checks
    .filter((check) => check.status === 'missing' || check.status === 'problem')
    .slice(0, limit);
}
