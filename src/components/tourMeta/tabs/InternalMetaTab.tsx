import type { TourEntry } from '@/schema';
import { MetaSectionCard } from '../MetaSectionCard';
import { DefList, EmptyHint, placeholder } from '../metaPrimitives';

interface Props {
  tour: TourEntry;
}

/**
 * Read-only summary of `tour.adminMeta`. Internal-only — never rendered
 * to end-users. Editor lands in PR-39.
 */
export function InternalMetaTab({ tour }: Props) {
  const meta = tour.adminMeta;
  return (
    <div style={{ display: 'grid', gap: 12 }}>
      <MetaSectionCard
        eyebrow="Intern"
        title="Status & Verantwortlichkeiten"
        description="Nur intern — wird Endnutzer:innen nie angezeigt."
      >
        <DefList
          rows={[
            ['Status', meta?.status ?? placeholder('Nicht gesetzt')],
            ['Owner', meta?.owner ?? placeholder('Nicht gesetzt')],
            ['Geprüft von', meta?.reviewedBy ?? placeholder('Nicht gesetzt')],
            ['Schema', meta?.schemaVersion ?? placeholder('—')],
            ['Inhalt-Version', meta?.contentVersion ?? placeholder('—')],
            [
              'Freigabe',
              meta?.approvedForPublishing
                ? 'Ja'
                : placeholder('Noch nicht freigegeben'),
            ],
            ['Erstellt', meta?.createdAt ?? placeholder('—')],
            ['Geändert', meta?.updatedAt ?? placeholder('—')],
          ]}
        />
      </MetaSectionCard>

      <MetaSectionCard
        eyebrow="Rechte"
        title="Rechteklärung"
        description="Editor folgt mit PR-39."
      >
        <DefList
          rows={[
            [
              'Bildrechte geklärt',
              boolPlaceholder(meta?.rights?.imageRightsCleared),
            ],
            [
              'Audiorechte geklärt',
              boolPlaceholder(meta?.rights?.audioRightsCleared),
            ],
            [
              'Drittinhalte enthalten',
              boolPlaceholder(meta?.rights?.usesThirdPartyContent),
            ],
            [
              'Kommune muss freigeben',
              boolPlaceholder(meta?.rights?.requiresMunicipalityApproval),
            ],
          ]}
        />
      </MetaSectionCard>

      {!meta && (
        <EmptyHint>
          Noch keine internen Metadaten gepflegt — der Admin-Editor (PR-39)
          füllt diesen Tab.
        </EmptyHint>
      )}
    </div>
  );
}

function boolPlaceholder(value: boolean | undefined): React.ReactNode {
  if (value === true) return 'Ja';
  if (value === false) return 'Nein';
  return placeholder('Nicht gesetzt');
}
