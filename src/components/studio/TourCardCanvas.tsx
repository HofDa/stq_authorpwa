import { useEffect, useState, type ReactNode } from 'react';
import type {
  DifficultyLevel,
  Locale,
  PracticalInfo,
  TourDraft,
  TourPublicMeta,
} from '@/schema';
import { useBlobUrl } from '@/hooks/useBlobUrl';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import { Icon } from './Icon';
import { DeviceMockup } from './DeviceMockup';
import { EditPanel, type EditPanelField } from './EditPanel';
import { ImageAssetPanel } from './ImageAssetPanel';
import {
  RightEditDrawer,
  type RightEditDrawerState,
} from './mobile/RightEditDrawer';

interface Props {
  draft: TourDraft;
  locale: Locale;
  onChange: (
    patch: Partial<TourDraft> | ((prev: TourDraft) => TourDraft),
  ) => void | Promise<void>;
  onCreateTour?: () => void | Promise<void>;
  onDuplicateTour?: () => void | Promise<void>;
  onDeleteTour?: () => void | Promise<void>;
  otherDrafts?: TourDraft[];
  onSelectDraft?: (draftId: string) => void;
  onOpenCurrentTour?: () => void;
  editable?: boolean;
  mobileSelectionFlow?: boolean;
  /** Optional control rendered as a floating chip outside the phone frame. */
  floatingEditToggle?: ReactNode;
}

type ActivePanel = 'cover' | 'title' | 'description' | 'meta' | 'welcome' | null;

