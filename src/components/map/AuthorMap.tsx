import { lazy, Suspense } from 'react';
import {
  sanitizeAuthorMapProps,
  type AuthorMapProps,
} from './mapTypes';

const MapLibreAuthorMap = lazy(() =>
  import('./MapLibreAuthorMap').then((module) => ({
    default: module.MapLibreAuthorMap,
  })),
);

/**
 * Single map renderer for the whole authoring app. We removed the
 * Leaflet path — MapLibre handles every author-side map.
 */
export function AuthorMap(props: AuthorMapProps) {
  const sanitizedProps = sanitizeAuthorMapProps(props);
  return (
    <Suspense fallback={<AuthorMapLoadingState props={sanitizedProps} />}>
      <MapLibreAuthorMap {...sanitizedProps} />
    </Suspense>
  );
}

function AuthorMapLoadingState({ props }: { props: AuthorMapProps }) {
  return (
    <div
      className={props.className}
      style={{
        ...props.style,
        display: 'grid',
        placeItems: 'center',
        background:
          'linear-gradient(180deg, var(--stq-color-surface-cream) 0%, var(--stq-bg-alt) 100%)',
        color: 'var(--stq-color-text-muted)',
      }}
      role="status"
      aria-live="polite"
    >
      <span className="text-bodySm">Loading map...</span>
    </div>
  );
}
