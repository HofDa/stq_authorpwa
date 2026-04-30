import { useCallback, useState, type CSSProperties } from 'react';
import type { ContentBlock, Locale, TourDraft, TourLocaleContent } from '@/schema';
import { EditableContentSection } from '@/components/editable/EditableContentSection';
import { buildAssistantAction } from '@/services/ai/agentActions';
import { Icon, type IconName } from '../Icon';
import {
  AssistantSlot,
  useAssistantSuggestions,
  type AssistantAction,
} from '../assistant';
import {
  getTourReadiness,
  getWorstStatus,
} from '../readiness';

interface Props {
  draft: TourDraft;
  locale: Locale;
  onChange: (
    patch: Partial<TourDraft> | ((prev: TourDraft) => TourDraft),
  ) => void;
}

type StoryTab = 'storyline' | 'intro' | 'outro';

/**
 * Story workspace — answers "why is this tour exciting?".
 *
 * Surfaces the three editable shapes the data model already supports
 * (storyline markdown, intro blocks, outro blocks) plus calm placeholders
 * for tone-of-voice / characters / writing rules. The AssistantSlot is
 * inert for now — actions are disabled until the AI provider lands.
 */
export function StoryWorkspace({ draft, locale, onChange }: Props) {
  const [tab, setTab] = useState<StoryTab>('storyline');
  const tourChecks = getTourReadiness(draft, locale).filter(
    (c) => c.target?.section === 'story',
  );
  const { suggestions } = useAssistantSuggestions({
    section: 'story',
    draft,
    locale,
  });

  const setStorylineMarkdown = useCallback(
    (markdown: string) => {
      onChange((prev) => ({
        ...prev,
        storyline: {
          ...prev.storyline,
          markdown,
          updatedAt: Date.now(),
        },
      }));
    },
    [onChange],
  );

  const patchLocale = useCallback(
    (patch: Partial<TourLocaleContent>) => {
      onChange((prev) => ({
        ...prev,
        tour: {
          ...prev.tour,
          [locale]: { ...prev.tour[locale], ...patch },
        },
      }));
    },
    [locale, onChange],
  );

  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        overflow: 'auto',
        padding: '4px 4px 24px',
        display: 'flex',
        flexDirection: 'column',
        gap: 14,
      }}
    >
      <header>
        <div style={eyebrowStyle}>Story</div>
        <h1
          style={{
            fontFamily: 'Lato, Georgia, serif',
            fontSize: 22,
            fontWeight: 700,
            margin: '4px 0 0',
          }}
        >
          Why is this tour exciting?
        </h1>
        <p
          style={{
            margin: '4px 0 0',
            color: 'var(--stq-text-mute)',
            fontSize: 13,
          }}
        >
          Shape the narrative bible, intro and outro players will experience.
          The per-station AI assistant later reads the storyline to keep
          suggestions consistent.
        </p>
      </header>

      <div
        style={{
          display: 'grid',
          gridTemplateColumns: 'minmax(0, 1fr) 320px',
          gap: 14,
          alignItems: 'start',
        }}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
          <Card>
            <SectionHeader
              icon="sparkles"
              eyebrow="Narrative"
              title="Story core"
            />
            <div className="studio-seg" style={{ marginTop: 8 }}>
              <button
                type="button"
                className={tab === 'storyline' ? 'active' : ''}
                onClick={() => setTab('storyline')}
              >
                Storyline
              </button>
              <button
                type="button"
                className={tab === 'intro' ? 'active' : ''}
                onClick={() => setTab('intro')}
              >
                Intro
              </button>
              <button
                type="button"
                className={tab === 'outro' ? 'active' : ''}
                onClick={() => setTab('outro')}
              >
                Outro
              </button>
            </div>
            <div style={{ marginTop: 12 }}>
              {tab === 'storyline' && (
                <StorylineEditor
                  markdown={draft.storyline.markdown}
                  onChange={setStorylineMarkdown}
                />
              )}
              {tab === 'intro' && (
                <BlocksEditor
                  draftId={draft.draftId}
                  blocks={draft.tour[locale].introSection}
                  onChange={(next: ContentBlock[]) =>
                    patchLocale({ introSection: next })
                  }
                  emptyState="No intro blocks yet. Add a heading or paragraph to set the scene."
                />
              )}
              {tab === 'outro' && (
                <BlocksEditor
                  draftId={draft.draftId}
                  blocks={draft.tour[locale].outroSection}
                  onChange={(next: ContentBlock[]) =>
                    patchLocale({ outroSection: next })
                  }
                  emptyState="No outro blocks yet. Add a closing paragraph players see when they finish."
                />
              )}
            </div>
          </Card>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
              gap: 12,
            }}
          >
            <Card>
              <SectionHeader
                icon="sparkles"
                eyebrow="Tone of voice"
                title="How the tour should sound"
              />
              <Placeholder>
                Warm, curious, lightly playful — note the voice once and the
                station assistant will respect it. Structured tone fields land
                in a later PR.
              </Placeholder>
            </Card>
            <Card>
              <SectionHeader
                icon="map-pin"
                eyebrow="Characters & motifs"
                title="Recurring threads"
              />
              <Placeholder>
                Capture characters, symbols, or motifs that should reappear at
                multiple stations. Structured fields land in a later PR.
              </Placeholder>
            </Card>
            <Card>
              <SectionHeader
                icon="check-circle"
                eyebrow="Writing rules"
                title="Do / don't"
              />
              <Placeholder>
                e.g. avoid spoilers before station 3, never break the second
                person, keep paragraphs under three lines. A real list lands
                later.
              </Placeholder>
            </Card>
          </div>
        </div>

        <AssistantSlot
          section="story"
          title="Story assistant"
          description="Will help spin up storylines, sharpen intros and outros, and check tone consistency. Local checks plus offline suggestions until the AI provider is wired up."
          checks={tourChecks}
          actions={STORY_ACTIONS}
          suggestions={suggestions}
        />
      </div>
    </div>
  );
}

