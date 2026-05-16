import type { useEditorLanguage } from '@/i18n/editorLanguage';
import type { RiddleEntry } from '@/schema';
import {
  applyStationVisualSelection,
  normalizeStationVisualChoice,
  STATION_ICON_OPTIONS,
} from '@/stations/visuals';
import { StationIconPreview } from '@/components/stations/StationVisualPreview';
import { ImageAssetPanel } from '../ImageAssetPanel';
import { Icon } from '../Icon';

interface StationImageIconPanelProps {
  draftId: string;
  station: RiddleEntry;
  imageUrl: string | undefined;
  t: ReturnType<typeof useEditorLanguage>['t'];
  onPatchStation: (patch: Partial<RiddleEntry>) => void;
}

export function StationImageIconPanel({
  draftId,
  station,
  imageUrl,
  t,
  onPatchStation,
}: StationImageIconPanelProps) {
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
        <span>
          {t('studio.iconSelected')}: {selectedIconLabel}
        </span>
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
                choice={{
                  iconKey: option.key,
                  iconColorKey: choice.iconColorKey,
                }}
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
