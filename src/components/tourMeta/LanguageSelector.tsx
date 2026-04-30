import type { CSSProperties } from 'react';
import { LOCALES, LOCALE_LABELS, type Locale } from '@/schema';

interface Props {
  /** Languages the tour is available in. */
  languages: ReadonlyArray<Locale> | undefined;
  /** The locale shown first / used as the AI/export fallback. */
  defaultLanguage: Locale | undefined;
  onLanguagesChange: (next: Locale[]) => void;
  onDefaultLanguageChange: (next: Locale | undefined) => void;
}

/**
 * Two-row language picker — top row toggles which locales the tour
 * supports, bottom row marks one of the active locales as default. The
 * default automatically clears when its locale is removed from the
 * supported list, so the two fields stay consistent.
 */
export function LanguageSelector({
  languages,
  defaultLanguage,
  onLanguagesChange,
  onDefaultLanguageChange,
}: Props) {
  const active = new Set<Locale>(languages ?? []);

  function toggleLanguage(locale: Locale) {
    if (active.has(locale)) {
      const next = (languages ?? []).filter((entry) => entry !== locale);
      onLanguagesChange(next);
      if (defaultLanguage === locale) {
        onDefaultLanguageChange(undefined);
      }
    } else {
      onLanguagesChange([...(languages ?? []), locale]);
    }
  }

  return (
    <div style={{ display: 'grid', gap: 10 }}>
      <div>
        <div style={subLabelStyle}>Verfügbare Sprachen</div>
        <div role="group" aria-label="Verfügbare Sprachen" style={rowStyle}>
          {LOCALES.map((locale) => {
            const isActive = active.has(locale);
            return (
              <button
                key={locale}
                type="button"
                role="checkbox"
                aria-checked={isActive}
                onClick={() => toggleLanguage(locale)}
                style={chipStyle(isActive)}
              >
                {LOCALE_LABELS[locale]}
              </button>
            );
          })}
        </div>
      </div>
      <div>
        <div style={subLabelStyle}>Standardsprache</div>
        <div role="radiogroup" aria-label="Standardsprache" style={rowStyle}>
          {LOCALES.map((locale) => {
            const enabled = active.has(locale);
            const isDefault = defaultLanguage === locale;
            return (
              <button
                key={locale}
                type="button"
                role="radio"
                aria-checked={isDefault}
                aria-disabled={!enabled}
                onClick={() => {
                  if (!enabled) return;
                  onDefaultLanguageChange(isDefault ? undefined : locale);
                }}
                style={{
                  ...chipStyle(isDefault),
                  opacity: enabled ? 1 : 0.45,
                  cursor: enabled ? 'pointer' : 'not-allowed',
                }}
              >
                {LOCALE_LABELS[locale]}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

const rowStyle: CSSProperties = {
  display: 'flex',
  flexWrap: 'wrap',
  gap: 6,
  marginTop: 4,
};

const subLabelStyle: CSSProperties = {
  fontSize: 11,
  fontWeight: 600,
  letterSpacing: '0.02em',
  color: 'var(--stq-text-mute)',
};

function chipStyle(active: boolean): CSSProperties {
  return {
    display: 'inline-flex',
    alignItems: 'center',
    padding: '4px 10px',
    fontSize: 12,
    fontWeight: 600,
    borderRadius: 999,
    border: `1px solid ${active ? 'var(--stq-primary)' : 'var(--stq-border)'}`,
    background: active ? 'var(--stq-primary)' : 'white',
    color: active ? 'white' : 'var(--stq-text)',
    transition: 'background 0.12s ease, color 0.12s ease',
  };
}
