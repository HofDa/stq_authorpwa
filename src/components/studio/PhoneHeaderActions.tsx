import { useState, type ReactNode } from 'react';
import { LOCALES, LOCALE_LABELS, type Locale } from '@/schema';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import { Icon } from './Icon';

interface PhoneHeaderActionsProps {
  locale: Locale;
  onLocaleChange?: (locale: Locale) => void;
  editAction?: ReactNode;
}

export function PhoneHeaderActions({
  locale,
  onLocaleChange,
  editAction,
}: PhoneHeaderActionsProps) {
  const { t } = useEditorLanguage();
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <span className="stq-tour-card-phone-header-actions">
      {editAction}
      <span className="stq-phone-header-settings">
        <button
          type="button"
          className="stq-tour-card-phone-header-gear"
          aria-label={t('studio.languages')}
          aria-expanded={settingsOpen}
          onClick={() => setSettingsOpen((open) => !open)}
        >
          <Icon name="settings" size={16} />
        </button>
        {settingsOpen && (
          <span
            className="stq-phone-header-settings__menu"
            role="menu"
            aria-label={t('studio.chooseLanguage')}
          >
            {LOCALES.map((entry) => (
              <button
                key={entry}
                type="button"
                role="menuitemradio"
                aria-checked={entry === locale}
                className={entry === locale ? 'is-active' : undefined}
                onClick={() => {
                  onLocaleChange?.(entry);
                  setSettingsOpen(false);
                }}
              >
                <span>{LOCALE_LABELS[entry]}</span>
                <strong>{entry.toUpperCase()}</strong>
              </button>
            ))}
          </span>
        )}
      </span>
    </span>
  );
}
