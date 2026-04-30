import { useState } from 'react';

export type AuthorPanelTarget =
  | { kind: 'edit'; targetPath: string; label: string }
  | { kind: 'agent'; targetPath: string; label: string };

export function useAuthorSelection() {
  const [target, setTarget] = useState<AuthorPanelTarget | null>(null);
  return {
    target,
    close: () => setTarget(null),
    edit: (targetPath: string, label: string) =>
      setTarget({ kind: 'edit', targetPath, label }),
    agent: (targetPath: string, label: string) =>
      setTarget({ kind: 'agent', targetPath, label }),
  };
}
