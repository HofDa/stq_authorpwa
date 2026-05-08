import type { ReactNode } from 'react';
import {
  createEmptyRrrInteraction,
  withRiddleType,
  type Locale,
  type RiddleEntry,
  type RrrFieldTestIssueTag,
  type RrrFieldTestStatus,
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
import { EditableTextEntryList } from './EditableTextEntryList';
import { TextBodyPanel } from './TextBodyPanel';

export type StationEditPanelKey =
  | 'station'
  | 'marker'
  | 'hero'
  | 'title'
  | 'story'
  | 'history'
  | 'riddle'
  | 'successSection'
  | 'riddleSettings'
  | 'answers';

const SECTION_SUCCESS_TITLE = 'Success';

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

  const panels: Record<
    StationEditPanelKey,
    { title: string; fields: EditPanelField[]; body?: ReactNode }
  > = {
    station: {
      title: t('studio.editStation'),
      fields: [
        {
          id: 'station-number',
          label: t('studio.station'),
          type: 'text',
          value: String(station.number),
          placeholder: '1',
          onChange: (value) => {
            const parsed = Number.parseInt(value, 10);
            if (Number.isFinite(parsed) && parsed >= 0) {
              onPatchStation({ number: parsed });
            }
          },
        },
        ...getStationIdentityFields({
          station,
          localized,
          t,
          onPatchLocale,
          onPatchStation,
        }),
      ],
    },
    marker: {
      title: 'Marker & GPS',
      fields: [
        {
          id: 'station-latitude',
          label: 'Latitude',
          type: 'text',
          value: formatCoordinate(station.position_lat),
          placeholder: '46.670300',
          onChange: (value) => {
            const parsed = parseCoordinate(value);
            if (parsed !== null) onPatchStation({ position_lat: parsed });
          },
        },
        {
          id: 'station-longitude',
          label: 'Longitude',
          type: 'text',
          value: formatCoordinate(station.position_lng),
          placeholder: '11.159400',
          onChange: (value) => {
            const parsed = parseCoordinate(value);
            if (parsed !== null) onPatchStation({ position_lng: parsed });
          },
        },
        {
          id: 'station-marker-icon',
          label: 'Marker icon',
          type: 'text',
          value: station.markerIconPath,
          placeholder: 'markers/...',
          onChange: (value) => onPatchStation({ markerIconPath: value }),
        },
      ],
    },
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
      fields: getStationIdentityFields({
        station,
        localized,
        t,
        onPatchLocale,
        onPatchStation,
      }),
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
    successSection: {
      title: SECTION_SUCCESS_TITLE,
      fields: [
        {
          id: 'station-success-heading',
          label: t('studio.heading'),
          type: 'text',
          value: getFirstHeadingText(localized.successSection),
          placeholder: SECTION_SUCCESS_TITLE,
          onChange: (value) =>
            onPatchLocale({
              successSection: setFirstHeadingText(
                localized.successSection,
                value,
              ),
            }),
        },
      ],
      body: (
        <TextBodyPanel
          blocks={localized.successSection.filter(
            (block) => block.type !== 'heading',
          )}
          onChange={(nextParagraphs) => {
            const headingBlocks = localized.successSection.filter(
              (block) => block.type === 'heading',
            );
            onPatchLocale({
              successSection: [...headingBlocks, ...nextParagraphs],
            });
          }}
          placeholder={t('studio.paragraphPlaceholder')}
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
      title: t('studio.hints'),
      fields: [],
      body: (
        <EditableTextEntryList
          sourceEntries={localized.hints}
          onCommit={(hints) => onPatchLocale({ hints: hints.slice(0, 3) })}
          heading={t('studio.hintLevels')}
          placeholder={t('studio.hint1Placeholder')}
          fixedEntryCount={3}
          rows={2}
        />
      ),
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

function getStationIdentityFields({
  station,
  localized,
  t,
  onPatchLocale,
  onPatchStation,
}: {
  station: RiddleEntry;
  localized: RiddleEntry[Locale];
  t: ReturnType<typeof useEditorLanguage>['t'];
  onPatchLocale: (patch: Partial<RiddleEntry[Locale]>) => void;
  onPatchStation: (patch: Partial<RiddleEntry>) => void;
}): EditPanelField[] {
  return [
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
  ];
}

function parseCoordinate(value: string): number | null {
  const parsed = Number.parseFloat(value.trim().replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCoordinate(value: number): string {
  return Number.isFinite(value) ? String(value) : '';
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
  const fieldTestStatus = station.fieldTestStatus ?? 'not_tested';
  const fieldTestIssueTags = station.fieldTestIssueTags ?? [];
  const fieldTestNotes = station.fieldTestNotes ?? '';
  const fieldTestTestedAt = station.fieldTestTestedAt ?? '';

  function patchFieldTestStatus(status: RrrFieldTestStatus) {
    onPatchStation({
      fieldTestStatus: status,
      fieldTestTestedAt:
        status === 'not_tested'
          ? undefined
          : station.fieldTestTestedAt ?? new Date().toISOString(),
    });
  }

  function toggleFieldTestIssueTag(
    tag: RrrFieldTestIssueTag,
    checked: boolean,
  ) {
    const nextTags = checked
      ? [...new Set([...fieldTestIssueTags, tag])]
      : fieldTestIssueTags.filter((entry) => entry !== tag);
    onPatchStation({ fieldTestIssueTags: nextTags });
  }

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
          Modulares Rätsel
        </button>
      </div>
      {isModular && (
        <>
          <div className="stq-rrr-field-test-status">
            <div>
              <span>Feldtest-Status</span>
              <strong>{getFieldTestStatusLabel(fieldTestStatus)}</strong>
            </div>
            <select
              className="stq-rrr-editor__select"
              value={fieldTestStatus}
              onChange={(event) =>
                patchFieldTestStatus(event.target.value as RrrFieldTestStatus)
              }
            >
              {FIELD_TEST_STATUS_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <div className="stq-rrr-field-test-tags" aria-label="Feldtest-Problem-Tags">
              {FIELD_TEST_ISSUE_TAG_OPTIONS.map((option) => (
                <label key={option.value} className="stq-rrr-check">
                  <input
                    type="checkbox"
                    checked={fieldTestIssueTags.includes(option.value)}
                    onChange={(event) =>
                      toggleFieldTestIssueTag(
                        option.value,
                        event.target.checked,
                      )
                    }
                  />
                  <span>{option.label}</span>
                </label>
              ))}
            </div>
            <label className="stq-rrr-field">
              <span>Getestet am</span>
              <input
                type="datetime-local"
                value={toDateTimeLocalValue(fieldTestTestedAt)}
                onChange={(event) =>
                  onPatchStation({
                    fieldTestTestedAt: fromDateTimeLocalValue(
                      event.target.value,
                    ),
                  })
                }
              />
            </label>
            <label className="stq-rrr-field">
              <span>Feldtest-Notizen</span>
              <textarea
                value={fieldTestNotes}
                onChange={(event) =>
                  onPatchStation({ fieldTestNotes: event.target.value })
                }
                placeholder="Optional: Beobachtungen, Gerätehinweise oder offene Punkte"
              />
            </label>
          </div>
          <RrrInteractionEditor
            interaction={station.interaction ?? createEmptyRrrInteraction()}
            stationId={station.id}
            fieldTestIssueTags={fieldTestIssueTags}
            stationTitle={
              station.de.location ||
              station.en.location ||
              station.it.location ||
              `Station ${station.number}`
            }
            onChange={(interaction) => onPatchStation({ interaction })}
          />
        </>
      )}
    </div>
  );
}

const FIELD_TEST_STATUS_OPTIONS: Array<{
  value: RrrFieldTestStatus;
  label: string;
}> = [
  { value: 'not_tested', label: 'Nicht getestet' },
  { value: 'tested_ok', label: 'Getestet: OK' },
  { value: 'tested_with_warnings', label: 'Getestet: mit Hinweisen' },
  { value: 'needs_fix', label: 'Braucht Fix' },
];

const FIELD_TEST_ISSUE_TAG_OPTIONS: Array<{
  value: RrrFieldTestIssueTag;
  label: string;
}> = [
  { value: 'gps_ungenau', label: 'GPS ungenau' },
  { value: 'kompass_instabil', label: 'Kompass instabil' },
  { value: 'qr_schlecht_lesbar', label: 'QR schlecht lesbar' },
  { value: 'aufgabe_unklar', label: 'Aufgabe unklar' },
  { value: 'ort_schwer_zugaenglich', label: 'Ort schwer zugänglich' },
  { value: 'ersatzloesung_noetig', label: 'Ersatzlösung nötig' },
  { value: 'sonstiges', label: 'Sonstiges' },
];

function getFieldTestStatusLabel(status: RrrFieldTestStatus): string {
  return (
    FIELD_TEST_STATUS_OPTIONS.find((option) => option.value === status)
      ?.label ?? 'Nicht getestet'
  );
}

function toDateTimeLocalValue(value: string): string {
  if (!value) {
    return '';
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return '';
  }
  const year = date.getFullYear();
  const month = padDatePart(date.getMonth() + 1);
  const day = padDatePart(date.getDate());
  const hours = padDatePart(date.getHours());
  const minutes = padDatePart(date.getMinutes());
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

function fromDateTimeLocalValue(value: string): string | undefined {
  if (!value) {
    return undefined;
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function padDatePart(value: number): string {
  return String(value).padStart(2, '0');
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
