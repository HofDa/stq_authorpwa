import { useState } from 'react';
import type { Locale, RiddleEntry } from '@/schema';
import { ContentSectionPreview } from './ContentSectionPreview';

interface Props {
  station: RiddleEntry;
  locale: Locale;
}

type Tab = 'first' | 'history' | 'riddle' | 'success';

const TAB_LABELS: Record<Tab, string> = {
  first: 'Story',
  history: 'Background',
  riddle: 'Riddle',
  success: 'Success',
};

export function StationDrawerPreview({ station, locale }: Props) {
  const [tab, setTab] = useState<Tab>('first');
  const content = station[locale];

  const blocks =
    tab === 'first'
      ? content.firstSection
      : tab === 'history'
        ? content.historySection
        : tab === 'riddle'
          ? content.riddleSection
          : content.successSection;

  return (
    <article className="flex flex-col">
      <header className="flex items-center gap-3 bg-primary px-4 py-4 text-white">
        <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/20 font-ui text-h5">
          {station.number}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="truncate font-ui text-h5">
            {content.location || 'Station'}
          </h1>
          <p className="text-labelSm opacity-80">
            {station.position_lat.toFixed(5)},{' '}
            {station.position_lng.toFixed(5)}
          </p>
        </div>
      </header>
      <nav className="flex border-b border-border bg-background">
        {(Object.keys(TAB_LABELS) as Tab[]).map((key) => (
          <button
            key={key}
            type="button"
            onClick={() => setTab(key)}
            className={[
              'flex-1 px-2 py-2 text-labelSm',
              tab === key
                ? 'border-b-2 border-primary font-ui text-primary'
                : 'text-disabled',
            ].join(' ')}
          >
            {TAB_LABELS[key]}
          </button>
        ))}
      </nav>
      <ContentSectionPreview blocks={blocks} />
      {tab === 'riddle' && (
        <div className="flex flex-col gap-2 px-4 pb-6">
          <input
            className="input-field"
            placeholder="Your answer…"
            disabled
          />
          {content.hints.length > 0 && (
            <details className="rounded-sm border border-border bg-white px-3 py-2">
              <summary className="cursor-pointer text-labelSm">
                Hints ({content.hints.length})
              </summary>
              <ol className="mt-2 list-decimal pl-5 font-body text-body">
                {content.hints.map((hint, i) => (
                  <li key={i}>{hint || <em className="text-disabled">(empty)</em>}</li>
                ))}
              </ol>
            </details>
          )}
        </div>
      )}
    </article>
  );
}
