import { useCallback, type CSSProperties } from 'react';
import {
  LOCALES,
  LOCALE_LABELS,
  type DifficultyLevel,
  type Locale,
  type LocalizedString,
  type PracticalInfo,
  type Season,
  type TourEntry,
  type TourPublicMeta,
} from '@/schema';
import {
  audienceChoices,
  themeChoices,
} from '@/domain/tourMeta/choices';
import { MetaSectionCard } from '../MetaSectionCard';
import { MultiChoiceTagPicker } from '../ChoiceChipGroup';
import { DifficultySelector } from '../DifficultySelector';
import { PracticalInfoSelector } from '../PracticalInfoSelector';
import { LanguageSelector } from '../LanguageSelector';

interface Props {
  tour: TourEntry;
  locale: Locale;
  /**
   * When omitted, the tab renders read-only (used by tests and previews).
   * The editor calls this callback for every chip toggle / text change.
   */
  onTourChange?: (recipe: (prev: TourEntry) => TourEntry) => void;
}

const SEASON_OPTIONS: ReadonlyArray<{ id: Season; label: string }> = [
  { id: 'spring', label: 'Frühling' },
  { id: 'summer', label: 'Sommer' },
  { id: 'autumn', label: 'Herbst' },
  { id: 'winter', label: 'Winter' },
  { id: 'year_round', label: 'Ganzjährig' },
];

/**
 * Editable Public Meta tab. Most fields are chip/button selectors backed
 * by the `tourMetaChoices` catalogs from PR-36 — free-text only where
 * stable ids would lose meaning (titles, subtitles, descriptions).
 *
 * All edits route through `onTourChange` and end up in `tour.publicMeta`.
 * AI / authoring / story fields stay outside this tab on purpose.
 */
