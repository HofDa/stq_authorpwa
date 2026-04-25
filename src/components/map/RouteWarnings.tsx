interface Props {
  plannerError: string | null;
  tracking: boolean;
  warnings: string[];
}

export function RouteWarnings({ plannerError, tracking, warnings }: Props) {
  return (
    <div className="mt-3 flex flex-col gap-2">
      {plannerError && (
        <p className="rounded-sm border border-error/30 bg-error/5 px-3 py-2 text-bodySm text-error">
          {plannerError}
        </p>
      )}
      {tracking && (
        <p className="rounded-sm border border-success/30 bg-success/5 px-3 py-2 text-bodySm text-text">
          Live tracking is running. New GPS points are being stored in this draft.
        </p>
      )}
      {warnings.map((warning) => (
        <p
          key={warning}
          className="rounded-sm border border-border bg-white px-3 py-2 text-bodySm text-disabled"
        >
          {warning}
        </p>
      ))}
    </div>
  );
}

