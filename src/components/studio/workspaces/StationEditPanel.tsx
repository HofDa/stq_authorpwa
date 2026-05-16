import type { ReactNode } from 'react';
import {
  type Locale,
  type RiddleEntry,
} from '@/schema';
import type { ContentBlock } from '@/schema/contentBlock';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import type { EditPanelField } from '../EditPanel';
import { EditableTextEntryList } from './EditableTextEntryList';
import { StationImageIconPanel } from './StationImageIconPanel';
import { StationRiddleSettingsPanel } from './StationRiddleSettingsPanel';
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

interface StationEditPanelConfig {
  title: string;
  fields: EditPanelField[];
  body?: ReactNode;
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
}: GetStationEditPanelArgs): StationEditPanelConfig {
  const localized = station[locale];

  const panels: Record<StationEditPanelKey, StationEditPanelConfig> = {
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
      body: (
        <StationImageIconPanel
          draftId={draftId}
          station={station}
          imageUrl={imageUrl}
          t={t}
          onPatchStation={onPatchStation}
        />
      ),
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
      body: renderTextSectionBody({
        blocks: localized.firstSection,
        onChange: (firstSection) => onPatchLocale({ firstSection }),
        placeholder: t('studio.paragraphPlaceholder'),
      }),
    },
    history: {
      title: t('studio.historySectionTitle'),
      fields: [
        createHeadingField({
          id: 'station-history-heading',
          label: t('studio.heading'),
          blocks: localized.historySection,
          placeholder: t('studio.historicalContextPlaceholder'),
          onChange: (historySection) => onPatchLocale({ historySection }),
        }),
      ],
      body: renderTextSectionBody({
        blocks: localized.historySection,
        onChange: (historySection) => onPatchLocale({ historySection }),
        placeholder: t('studio.paragraphPlaceholder'),
      }),
    },
    riddle: {
      title: t('studio.riddle'),
      fields: [
        createHeadingField({
          id: 'station-riddle-heading',
          label: t('studio.heading'),
          blocks: localized.riddleSection,
          placeholder: t('studio.riddlePlaceholder'),
          onChange: (riddleSection) => onPatchLocale({ riddleSection }),
        }),
      ],
      body: renderTextSectionBody({
        blocks: localized.riddleSection,
        onChange: (riddleSection) => onPatchLocale({ riddleSection }),
        placeholder: t('studio.riddlePlaceholder'),
        blockType: 'line',
      }),
    },
    successSection: {
      title: SECTION_SUCCESS_TITLE,
      fields: [
        createHeadingField({
          id: 'station-success-heading',
          label: t('studio.heading'),
          blocks: localized.successSection,
          placeholder: SECTION_SUCCESS_TITLE,
          onChange: (successSection) => onPatchLocale({ successSection }),
        }),
      ],
      body: renderTextSectionBody({
        blocks: localized.successSection,
        onChange: (successSection) => onPatchLocale({ successSection }),
        placeholder: t('studio.paragraphPlaceholder'),
      }),
    },
    riddleSettings: {
      title: t('studio.riddleSettings'),
      fields: [],
      body: (
        <StationRiddleSettingsPanel
          station={station}
          onPatchStation={onPatchStation}
        />
      ),
    },
    answers: {
      title: t('studio.hints'),
      fields: [],
      body: (
        <EditableTextEntryList
          sourceEntries={localized.hints}
          onCommit={(hints) => onPatchLocale({ hints: hints.slice(0, 3) })}
          heading={t('studio.hintLevels')}
          placeholder={[
            t('studio.hint1Placeholder'),
            t('studio.hint2Placeholder'),
            t('studio.hint3Placeholder'),
          ]}
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

function createHeadingField({
  id,
  label,
  blocks,
  placeholder,
  onChange,
}: {
  id: string;
  label: string;
  blocks: ContentBlock[];
  placeholder: string;
  onChange: (blocks: ContentBlock[]) => void;
}): EditPanelField {
  return {
    id,
    label,
    type: 'text',
    value: getFirstHeadingText(blocks),
    placeholder,
    onChange: (value) => onChange(setFirstHeadingText(blocks, value)),
  };
}

function renderTextSectionBody({
  blocks,
  onChange,
  placeholder,
  blockType,
}: {
  blocks: ContentBlock[];
  onChange: (blocks: ContentBlock[]) => void;
  placeholder: string;
  blockType?: 'paragraph' | 'line';
}) {
  return (
    <TextBodyPanel
      blocks={blocks.filter((block) => block.type !== 'heading')}
      onChange={(nextBodyBlocks) =>
        onChange(replaceSectionBodyBlocks(blocks, nextBodyBlocks))
      }
      placeholder={placeholder}
      blockType={blockType}
    />
  );
}

function replaceSectionBodyBlocks(
  blocks: ContentBlock[],
  nextBodyBlocks: ContentBlock[],
): ContentBlock[] {
  const headingBlocks = blocks.filter((block) => block.type === 'heading');
  return [...headingBlocks, ...nextBodyBlocks];
}

function parseCoordinate(value: string): number | null {
  const parsed = Number.parseFloat(value.trim().replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function formatCoordinate(value: number): string {
  return Number.isFinite(value) ? String(value) : '';
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
