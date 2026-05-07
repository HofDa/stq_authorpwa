import type { ReactNode } from 'react';
import {
  createEmptyRrrInteraction,
  formatAcceptedAnswersInput,
  parseAcceptedAnswersInput,
  withRiddleType,
  type Locale,
  type RiddleEntry,
} from '@/schema';
import { RrrInteractionEditor } from '@/components/rrr-author/RrrInteractionEditor';
import type { ContentBlock } from '@/schema/contentBlock';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import {
  applyStationVisualSelection,
  normalizeStationVisualChoice,
  STATION_ICON_OPTIONS,
} from '@/stations/visuals';
import { StationIconPreview } from '@/components/stations/StationVisualPreview';
import { ImageAssetPanel } from '../ImageAssetPanel';
import { Icon } from '../Icon';
import type { EditPanelField } from '../EditPanel';
import { TextBodyPanel } from './TextBodyPanel';

export type StationEditPanelKey =
  | 'hero'
  | 'title'
  | 'story'
  | 'history'
  | 'riddle'
  | 'riddleSettings'
  | 'answers';

interface GetStationEditPanelArgs {
  panel: StationEditPanelKey;
  station: RiddleEntry;
  locale: Locale;
  t: ReturnType<typeof useEditorLanguage>['t'];
  draftId: string;
  imageUrl: string | undefined;
  onPatchLocale: (patch: Partial<RiddleEntry[Locale]>) => void;
  onPatchStation: (patch: Partial<RiddleEntry>) => void;
}