export function PublicMetaTab({ tour, locale: _locale, onTourChange }: Props) {
  const meta = tour.publicMeta ?? {};
  const readOnly = !onTourChange;

  const updatePublicMeta = useCallback(
    (recipe: (prev: TourPublicMeta) => TourPublicMeta) => {
      if (!onTourChange) return;
      onTourChange((prev) => ({
        ...prev,
        publicMeta: recipe(prev.publicMeta ?? {}),
      }));
    },
    [onTourChange],
  );

  const updateLocaleTitle = useCallback(
    (target: Locale, next: string) => {
      if (!onTourChange) return;
      onTourChange((prev) => ({
        ...prev,
        [target]: { ...prev[target], title: next },
      }));
    },
    [onTourChange],
  );

  const updateLocalizedField = useCallback(
    (
      key: 'subtitle' | 'shortDescription' | 'longDescription',
      target: Locale,
      next: string,
    ) => {
      updatePublicMeta((prev) => {
        const current: LocalizedString = prev[key] ?? {};
        const merged: LocalizedString = { ...current, [target]: next };
        if (!next.trim()) delete merged[target];
        return Object.keys(merged).length === 0
          ? omit(prev, key)
          : { ...prev, [key]: merged };
      });
    },
    [updatePublicMeta],
  );

  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <MetaSectionCard
        eyebrow="Öffentlich"
        title="Titel & Beschreibung"
        description="Für Endnutzer:innen sichtbar. Pro Sprache pflegbar."
      >
        <div style={{ display: 'grid', gap: 8 }}>
          {LOCALES.map((target) => (
            <fieldset key={target} style={fieldsetStyle}>
              <legend style={legendStyle}>{LOCALE_LABELS[target]}</legend>
              <TextRow
                label="Titel"
                value={tour[target].title}
                onChange={(next) => updateLocaleTitle(target, next)}
                readOnly={readOnly}
                placeholder="Tourtitel"
              />
              <TextRow
                label="Untertitel"
                value={meta.subtitle?.[target] ?? ''}
                onChange={(next) =>
                  updateLocalizedField('subtitle', target, next)
                }
                readOnly={readOnly}
                placeholder="Optional"
              />
              <TextRow
                label="Kurzbeschreibung"
                value={meta.shortDescription?.[target] ?? ''}
                onChange={(next) =>
                  updateLocalizedField('shortDescription', target, next)
                }
                readOnly={readOnly}
                multiline
                placeholder="Ein bis zwei Sätze"
              />
              <TextRow
                label="Langbeschreibung (optional)"
                value={meta.longDescription?.[target] ?? ''}
                onChange={(next) =>
                  updateLocalizedField('longDescription', target, next)
                }
                readOnly={readOnly}
                multiline
                rows={4}
                placeholder="Längerer Beschreibungstext für die Tour-Detailseite"
              />
            </fieldset>
          ))}
        </div>
      </MetaSectionCard>

      <MetaSectionCard
        eyebrow="Auswahl"
        title="Themen"
        description="Mehrfach wählbar. Empfehlungen sind farblich hervorgehoben."
      >
        <MultiChoiceTagPicker
          options={themeChoices}
          value={meta.themes ?? []}
          onChange={(next) => updatePublicMeta((prev) => set(prev, 'themes', next))}
          ariaLabel="Themen"
        />
      </MetaSectionCard>

      <MetaSectionCard
        eyebrow="Auswahl"
        title="Zielgruppe"
        description="Mehrfach wählbar. Wer soll diese Tour erleben?"
      >
        <MultiChoiceTagPicker
          options={audienceChoices}
          value={meta.audience ?? []}
          onChange={(next) => updatePublicMeta((prev) => set(prev, 'audience', next))}
          ariaLabel="Zielgruppe"
        />
      </MetaSectionCard>

      <MetaSectionCard
        eyebrow="Schwierigkeit"
        title="Geh- und Rätselschwierigkeit"
        description="Getrennte Bewertung — Spaziergang ist nicht gleich Knobelei."
      >
        <div style={{ display: 'grid', gap: 12 }}>
          <DifficultyRow
            label="Geh-Schwierigkeit"
            value={meta.difficulty?.walking}
            onChange={(next) =>
              updatePublicMeta((prev) =>
                setDifficulty(prev, 'walking', next),
              )
            }
          />
          <DifficultyRow
            label="Rätsel-Schwierigkeit"
            value={meta.difficulty?.riddle}
            onChange={(next) =>
              updatePublicMeta((prev) =>
                setDifficulty(prev, 'riddle', next),
              )
            }
          />
        </div>
      </MetaSectionCard>

      <MetaSectionCard
        eyebrow="Dauer & Strecke"
        title="Wie lange, wie weit?"
      >
        <div style={{ display: 'grid', gap: 8, gridTemplateColumns: '1fr 1fr' }}>
          <NumberRow
            label="Dauer (min)"
            value={meta.durationMinutes}
            onChange={(next) =>
              updatePublicMeta((prev) => set(prev, 'durationMinutes', next))
            }
            readOnly={readOnly}
            min={1}
          />
          <NumberRow
            label="Strecke (m)"
            value={meta.distanceMeters}
            onChange={(next) =>
              updatePublicMeta((prev) => set(prev, 'distanceMeters', next))
            }
            readOnly={readOnly}
            min={0}
          />
        </div>
      </MetaSectionCard>

      <MetaSectionCard
        eyebrow="Hinweise"
        title="Praktische Infos"
        description="Drei Zustände: Ja, Nein, oder noch nicht geprüft."
      >
        <PracticalInfoSelector
          value={meta.practicalInfo}
          onChange={(next: PracticalInfo) =>
            updatePublicMeta((prev) => set(prev, 'practicalInfo', next))
          }
        />
      </MetaSectionCard>

      <MetaSectionCard
        eyebrow="Sprachen"
        title="Verfügbarkeit & Standardsprache"
        description="Welche Sprachen sind gepflegt? Die Standardsprache wird bevorzugt angezeigt."
      >
        <LanguageSelector
          languages={meta.languages}
          defaultLanguage={meta.defaultLanguage}
          onLanguagesChange={(next) =>
            updatePublicMeta((prev) => set(prev, 'languages', next))
          }
          onDefaultLanguageChange={(next) =>
            updatePublicMeta((prev) => set(prev, 'defaultLanguage', next))
          }
        />
      </MetaSectionCard>

      <MetaSectionCard eyebrow="Saison" title="Wann ist die Tour gut?">
        <MultiChoiceTagPicker
          options={SEASON_OPTIONS}
          value={meta.seasons ?? []}
          onChange={(next) =>
            updatePublicMeta((prev) =>
              set(prev, 'seasons', next as Season[]),
            )
          }
          ariaLabel="Saison"
        />
      </MetaSectionCard>
    </div>
  );
}

function DifficultyRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: DifficultyLevel | undefined;
  onChange: (next: DifficultyLevel | undefined) => void;
}) {
  return (
    <div>
      <div style={difficultyLabelStyle}>{label}</div>
      <div style={{ marginTop: 4 }}>
        <DifficultySelector value={value} onChange={onChange} ariaLabel={label} />
      </div>
    </div>
  );
}

function TextRow({
  label,
  value,
  onChange,
  readOnly,
  placeholder,
  multiline,
  rows = 2,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  readOnly: boolean;
  placeholder?: string;
  multiline?: boolean;
  rows?: number;
}) {
  return (
    <label style={textRowStyle}>
      <span style={textLabelStyle}>{label}</span>
      {multiline ? (
        <textarea
          value={value}
          readOnly={readOnly}
          rows={rows}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          style={{ ...inputStyle, resize: 'vertical', minHeight: 44 }}
        />
      ) : (
        <input
          type="text"
          value={value}
          readOnly={readOnly}
          placeholder={placeholder}
          onChange={(event) => onChange(event.target.value)}
          style={inputStyle}
        />
      )}
    </label>
  );
}

function NumberRow({
  label,
  value,
  onChange,
  readOnly,
  min,
}: {
  label: string;
  value: number | undefined;
  onChange: (next: number | undefined) => void;
  readOnly: boolean;
  min?: number;
}) {
  return (
    <label style={textRowStyle}>
      <span style={textLabelStyle}>{label}</span>
      <input
        type="number"
        readOnly={readOnly}
        min={min}
        value={value ?? ''}
        onChange={(event) => {
          const raw = event.target.value;
          if (raw === '') {
            onChange(undefined);
            return;
          }
          const parsed = Number(raw);
          onChange(Number.isFinite(parsed) ? parsed : undefined);
        }}
        style={inputStyle}
      />
    </label>
  );
}

function set<K extends keyof TourPublicMeta>(
  prev: TourPublicMeta,
  key: K,
  value: TourPublicMeta[K] | undefined,
): TourPublicMeta {
  if (value === undefined || (Array.isArray(value) && value.length === 0)) {
    return omit(prev, key);
  }
  return { ...prev, [key]: value };
}

function setDifficulty(
  prev: TourPublicMeta,
  key: 'walking' | 'riddle',
  value: DifficultyLevel | undefined,
): TourPublicMeta {
  const current = prev.difficulty ?? {};
  const next = { ...current };
  if (value === undefined) {
    delete next[key];
  } else {
    next[key] = value;
  }
  if (Object.keys(next).length === 0) {
    return omit(prev, 'difficulty');
  }
  return { ...prev, difficulty: next };
}

function omit<T extends object, K extends keyof T>(value: T, key: K): T {
  const next = { ...value };
  delete next[key];
  return next;
}

const fieldsetStyle: CSSProperties = {
  border: '1px solid var(--stq-border-soft)',
  borderRadius: 8,
  padding: '8px 10px 10px',
  background: 'var(--stq-author-surface-raised, var(--stq-bg))',
  display: 'grid',
  gap: 6,
};

const legendStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 700,
  letterSpacing: '0.08em',
  textTransform: 'uppercase',
  color: 'var(--stq-primary)',
  padding: '0 4px',
};

const textRowStyle: CSSProperties = {
  display: 'grid',
  gap: 2,
};

const textLabelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  color: 'var(--stq-text-mute)',
  letterSpacing: '0.02em',
};

const inputStyle: CSSProperties = {
  fontSize: 13,
  padding: '6px 10px',
  borderRadius: 8,
  border: '1px solid var(--stq-border)',
  background: 'var(--stq-author-surface-raised, white)',
  color: 'var(--stq-text)',
  width: '100%',
  fontFamily: 'inherit',
};

const difficultyLabelStyle: CSSProperties = {
  fontSize: 12,
  fontWeight: 600,
  color: 'var(--stq-text-mute)',
};