const STORY_ACTIONS: AssistantAction[] = [
  buildAssistantAction('story.createStoryline', {
    description: 'Disabled until the AI provider is connected.',
    disabled: true,
  }),
  buildAssistantAction('story.refineIntro', {
    description: 'Disabled until the AI provider is connected.',
    disabled: true,
  }),
  buildAssistantAction('story.refineOutro', {
    description: 'Disabled until the AI provider is connected.',
    disabled: true,
  }),
];

function StorylineEditor({
  markdown,
  onChange,
}: {
  markdown: string;
  onChange: (next: string) => void;
}) {
  const status = getWorstStatus([
    {
      id: 'storyline',
      label: 'storyline',
      status: markdown.trim() ? 'ready' : 'missing',
    },
  ]);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div
        style={{
          fontSize: 12,
          color: 'var(--stq-text-mute)',
          lineHeight: 1.5,
        }}
      >
        Author-only narrative bible. Hooks, twists and tone live here so the
        per-station assistant can stay consistent. Plain markdown — never
        exported.
      </div>
      <textarea
        value={markdown}
        onChange={(event) => onChange(event.target.value)}
        spellCheck
        rows={12}
        placeholder="# The hidden coronation
A passing remark in chapter one becomes a clue in chapter four..."
        style={{
          width: '100%',
          fontFamily: 'ui-monospace, "JetBrains Mono", monospace',
          fontSize: 12.5,
          lineHeight: 1.55,
          padding: '10px 12px',
          borderRadius: 12,
          border: '1px solid var(--stq-border)',
          background: 'var(--stq-bg)',
          color: 'var(--stq-text)',
          resize: 'vertical',
          minHeight: 200,
        }}
      />
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: 11,
          color: 'var(--stq-text-mute)',
        }}
      >
        <span>{markdown.trim().length} characters</span>
        <span>
          {status === 'ready' ? 'Saved locally' : 'Empty — add at least a hook.'}
        </span>
      </div>
    </div>
  );
}

function BlocksEditor({
  draftId,
  blocks,
  onChange,
  emptyState,
}: {
  draftId: string;
  blocks: ContentBlock[];
  onChange: (next: ContentBlock[]) => void;
  emptyState: string;
}) {
  return (
    <div
      style={{
        background: 'var(--stq-bg)',
        border: '1px solid var(--stq-border-soft)',
        borderRadius: 12,
        padding: '6px 8px',
      }}
    >
      {blocks.length === 0 && (
        <div
          style={{
            padding: 10,
            fontSize: 12.5,
            color: 'var(--stq-text-mute)',
          }}
        >
          {emptyState}
        </div>
      )}
      <EditableContentSection
        draftId={draftId}
        blocks={blocks}
        onChange={onChange}
      />
    </div>
  );
}

function Card({ children }: { children: React.ReactNode }) {
  return (
    <section
      style={{
        background: 'white',
        border: '1px solid var(--stq-border)',
        borderRadius: 18,
        padding: 16,
        boxShadow: 'var(--stq-shadow-soft)',
      }}
    >
      {children}
    </section>
  );
}

function SectionHeader({
  icon,
  eyebrow,
  title,
}: {
  icon: IconName;
  eyebrow: string;
  title: string;
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span
        style={{
          display: 'inline-grid',
          placeItems: 'center',
          width: 26,
          height: 26,
          borderRadius: 8,
          background: 'rgba(144, 74, 72, 0.08)',
          color: 'var(--stq-primary)',
        }}
      >
        <Icon name={icon} size={14} />
      </span>
      <div>
        <div style={eyebrowStyle}>{eyebrow}</div>
        <div
          style={{
            fontFamily: 'Lato, Georgia, serif',
            fontSize: 14.5,
            fontWeight: 700,
            lineHeight: 1.2,
          }}
        >
          {title}
        </div>
      </div>
    </div>
  );
}

function Placeholder({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        marginTop: 8,
        padding: 10,
        border: '1px dashed var(--stq-border)',
        borderRadius: 12,
        background: 'var(--stq-bg)',
        fontSize: 12.5,
        color: 'var(--stq-text-mute)',
        lineHeight: 1.5,
        fontStyle: 'italic',
      }}
    >
      {children}
    </div>
  );
}

const eyebrowStyle: CSSProperties = {
  fontSize: 10,
  fontWeight: 700,
  letterSpacing: '0.14em',
  color: 'var(--stq-primary)',
  textTransform: 'uppercase',
};
