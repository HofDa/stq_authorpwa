import { useRef, useState, type ReactNode } from 'react';
import type {
  DifficultyLevel,
  Locale,
  PracticalInfo,
  TourDraft,
  TourPublicMeta,
} from '@/schema';
import { useBlobUrl } from '@/hooks/useBlobUrl';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import { storeImageBlob } from '@/media/imagePipeline';
import { Icon } from './Icon';
import { DeviceMockup } from './DeviceMockup';
import { EditPanel, type EditPanelField } from './EditPanel';

interface Props {
  draft: TourDraft;
  locale: Locale;
  onChange: (patch: Partial<TourDraft> | ((prev: TourDraft) => TourDraft)) => void;
  onCreateTour?: () => void | Promise<void>;
  otherDrafts?: TourDraft[];
  onSelectDraft?: (draftId: string) => void;
}

type ActivePanel = 'cover' | 'title' | 'description' | 'meta' | 'welcome' | null;

export function TourCardCanvas({
  draft,
  locale,
  onChange,
  onCreateTour,
  otherDrafts,
  onSelectDraft,
}: Props) {
  const { t } = useEditorLanguage();
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [snapshot, setSnapshot] = useState<TourDraft['tour'] | null>(null);
  const coverUrl = useBlobUrl(draft.tour.coverBlobId);
  const localized = draft.tour[locale];

  function openPanel(panel: Exclude<ActivePanel, null>) {
    setSnapshot(draft.tour);
    setActivePanel(panel);
  }

  function closePanel() {
    setSnapshot(null);
    setActivePanel(null);
  }

  function cancelPanel() {
    if (snapshot) {
      const original = snapshot;
      onChange((prev) => ({ ...prev, tour: original }));
    }
  }

  function patchLocale(patch: Partial<typeof localized>) {
    onChange((prev) => ({
      ...prev,
      tour: {
        ...prev.tour,
        [locale]: { ...prev.tour[locale], ...patch },
      },
    }));
  }

  function patchTour(patch: Partial<TourDraft['tour']>) {
    onChange((prev) => ({ ...prev, tour: { ...prev.tour, ...patch } }));
  }

  const titleFields: EditPanelField[] = [
    {
      id: 'title',
      label: t('studio.title'),
      type: 'text',
      value: localized.title,
      placeholder: t('studio.untitledTour'),
      onChange: (v) => patchLocale({ title: v }),
    },
    {
      id: 'location',
      label: t('studio.location'),
      type: 'text',
      value: localized.location,
      placeholder: t('studio.locationPlaceholder'),
      onChange: (v) => patchLocale({ location: v }),
    },
  ];

  const descriptionFields: EditPanelField[] = [
    {
      id: 'description',
      label: t('studio.shortDescription'),
      type: 'textarea',
      value: blocksToText(localized.description),
      placeholder: t('studio.shortDescriptionPlaceholder'),
      maxLength: 320,
      onChange: (v) =>
        patchLocale({
          description: v.trim() ? [{ type: 'paragraph', text: v }] : [],
        }),
    },
  ];

  const welcomeFields: EditPanelField[] = [
    {
      id: 'welcomeMessage',
      label: t('studio.welcomeMessage'),
      type: 'textarea',
      value: localized.welcomeMessage ?? '',
      placeholder: t('studio.welcomeMessagePlaceholder'),
      onChange: (v) => patchLocale({ welcomeMessage: v }),
    },
  ];

  const publicMeta: TourPublicMeta = draft.tour.publicMeta ?? {};

  function patchPublicMeta(patch: Partial<TourPublicMeta>) {
    onChange((prev) => ({
      ...prev,
      tour: {
        ...prev.tour,
        publicMeta: { ...(prev.tour.publicMeta ?? {}), ...patch },
      },
    }));
  }

  function patchPracticalInfo(patch: Partial<PracticalInfo>) {
    const next: PracticalInfo = {
      ...(publicMeta.practicalInfo ?? {}),
      ...patch,
    };
    for (const key of Object.keys(patch) as Array<keyof PracticalInfo>) {
      if (patch[key] === undefined) delete next[key];
    }
    patchPublicMeta({ practicalInfo: next });
  }

  const panelConfig: Record<
    Exclude<ActivePanel, null>,
    { title: string; fields: EditPanelField[]; body?: ReactNode }
  > = {
    cover: {
      title: t('studio.tourCover'),
      fields: [],
      body: (
        <CoverImagePanel
          draftId={draft.draftId}
          coverUrl={coverUrl}
          imagePath={draft.tour.imagePath}
          coverBlobId={draft.tour.coverBlobId}
          onBlob={(blobId) =>
            patchTour({ coverBlobId: blobId, imagePath: `images/${blobId}.webp` })
          }
          onUrl={(url) => patchTour({ imagePath: url, coverBlobId: undefined })}
        />
      ),
    },
    title: { title: t('studio.titleLocation'), fields: titleFields },
    description: { title: t('studio.description'), fields: descriptionFields },
    meta: {
      title: t('studio.tourStats'),
      fields: [],
      body: (
        <StatsPanel
          distance={draft.tour.distance}
          duration={localized.duration}
          difficulty={publicMeta.difficulty?.walking}
          practicalInfo={publicMeta.practicalInfo}
          onDistance={(v) => patchTour({ distance: v })}
          onDuration={(v) => patchLocale({ duration: v })}
          onDifficulty={(level) =>
            patchPublicMeta({
              difficulty: { ...(publicMeta.difficulty ?? {}), walking: level },
            })
          }
          onPracticalInfo={patchPracticalInfo}
        />
      ),
    },
    welcome: { title: t('studio.welcomeMessage'), fields: welcomeFields },
  };

  const panel = activePanel ? panelConfig[activePanel] : null;
  const descText = blocksToText(localized.description);

  return (
    <div className="stq-tour-card-canvas">
      <DeviceMockup
        label={t('studio.appPreview')}
        detail={t('studio.tourListPreview')}
      >
        <div className="stq-tour-card-phone-scroll">
          <div className="stq-tour-card-phone-header">
            <span className="stq-tour-card-phone-header-logo" aria-hidden>
              <img src="/stq_logo.svg" alt="" />
            </span>
            <span className="stq-tour-card-phone-header-title">
              SouthTyrolQuests
            </span>
            <span className="stq-tour-card-phone-header-actions">
              <span className="stq-tour-card-phone-header-locale">
                {locale.toUpperCase()}
                <Icon name="chevron-right" size={10} />
              </span>
              <span className="stq-tour-card-phone-header-gear" aria-hidden>
                <Icon name="settings" size={16} />
              </span>
            </span>
          </div>

          <Editable
            label={t('studio.welcomeMessageEdit')}
            onClick={() => openPanel('welcome')}
            active={activePanel === 'welcome'}
          >
            <div className="stq-tour-card-phone-welcome">
              {localized.welcomeMessage || t('studio.welcomeMessagePlaceholder')}
            </div>
          </Editable>

          <div className="stq-tour-card-item">
            <Editable
              label={t('studio.coverImageEdit')}
              onClick={() => openPanel('cover')}
              active={activePanel === 'cover'}
            >
              <div className="stq-tour-card-cover">
                {coverUrl || draft.tour.imagePath ? (
                  <img
                    src={coverUrl ?? draft.tour.imagePath}
                    alt=""
                    className="stq-tour-card-cover-img"
                  />
                ) : (
                  <div className="stq-tour-card-cover-placeholder">
                    <Icon name="image" size={24} />
                    <span>{t('studio.noCoverImage')}</span>
                  </div>
                )}
              </div>
            </Editable>

            <div className="stq-tour-card-body">
              <Editable
                label={t('studio.titleLocationEdit')}
                onClick={() => openPanel('title')}
                active={activePanel === 'title'}
              >
                <div className="stq-tour-card-title">
                  {localized.title || (
                    <span className="stq-tour-card-placeholder">
                      {t('studio.untitledTour')}
                    </span>
                  )}
                </div>
                <div className="stq-tour-card-location">
                  <span className="stq-tour-card-location-pin" aria-hidden>
                    📍
                  </span>
                  <span className="stq-tour-card-location-text">
                    {localized.location || t('studio.noLocation')}
                  </span>
                </div>
              </Editable>

              <Editable
                label={t('studio.descriptionEdit')}
                onClick={() => openPanel('description')}
                active={activePanel === 'description'}
              >
                <div className="stq-tour-card-description">
                  {descText || (
                    <span className="stq-tour-card-placeholder">
                      {t('studio.shortDescriptionPlaceholder')}
                    </span>
                  )}
                </div>
              </Editable>

              <Editable
                label={t('studio.metaEdit')}
                onClick={() => openPanel('meta')}
                active={activePanel === 'meta'}
              >
                <div className="stq-tour-card-chips">
                  {localized.duration && (
                    <span className="stq-tour-card-chip">
                      <Icon name="clock" size={11} />
                      {localized.duration}
                    </span>
                  )}
                  {draft.tour.distance && (
                    <span className="stq-tour-card-chip">
                      <Icon name="route" size={11} />
                      {draft.tour.distance}
                    </span>
                  )}
                  <span className="stq-tour-card-chip">
                    <Icon name="map-pin" size={11} />
                    {draft.stations.length}{' '}
                    {placeCountLabel(draft.stations.length, t)}
                  </span>
                  {publicMeta.difficulty?.walking && (() => {
                    const opt = DIFFICULTY_OPTIONS.find(
                      (o) => o.level === publicMeta.difficulty?.walking,
                    );
                    return opt ? (
                      <span className="stq-tour-card-chip">
                        <span
                          className="stq-tour-card-chip-dot"
                          style={{ background: opt.dot }}
                          aria-hidden
                        />
                        {t(opt.labelKey)}
                      </span>
                    ) : null;
                  })()}
                  {INFO_OPTIONS.filter(
                    (opt) => publicMeta.practicalInfo?.[opt.key] === true,
                  ).map((opt) => (
                    <span
                      key={opt.key}
                      className="stq-tour-card-chip stq-tour-card-chip--icon"
                      title={t(opt.labelKey).replace('\n', ' ')}
                    >
                      <span aria-hidden>{opt.emoji}</span>
                    </span>
                  ))}
                  {!localized.duration && !draft.tour.distance && (
                    <span className="stq-tour-card-placeholder stq-tour-card-chip">
                      {t('studio.addDurationDistance')}
                    </span>
                  )}
                </div>
              </Editable>
            </div>
          </div>

          {otherDrafts?.map((other) => (
            <ReadOnlyTourCard
              key={other.draftId}
              draft={other}
              locale={locale}
              onSelect={
                onSelectDraft ? () => onSelectDraft(other.draftId) : undefined
              }
            />
          ))}

          <button
            type="button"
            className="stq-tour-card-add-btn"
            onClick={() => onCreateTour?.()}
            disabled={!onCreateTour}
          >
            <Icon name="plus" size={16} />
            {t('studio.createNewTour')}
          </button>
        </div>
      </DeviceMockup>

      {panel && (
        <EditPanel
          title={panel.title}
          fields={panel.fields}
          open={activePanel !== null}
          onClose={closePanel}
          onCancel={cancelPanel}
        >
          {panel.body}
        </EditPanel>
      )}
    </div>
  );
}

