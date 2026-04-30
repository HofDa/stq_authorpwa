import type { ReactNode } from 'react';

interface Props {
  children: ReactNode;
}

export function FakePhoneFrame({ children }: Props) {
  return <div className="stq-fake-phone-frame">{children}</div>;
}
