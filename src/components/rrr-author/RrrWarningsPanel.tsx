import type { RrrWarning } from '@/rrr';

interface Props {
  warnings: RrrWarning[];
}

export function RrrWarningsPanel({ warnings }: Props) {
  if (warnings.length === 0) return null;

  return (
    <div className="stq-rrr-warnings" role="status" aria-label="RRR warnings">
      <div className="stq-rrr-warnings__header">
        <strong>Warnings</strong>
        <span>{warnings.length}</span>
      </div>
      <ul>
        {warnings.map((warning, index) => (
          <li
            key={`${warning.code}-${warning.moduleId ?? index}`}
            className={`stq-rrr-warnings__item stq-rrr-warnings__item--${warning.severity}`}
          >
            <span
              className={`stq-rrr-warnings__badge stq-rrr-warnings__badge--${warning.severity}`}
              aria-label={warning.severity}
            >
              {warning.severity}
            </span>
            <span className="stq-rrr-warnings__message">
              {warning.moduleId ? <code>{warning.moduleId}</code> : null}
              {warning.message}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
