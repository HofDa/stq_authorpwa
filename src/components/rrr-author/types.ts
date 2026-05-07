import type { RrrInteraction } from '@/rrr';

export interface RrrInteractionEditorProps {
  interaction: RrrInteraction;
  onChange: (interaction: RrrInteraction) => void;
}