function CoverImagePanel({
  draftId,
  coverUrl,
  imagePath,
  coverBlobId,
  onBlob,
  onUrl,
}: {
  draftId: string;
  coverUrl: string | undefined;
  imagePath: string;
  coverBlobId: string | undefined;
  onBlob: (blobId: string) => void;
  onUrl: (url: string) => void;
}) {
  const { t } = useEditorLanguage();
  const [tab, setTab] = useState<'photo' | 'upload'>('upload');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const cameraInputRef = useRef<HTMLInputElement | null>(null);

  async function handleFile(file: File | undefined) {
    if (!file) return;
    setBusy(true);
    setError(null);
    try {
      const stored = await storeImageBlob(draftId, file, 'tourCover');
      onBlob(stored.id);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Capture failed');
    } finally {
      setBusy(false);
    }
  }

  const hasImage = Boolean(coverUrl ?? (imagePath && !coverBlobId));
  const statusLabel = coverBlobId
    ? t('studio.imageSelected')
    : imagePath || t('studio.imageSelected');

  return (
    <div className="stq-cover-panel">
      <div className="stq-edit-panel-label">{t('studio.tourImage')}</div>

      <div className="stq-cover-tabs" role="tablist">
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'photo'}
          className={`stq-cover-tab${tab === 'photo' ? ' is-active' : ''}`}
          onClick={() => setTab('photo')}
        >
          <span aria-hidden>📷</span> {t('studio.takePhoto')}
        </button>
        <button
          type="button"
          role="tab"
          aria-selected={tab === 'upload'}
          className={`stq-cover-tab${tab === 'upload' ? ' is-active' : ''}`}
          onClick={() => setTab('upload')}
        >
          <span aria-hidden>⬆️</span> {t('studio.upload')}
        </button>
      </div>

      {hasImage && (
        <div className="stq-cover-status" title={statusLabel}>
          {statusLabel}
        </div>
      )}

      <button
        type="button"
        className="stq-cover-dropzone"
        disabled={busy}
        onClick={() =>
          (tab === 'photo' ? cameraInputRef : fileInputRef).current?.click()
        }
      >
        <span aria-hidden className="stq-cover-dropzone-icon">⬆️</span>
        <span className="stq-cover-dropzone-title">
          {busy ? '…' : t('studio.chooseImage')}
        </span>
        <span className="stq-cover-dropzone-hint">
          {t('studio.imageFormatHint')}
        </span>
      </button>

      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        className="hidden"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          handleFile(file);
        }}
      />
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture="environment"
        className="hidden"
        style={{ display: 'none' }}
        onChange={(e) => {
          const file = e.target.files?.[0];
          e.target.value = '';
          handleFile(file);
        }}
      />

      <input
        type="text"
        className="stq-edit-panel-input"
        value={coverBlobId ? '' : imagePath}
        placeholder={t('studio.imageUrlPlaceholder')}
        onChange={(e) => onUrl(e.target.value)}
      />

      {error && (
        <p style={{ color: '#c84a3a', fontSize: 12, margin: 0 }}>{error}</p>
      )}
    </div>
  );
}

