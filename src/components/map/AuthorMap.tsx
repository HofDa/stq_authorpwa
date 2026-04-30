import {
  sanitizeAuthorMapProps,
  type AuthorMapProps,
} from './mapTypes';
import { MapLibreAuthorMap } from './MapLibreAuthorMap';

/**
 * Single map renderer for the whole authoring app. We removed the
 * Leaflet path — MapLibre handles every author-side map.
 */
export function AuthorMap(props: AuthorMapProps) {
  const sanitizedProps = sanitizeAuthorMapProps(props);
  return <MapLibreAuthorMap {...sanitizedProps} />;
}
