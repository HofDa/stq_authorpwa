import { lazy, Suspense } from 'react';
import type { DesktopStudioShellProps } from './DesktopStudioShell';
import { useMediaQuery } from '@/hooks/useMediaQuery';

const MOBILE_STUDIO_QUERY = '(max-width: 767px)';

const DesktopStudioShell = lazy(() =>
  import('./DesktopStudioShell').then((module) => ({
    default: module.DesktopStudioShell,
  })),
);

const MobileStudioShell = lazy(() =>
  import('./mobile/MobileStudioShell').then((module) => ({
    default: module.MobileStudioShell,
  })),
);

export function Studio(props: DesktopStudioShellProps) {
  const isMobileStudio = useMediaQuery(MOBILE_STUDIO_QUERY);
  const Shell = isMobileStudio ? MobileStudioShell : DesktopStudioShell;

  return (
    <Suspense fallback={<StudioLoadingState />}>
      <Shell {...props} />
    </Suspense>
  );
}

function StudioLoadingState() {
  return (
    <div
      role="status"
      aria-live="polite"
      style={{
        minHeight: '100dvh',
        display: 'grid',
        placeItems: 'center',
        padding: 24,
        background: 'var(--stq-color-bg)',
        color: 'var(--stq-color-text-muted)',
      }}
    >
      <p className="text-bodySm text-disabled">Loading studio...</p>
    </div>
  );
}
