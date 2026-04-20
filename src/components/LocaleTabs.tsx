import { LOCALES, LOCALE_LABELS, type Locale } from '@/schema';

interface Props {
  active: Locale;
  onChange: (locale: Locale) => void;
}

export function LocaleTabs({ active, onChange }: Props) {
  return (
    <div
      role="tablist"
      aria-label="Locale"
      className="flex gap-1 rounded-sm border border-border bg-white p-1"
    >
      {LOCALES.map((locale) => {
        const isActive = locale === active;
        return (
          <button
            key={locale}
            role="tab"
            aria-selected={isActive}
            onClick={() => onChange(locale)}
            className={[
              'flex-1 rounded-sm px-3 py-1.5 text-labelLg transition',
              isActive
                ? 'bg-primary text-white'
                : 'text-text hover:bg-primary/10',
            ].join(' ')}
          >
            {LOCALE_LABELS[locale]}
          </button>
        );
      })}
    </div>
  );
}
