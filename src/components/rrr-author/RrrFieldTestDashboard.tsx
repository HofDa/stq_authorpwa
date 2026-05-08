import type {
  RiddleEntry,
  RrrFieldTestStatus,
  TourDraft,
} from '@/schema';
import { formatRrrFieldTestIssueTag } from '@/rrr';

interface Props {
  draft: TourDraft;
  onSelectStation?: (stationId: string) => void;
}

const FIELD_TEST_STATUSES: Array<{
  value: RrrFieldTestStatus;
  label: string;
  emptyLabel: string;
}> = [
  {
    value: 'not_tested',
    label: 'Nicht getestet',
    emptyLabel: 'Keine ungetesteten Stationen',
  },
  {
    value: 'tested_ok',
    label: 'Getestet OK',
    emptyLabel: 'Noch keine Stationen ohne Hinweise',
  },
  {
    value: 'tested_with_warnings',
    label: 'Mit Warnungen',
    emptyLabel: 'Keine Stationen mit Warnungen',
  },
  {
    value: 'needs_fix',
    label: 'Braucht Korrektur',
    emptyLabel: 'Keine Stationen mit Korrekturbedarf',
  },
];

export function RrrFieldTestDashboard({ draft, onSelectStation }: Props) {
  const modularStations = draft.stations.filter(
    (station) => station.riddleType === 'modular',
  );

  if (modularStations.length === 0) {
    return null;
  }

  const counts = FIELD_TEST_STATUSES.map((status) => ({
    ...status,
    count: modularStations.filter(
      (station) => getStationStatus(station) === status.value,
    ).length,
  }));

  return (
    <section
      className="stq-rrr-field-test-dashboard"
      aria-label="RRR field-test dashboard"
    >
      <div className="stq-rrr-field-test-dashboard__header">
        <div>
          <strong>RRR-Feldtest-Status</strong>
          <span>{modularStations.length} modulare Stationen</span>
        </div>
      </div>

      <dl className="stq-rrr-field-test-dashboard__stats">
        <div>
          <dt>Gesamt</dt>
          <dd>{modularStations.length}</dd>
        </div>
        {counts.map((status) => (
          <div key={status.value}>
            <dt>{getCompactStatusLabel(status.value)}</dt>
            <dd>{status.count}</dd>
          </div>
        ))}
      </dl>

      <div className="stq-rrr-field-test-dashboard__groups">
        {FIELD_TEST_STATUSES.map((status) => {
          const stations = modularStations.filter(
            (station) => getStationStatus(station) === status.value,
          );

          return (
            <article
              key={status.value}
              className={`stq-rrr-field-test-dashboard__group stq-rrr-field-test-dashboard__group--${status.value}`}
            >
              <div className="stq-rrr-field-test-dashboard__group-head">
                <strong>{status.label}</strong>
                <span>{stations.length}</span>
              </div>

              {stations.length > 0 ? (
                <ul>
                  {stations.map((station) => (
                    <li key={station.id}>
                      <button
                        type="button"
                        className="stq-rrr-field-test-dashboard__station"
                        onClick={() => onSelectStation?.(station.id)}
                      >
                        <span>
                          Station {station.number}: {getStationLabel(station)}
                        </span>
                        {station.fieldTestIssueTags.length > 0 && (
                          <small>
                            {station.fieldTestIssueTags
                              .map(formatRrrFieldTestIssueTag)
                              .join(', ')}
                          </small>
                        )}
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p>{status.emptyLabel}</p>
              )}
            </article>
          );
        })}
      </div>
    </section>
  );
}

function getStationStatus(station: RiddleEntry): RrrFieldTestStatus {
  return station.fieldTestStatus ?? 'not_tested';
}

function getStationLabel(station: RiddleEntry): string {
  return (
    station.de.location.trim() ||
    station.en.location.trim() ||
    station.it.location.trim() ||
    `Station ${station.number}`
  );
}

function getCompactStatusLabel(status: RrrFieldTestStatus): string {
  switch (status) {
    case 'tested_ok':
      return 'OK';
    case 'tested_with_warnings':
      return 'Warnungen';
    case 'needs_fix':
      return 'Fix';
    case 'not_tested':
      return 'Offen';
  }
}
