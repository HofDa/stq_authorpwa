import { useState } from 'react';
import type { Locale, RiddleEntry, TourDraft } from '@/schema';
import {
  ASSISTANT_FOCUS_OPTIONS,
  buildContextSnapshot,
  buildOpenClawPrompt,
  defaultQuestionForFocus,
  runLocalAssistantChecks,
  type AssistantFocus,
} from '@/assistant/openClaw';
import { useToast } from '@/components/ui/FeedbackProvider';

interface Props {
  draft: TourDraft;
  locale: Locale;
  station?: RiddleEntry;
}

export function OpenClawAssistantPanel({ draft, locale, station }: Props) {
  const kind = station ? 'station' : 'tour';
  const [open, setOpen] = useState(false);
  const [focus, setFocus] = useState<AssistantFocus>(
    station ? 'riddle' : 'narrative',
  );
  const [question, setQuestion] = useState('');
  const [copyState, setCopyState] = useState<'idle' | 'prompt' | 'context'>(
    'idle',
  );
  const toast = useToast();

  const scope = { draft, locale, kind, station } as const;
  const checks = runLocalAssistantChecks(scope);
  const prompt = buildOpenClawPrompt(scope, focus, question);
  const contextSnapshot = buildContextSnapshot(scope);

  async function copyText(value: string, target: 'prompt' | 'context') {
    try {
      await navigator.clipboard.writeText(value);
      setCopyState(target);
      window.setTimeout(() => setCopyState('idle'), 1600);
    } catch {
      toast({
        title: 'Clipboard unavailable',
        message: 'Could not copy the assistant text on this device.',
        tone: 'error',
      });
    }
  }

  return (
    <section
      className="overflow-hidden rounded-md border border-border bg-white
                 shadow-sm"
    >
      <div
        className="border-b border-border bg-[linear-gradient(135deg,rgba(144,74,72,0.12),rgba(255,248,247,0.9))]
                   px-4 py-4"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-labelSm uppercase tracking-[0.18em] text-primary/80">
              OpenClaw Ready
            </p>
            <h2 className="mt-1 text-h5">Design Assistant</h2>
            <p className="mt-1 text-bodySm text-disabled">
              Local checks now, real AI handoff later.
            </p>
          </div>
          <button className="btn-ghost" onClick={() => setOpen((value) => !value)}>
            {open ? 'Hide' : 'Open'}
          </button>
        </div>
      </div>

      <div className="px-4 py-4">
        <div className="grid grid-cols-2 gap-2">
          {ASSISTANT_FOCUS_OPTIONS.map((option) => (
            <button
              key={option.value}
              type="button"
              className={[
                'rounded-sm border px-3 py-2 text-left text-labelLg transition',
                focus === option.value
                  ? 'border-primary bg-primary text-white'
                  : 'border-border bg-background text-text',
              ].join(' ')}
              onClick={() => {
                setFocus(option.value);
                if (!question.trim()) {
                  setQuestion(defaultQuestionForFocus(kind, option.value));
                }
              }}
            >
              {option.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex flex-col gap-2">
          <label className="text-labelSm text-disabled">
            Ask OpenClaw later
          </label>
          <textarea
            className="input-field min-h-[7rem] resize-y"
            value={question}
            onChange={(event) => setQuestion(event.target.value)}
            placeholder={defaultQuestionForFocus(kind, focus)}
          />
        </div>

        <div className="mt-4 grid gap-2">
          {checks.map((check, index) => (
            <div
              key={`${check.title}-${index}`}
              className={[
                'rounded-sm border px-3 py-2',
                check.level === 'warning'
                  ? 'border-error/30 bg-error/5'
                  : check.level === 'ready'
                    ? 'border-success/30 bg-success/5'
                    : 'border-border bg-background',
              ].join(' ')}
            >
              <p className="text-labelLg text-text">{check.title}</p>
              <p className="mt-1 text-bodySm text-disabled">{check.detail}</p>
            </div>
          ))}
        </div>

        {open && (
          <div className="mt-4 flex flex-col gap-4 border-t border-border pt-4">
            <div className="flex flex-wrap gap-2">
              <button
                className="btn-primary"
                onClick={() => copyText(prompt, 'prompt')}
              >
                {copyState === 'prompt' ? 'Prompt Copied' : 'Copy Prompt'}
              </button>
              <button
                className="btn-ghost"
                onClick={() => copyText(contextSnapshot, 'context')}
              >
                {copyState === 'context' ? 'Context Copied' : 'Copy Context'}
              </button>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-labelSm text-disabled">Prompt preview</p>
              <textarea
                className="input-field min-h-[12rem] resize-y font-mono text-[13px]"
                value={prompt}
                readOnly
              />
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-labelSm text-disabled">Structured context</p>
              <textarea
                className="input-field min-h-[10rem] resize-y font-mono text-[13px]"
                value={contextSnapshot}
                readOnly
              />
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
