import type { Locale, TourDraft } from '@/schema';
import {
  getTourLocationLabel,
  getTourTitleLabel,
} from '@/utils/localizedContent';
import { TourCard } from '@/renderer/TourCard';
import { Icon } from '@/components/studio/Icon';

interface Props {
  drafts: TourDraft[];
  locale: Locale;
  onCreateTour: () => void;
  onOpenTour: (draftId: string) => void;
}

export function TourMenuScreen({
  drafts,
  locale,
  onCreateTour,
  onOpenTour,
}: Props) {
  return (
    <main className="stq-field-tour-menu">
      <header>
        <h1>SouthTyrolQuests</h1>
        <p>Wähle eine Tour und starte dein Abenteuer.</p>
      </header>
      <button type="button" className="stq-new-tour-card" onClick={onCreateTour}>
        <span>
          <Icon name="plus" size={24} />
        </span>
        <strong>Neue Tour</strong>
      </button>
      <div className="stq-field-tour-list">
        {drafts.map((draft) => (
          <TourCard
            key={draft.draftId}
            draft={draft}
            title={getTourTitleLabel(draft.tour, locale, 'Untitled tour')}
            description={summarizeDescription(draft, locale)}
            location={getTourLocationLabel(draft.tour, locale, 'South Tyrol')}
            onOpen={() => onOpenTour(draft.draftId)}
          />
        ))}
      </div>
    </main>
  );
}

function summarizeDescription(draft: TourDraft, locale: Locale): string {
  const paragraph = draft.tour[locale].description.find(
    (block) => block.type === 'paragraph' && block.text.trim(),
  );
  return paragraph?.type === 'paragraph' ? paragraph.text : '';
}
