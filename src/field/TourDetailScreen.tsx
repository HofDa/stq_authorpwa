import { useState } from 'react';
import type { Locale, TourDraft, TourLocaleContent } from '@/schema';
import { CaptureButton } from '@/components/CaptureButton';
import { EditPanel, type EditPayload } from '@/author/EditPanel';
import { TourAiSidePanel, type TourAiPanelMode } from '@/author/TourAiSidePanel';
import { useAuthorSelection } from '@/author/useAuthorSelection';
import { Icon } from '@/components/studio/Icon';
import { useBlobUrl } from '@/hooks/useBlobUrl';
import { TourIntro } from '@/renderer/TourIntro';
import { getTourLocationLabel, getTourTitleLabel } from '@/utils/localizedContent';

interface Props {
  draft: TourDraft;
  locale: Locale;
  authorMode: boolean;
  onAuthorModeChange: (enabled: boolean) => void;
  onBack: () => void;
  onStart: () => void;
  onChange: (recipe: (prev: TourDraft) => TourDraft) => void;
}

export function TourDetailScreen({
  draft,
  locale,
  authorMode,
  onAuthorModeChange,
  onBack,
  onStart,
  onChange,
}: Props) {
  const selection = useAuthorSelection();
  const [aiPanelOpen, setAiPanelOpen] = useState(false);
  const [aiPanelMode, setAiPanelMode] = useState<TourAiPanelMode>('image');
  const coverBlobUrl = useBlobUrl(draft.tour.coverBlobId);
  const imageUrl = coverBlobUrl ?? resolveAssetPath(draft.tour.imagePath);
  const title = getTourTitleLabel(draft.tour, locale, 'Untitled tour');
  const location = getTourLocationLabel(draft.tour, locale, 'South Tyrol');
  const content = draft.tour[locale];

  function patchLocale(patch: Partial<TourLocaleContent>) {
    onChange((prev) => ({
      ...prev,
      tour: { ...prev.tour, [locale]: { ...prev.tour[locale], ...patch } },
    }));
  }

  function setCoverBlob(blobId: string) {
    onChange((prev) => ({
      ...prev,
      tour: {
        ...prev.tour,
        imagePath: `images/${blobId}.webp`,
        coverBlobId: blobId,
      },
    }));
  }

  function openAiPanel(nextMode: TourAiPanelMode) {
    setAiPanelMode(nextMode);
    setAiPanelOpen(true);
  }

  function save(payload: EditPayload) {
    if (payload.kind === 'hero') {
      setCoverBlob(payload.blobId);
    }
    if (payload.kind === 'tourIntro') {
      patchLocale({ title: payload.title, description: payload.description });
    }
    selection.close();
  }

  const heroAction = authorMode ? (
    <div className="stq-riddle-map-card-actions">
      <CaptureButton
        draftId={draft.draftId}
        preset="station"
        onCaptured={setCoverBlob}
        className="stq-riddle-map-card-action"
        ariaLabel={imageUrl ? 'Replace tour cover image' : 'Capture tour cover image'}
        label={<Icon name="camera" size={18} />}
        capture={false}
      />
      <button
        type="button"
        className="stq-riddle-map-card-action"
        onClick={() => openAiPanel('image')}
        aria-label="Open AI helper for tour cover image"
      >
        <Icon name="wand" size={18} />
      </button>
    </div>
  ) : null;

  const introHeadingAction = authorMode ? (
    <div className="stq-riddle-heading-actions">
      <button
        type="button"
        className="stq-riddle-heading-action"
        onClick={() => selection.edit('tour.intro', 'tour intro')}
        aria-label="Edit tour title and description"
      >
        <Icon name="edit" size={17} />
      </button>
      <button
        type="button"
        className="stq-riddle-heading-action"
        onClick={() => openAiPanel('intro')}
        aria-label="Open AI helper for tour title and description"
      >
        <Icon name="sparkles" size={17} />
      </button>
    </div>
  ) : null;

  return (
    <div className="stq-field-tour-detail">
      <div className="stq-field-detail-topbar">
        <button type="button" onClick={onBack} aria-label="Back to tours">
          <Icon name="chevron-left" size={20} />
        </button>
        <button
          type="button"
          className={`stq-field-map-edit-toggle${authorMode ? ' active' : ''}`}
          onClick={() => onAuthorModeChange(!authorMode)}
          aria-label={authorMode ? 'Disable editing' : 'Enable editing'}
          aria-pressed={authorMode}
        >
          <Icon name="edit" size={16} />
        </button>
      </div>
      <TourIntro
        imageUrl={imageUrl}
        title={title}
        location={location}
        description={content.description}
        onStart={onStart}
        heroAction={heroAction}
        titleHeadingAction={introHeadingAction}
      />

      {authorMode && !selection.target && (
        <TourAiSidePanel
          locale={locale}
          tourTitle={title}
          mode={aiPanelMode}
          onModeChange={setAiPanelMode}
          open={aiPanelOpen}
          onOpenChange={setAiPanelOpen}
        />
      )}

      {selection.target && selection.target.kind === 'edit' && (
        <div
          className="stq-riddle-modal-backdrop"
          role="presentation"
          onClick={selection.close}
        >
          <div
            className="stq-riddle-modal"
            role="dialog"
            aria-modal="true"
            onClick={(event) => event.stopPropagation()}
          >
            <button
              type="button"
              className="stq-riddle-modal-close"
              onClick={selection.close}
              aria-label="Close"
            >
              <Icon name="x" size={18} />
            </button>
            <EditPanel
              targetPath={selection.target.targetPath}
              label={selection.target.label}
              draftId={draft.draftId}
              stationTitle={content.title}
              heroBlobId={draft.tour.coverBlobId}
              sectionBlocks={content.description}
              sectionFallbackTitle="Description"
              riddleType="text"
              solutionInputType="text"
              acceptedAnswers={[]}
              hints={[]}
              onSave={save}
            />
          </div>
        </div>
      )}
    </div>
  );
}

function resolveAssetPath(path: string | undefined): string | undefined {
  if (!path) return undefined;
  if (/^(https?:|blob:|data:)/.test(path)) return path;
  return `/${path.replace(/^\/+/, '')}`;
}
