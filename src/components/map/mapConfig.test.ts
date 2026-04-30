import { describe, expect, it } from 'vitest';
import {
  buildRasterBasemapStyle,
  expandTileUrlSubdomains,
  resolveMapLibreStyle,
  resolveMapStyleUrl,
} from './mapConfig';

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

describe('expandTileUrlSubdomains', () => {
  it('expands {s} tile URL subdomains for MapLibre raster sources', () => {
    expect(
      expandTileUrlSubdomains('https://{s}.tile.example/{z}/{x}/{y}.png', [
        'a',
        'b',
      ]),
    ).toEqual([
      'https://a.tile.example/{z}/{x}/{y}.png',
      'https://b.tile.example/{z}/{x}/{y}.png',
    ]);
  });

  it('strips the subdomain token when no subdomains are configured', () => {
    expect(
      expandTileUrlSubdomains('https://{s}.tile.example/{z}/{x}/{y}.png', undefined),
    ).toEqual(['https://tile.example/{z}/{x}/{y}.png']);
  });

  it('keeps tile URLs without subdomain tokens unchanged', () => {
    expect(
      expandTileUrlSubdomains('https://tiles.example/{z}/{x}/{y}.png', ['a']),
    ).toEqual(['https://tiles.example/{z}/{x}/{y}.png']);
  });
});

describe('buildRasterBasemapStyle', () => {
  it('builds a MapLibre raster style with all configured subdomains', () => {
    const style = buildRasterBasemapStyle('streets');
    const source = style.sources.basemap as { type: string; tiles: string[] };

    expect(source.type).toBe('raster');
    expect(source.tiles).toContain('https://a.tile.openstreetmap.org/{z}/{x}/{y}.png');
    expect(source.tiles).toContain('https://b.tile.openstreetmap.org/{z}/{x}/{y}.png');
    expect(source.tiles).toContain('https://c.tile.openstreetmap.org/{z}/{x}/{y}.png');
  });
});

describe('resolveMapLibreStyle', () => {
  it('uses an explicit style URL when available', () => {
    expect(resolveMapLibreStyle('streets', 'https://example.com/style.json')).toBe(
      'https://example.com/style.json',
    );
  });

  it('falls back to a raster basemap style', () => {
    expect(resolveMapLibreStyle('outdoors', null)).toMatchObject({
      version: 8,
      layers: [{ id: 'basemap' }],
    });
  });
});
