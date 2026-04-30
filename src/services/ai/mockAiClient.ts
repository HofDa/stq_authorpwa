import type { AssistantSuggestion } from '@/components/studio/assistant/assistantTypes';
import type { AiClient } from './aiClient';
import type { AiRequest, AiResponse } from './aiTypes';

interface Options {
  /**
   * How long the mock pretends to "think" before resolving. Defaults to a
   * short delay so the UI gets to render its loading state without making
   * tests slow. Set to 0 in unit tests for instant resolution.
   */
  latencyMs?: number;
}

/**
 * In-memory, deterministic implementation of `AiClient`. No network, no
 * env vars, no API keys. Each action id maps to a fixed-shape response so
 * tests and UI can exercise the boundary identically to a real provider.
 *
 * The real `remoteAiClient.ts` will land later — it must talk to an
 * authenticated edge endpoint, never embed a key in the bundle.
 */
export function createMockAiClient(options: Options = {}): AiClient {
  const latencyMs = options.latencyMs ?? 80;
  return {
    id: 'mock',
    async runAction(input: AiRequest): Promise<AiResponse> {
      if (latencyMs > 0) {
        await new Promise((resolve) => setTimeout(resolve, latencyMs));
      }
      return {
        provider: 'mock',
        notice: 'Mock provider — no remote calls were made.',
        suggestions: suggestionsForAction(input),
      };
    },
  };
}

function suggestionsForAction(input: AiRequest): AssistantSuggestion[] {
  switch (input.actionId) {
    case 'plan.improveConcept':
      return [
        {
          id: `mock.plan.concept.${input.timestamp}`,
          title: 'Tighten the tour goal to one sentence',
          reason:
            'Plan dashboards stay calm when the goal is one line. The story workspace will inherit that tone.',
          proposedChange:
            'tour.goal := "Walk visitors through the medieval origins of the city in 90 minutes."',
          target: { section: 'plan', field: 'goal' },
        },
      ];
    case 'story.createStoryline':
      return [
        {
          id: `mock.story.storyline.${input.timestamp}`,
          title: 'Open with the twist players don\'t see yet',
          reason:
            'Hooks land when the storyline opens with the unresolved tension that pays off at the outro.',
          proposedChange:
            '# Story core\nA passing remark in chapter one becomes a clue in chapter four. The narrator is unreliable until station 3.',
          target: { section: 'story', field: 'storyline' },
        },
      ];
    case 'story.refineIntro':
      return [
        {
          id: `mock.story.intro.${input.timestamp}`,
          title: 'Lead with sensory detail in the intro',
          reason:
            'A concrete sound or smell anchors players faster than abstract framing.',
          proposedChange:
            'paragraph := "Listen first. The bells will ring twice, and only the second one tells you which way to turn."',
          target: { section: 'story', field: 'intro' },
        },
      ];
    case 'story.refineOutro':
      return [
        {
          id: `mock.story.outro.${input.timestamp}`,
          title: 'Close the loop on the unanswered question',
          reason:
            'The outro lands harder when it pays off the very first line of the intro.',
          proposedChange:
            'paragraph := "Remember the bells? You just walked the path the second one was pointing to."',
          target: { section: 'story', field: 'outro' },
        },
      ];
    case 'station.reviewStation':
      return [
        {
          id: `mock.station.review.${input.stationId ?? 'unknown'}.${input.timestamp}`,
          title: 'Trim story blocks to under three lines',
          reason:
            'On phones, station copy past three lines starts feeling like a wall — players skim and miss the riddle hook.',
          proposedChange: 'paragraph[*].text := <shorter version>',
          target: {
            section: 'stations',
            stationId: input.stationId,
            field: 'story',
          },
        },
      ];
    case 'station.createRiddle':
      return [
        {
          id: `mock.station.riddle.${input.stationId ?? 'unknown'}.${input.timestamp}`,
          title: 'Anchor the riddle to a visible detail',
          reason:
            'Riddles that depend on something physically visible at the station are easier to solve and more rewarding.',
          proposedChange: 'paragraph := "Count the windows on the south face. The third one hides what we\'re looking for."',
          target: {
            section: 'stations',
            stationId: input.stationId,
            field: 'riddle',
          },
        },
      ];
    case 'station.shortenText':
      return [
        {
          id: `mock.station.shorten.${input.stationId ?? 'unknown'}.${input.timestamp}`,
          title: 'Drop a third of the story copy',
          reason:
            'Players read on the move; the second paragraph almost always restates the first.',
          proposedChange: 'paragraph[1].text := <delete>',
          target: {
            section: 'stations',
            stationId: input.stationId,
            field: 'story',
          },
        },
      ];
    case 'route.reviewRoute':
      return [
        {
          id: `mock.route.review.${input.timestamp}`,
          title: 'Re-walk the longest segment',
          reason:
            'Long segments tend to drift on phones. Recording the same stretch twice averages the noise out.',
          proposedChange:
            'Re-record the longest segment in Stations · Map mode.',
          target: { section: 'route', field: 'recordedRoute' },
        },
      ];
    case 'preview.runQA':
      return [
        {
          id: `mock.preview.qa.${input.timestamp}`,
          title: 'Walk every language in the phone frame',
          reason:
            'Most translation issues are spotted within 60 seconds of seeing them in context.',
          proposedChange:
            'Switch DE → EN → IT and tap Intro · Station · Outro for each.',
          target: { section: 'preview' },
        },
      ];
    case 'translation.checkCompleteness':
      return [
        {
          id: `mock.translation.check.${input.timestamp}`,
          title: 'Backfill missing localised titles',
          reason:
            'Once one locale has a title, copying it across guarantees the export passes title checks.',
          proposedChange: 'tour.<locale>.title := tour.de.title',
          target: { section: 'plan', field: 'languages' },
        },
      ];
  }
}
