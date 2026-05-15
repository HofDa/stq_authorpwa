import { describe, expect, it } from 'vitest';
import {
  getActiveRouteHitLayerIds,
  getRouteEndpointPoints,
  parseDashArray,
  sanitizeLayerSuffix,
  type RouteLayerRef,
} from './mapLibreUtils';

describe('parseDashArray', () => {
  it('keeps positive numeric dash values', () => {
    expect(parseDashArray('4, 2 0 bad 3')).toEqual([4, 2, 3]);
  });

  it('returns undefined when no usable dash values exist', () => {
    expect(parseDashArray('0, -1, nope')).toBeUndefined();
  });
});

describe('getRouteEndpointPoints', () => {
  it('returns both endpoints for an open route', () => {
    expect(
      getRouteEndpointPoints([
        { lat: 46.49, lng: 11.34 },
        { lat: 46.5, lng: 11.35 },
      ]),
    ).toEqual([
      { lat: 46.49, lng: 11.34 },
      { lat: 46.5, lng: 11.35 },
    ]);
  });

  it('returns one endpoint for a closed route', () => {
    expect(
      getRouteEndpointPoints([
        { lat: 46.49, lng: 11.34 },
        { lat: 46.49, lng: 11.34 },
      ]),
    ).toEqual([{ lat: 46.49, lng: 11.34 }]);
  });
});

describe('sanitizeLayerSuffix', () => {
  it('keeps MapLibre layer ids safe', () => {
    expect(sanitizeLayerSuffix('route 1/foo.bar')).toBe('route-1-foo-bar');
  });
});

describe('getActiveRouteHitLayerIds', () => {
  it('returns only route hit layers that still exist on the map', () => {
    const layers: RouteLayerRef[] = [
      { layerId: 'route-a', sourceId: 'source-a', hitLayerId: 'hit-a' },
      { layerId: 'route-b', sourceId: 'source-b', hitLayerId: 'hit-b' },
      { layerId: 'route-c', sourceId: 'source-c' },
    ];
    const map = {
      getLayer: (layerId: string) => (layerId === 'hit-b' ? {} : undefined),
    };

    expect(getActiveRouteHitLayerIds(map, layers)).toEqual(['hit-b']);
  });
});
