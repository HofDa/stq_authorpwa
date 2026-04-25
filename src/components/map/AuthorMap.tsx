import { lazy, Suspense } from 'react';
import {
  sanitizeAuthorMapProps,
  type AuthorMapProps,
} from './mapTypes';
import { MAP_PROVIDER } from './mapConfig';
import { LeafletAuthorMap } from './LeafletAuthorMap';

const LazyMapLibreAuthorMap = lazy(async () => {
  const module = await import('./MapLibreAuthorMap');
  return { default: module.MapLibreAuthorMap };
});

export function AuthorMap(props: AuthorMapProps) {
  const sanitizedProps = sanitizeAuthorMapProps(props);

  if (MAP_PROVIDER === 'maplibre') {
    return (
      <Suspense
        fallback={
          <div className={sanitizedProps.className} style={sanitizedProps.style} />
        }
      >
        <LazyMapLibreAuthorMap {...sanitizedProps} />
      </Suspense>
    );
  }
  return <LeafletAuthorMap {...sanitizedProps} />;
}
