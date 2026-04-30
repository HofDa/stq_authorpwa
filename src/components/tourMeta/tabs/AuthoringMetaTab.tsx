import type { TourEntry } from '@/schema';
import { findChoiceLabel } from '@/domain/tourMeta/choices';
import { MetaSectionCard } from '../MetaSectionCard';
import { ChipList, DefList, EmptyHint, placeholder } from '../metaPrimitives';

interface Props {
  tour: TourEntry;
}

/**
 * Read-only summary of `tour.authoringMeta`. Editor follows in PR-40.
 */
export function AuthoringMetaTab({ tour }: Props) {
  const meta = tour.authoringMeta;
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <MetaSectionCard
        eyebrow="Authoring"
        title="Redaktionelle Steuerung"
        description="Zielgruppe, Tonalität, Lernziele — Editor folgt mit PR-40."
      >
        <DefList
          rows={[
            [
              'Primäre Zielgruppe',
              meta?.primaryAudience
                ? findChoiceLabel('audience', meta.primaryAudience)
                : placeholder('Nicht gesetzt'),
            ],
            [
              'Weitere Zielgruppen',
              meta?.secondaryAudiences && meta.secondaryAudiences.length > 0 ? (
                <ChipList
                  items={meta.secondaryAudiences.map((id) =>
                    findChoiceLabel('audience', id),
                  )}
                />
              ) : (
                placeholder('Keine')
              ),
            ],
            [
              'Tonalität',
              meta?.tone && meta.tone.length > 0 ? (
                <ChipList
                  items={meta.tone.map((id) => findChoiceLabel('tone', id))}
                />
              ) : (
                placeholder('Nicht gesetzt')
              ),
            ],
            [
              'Zu vermeiden',
              meta?.avoidTone && meta.avoidTone.length > 0 ? (
                <ChipList
                  items={meta.avoidTone.map((id) =>
                    findChoiceLabel('avoidTone', id),
                  )}
                />
              ) : (
                placeholder('Keine')
              ),
            ],
            ['Lesestufe', meta?.readingLevel ?? placeholder('Nicht gesetzt')],
          ]}
        />
      </MetaSectionCard>

      <MetaSectionCard
        eyebrow="Didaktik"
        title="Lernziele & Methoden"
        description="Wie soll das Erlebnis funktionieren?"
      >
        <DefList
          rows={[
            [
              'Lernziele',
              meta?.learningGoals && meta.learningGoals.length > 0 ? (
                <ChipList items={meta.learningGoals} />
              ) : (
                placeholder('Keine')
              ),
            ],
            [
              'Didaktische Modi',
              meta?.didacticModes && meta.didacticModes.length > 0 ? (
                <ChipList
                  items={meta.didacticModes.map((id) =>
                    findChoiceLabel('didacticMode', id),
                  )}
                />
              ) : (
                placeholder('Nicht gesetzt')
              ),
            ],
            [
              'Qualitätsregeln',
              meta?.editorialRules && meta.editorialRules.length > 0 ? (
                <ChipList items={meta.editorialRules} />
              ) : (
                placeholder('Keine')
              ),
            ],
          ]}
        />
      </MetaSectionCard>

      {!meta && (
        <EmptyHint>
          Noch keine Authoring-Metadaten gepflegt — der Authoring-Editor
          (PR-40) füllt diesen Tab.
        </EmptyHint>
      )}
    </div>
  );
}
