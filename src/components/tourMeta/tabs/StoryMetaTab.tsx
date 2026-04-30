import type { TourEntry } from '@/schema';
import { MetaSectionCard } from '../MetaSectionCard';
import { ChipList, DefList, EmptyHint, placeholder } from '../metaPrimitives';

interface Props {
  tour: TourEntry;
}

/**
 * Read-only summary of `tour.storyMeta`. Strictly separate from
 * `aiContext` — story is the player-facing narrative; aiContext is
 * internal rules. The Story workspace already edits the markdown bible
 * (`draft.storyline`); this tab is for the structured premise/characters.
 */
export function StoryMetaTab({ tour }: Props) {
  const story = tour.storyMeta;
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <MetaSectionCard
        eyebrow="Story"
        title="Prämisse & Bogen"
        description="Was treibt die Geschichte? Strukturierter Editor folgt — bis dahin pflegen Autor:innen den Bogen im Story-Workspace."
      >
        <DefList
          rows={[
            ['Prämisse', story?.premise ?? placeholder('Nicht gesetzt')],
            ['Anfang', story?.arc?.beginning ?? placeholder('—')],
            ['Mitte', story?.arc?.middle ?? placeholder('—')],
            ['Ende', story?.arc?.ending ?? placeholder('—')],
            ['Finale', story?.finale ?? placeholder('Nicht gesetzt')],
            [
              'Wiederkehrende Motive',
              story?.recurringMotifs && story.recurringMotifs.length > 0 ? (
                <ChipList items={story.recurringMotifs} />
              ) : (
                placeholder('Keine')
              ),
            ],
          ]}
        />
      </MetaSectionCard>

      <MetaSectionCard
        eyebrow="Story"
        title="Figuren"
      >
        {story?.characters && story.characters.length > 0 ? (
          <ul
            style={{
              margin: 0,
              padding: 0,
              listStyle: 'none',
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            {story.characters.map((character, index) => (
              <li
                key={`${character.name}-${index}`}
                style={{
                  border: '1px solid var(--stq-border-soft)',
                  borderRadius: 10,
                  padding: '8px 10px',
                  background: 'var(--stq-bg)',
                }}
              >
                <div style={{ fontWeight: 700, fontSize: 13 }}>{character.name}</div>
                <div style={{ fontSize: 12, color: 'var(--stq-text-mute)' }}>
                  {character.role || '—'}
                  {character.personality
                    ? ` · ${character.personality}`
                    : ''}
                </div>
              </li>
            ))}
          </ul>
        ) : (
          placeholder('Keine Figuren angelegt')
        )}
      </MetaSectionCard>

      {!story && (
        <EmptyHint>
          Noch keine Story-Metadaten gepflegt — strukturierte Story-Felder
          werden in einem späteren PR ergänzt.
        </EmptyHint>
      )}
    </div>
  );
}