export function getStationEditPanel({
  panel,
  station,
  locale,
  t,
  draftId,
  imageUrl,
  onPatchLocale,
  onPatchStation,
}: GetStationEditPanelArgs): {
  title: string;
  fields: EditPanelField[];
  body?: ReactNode;
} {
  const localized = station[locale];
  const hints = [...localized.hints, '', '', ''].slice(0, 3);

  const panels: Record<
    StationEditPanelKey,
    { title: string; fields: EditPanelField[]; body?: ReactNode }
  > = {
    hero: {
      title: 'Stations-Bild & Icon',
      fields: [],
      body: renderStationImageIconPanelBody({
        draftId,
        station,
        imageUrl,
        t,
        onPatchStation,
      }),
    },
    title: {
      title: t('studio.stationTitle'),
      fields: [
        {
          id: 'station-name',
          label: t('studio.stationName'),
          type: 'text',
          value: localized.location,
          placeholder: `${t('studio.station')} ${station.number}`,
          onChange: (value) => onPatchLocale({ location: value }),
        },
        {
          id: 'station-story-heading',
          label: t('studio.storyHeading'),
          type: 'text',
          value: getFirstHeadingText(localized.firstSection),
          placeholder: t('studio.storyHeadingPlaceholder'),
          onChange: (value) =>
            onPatchLocale({
              firstSection: setFirstHeadingText(localized.firstSection, value),
            }),
        },
        {
          id: 'station-icon-label',
          label: t('studio.iconLabel'),
          type: 'text',
          value: station.iconPath,
          placeholder: 'icons/...',
          onChange: (value) => onPatchStation({ iconPath: value }),
        },
      ],
    },
    story: {
      title: t('studio.storyParagraphsTitle'),
      fields: [],
      body: (
        <TextBodyPanel
          blocks={localized.firstSection.filter(
            (block) => block.type !== 'heading',
          )}
          onChange={(nextParagraphs) => {
            const headingBlocks = localized.firstSection.filter(
              (block) => block.type === 'heading',
            );
            onPatchLocale({
              firstSection: [...headingBlocks, ...nextParagraphs],
            });
          }}
          placeholder={t('studio.paragraphPlaceholder')}
        />
      ),
    },
    history: {
      title: t('studio.historySectionTitle'),
      fields: [
        {
          id: 'station-history-heading',
          label: t('studio.heading'),
          type: 'text',
          value: getFirstHeadingText(localized.historySection),
          placeholder: t('studio.historicalContextPlaceholder'),
          onChange: (value) =>
            onPatchLocale({
              historySection: setFirstHeadingText(
                localized.historySection,
                value,
              ),
            }),
        },
      ],
      body: (
        <TextBodyPanel
          blocks={localized.historySection.filter(
            (block) => block.type !== 'heading',
          )}
          onChange={(nextParagraphs) => {
            const headingBlocks = localized.historySection.filter(
              (block) => block.type === 'heading',
            );
            onPatchLocale({
              historySection: [...headingBlocks, ...nextParagraphs],
            });
          }}
          placeholder={t('studio.paragraphPlaceholder')}
        />
      ),
    },
    riddle: {
      title: t('studio.riddle'),
      fields: [
        {
          id: 'station-riddle-heading',
          label: t('studio.heading'),
          type: 'text',
          value: getFirstHeadingText(localized.riddleSection),
          placeholder: t('studio.riddlePlaceholder'),
          onChange: (value) =>
            onPatchLocale({
              riddleSection: setFirstHeadingText(
                localized.riddleSection,
                value,
              ),
            }),
        },
      ],
      body: (
        <TextBodyPanel
          blocks={localized.riddleSection.filter(
            (block) => block.type !== 'heading',
          )}
          onChange={(nextParagraphs) => {
            const headingBlocks = localized.riddleSection.filter(
              (block) => block.type === 'heading',
            );
            onPatchLocale({
              riddleSection: [...headingBlocks, ...nextParagraphs],
            });
          }}
          placeholder={t('studio.riddlePlaceholder')}
          blockType="line"
        />
      ),
    },
    riddleSettings: {
      title: t('studio.riddleSettings'),
      fields: [],
      body: renderRiddleSettingsPanelBody({
        station,
        onPatchStation,
      }),
    },
    answers: {
      title: 'Answer and hints',
      fields: [
        {
          id: 'station-answer',
          label: t('studio.acceptedAnswers'),
          type: 'text',
          value: formatAcceptedAnswersInput(station.acceptedAnswers[locale]),
          placeholder: t('studio.acceptedAnswersPlaceholder'),
          onChange: (value) =>
            onPatchStation({
              acceptedAnswers: {
                ...station.acceptedAnswers,
                [locale]: parseAcceptedAnswersInput(value),
              },
            }),
        },
        {
          id: 'station-hint-1',
          label: t('studio.hint1'),
          type: 'text',
          value: hints[0],
          placeholder: t('studio.hint1Placeholder'),
          onChange: (value) => onPatchLocale({ hints: replaceHint(hints, 0, value) }),
        },
        {
          id: 'station-hint-2',
          label: t('studio.hint2'),
          type: 'text',
          value: hints[1],
          placeholder: t('studio.hint2Placeholder'),
          onChange: (value) => onPatchLocale({ hints: replaceHint(hints, 1, value) }),
        },
        {
          id: 'station-hint-3',
          label: t('studio.hint3'),
          type: 'text',
          value: hints[2],
          placeholder: t('studio.hint3Placeholder'),
          onChange: (value) => onPatchLocale({ hints: replaceHint(hints, 2, value) }),
        },
      ],
    },
  };

  return panels[panel];
}

export function getStoryHeading(
  station: RiddleEntry,
  locale: Locale,
  t: ReturnType<typeof useEditorLanguage>['t'],
): string {
  const heading = getFirstHeadingText(station[locale].firstSection).trim();
  return heading || t('studio.storyHeadingPlaceholder');
}

function renderRiddleSettingsPanelBody({
  station,
  onPatchStation,
}: {
  station: RiddleEntry;
  onPatchStation: (patch: Partial<RiddleEntry>) => void;
}) {
  const isText = station.riddleType === 'text';
  const isModular = station.riddleType === 'modular';

  return (
    <div className="stq-edit-panel-field">
      <div className="stq-edit-panel-label">Riddle type</div>
      <div className="stq-riddle-type-switch" role="group" aria-label="Riddle type">
        <button
          type="button"
          className={`stq-riddle-type-switch__option${isText ? ' is-active' : ''}`}
          aria-pressed={isText}
          onClick={() => onPatchStation(withRiddleType(station, 'text'))}
        >
          Text
        </button>
        <button
          type="button"
          className={`stq-riddle-type-switch__option${isModular ? ' is-active' : ''}`}
          aria-pressed={isModular}
          onClick={() => onPatchStation(withRiddleType(station, 'modular'))}
        >
          Modular / RRR
        </button>
      </div>
      {isModular && (
        <RrrInteractionEditor
          interaction={station.interaction ?? createEmptyRrrInteraction()}
          onChange={(interaction) => onPatchStation({ interaction })}
        />
      )}
    </div>
  );
}

