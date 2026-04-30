interface Props {
  label: string;
}

export function AgentPanel({ label }: Props) {
  return (
    <>
      <h2>AI agent</h2>
      <p className="stq-riddle-modal-copy">
        The agent action for {label} is intentionally not connected yet.
      </p>
      <button type="button" className="stq-riddle-modal-save" disabled>
        Coming later
      </button>
    </>
  );
}
