import { lazy, Suspense, type ReactNode } from 'react';

export const TourRedirectRoute = lazy(() =>
  import('@/pages/TourRedirectPage').then((module) => ({
    default: module.TourRedirectPage,
  })),
);

export const TourEditorRoute = lazy(() =>
  import('@/pages/TourEditorPage').then((module) => ({
    default: module.TourEditorPage,
  })),
);

export const RrrRuntimeDemoRoute = lazy(() =>
  import('@/pages/RrrRuntimeDemo').then((module) => ({
    default: module.RrrRuntimeDemo,
  })),
);

export const RrrFieldTestRoute = lazy(() =>
  import('@/pages/RrrFieldTest').then((module) => ({
    default: module.RrrFieldTest,
  })),
);

export function LazyRouteElement({ children }: { children: ReactNode }) {
  return <Suspense fallback={<RouteLoadingState />}>{children}</Suspense>;
}

function RouteLoadingState() {
  return (
    <div
      role="status"
      aria-live="polite"
      className="stq-loading-shell"
    >
      <p className="text-bodySm text-disabled">Loading...</p>
    </div>
  );
}