function getFirstHeadingText(blocks: ContentBlock[]): string {
  const heading = blocks.find((block) => block.type === 'heading');
  return heading?.type === 'heading' ? heading.text : '';
}

function setFirstHeadingText(
  blocks: ContentBlock[],
  text: string,
): ContentBlock[] {
  const trimmed = text.trim();
  const headingIndex = blocks.findIndex((block) => block.type === 'heading');

  if (headingIndex >= 0) {
    if (!trimmed) {
      return blocks.filter((_, index) => index !== headingIndex);
    }
    return blocks.map((block, index) =>
      index === headingIndex && block.type === 'heading'
        ? { ...block, text }
        : block,
    );
  }

  if (!trimmed) return blocks;
  return [{ type: 'heading', text }, ...blocks];
}

function replaceHint(hints: string[], index: number, value: string): string[] {
  const next = [...hints];
  next[index] = value;
  return next.map((hint) => hint.trim()).filter(Boolean).slice(0, 3);
}

function renderStationImageIconPanelBody({
  draftId,
  station,
  imageUrl,
  t,
  onPatchStation,
}: {
  draftId: string;
  station: RiddleEntry;
  imageUrl: string | undefined;
  t: ReturnType<typeof useEditorLanguage>['t'];
  onPatchStation: (patch: Partial<RiddleEntry>) => void;
}) {
  const choice = normalizeStationVisualChoice(station);
  const selectedIconLabel =
    STATION_ICON_OPTIONS.find((option) => option.key === choice.iconKey)?.label ??
    choice.iconKey;

  return (
    <ImageAssetPanel
      draftId={draftId}
      label={t('studio.stationImage')}
      imageUrl={imageUrl}
      imagePath={station.imagePath}
      imageBlobId={station.imageBlobId}
      preset="station"
      onBlobStored={(blobId) =>
        onPatchStation({
          imageBlobId: blobId,
          imagePath: `images/${blobId}.webp`,
        })
      }
      onPathChange={(path) =>
        onPatchStation({
          imagePath: path,
          imageBlobId: undefined,
        })
      }
    >
      <div className="stq-edit-panel-label" style={{ marginTop: 18 }}>
        {t('studio.stationIcon')}
      </div>

      <div className="stq-station-icon-current">
        <div className="stq-station-icon-current__preview">
          <StationIconPreview
            station={station}
            style={{ width: 30, height: 30 }}
          />
        </div>
        <span>{t('studio.iconSelected')}: {selectedIconLabel}</span>
      </div>

      <div className="stq-station-icon-grid">
        {STATION_ICON_OPTIONS.map((option) => {
          const selected = option.key === choice.iconKey;
          return (
            <button
              key={option.key}
              type="button"
              className={`stq-station-icon-tile${selected ? ' is-active' : ''}`}
              aria-pressed={selected}
              aria-label={option.label}
              title={option.label}
              onClick={() =>
                onPatchStation(
                  applyStationVisualSelection(station.id, {
                    ...choice,
                    iconKey: option.key,
                  }),
                )
              }
            >
              <StationIconPreview
                choice={{ iconKey: option.key, iconColorKey: choice.iconColorKey }}
                style={{ width: 36, height: 36 }}
              />
            </button>
          );
        })}
        <button
          type="button"
          className="stq-station-icon-tile stq-station-icon-tile--add"
          aria-label={t('studio.addIcon')}
          title={t('studio.addIcon')}
          disabled
        >
          <Icon name="plus" size={18} />
        </button>
      </div>
    </ImageAssetPanel>
  );
}
