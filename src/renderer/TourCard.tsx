import type { TourDraft } from '@/schema';
import { resolveRendererAssetPath } from './assetPaths';

interface Props {
  draft: TourDraft;
  title: string;
  description: string;
  location: string;
  onOpen: () => void;
}

export function TourCard({ draft, title, description, location, onOpen }: Props) {
  const imageUrl = resolveRendererAssetPath(draft.tour.imagePath);

  return (
    <button type="button" className="stq-native-tour-card" onClick={onOpen}>
      {imageUrl && <img src={imageUrl} alt="" />}
      <div>
        <h2>{title}</h2>
        <p className="stq-native-tour-location">{location}</p>
        <p>{description}</p>
      </div>
    </button>
  );
}
