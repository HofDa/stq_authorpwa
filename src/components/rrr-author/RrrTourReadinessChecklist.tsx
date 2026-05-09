import type { RrrTourReadiness } from '@/rrr';

interface Props {
  readiness: RrrTourReadiness;
  onSelectStation?: (stationId: string) => void;
}

export function RrrTourReadinessChecklist({
  readiness,
  onSelectStation,
}: Props) {
  if (readiness.modularStationCount === 0) {
    return null;
  }

  const ready = readiness.issueCount === 0;
  const issueCodes = new Set(
    readiness.stations.flatMap((station) =>
      station.issues.map((issue) => issue.code),
    ),
  );
  const checklist = [
    {
      label: 'Alle modularen Rätsel haben Bausteine',
      ok: !issueCodes.has('no_modules'),
    },
    {
      label: 'Alle modularen Rätsel haben Lösungsregeln',
      ok:
        !issueCodes.has('no_condition') &&
        !issueCodes.has('sequence_no_steps') &&
        !issueCodes.has('all_of_no_children') &&
        !issueCodes.has('any_of_no_children'),
    },
    {
      label: 'Keine fehlenden Modul-Verweise',
      ok:
        !issueCodes.has('missing_module_reference') &&
        !issueCodes.has('missing_fallback_reference'),
    },
    {
      label: 'Sensorlastige Bausteine haben Ersatzlösungen oder Warnhinweise',
      ok: !issueCodes.has('sensor_fallback_recommended'),
    },
    {
      label: 'GPS-Radien sind plausibel',
      ok:
        !issueCodes.has('gps_radius_missing') &&
        !issueCodes.has('gps_radius_small') &&
        !issueCodes.has('gps_radius_large'),
    },
    {
      label: 'QR-Bausteine haben erwartete Werte',
      ok: !issueCodes.has('qr_scan_expected_value_empty'),
    },
    {
      label: 'Manuelle Aufgaben haben Anweisungen',
      ok:
        !issueCodes.has('photo_check_manual_prompt_empty') &&
        !issueCodes.has('object_found_prompt_empty') &&
        !issueCodes.has('multi_choice_question_empty') &&
        !issueCodes.has('multi_choice_options_empty') &&
        !issueCodes.has('multi_choice_correct_empty'),
    },
  ];

  return (
    <details
      className={`stq-rrr-tour-readiness ${
        ready ? 'stq-rrr-tour-readiness--ready' : ''
      }`}
      aria-label="RRR readiness checklist"
    >
      <summary className="stq-rrr-tour-readiness__header">
        <div>
          <strong>RRR-Feldtest-Check</strong>
          <span>
            {ready
              ? `${readiness.modularStationCount} modulare Stationen bereit`
              : `${readiness.issueCount} Hinweise in ${readiness.stations.length} Stationen`}
          </span>
        </div>
        <span className="stq-rrr-tour-readiness__badge">
          {ready ? 'Bereit' : 'Prüfen'}
        </span>
      </summary>

      <ul className="stq-rrr-tour-readiness__checks">
        {checklist.map((item) => (
          <li key={item.label} className={item.ok ? 'is-ok' : 'is-warning'}>
            {item.label}
          </li>
        ))}
      </ul>

      {!ready && (
        <div className="stq-rrr-tour-readiness__stations">
          {readiness.stations.map((station) => (
            <article
              key={station.stationId}
              className="stq-rrr-tour-readiness__station"
            >
              <div className="stq-rrr-tour-readiness__station-head">
                <div>
                  <strong>Station {station.stationNumber}</strong>
                  <span>{station.stationLabel}</span>
                </div>
                {onSelectStation && (
                  <button
                    type="button"
                    className="stq-rrr-tour-readiness__jump"
                    onClick={() => onSelectStation(station.stationId)}
                  >
                    Öffnen
                  </button>
                )}
              </div>
              <ul>
                {station.issues.map((issue, index) => (
                  <li key={`${issue.code}-${issue.moduleId ?? 'station'}-${index}`}>
                    {issue.message}
                  </li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      )}
    </details>
  );
}
