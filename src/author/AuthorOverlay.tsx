import type { ReactNode } from 'react';
import { AuthorToolbar } from './AuthorToolbar';

interface Props {
  targetPath: string;
  label: string;
  children?: ReactNode;
  tone?: 'light' | 'dark';
  accent?: 'image' | 'icon' | 'story' | 'facts' | 'riddle' | 'success';
  onEdit: (targetPath: string, label: string) => void;
}

export function AuthorOverlay({
  targetPath,
  label,
  children,
  tone,
  accent,
  onEdit,
}: Props) {
  return (
    <>
      {children}
      <AuthorToolbar
        label={label}
        tone={tone}
        accent={accent}
        onEdit={() => onEdit(targetPath, label)}
      />
    </>
  );
}
