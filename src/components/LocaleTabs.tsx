import { LOCALES, LOCALE_LABELS, type Locale } from '@/schema';

interface Props {
  active: Locale;
  onChange: (locale: Locale) => void;
  /**
   * "full" (default) shows long names ("English / Deutsch / Italiano") in a
   * full-width pill. "compact" shows short codes ("EN / DE / IT") in a
   * tighter segmented control — used in space-constrained headers (e.g.
   * mobile Field Mode).
   */
  variant?: 'full' | 'compact';
}

const SHORT_LABELS: Record<Locale, string> = {
  en: 'EN',
  de: 'DE',
  it: 'IT',
};

export function LocaleTabs({ active, onChange, variant = 'full' }: Props) {
  if (variant === 'compact') {
    return (
      <div
        role="tablist"
        aria-label="Locale"
        className="inline-flex gap-0.5 rounded-full border border-border bg-white/90 p-0.5 shadow-sm"
      >
        {LOCALES.map((locale) => {
          const isActive = locale === active;
          return (
            <button
              key={locale}
              role="tab"
              aria-selected={isActive}
              aria-label={LOCALE_LABELS[locale]}
              onClick={() => onChange(locale)}
              className={[
                'rounded-full px-2 py-0.5 text-[11px] font-semibold tracking-[0.06em] transition',
                isActive
                  ? 'bg-primary text-white shadow-[0_2px_6px_rgba(144,74,72,0.22)]'
                  : 'text-disabled hover:text-text',
              ].join(' ')}
            >
              {SHORT_LABELS[locale]}
            </button>
          );
        })}
      </div>
    );
  }

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
