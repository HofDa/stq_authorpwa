import { useEffect, useMemo, useState, type ReactNode } from 'react';
import type { ContentBlock, Locale, TourDraft } from '@/schema';
import { useBlobUrl } from '@/hooks/useBlobUrl';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import { ContentSectionRenderer } from '@/renderer/ContentSectionRenderer';
import { getTourTitleLabel } from '@/utils/localizedContent';
import { EditPanel, type EditPanelField } from '../EditPanel';
import { Icon } from '../Icon';
import {
  RightEditDrawer,
  type RightEditDrawerState,
} from '../mobile/RightEditDrawer';
import { EditableTextEntryList } from './EditableTextEntryList';
import { TextBodyPanel } from './TextBodyPanel';

interface Props {
  draft: TourDraft;
  locale: Locale;
  onChange: (patch: Partial<TourDraft> | ((prev: TourDraft) => TourDraft)) => void;
  mode?: 'intro' | 'outro';
  onBack?: () => void;
  onStartTour?: () => void;
  onSelectTourOverview?: () => void;
  editable?: boolean;
  mobileSelectionFlow?: boolean;
}

type ActivePanel = 'cover' | 'title' | 'copy' | 'lines' | 'hints' | null;

export function IntroPhonePreview({
  draft,
  locale,
  onChange,
  mode = 'intro',
  onBack,
  onStartTour,
  onSelectTourOverview,
  editable = true,
  mobileSelectionFlow = false,
}: Props) {
  const { t } = useEditorLanguage();
  const [activePanel, setActivePanel] = useState<ActivePanel>(null);
  const [selectedPanel, setSelectedPanel] = useState<ActivePanel>(null);
  const [rightDrawerState, setRightDrawerState] =
    useState<RightEditDrawerState>('closed');
  const coverUrl = useBlobUrl(draft.tour.coverBlobId);
  const firstStation =
    draft.stations.slice().sort((a, b) => a.number - b.number)[0] ?? null;
  const localized = draft.tour[locale];
  const title = getTourTitleLabel(draft.tour, locale, t('studio.untitledTour'));
  const blocks =
    mode === 'outro'
      ? draft.tour[locale].outroSection
      : draft.tour[locale].introSection;
  const paragraphBlocks = blocks.filter((block) => block.type !== 'line');
  const firstParagraphBlock = paragraphBlocks.slice(0, 1);
  const remainingParagraphBlocks = paragraphBlocks.slice(1);
  const lineBlocks = blocks.filter((block) => block.type === 'line');
  const publicMeta = draft.tour.publicMeta ?? {};
  const themeDescription = publicMeta.shortDescription?.[locale] ?? '';
  const hintHeading = localized.welcomeMessage ?? t('studio.preStartHintsDefaultTitle');
  const preStartHints = textToList(publicMeta.longDescription?.[locale] ?? '');
  const copyField = mode === 'outro' ? 'outroSection' : 'introSection';

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

  function patchPublicMeta(patch: NonNullable<TourDraft['tour']['publicMeta']>) {
    onChange((prev) => ({
      ...prev,
      tour: {
        ...prev.tour,
        publicMeta: { ...(prev.tour.publicMeta ?? {}), ...patch },
      },
    }));
  }

  const coverFields: EditPanelField[] = [
    {
      id: 'intro-imagePath',
      label: t('studio.imagePath'),
      type: 'text',
      value: draft.tour.imagePath,
      placeholder: 'images/cover.webp',
      onChange: (v) => patchTour({ imagePath: v }),
    },
  ];

  const titleFields: EditPanelField[] = [
    {
      id: 'intro-title',
      label: t('studio.title'),
      type: 'text',
      value: localized.title,
      placeholder: t('studio.untitledTour'),
      onChange: (v) => patchLocale({ title: v }),
    },
  ];

  function setCopyBlocks(nextBlocks: ContentBlock[]) {
    patchLocale({ [copyField]: [...nextBlocks, ...lineBlocks] });
  }

  function setLineBlocks(nextLineBlocks: ContentBlock[]) {
    patchLocale({ [copyField]: [...paragraphBlocks, ...nextLineBlocks] });
  }

  function setTheme(themeId: string) {
    patchPublicMeta({ themes: publicMeta.themes?.[0] === themeId ? [] : [themeId] });
  }

  function setThemeDescription(value: string) {
    patchPublicMeta({
      shortDescription: {
        ...(publicMeta.shortDescription ?? {}),
        [locale]: value,
      },
    });
  }

  function setHintHeading(value: string) {
    patchLocale({ welcomeMessage: value });
  }

  function setPreStartHints(values: string[]) {
    patchPublicMeta({
      longDescription: {
        ...(publicMeta.longDescription ?? {}),
        [locale]: listToText(values),
      },
    });
  }

  const panelConfig: Record<
    Exclude<ActivePanel, null>,
    { title: string; fields: EditPanelField[] }
  > = {
    cover: { title: t('studio.coverImage'), fields: coverFields },
    title: { title: t('studio.title'), fields: titleFields },
    copy: {
      title: mode === 'outro' ? t('studio.outroText') : t('studio.introText'),
      fields: [],
    },
    lines: {
      title: t('studio.keyDataLines'),
      fields: [],
    },
    hints: {
      title: t('studio.preStartHints'),
      fields: [],
    },
  };
  const panel = activePanel ? panelConfig[activePanel] : null;

  function selectPanel(panelKey: Exclude<ActivePanel, null>) {
    setSelectedPanel(panelKey);
    setActivePanel(null);
    setRightDrawerState('closed');
  }

  function openPanel(panelKey: Exclude<ActivePanel, null>) {
    setSelectedPanel(panelKey);
    setActivePanel(panelKey);
    if (mobileSelectionFlow) setRightDrawerState('open');
  }

  function activateEditable(panelKey: Exclude<ActivePanel, null>) {
    if (!editable) return;

    if (mobileSelectionFlow && selectedPanel !== panelKey) {
      selectPanel(panelKey);
      return;
    }

    openPanel(panelKey);
  }

  function closePanel() {
    setActivePanel(null);
    setRightDrawerState('closed');
  }

  function renderPanelBody() {
    return (
      <>
        {activePanel === 'copy' && (
          <TextBodyPanel
            blocks={blocks}
            onChange={setCopyBlocks}
            placeholder={t('studio.introMissing')}
          />
        )}
        {activePanel === 'lines' && (
          <LinesPanel
            blocks={lineBlocks}
            selectedTheme={publicMeta.themes?.[0]}
            themeDescription={themeDescription}
            onChange={setLineBlocks}
            onTheme={setTheme}
            onThemeDescription={setThemeDescription}
          />
        )}
        {activePanel === 'hints' && (
          <PreStartHintsPanel
            heading={hintHeading}
            hints={preStartHints}
            onHeading={setHintHeading}
            onHints={setPreStartHints}
          />
        )}
      </>
    );
  }

  useEffect(() => {
    if (!editable) {
      setActivePanel(null);
      setSelectedPanel(null);
      setRightDrawerState('closed');
    }
  }, [editable]);

  return (
    <article className="stq-intro-phone">
      <header className="stq-intro-phone__header">
        <button type="button" aria-label={t('studio.back')} onClick={onBack}>
          <Icon name="chevron-left" size={16} />
        </button>
        <span>{mode === 'outro' ? t('studio.outro') : t('studio.introPage')}</span>
        <button type="button" aria-label={t('studio.language')}>
          {locale.toUpperCase()}
        </button>
      </header>

      <main className="stq-intro-phone__body">
        {mode === 'intro' && (
          <Editable
            label={t('studio.coverImageEdit')}
            onClick={() => activateEditable('cover')}
            active={activePanel === 'cover'}
            selected={mobileSelectionFlow && selectedPanel === 'cover'}
            editable={editable}
          >
            <div className="stq-intro-phone__hero">
              {coverUrl || draft.tour.imagePath ? (
                <img src={coverUrl ?? draft.tour.imagePath} alt="" />
              ) : (
                <div className="stq-intro-phone__hero-placeholder">
                  <Icon name="image" size={28} />
                  <span>{t('studio.noCoverImage')}</span>
                </div>
              )}
            </div>
          </Editable>
        )}

        <section className="stq-intro-phone__content">
          <Editable
            label={t('studio.title')}
            onClick={() => activateEditable('title')}
            active={activePanel === 'title'}
            selected={mobileSelectionFlow && selectedPanel === 'title'}
            editable={editable}
          >
            <h1>{title}</h1>
          </Editable>

          <Editable
            label={t('studio.descriptionEdit')}
            onClick={() => activateEditable('copy')}
            active={activePanel === 'copy'}
            selected={mobileSelectionFlow && selectedPanel === 'copy'}
            editable={editable}
          >
            <div className="stq-intro-phone__copy">
              {firstParagraphBlock.length > 0 ? (
                <ContentSectionRenderer blocks={firstParagraphBlock} />
              ) : (
                <p>{t('studio.introMissing')}</p>
              )}
            </div>
          </Editable>

          {mode === 'intro' && (
            <Editable
              label={t('studio.keyDataLines')}
              onClick={() => activateEditable('lines')}
              active={activePanel === 'lines'}
              selected={mobileSelectionFlow && selectedPanel === 'lines'}
              editable={editable}
            >
              <div className="stq-intro-phone__lines">
                {lineBlocks.length > 0 || themeDescription ? (
                  <>
                    <ContentSectionRenderer blocks={lineBlocks} />
                    {themeDescription && <p>{themeDescription}</p>}
                  </>
                ) : (
                  <p>{t('studio.linesMissing')}</p>
                )}
              </div>
            </Editable>
          )}

          {remainingParagraphBlocks.length > 0 && (
            <Editable
              label={t('studio.descriptionEdit')}
              onClick={() => activateEditable('copy')}
              active={activePanel === 'copy'}
              selected={mobileSelectionFlow && selectedPanel === 'copy'}
              editable={editable}
            >
              <div className="stq-intro-phone__copy stq-intro-phone__copy--after-lines">
                <ContentSectionRenderer blocks={remainingParagraphBlocks} />
              </div>
            </Editable>
          )}

          {mode === 'intro' && (
            <Editable
              label={t('studio.preStartHints')}
              onClick={() => activateEditable('hints')}
              active={activePanel === 'hints'}
              selected={mobileSelectionFlow && selectedPanel === 'hints'}
              editable={editable}
            >
              <div className="stq-intro-phone__prestart">
                <h2>{hintHeading}</h2>
                <ul>
                  {(preStartHints.length > 0
                    ? preStartHints
                    : [
                        t('studio.preStartHintSafety'),
                        t('studio.preStartHintNature'),
                        t('studio.preStartHintDaylight'),
                      ]
                  ).map((hint, index) => (
                    <li key={`${hint}-${index}`}>{hint}</li>
                  ))}
                </ul>
                <p>
                  → {t('studio.privacyPolicy')}
                </p>
                <label>
                  <span aria-hidden>✓</span>
                  {t('studio.acceptTerms')}
                </label>
              </div>
            </Editable>
          )}

          <button
            type="button"
            className="stq-intro-phone__start"
            disabled={mode === 'intro' && !firstStation}
            onClick={() => {
              if (mode === 'outro') {
                onSelectTourOverview?.();
                return;
              }
              onStartTour?.();
            }}
          >
            {mode === 'outro'
              ? t('studio.otherToursCta')
              : firstStation
                ? t('studio.startTour')
                : t('studio.noStations')}
          </button>
          {mode === 'intro' && (
            <button type="button" className="stq-intro-phone__reset" disabled>
              {t('studio.resetTour')}
            </button>
          )}
        </section>
      </main>
      {panel && mobileSelectionFlow && (
        <RightEditDrawer
          title={panel.title}
          fields={panel.fields}
          state={rightDrawerState}
          onStateChange={setRightDrawerState}
          onClose={closePanel}
        >
          {renderPanelBody()}
        </RightEditDrawer>
      )}

      {panel && !mobileSelectionFlow && (
        <EditPanel
          title={panel.title}
          fields={panel.fields}
          open={activePanel !== null}
          onClose={closePanel}
        >
          {renderPanelBody()}
        </EditPanel>
      )}
    </article>
  );
}

