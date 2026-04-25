import { describe, expect, it } from 'vitest';
import { resolveMapProvider, resolveMapStyleUrl } from './mapConfig';

describe('resolveMapProvider', () => {
  it('defaults to maplibre when no env value is set', () => {
    expect(resolveMapProvider(undefined)).toBe('maplibre');
  });

  it('keeps leaflet as an explicit fallback', () => {
    expect(resolveMapProvider('leaflet')).toBe('leaflet');
  });

  it('uses maplibre for the explicit provider value', () => {
    expect(resolveMapProvider('maplibre')).toBe('maplibre');
  });
});

describe('resolveMapStyleUrl', () => {
  it('prefers the generic map style env var', () => {
    expect(resolveMapStyleUrl(' https://example.com/style.json ', 'legacy')).toBe(
      'https://example.com/style.json',
    );
  });

  it('falls back to the legacy maplibre env var', () => {
    expect(resolveMapStyleUrl(undefined, ' https://legacy.example/style.json ')).toBe(
      'https://legacy.example/style.json',
    );
  });
});
