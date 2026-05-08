import type { RrrWarning } from '@/rrr';

interface Props {
  warnings: RrrWarning[];
  expertMode?: boolean;
}

export function RrrWarningsPanel({ warnings, expertMode = false }: Props) {
  if (warnings.length === 0) return null;

  return (
    <div className="stq-rrr-warnings" role="status" aria-label="Hinweise">
      <div className="stq-rrr-warnings__header">
        <strong>Hinweise</strong>
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
              aria-label={warning.severity === 'warning' ? 'Warnung' : 'Hinweis'}
            >
              {warning.severity === 'warning' ? 'Warnung' : 'Hinweis'}
            </span>
            <span className="stq-rrr-warnings__message">
              {expertMode && warning.moduleId ? (
                <code>{warning.moduleId}</code>
              ) : null}
              {getWarningMessage(warning, expertMode)}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function getWarningMessage(warning: RrrWarning, expertMode: boolean): string {
  if (expertMode) {
    return warning.message;
  }
  if (warning.code === 'missing_module_reference') {
    return 'Die Lösungsregel verweist auf einen fehlenden Baustein.';
  }
  if (warning.code === 'missing_fallback_reference') {
    return 'Die Ersatzlösung verweist auf einen fehlenden Baustein.';
  }
  return warning.message;
}