function PreStartHintsPanel({
  heading,
  hints,
  onHeading,
  onHints,
}: {
  heading: string;
  hints: string[];
  onHeading: (value: string) => void;
  onHints: (values: string[]) => void;
}) {
  const { t } = useEditorLanguage();

  return (
    <div className="stq-prestart-panel">
      <div className="stq-edit-panel-field">
        <label className="stq-edit-panel-label" htmlFor="prestart-heading">
          {t('studio.heading')}
        </label>
        <input
          id="prestart-heading"
          className="stq-lines-input"
          value={heading}
          onChange={(e) => onHeading(e.target.value)}
        />
      </div>

      <EditableTextEntryList
        sourceEntries={hints}
        onCommit={onHints}
        heading={t('studio.hints')}
        placeholder={t('studio.preStartHintPlaceholder')}
        rows={2}
      />
    </div>
  );
}

function LinesPanel({
  blocks,
  selectedTheme,
  themeDescription,
  onChange,
  onTheme,
  onThemeDescription,
}: {
  blocks: ContentBlock[];
  selectedTheme: string | undefined;
  themeDescription: string;
  onChange: (blocks: ContentBlock[]) => void;
  onTheme: (themeId: string) => void;
  onThemeDescription: (value: string) => void;
}) {
  const { t } = useEditorLanguage();
  const sourceEntries = useMemo(() => blocksToLineEntries(blocks), [blocks]);

  return (
    <div className="stq-lines-panel">
      <EditableTextEntryList
        sourceEntries={sourceEntries}
        onCommit={(entries) =>
          onChange(entries.map((text) => ({ type: 'line', text })))
        }
        heading={t('studio.lines')}
        placeholder={t('studio.linePlaceholder')}
        inputMode="input"
        rowClassName="stq-textbody-row--line"
      />

      <div className="stq-lines-section">
        <div className="stq-textbody-panel-heading">{t('studio.theme')}</div>
        <div className="stq-lines-theme-grid">
          {THEME_OPTIONS.map((option) => (
            <button
              key={option.id}
              type="button"
              className={`stq-lines-theme${selectedTheme === option.id ? ' is-active' : ''}`}
              aria-pressed={selectedTheme === option.id}
              onClick={() => onTheme(option.id)}
            >
              <span aria-hidden>{option.emoji}</span>
              <strong>{option.label}</strong>
            </button>
          ))}
          <button type="button" className="stq-lines-theme stq-lines-theme--new" disabled>
            <span aria-hidden>＋</span>
            <strong>{t('studio.infoNew')}</strong>
          </button>
        </div>
      </div>

      <div className="stq-lines-section">
        <label className="stq-textbody-panel-heading" htmlFor="intro-theme-description">
          {t('studio.themeDescription')}
        </label>
        <input
          id="intro-theme-description"
          className="stq-lines-input"
          value={themeDescription}
          placeholder={t('studio.themeDescriptionPlaceholder')}
          onChange={(e) => onThemeDescription(e.target.value)}
        />
      </div>
    </div>
  );
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

function blocksToLineEntries(blocks: ContentBlock[]): string[] {
  return blocks
    .filter((block) => block.type === 'line')
    .map((block) => block.text)
    .filter(Boolean)
    .map((text) => text.trim());
}

function textToList(text: string): string[] {
  return text
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean);
}

function listToText(values: string[]): string {
  return values.map((value) => value.trim()).filter(Boolean).join('\n');
}

const THEME_OPTIONS = [
  { id: 'nature', label: 'Natur', emoji: '🌿' },
  { id: 'history', label: 'Historisch', emoji: '🏛️' },
  { id: 'fairy_tale', label: 'Märchen', emoji: '🧚' },
  { id: 'sci_fi', label: 'Sci-Fi', emoji: '🛸' },
  { id: 'action', label: 'Action', emoji: '⚡' },
  { id: 'crime', label: 'Krimi', emoji: '🕵️' },
  { id: 'culinary', label: 'Kulinarik', emoji: '🍰' },
] as const;