function placeCountLabel(
  count: number,
  t: ReturnType<typeof useEditorLanguage>['t'],
): string {
  return count === 1 ? t('studio.place') : t('studio.places');
}

function Editable({
  children,
  label,
  onClick,
  active,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  active: boolean;
}) {
  return (
    <div
      className={`stq-editable-region${active ? ' stq-editable-region--active' : ''}`}
      role="button"
      tabIndex={0}
      aria-label={label}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {children}
      <span className="stq-editable-pen" aria-hidden>
        <Icon name="pen" size={12} />
      </span>
    </div>
  );
}

function blocksToText(
  blocks: Array<{ type: string; text?: string }>,
): string {
  return blocks
    .map((b) => ('text' in b ? b.text : ''))
    .filter(Boolean)
    .join(' ');
}

const DIFFICULTY_OPTIONS: Array<{
  level: DifficultyLevel;
  labelKey: 'studio.difficultyEasy' | 'studio.difficultyMedium' | 'studio.difficultyHard';
  dot: string;
}> = [
  { level: 'easy', labelKey: 'studio.difficultyEasy', dot: '#4a8a4a' },
  { level: 'medium', labelKey: 'studio.difficultyMedium', dot: '#e6b73a' },
  { level: 'hard', labelKey: 'studio.difficultyHard', dot: '#c84a3a' },
];