export function TourCardCanvas({
  draft,
  locale,
  onChange,
  onCreateTour,
  onDuplicateTour,
  onDeleteTour,
  otherDrafts,
  onSelectDraft,
  onOpenCurrentTour,
  editable = true,
  mobileSelectionFlow = false,
  floatingEditToggle,
}: Props) {
  const { t } = useEditorLanguage();
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [selectedPanel, setSelectedPanel] = useState<ActivePanel>(null);
  const [rightDrawerState, setRightDrawerState] =
    useState<RightEditDrawerState>('closed');
  const [snapshot, setSnapshot] = useState<TourDraft['tour'] | null>(null);
  const coverUrl = useBlobUrl(draft.tour.coverBlobId);
  const localized = draft.tour[locale];

  function openPanel(panel: Exclude<ActivePanel, null>) {
    setSnapshot(draft.tour);
    setSelectedPanel(panel);
    setActivePanel(panel);
    if (mobileSelectionFlow) setRightDrawerState('open');
  }

  function closePanel() {
    setSnapshot(null);
    setActivePanel(null);
    setRightDrawerState('closed');
  }

  function cancelPanel() {
    if (snapshot) {
      const original = snapshot;
      onChange((prev) => ({ ...prev, tour: original }));
    }
  }

  function selectPanel(panel: Exclude<ActivePanel, null>) {
    setSelectedPanel(panel);
    setActivePanel(null);
    setRightDrawerState('closed');
  }

  function activateEditable(panel: Exclude<ActivePanel, null>) {
    if (!editable) return;

    if (mobileSelectionFlow && selectedPanel !== panel) {
      selectPanel(panel);
      return;
    }

    openPanel(panel);
  }

  useEffect(() => {
    if (!editable) {
      setActivePanel(null);
      setSelectedPanel(null);
      setRightDrawerState('closed');
    }
  }, [editable]);

  function patchLocale(patch: Partial<typeof localized>) {
    return onChange((prev) => ({
      ...prev,
      tour: {
        ...prev.tour,
        [locale]: { ...prev.tour[locale], ...patch },
      },
    }));
  }

  function patchTour(patch: Partial<TourDraft['tour']>) {
    return onChange((prev) => ({ ...prev, tour: { ...prev.tour, ...patch } }));
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
    return onChange((prev) => ({
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
        <ImageAssetPanel
          draftId={draft.draftId}
          label={t('studio.tourImage')}
          imageUrl={coverUrl}
          imagePath={draft.tour.imagePath}
          imageBlobId={draft.tour.coverBlobId}
          preset="tourCover"
          onBlobStored={(blobId) =>
            patchTour({ coverBlobId: blobId, imagePath: `images/${blobId}.webp` })
          }
          onPathChange={(url) => patchTour({ imagePath: url, coverBlobId: undefined })}
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
            onClick={() => activateEditable('welcome')}
            active={activePanel === 'welcome'}
            selected={mobileSelectionFlow && selectedPanel === 'welcome'}
            editable={editable}
          >
            <div className="stq-tour-card-phone-welcome">
              {localized.welcomeMessage || t('studio.welcomeMessagePlaceholder')}
            </div>
          </Editable>

          <div
            className={`stq-tour-card-item${
              !editable && onOpenCurrentTour ? ' stq-tour-card-item--selectable' : ''
            }`}
            role={!editable && onOpenCurrentTour ? 'button' : undefined}
            tabIndex={!editable && onOpenCurrentTour ? 0 : undefined}
            onClick={!editable ? onOpenCurrentTour : undefined}
            onKeyDown={(event) => {
              if (editable || !onOpenCurrentTour) return;
              if (event.key === 'Enter' || event.key === ' ') {
                event.preventDefault();
                onOpenCurrentTour();
              }
            }}
          >
            <div className="stq-tour-card-cover-frame">
              <div
                className={`stq-tour-card-cover${
                  editable ? ' stq-editable-image-frame' : ''
                }${
                  editable && activePanel === 'cover'
                    ? ' stq-tour-card-cover--active'
                    : ''
                }${
                  editable && mobileSelectionFlow && selectedPanel === 'cover'
                    ? ' stq-tour-card-cover--selected'
                    : ''
                }`}
              >
                <TourCoverContent
                  imageUrl={coverUrl ?? draft.tour.imagePath}
                  emptyLabel={t('studio.noCoverImage')}
                />
                {editable && (
                  <button
                    type="button"
                    className="stq-image-edit-fab"
                    onClick={() => activateEditable('cover')}
                    aria-label={t('studio.coverImageEdit')}
                    aria-pressed={
                      activePanel === 'cover' ||
                      (mobileSelectionFlow && selectedPanel === 'cover') ||
                      undefined
                    }
                  >
                    <Icon name="camera" size={20} />
                  </button>
                )}
              </div>
              {editable && (onDuplicateTour || onDeleteTour) && (
                <div className="stq-tour-card-cover-actions">
                  {onDuplicateTour && (
                    <button
                      type="button"
                      className="stq-tour-card-cover-action"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDuplicateTour();
                      }}
                      aria-label={t('studio.copyTour')}
                      title={t('studio.copyTour')}
                    >
                      <Icon name="copy" size={16} />
                    </button>
                  )}
                  {onDeleteTour && (
                    <button
                      type="button"
                      className="stq-tour-card-cover-action stq-tour-card-cover-action--danger"
                      onClick={(event) => {
                        event.stopPropagation();
                        onDeleteTour();
                      }}
                      aria-label={t('studio.deleteTour')}
                      title={t('studio.deleteTour')}
                    >
                      <Icon name="trash" size={16} />
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="stq-tour-card-body">
              <Editable
                label={t('studio.titleLocationEdit')}
                onClick={() => activateEditable('title')}
                active={activePanel === 'title'}
                selected={mobileSelectionFlow && selectedPanel === 'title'}
                editable={editable}
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
                onClick={() => activateEditable('description')}
                active={activePanel === 'description'}
                selected={mobileSelectionFlow && selectedPanel === 'description'}
                editable={editable}
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
                onClick={() => activateEditable('meta')}
                active={activePanel === 'meta'}
                selected={mobileSelectionFlow && selectedPanel === 'meta'}
                editable={editable}
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

      {floatingEditToggle && (
        <div className="stq-mobile-studio__floating-edit-chip">
          {floatingEditToggle}
        </div>
      )}

      {panel && mobileSelectionFlow && (
        <RightEditDrawer
          title={panel.title}
          fields={panel.fields}
          state={rightDrawerState}
          onStateChange={setRightDrawerState}
          onClose={closePanel}
          onCancel={cancelPanel}
        >
          {panel.body}
        </RightEditDrawer>
      )}

      {panel && !mobileSelectionFlow && (
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
  selected = false,
  editable = true,
}: {
  children: ReactNode;
  label: string;
  onClick: () => void;
  active: boolean;
  selected?: boolean;
  editable?: boolean;
}) {
  if (!editable) return <>{children}</>;

  return (
    <div
      className={`stq-editable-region${active ? ' stq-editable-region--active' : ''}${
        selected ? ' stq-editable-region--selected' : ''
      }`}
      role="button"
      tabIndex={0}
      aria-label={label}
      aria-pressed={active || selected || undefined}
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

function TourCoverContent({
  imageUrl,
  emptyLabel,
}: {
  imageUrl: string | undefined;
  emptyLabel: string;
}) {
  if (imageUrl) {
    return <img src={imageUrl} alt="" className="stq-tour-card-cover-img" />;
  }

  return (
    <div className="stq-tour-card-cover-placeholder">
      <span>{emptyLabel}</span>
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
  { level: 'easy', labelKey: 'studio.difficultyEasy', dot: 'var(--stq-color-success)' },
  { level: 'medium', labelKey: 'studio.difficultyMedium', dot: 'var(--stq-color-warning)' },
  { level: 'hard', labelKey: 'studio.difficultyHard', dot: 'var(--stq-color-danger)' },
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
