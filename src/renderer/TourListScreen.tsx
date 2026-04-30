import type { TourDraft } from '@/schema';
import { getTourLocationLabel, getTourTitleLabel } from '@/utils/localizedContent';
import { TourCard } from './TourCard';

interface Props {
  drafts: TourDraft[];
  locale: 'de' | 'en' | 'it';
  onOpen: (draft: TourDraft) => void;
}

export function TourListScreen({ drafts, locale, onOpen }: Props) {
  return (
    <main className="stq-native-tour-list">
      <h1>SouthTyrolQuests</h1>
      {drafts.map((draft) => (
        <TourCard
          key={draft.draftId}
          draft={draft}
          title={getTourTitleLabel(draft.tour, locale, 'Untitled tour')}
          description={summarizeDescription(draft, locale)}
          location={getTourLocationLabel(draft.tour, locale, 'South Tyrol')}
          onOpen={() => onOpen(draft)}
        />
      ))}
    </main>
  );
}

function summarizeDescription(draft: TourDraft, locale: 'de' | 'en' | 'it'): string {
  const paragraph = draft.tour[locale].description.find(
    (block) => block.type === 'paragraph' && block.text.trim(),
  );
  return paragraph?.type === 'paragraph' ? paragraph.text : '';
}
