import type { TourEntry } from '@/schema';
import { findChoiceLabel } from '@/domain/tourMeta/choices';
import { MetaSectionCard } from '../MetaSectionCard';
import { ChipList, DefList, EmptyHint, placeholder } from '../metaPrimitives';

interface Props {
  tour: TourEntry;
}

/**
 * Read-only summary of `tour.aiContext`. The AI Context Builder (PR-41)
 * lets authors configure these via buttons. Story-level data lives in a
 * separate tab — never mix the two.
 */
export function AIContextMetaTab({ tour }: Props) {
  const ai = tour.aiContext;
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <MetaSectionCard
        eyebrow="AI-Kontext"
        title="Rolle & Kernidee"
        description="Wie soll sich die KI verhalten? Diese Felder gehen später in den Prompt."
      >
        <DefList
          rows={[
            [
              'Assistant-Rolle',
              ai?.assistantRole ?? placeholder('Nicht gesetzt'),
            ],
            ['Kernidee', ai?.coreIdea ?? placeholder('Nicht gesetzt')],
            [
              'Tonalitätsleitplanken',
              ai?.toneGuidelines && ai.toneGuidelines.length > 0 ? (
                <ChipList items={ai.toneGuidelines} />
              ) : (
                placeholder('Keine')
              ),
            ],
          ]}
        />
      </MetaSectionCard>

      <MetaSectionCard
        eyebrow="Rätsel"
        title="Bevorzugte & vermiedene Rätseltypen"
      >
        <DefList
          rows={[
            [
              'Bevorzugt',
              ai?.preferredRiddleTypes && ai.preferredRiddleTypes.length > 0 ? (
                <ChipList
                  items={ai.preferredRiddleTypes.map((id) =>
                    findChoiceLabel('riddleType', id),
                  )}
                />
              ) : (
                placeholder('Keine')
              ),
            ],
            [
              'Vermeiden',
              ai?.avoidRiddleTypes && ai.avoidRiddleTypes.length > 0 ? (
                <ChipList
                  items={ai.avoidRiddleTypes.map((id) =>
                    findChoiceLabel('avoidRiddleType', id),
                  )}
                />
              ) : (
                placeholder('Keine')
              ),
            ],
          ]}
        />
      </MetaSectionCard>

      <MetaSectionCard
        eyebrow="Guardrails"
        title="Sicherheit & Quellenpolitik"
      >
        <DefList
          rows={[
            [
              'AI Guardrails',
              ai?.guardrails && ai.guardrails.length > 0 ? (
                <ChipList
                  items={ai.guardrails.map((id) =>
                    findChoiceLabel('aiGuardrail', id),
                  )}
                />
              ) : (
                placeholder('Keine')
              ),
            ],
            [
              'Sicherheitsregeln',
              ai?.safetyRules && ai.safetyRules.length > 0 ? (
                <ChipList
                  items={ai.safetyRules.map((id) =>
                    findChoiceLabel('safetyRule', id),
                  )}
                />
              ) : (
                placeholder('Keine')
              ),
            ],
            [
              'Quellenpolitik',
              renderSourcePolicy(ai?.sourcePolicy),
            ],
          ]}
        />
      </MetaSectionCard>

      {!ai && (
        <EmptyHint>
          Noch keine AI-Regeln gepflegt — der AI Context Builder (PR-41)
          füllt diesen Tab.
        </EmptyHint>
      )}
    </div>
  );
}

function renderSourcePolicy(
  policy: TourEntry['aiContext'] extends infer T
    ? T extends { sourcePolicy?: infer P }
      ? P | undefined
      : undefined
    : undefined,
): React.ReactNode {
  if (!policy) return placeholder('Keine');
  const items: string[] = [];
  if (policy.mayUseProvidedSourcesOnly) items.push('Nur freigegebene Quellen');
  if (policy.mustMarkUnverifiedClaims) items.push('Unsichere Fakten markieren');
  if (policy.neverInventLocalHistory) items.push('Keine lokalen Fakten erfinden');
  if (items.length === 0) return placeholder('Keine');
  return <ChipList items={items} />;
}