const INFO_OPTIONS: Array<{
  key: keyof PracticalInfo;
  labelKey:
    | 'studio.infoWheelchair'
    | 'studio.infoParking'
    | 'studio.infoDogs'
    | 'studio.infoStroller'
    | 'studio.infoToilet'
    | 'studio.infoRefreshments'
    | 'studio.infoDrinkingWater'
    | 'studio.infoShade';
  emoji: string;
}> = [
  { key: 'wheelchairFriendly', labelKey: 'studio.infoWheelchair', emoji: '♿' },
  { key: 'parkingNearby', labelKey: 'studio.infoParking', emoji: '🅿️' },
  { key: 'dogsAllowed', labelKey: 'studio.infoDogs', emoji: '🐕' },
  { key: 'strollerFriendly', labelKey: 'studio.infoStroller', emoji: '👶' },
  { key: 'toiletNearby', labelKey: 'studio.infoToilet', emoji: '🚻' },
  { key: 'refreshmentsNearby', labelKey: 'studio.infoRefreshments', emoji: '☕' },
  { key: 'drinkingWater', labelKey: 'studio.infoDrinkingWater', emoji: '💧' },
  { key: 'shaded', labelKey: 'studio.infoShade', emoji: '🌳' },
];

function StatsPanel({
  distance,
  duration,
  difficulty,
  practicalInfo,
  onDistance,
  onDuration,
  onDifficulty,
  onPracticalInfo,
}: {
  distance: string;
  duration: string;
  difficulty: DifficultyLevel | undefined;
  practicalInfo: PracticalInfo | undefined;
  onDistance: (v: string) => void;
  onDuration: (v: string) => void;
  onDifficulty: (level: DifficultyLevel) => void;
  onPracticalInfo: (patch: Partial<PracticalInfo>) => void;
}) {
  const { t } = useEditorLanguage();
  const info = practicalInfo ?? {};

  return (
    <div className="stq-stats-panel">
      <div className="stq-edit-panel-field">
        <label className="stq-edit-panel-label" htmlFor="ep-distance">
          {t('studio.distance')}
        </label>
        <input
          id="ep-distance"
          type="text"
          className="stq-edit-panel-input"
          value={distance}
          placeholder={t('studio.distancePlaceholder')}
          onChange={(e) => onDistance(e.target.value)}
        />
      </div>

      <div className="stq-edit-panel-field">
        <label className="stq-edit-panel-label" htmlFor="ep-duration">
          {t('studio.duration')}
        </label>
        <input
          id="ep-duration"
          type="text"
          className="stq-edit-panel-input"
          value={duration}
          placeholder={t('studio.durationPlaceholder')}
          onChange={(e) => onDuration(e.target.value)}
        />
      </div>

      <div className="stq-edit-panel-field">
        <div className="stq-edit-panel-label">{t('studio.difficulty')}</div>
        <div className="stq-stats-difficulty">
          {DIFFICULTY_OPTIONS.map((opt) => (
            <button
              key={opt.level}
              type="button"
              className={`stq-stats-difficulty-btn${difficulty === opt.level ? ' is-active' : ''}`}
              onClick={() => onDifficulty(opt.level)}
              aria-pressed={difficulty === opt.level}
            >
              <span
                className="stq-stats-difficulty-dot"
                style={{ background: opt.dot }}
                aria-hidden
              />
              <span>{t(opt.labelKey)}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="stq-edit-panel-field">
        <div className="stq-edit-panel-label">{t('studio.infos')}</div>
        <div className="stq-stats-info-grid">
          {INFO_OPTIONS.map((opt) => {
            const active = info[opt.key] === true;
            return (
              <button
                key={opt.key}
                type="button"
                className={`stq-stats-info-btn${active ? ' is-active' : ''}`}
                onClick={() =>
                  onPracticalInfo({ [opt.key]: active ? undefined : true } as Partial<PracticalInfo>)
                }
                aria-pressed={active}
              >
                <span className="stq-stats-info-emoji" aria-hidden>
                  {opt.emoji}
                </span>
                <span className="stq-stats-info-label">{t(opt.labelKey)}</span>
              </button>
            );
          })}
          <button type="button" className="stq-stats-info-btn stq-stats-info-btn--add" disabled>
            <span className="stq-stats-info-emoji" aria-hidden>＋</span>
            <span className="stq-stats-info-label">{t('studio.infoNew')}</span>
          </button>
        </div>
      </div>
    </div>
  );
}

function ReadOnlyTourCard({
  draft,
  locale,
  onSelect,
}: {
  draft: TourDraft;
  locale: Locale;
  onSelect?: () => void;
}) {
  const { t } = useEditorLanguage();
  const localized = draft.tour[locale];
  const coverUrl = useBlobUrl(draft.tour.coverBlobId);
  const descText = blocksToText(localized.description);
  const meta = draft.tour.publicMeta ?? {};
  const difficultyOpt = meta.difficulty?.walking
    ? DIFFICULTY_OPTIONS.find((o) => o.level === meta.difficulty?.walking)
    : null;

  const className = `stq-tour-card-item${onSelect ? ' stq-tour-card-item--selectable' : ''}`;

  return (
    <div
      className={className}
      role={onSelect ? 'button' : undefined}
      tabIndex={onSelect ? 0 : undefined}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (!onSelect) return;
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      aria-label={
        onSelect
          ? `${t('studio.edit')}: ${localized.title || t('studio.untitledTour')}`
          : undefined
      }>
      <div className="stq-tour-card-cover">
        {coverUrl || draft.tour.imagePath ? (
          <img
            src={coverUrl ?? draft.tour.imagePath}
            alt=""
            className="stq-tour-card-cover-img"
          />
        ) : (
          <div className="stq-tour-card-cover-placeholder">
            <Icon name="image" size={24} />
            <span>{t('studio.noCoverImage')}</span>
          </div>
        )}
      </div>

      <div className="stq-tour-card-body">
        <div className="stq-tour-card-title">
          {localized.title || (
            <span className="stq-tour-card-placeholder">
              {t('studio.untitledTour')}
            </span>
          )}
        </div>
        <div className="stq-tour-card-location">
          <span className="stq-tour-card-location-pin" aria-hidden>📍</span>
          <span className="stq-tour-card-location-text">
            {localized.location || t('studio.noLocation')}
          </span>
        </div>

        {descText && (
          <div className="stq-tour-card-description">{descText}</div>
        )}

        <div className="stq-tour-card-chips">
          {localized.duration && (
            <span className="stq-tour-card-chip">
              <Icon name="clock" size={11} />
              {localized.duration}
            </span>
          )}
          {draft.tour.distance && (
            <span className="stq-tour-card-chip">
              <Icon name="route" size={11} />
              {draft.tour.distance}
            </span>
          )}
          <span className="stq-tour-card-chip">
            <Icon name="map-pin" size={11} />
            {draft.stations.length}{' '}
            {placeCountLabel(draft.stations.length, t)}
          </span>
          {difficultyOpt && (
            <span className="stq-tour-card-chip">
              <span
                className="stq-tour-card-chip-dot"
                style={{ background: difficultyOpt.dot }}
                aria-hidden
              />
              {t(difficultyOpt.labelKey)}
            </span>
          )}
          {INFO_OPTIONS.filter(
            (opt) => meta.practicalInfo?.[opt.key] === true,
          ).map((opt) => (
            <span
              key={opt.key}
              className="stq-tour-card-chip stq-tour-card-chip--icon"
              title={t(opt.labelKey).replace('\n', ' ')}
            >
              <span aria-hidden>{opt.emoji}</span>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
