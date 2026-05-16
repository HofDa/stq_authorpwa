import type {
  RiddleEntry,
  RrrFieldTestStatus,
  TourDraft,
} from '@/schema';
import {
  RRR_FIELD_TEST_STATUS_OPTIONS,
  formatRrrFieldTestIssueTag,
  getRrrFieldTestCompactStatusLabel,
  getRrrFieldTestDashboardStatusLabel,
  getRrrFieldTestEmptyStatusLabel,
} from '@/rrr';

interface Props {
  draft: TourDraft;
  onSelectStation?: (stationId: string) => void;
}

export function RrrFieldTestDashboard({ draft, onSelectStation }: Props) {
  const modularStations = draft.stations.filter(
    (station) => station.riddleType === 'modular',
  );

  if (modularStations.length === 0) {
    return null;
  }

  const counts = RRR_FIELD_TEST_STATUS_OPTIONS.map((status) => ({
    ...status,
    count: modularStations.filter(
      (station) => getStationStatus(station) === status.value,
    ).length,
  }));

  return (
    <details
      className="stq-rrr-field-test-dashboard"
      aria-label="RRR field-test dashboard"
    >
      <summary className="stq-rrr-field-test-dashboard__header">
        <div>
          <strong>RRR-Feldtest-Status</strong>
          <span>{modularStations.length} modulare Stationen</span>
        </div>
      </summary>

      <dl className="stq-rrr-field-test-dashboard__stats">
        <div>
          <dt>Gesamt</dt>
          <dd>{modularStations.length}</dd>
        </div>
        {counts.map((status) => (
          <div key={status.value}>
            <dt>{getRrrFieldTestCompactStatusLabel(status.value)}</dt>
            <dd>{status.count}</dd>
          </div>
        ))}
      </dl>

      <div className="stq-rrr-field-test-dashboard__groups">
        {RRR_FIELD_TEST_STATUS_OPTIONS.map((status) => {
          const stations = modularStations.filter(
            (station) => getStationStatus(station) === status.value,
          );

          return (
            <article
              key={status.value}
              className={`stq-rrr-field-test-dashboard__group stq-rrr-field-test-dashboard__group--${status.value}`}
            >
              <div className="stq-rrr-field-test-dashboard__group-head">
                <strong>
                  {getRrrFieldTestDashboardStatusLabel(status.value)}
                </strong>
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
                <p>{getRrrFieldTestEmptyStatusLabel(status.value)}</p>
              )}
            </article>
          );
        })}
      </div>
    </details>
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
