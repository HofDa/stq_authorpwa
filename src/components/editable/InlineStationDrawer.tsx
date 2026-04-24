import { useState } from 'react';
import type {
  Locale,
  RiddleEntry,
  RiddleLocaleContent,
  TourDraft,
} from '@/schema';
import { EditableText } from './EditableText';
import { EditableContentSection } from './EditableContentSection';
import { ImageCapture } from '@/components/ImageCapture';
import { CaptureButton } from '@/components/CaptureButton';
import { useBlobUrl } from '@/hooks/useBlobUrl';

interface Props {
  draft: TourDraft;
  station: RiddleEntry;
  locale: Locale;
  onChange: (recipe: (prev: TourDraft) => TourDraft) => void;
}

type Tab = 'first' | 'history' | 'riddle' | 'success';

const TAB_LABELS: Record<Tab, string> = {
  first: 'Story',
  history: 'Background',
  riddle: 'Riddle',
  success: 'Success',
};

/**
 * Visual twin of the native station drawer, fully editable in place.
 */
export function InlineStationDrawer({
  draft,
  station,
  locale,
  onChange,
}: Props) {
  const [tab, setTab] = useState<Tab>('first');
  const content = station[locale];
  const photoUrl = useBlobUrl(station.imageBlobId);

  function patchStation(patch: Partial<RiddleEntry>) {
    onChange((prev) => ({
      ...prev,
      stations: prev.stations.map((s) =>
        s.id === station.id ? { ...s, ...patch } : s,
      ),
    }));
  }

  function patchLocale(patch: Partial<RiddleLocaleContent>) {
    onChange((prev) => ({
      ...prev,
      stations: prev.stations.map((s) =>
        s.id === station.id ? { ...s, [locale]: { ...s[locale], ...patch } } : s,
      ),
    }));
  }

  function setStationBlob(blobId: string) {
    patchStation({
      imageBlobId: blobId,
      imagePath: `images/${blobId}.webp`,
    });
  }

  const blocksForTab = (() => {
    switch (tab) {
      case 'first':
        return content.firstSection;
      case 'history':
        return content.historySection;
      case 'riddle':
        return content.riddleSection;
      case 'success':
        return content.successSection;
    }
  })();

  function setBlocksForTab(blocks: RiddleLocaleContent['firstSection']) {
    const key: keyof RiddleLocaleContent = (() => {
      switch (tab) {
        case 'first':
          return 'firstSection';
        case 'history':
          return 'historySection';
        case 'riddle':
          return 'riddleSection';
        case 'success':
          return 'successSection';
      }
    })();
    patchLocale({ [key]: blocks });
  }

  return (
    <article className="flex flex-col">
      <div className="relative">
        {photoUrl ? (
          <>
            <img
              src={photoUrl}
              alt=""
              className="aspect-square w-full object-cover"
            />
            <div className="absolute right-2 top-2">
              <CaptureButton
                draftId={draft.draftId}
                preset="station"
                onCaptured={setStationBlob}
              />
            </div>
          </>
        ) : (
          <ImageCapture
            draftId={draft.draftId}
            preset="station"
            onCaptured={setStationBlob}
            aspectClass="aspect-square"
            label="Tap to photograph this location"
            rounded="none"
          />
        )}
      </div>
      <header className="flex items-center gap-3 bg-primary px-4 py-3 text-white">
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center
                     rounded-full bg-white/20 font-ui text-h5"
        >
          {station.number}
        </span>
        <div className="min-w-0 flex-1">
          <h1 className="font-ui text-h5">
            <EditableText
              value={content.location}
              onChange={(location) => patchLocale({ location })}
              placeholder="Station name"
              className="text-white"
            />
          </h1>
          <p className="text-labelSm opacity-80">
            {station.position_lat.toFixed(5)},{' '}
            {station.position_lng.toFixed(5)}
          </p>
        </div>
      </header>

      <nav className="flex border-b border-border bg-white">
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

      <EditableContentSection
        draftId={draft.draftId}
        blocks={blocksForTab}
        onChange={setBlocksForTab}
      />

      {tab === 'riddle' && (
        <RiddleAnswerSection
          solution={station.solution ?? ''}
          onSolution={(solution) => patchStation({ solution })}
          hints={content.hints}
          onHints={(hints) => patchLocale({ hints })}
        />
      )}
    </article>
  );
}

function RiddleAnswerSection({
  solution,
  onSolution,
  hints,
  onHints,
}: {
  solution: string;
  onSolution: (next: string) => void;
  hints: string[];
  onHints: (next: string[]) => void;
}) {
  return (
    <div className="flex flex-col gap-3 border-t border-border bg-background
                    px-4 py-4">
      <label className="flex flex-col gap-1">
        <span className="text-labelSm text-disabled">Correct answer</span>
        <input
          className="input-field"
          value={solution}
          onChange={(e) => onSolution(e.target.value)}
          placeholder="The tourist's answer"
        />
      </label>
      <fieldset className="flex flex-col gap-2">
        <legend className="text-labelSm text-disabled">
          Hints (up to 3, third reveals the answer)
        </legend>
        {hints.map((hint, i) => (
          <div key={i} className="flex gap-2">
            <input
              className="input-field"
              value={hint}
              placeholder={`Hint ${i + 1}`}
              onChange={(e) => {
                const next = hints.slice();
                next[i] = e.target.value;
                onHints(next);
              }}
            />
            <button
              type="button"
              className="btn-ghost text-labelSm text-error"
              onClick={() => onHints(hints.filter((_, idx) => idx !== i))}
            >
              ✕
            </button>
          </div>
        ))}
        {hints.length < 3 && (
          <button
            type="button"
            className="btn-ghost self-start text-labelSm"
            onClick={() => onHints([...hints, ''])}
          >
            + Add hint
          </button>
        )}
      </fieldset>
    </div>
  );
}
