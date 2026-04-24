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
      className="flex gap-1 rounded-[20px] border border-border bg-white/90 p-1 shadow-sm"
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
              'flex-1 rounded-[16px] px-3 py-2 text-labelLg transition',
              isActive
                ? 'bg-primary text-white shadow-[0_6px_16px_rgba(144,74,72,0.22)]'
                : 'text-text hover:bg-primary/6',
            ].join(' ')}
          >
            {LOCALE_LABELS[locale]}
          </button>
        );
      })}
    </div>
  );
}
