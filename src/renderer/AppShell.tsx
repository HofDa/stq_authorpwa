import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function AppShell({ children }: Props) {
  return <div className="stq-fake-native-app-shell">{children}</div>;
}
