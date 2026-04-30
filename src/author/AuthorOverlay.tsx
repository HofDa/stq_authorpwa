import type { ReactNode } from 'react';
import type { IconName } from '@/components/studio/Icon';
import { AuthorToolbar } from './AuthorToolbar';

interface Props {
  targetPath: string;
  label: string;
  children?: ReactNode;
  tone?: 'light' | 'dark';
  agentIcon?: IconName;
  onEdit: (targetPath: string, label: string) => void;
  onAgent: (targetPath: string, label: string) => void;
}

export function AuthorOverlay({
  targetPath,
  label,
  children,
  tone,
  agentIcon,
  onEdit,
  onAgent,
}: Props) {
  return (
    <>
      {children}
      <AuthorToolbar
        label={label}
        tone={tone}
        agentIcon={agentIcon}
        onEdit={() => onEdit(targetPath, label)}
        onAgent={() => onAgent(targetPath, label)}
      />
    </>
  );
}
