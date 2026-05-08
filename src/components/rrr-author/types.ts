import type { RrrInteraction } from '@/rrr';
import type { RrrFieldTestIssueTag } from '@/schema';

export interface RrrInteractionEditorProps {
  interaction: RrrInteraction;
  stationId?: string;
  stationTitle?: string;
  fieldTestIssueTags?: RrrFieldTestIssueTag[];
  onChange: (interaction: RrrInteraction) => void;
}
