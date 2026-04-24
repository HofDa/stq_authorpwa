import { Suspense, lazy, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useDraft } from '@/hooks/useDraft';
import { LocaleTabs } from '@/components/LocaleTabs';
import { StationListPanel } from '@/components/StationListPanel';
import { PhoneFramePreview } from '@/components/preview/PhoneFramePreview';
import { InlineTourIntro } from '@/components/editable/InlineTourIntro';
import { OpenClawAssistantPanel } from '@/components/assistant/OpenClawAssistantPanel';
import type { Locale, TourEntry } from '@/schema';
import {
  DraftExportValidationError,
  downloadDraftExportZip,
} from '@/export/tourExport';

const LiveRoutePlannerPanel = lazy(async () => {
  const module = await import('@/components/map/LiveRoutePlannerPanel');
  return { default: module.LiveRoutePlannerPanel };
});

export function TourEditorPage() {
  const { draftId } = useParams();
  const { draft, update } = useDraft(draftId);
  const [locale, setLocale] = useState<Locale>('en');
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [exportError, setExportError] = useState<string | null>(null);

  if (!draft) {
    return <p className="text-bodySm text-disabled">Loading draft…</p>;
  }

  function patchTour(patch: Partial<TourEntry>) {
    update((prev) => ({ ...prev, tour: { ...prev.tour, ...patch } }));
  }

  async function onExport() {
    if (!draft) return;
    setExportError(null);
    setExporting(true);
    try {
      const result = await downloadDraftExportZip(draft);
      if (result.missingBlobIds.length > 0) {
        alert(
          `Export complete (${result.fileName}).\n` +
            `${result.missingBlobIds.length} image(s) were missing in local storage ` +
            'and kept as existing imagePath values.',
        );
      }
    } catch (error) {
      setExportError(formatExportError(error));
    } finally {
      setExporting(false);
    }
  }

  function formatExportError(error: unknown): string {
    if (error instanceof DraftExportValidationError) {
      const lines = error.errors
        .slice(0, 8)
        .map((e) => `• ${e.path}: ${e.message}`);
      const extra = error.errors.length > 8 ? `\n…and ${error.errors.length - 8} more` : '';
      return `Cannot export — please fix:\n${lines.join('\n')}${extra}`;
    }
    return error instanceof Error ? error.message : 'Could not export this draft.';
  }

  return (
    <div className="flex flex-col gap-4">
      <header className="card flex flex-col gap-3">
        <Link to="/tours" className="text-bodySm text-disabled">
          ← All tours
        </Link>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-labelSm uppercase tracking-[0.18em] text-primary/75">
              Tour Authoring
            </p>
            <h1 className="text-h4">
              {draft.tour[locale].title || 'New tour'}
            </h1>
            <p className="mt-1 text-bodySm text-disabled">
              Edit the same content structure the tourist sees, then export the
              compatible JSON package.
            </p>
          </div>
          <button className="btn-ghost" onClick={onExport} disabled={exporting}>
            {exporting ? 'Exporting…' : 'Export ZIP'}
          </button>
        </div>
      </header>
      {exportError && <p className="text-bodySm text-error">{exportError}</p>}

      <LocaleTabs active={locale} onChange={setLocale} />

      <PhoneFramePreview>
        <InlineTourIntro draft={draft} locale={locale} onChange={update} />
      </PhoneFramePreview>

      <Suspense
        fallback={
          <section className="card">
            <p className="text-bodySm text-disabled">Loading live map planner…</p>
          </section>
        }
      >
        <LiveRoutePlannerPanel draft={draft} onChange={update} />
      </Suspense>

      <OpenClawAssistantPanel draft={draft} locale={locale} />

      <StationListPanel
        draftId={draft.draftId}
        stations={draft.stations}
        onChange={(stations) => update({ stations })}
      />

      <section className="card flex flex-col gap-2">
        <button
          className="btn-ghost self-start"
          onClick={() => setShowAdvanced((v) => !v)}
        >
          {showAdvanced ? '▼' : '▶'} Advanced metadata
        </button>
        {showAdvanced && (
          <div className="grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1">
              <span className="text-labelSm">Slug (ID)</span>
              <input
                className="input-field"
                value={draft.tour.id}
                onChange={(e) =>
                  patchTour({
                    id: e.target.value,
                    riddlesPath: `${e.target.value}/riddles.json`,
                  })
                }
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-labelSm">Riddles path</span>
              <input
                className="input-field"
                value={draft.tour.riddlesPath}
                onChange={(e) => patchTour({ riddlesPath: e.target.value })}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-labelSm">Number</span>
              <input
                className="input-field"
                type="number"
                min={0}
                value={draft.tour.number}
                onChange={(e) =>
                  patchTour({ number: Number(e.target.value) || 0 })
                }
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-labelSm">Unlock code (optional)</span>
              <input
                className="input-field"
                value={draft.tour.code ?? ''}
                onChange={(e) => {
                  const value = e.target.value.trim();
                  patchTour({ code: value.length === 0 ? undefined : value });
                }}
              />
            </label>
            <label className="flex flex-col gap-1">
              <span className="text-labelSm">GPS unlock range meters (optional)</span>
              <input
                className="input-field"
                type="number"
                min={1}
                value={draft.tour.gpsRangeMeters ?? ''}
                onChange={(e) => {
                  const raw = e.target.value.trim();
                  patchTour({
                    gpsRangeMeters: raw === '' ? undefined : Number(raw) || undefined,
                  });
                }}
              />
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.tour.unlocked}
                onChange={(e) => patchTour({ unlocked: e.target.checked })}
              />
              <span className="text-labelSm">Unlocked by default</span>
            </label>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={draft.tour.hideUnsolvedRiddles ?? false}
                onChange={(e) =>
                  patchTour({ hideUnsolvedRiddles: e.target.checked })
                }
              />
              <span className="text-labelSm">Hide unsolved riddles</span>
            </label>
          </div>
        )}
      </section>
    </div>
  );
}
