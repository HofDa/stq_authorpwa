import type { StudioWorkflowSection } from '@/components/studio/workflow/workflowTypes';
import type { AssistantAction } from '@/components/studio/assistant/assistantTypes';
import type { AiActionId, AiAgentId } from './aiTypes';

export interface AiAgentActionDefinition {
  id: AiActionId;
  agentId: AiAgentId;
  section: StudioWorkflowSection;
  label: string;
  description: string;
}

export const AI_AGENT_ACTIONS = [
  {
    id: 'plan.improveConcept',
    agentId: 'plan',
    section: 'plan',
    label: 'Improve concept',
    description: 'Suggest a tighter goal, audience and concept framing.',
  },
  {
    id: 'story.createStoryline',
    agentId: 'story',
    section: 'story',
    label: 'Draft storyline',
    description: 'Suggest a story core for the narrative workspace.',
  },
  {
    id: 'story.refineIntro',
    agentId: 'story',
    section: 'story',
    label: 'Refine intro',
    description: 'Suggest a sharper player-facing introduction.',
  },
  {
    id: 'story.refineOutro',
    agentId: 'story',
    section: 'story',
    label: 'Refine outro',
    description: 'Suggest a closing paragraph that pays off the story.',
  },
  {
    id: 'station.reviewStation',
    agentId: 'station',
    section: 'stations',
    label: 'Review station',
    description: 'Check one station for story, riddle and field clarity.',
  },
  {
    id: 'station.createRiddle',
    agentId: 'station',
    section: 'stations',
    label: 'Create riddle',
    description: 'Suggest a riddle anchored to visible station details.',
  },
  {
    id: 'station.shortenText',
    agentId: 'station',
    section: 'stations',
    label: 'Shorten text',
    description: 'Suggest a tighter station copy variant.',
  },
  {
    id: 'route.reviewRoute',
    agentId: 'route',
    section: 'route',
    label: 'Review route',
    description: 'Review route flow and long-segment risks.',
  },
  {
    id: 'preview.runQA',
    agentId: 'preview',
    section: 'preview',
    label: 'Run QA',
    description: 'Suggest preview checks before export.',
  },
  {
    id: 'translation.checkCompleteness',
    agentId: 'translation',
    section: 'preview',
    label: 'Check translations',
    description: 'Find missing localized content across languages.',
  },
] as const satisfies readonly AiAgentActionDefinition[];

export function getAiAgentAction(
  id: AiActionId,
): AiAgentActionDefinition {
  const action = AI_AGENT_ACTIONS.find((candidate) => candidate.id === id);
  if (!action) {
    throw new Error(`Unknown AI action: ${id}`);
  }
  return action;
}

export function buildAssistantAction(
  id: AiActionId,
  options: {
    disabled?: boolean;
    description?: string;
    onTrigger?: () => void;
  } = {},
): AssistantAction {
  const definition = getAiAgentAction(id);
  return {
    id: definition.id,
    label: definition.label,
    description: options.description ?? definition.description,
    disabled: options.disabled,
    onTrigger: options.onTrigger,
  };
}
