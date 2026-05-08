import { describe, it, expect } from 'vitest';
import {
  buildStationIconSvg,
  buildStationMarkerSvg,
  buildNumberedStationMarkerSvg,
  svgToDataUri,
  DEFAULT_STATION_VISUAL,
  STATION_ICON_KEYS,
} from './visuals.logic';

describe('visuals.logic', () => {
  describe('SVG generation', () => {
    it('buildStationIconSvg generates valid SVG for all icons', () => {
      for (const iconKey of STATION_ICON_KEYS) {
        const svg = buildStationIconSvg({
          ...DEFAULT_STATION_VISUAL,
          iconKey,
        });
        expect(svg).toBeTypeOf('string');
        expect(svg).toMatch(/^<svg/);
        expect(svg).toMatch(/<\/svg>$/);
        expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
        expect(svg).toContain('<g transform="translate(12 12)">');
        expect(svg).toContain('fill="none"');
      }
    });

    it('buildStationMarkerSvg generates valid SVG', () => {
      const svg = buildStationMarkerSvg(DEFAULT_STATION_VISUAL);
      expect(svg).toBeTypeOf('string');
      expect(svg).toMatch(/^<svg/);
      expect(svg).toMatch(/<\/svg>$/);
      expect(svg).toContain('xmlns="http://www.w3.org/2000/svg"');
      expect(svg).toContain('<path d="M31.5 5.5C'); // Marker base shape
      expect(svg).toContain('<circle cx="31.5" cy="29.5"'); // Inner circle
      expect(svg).toContain('<g transform="translate(19.5 17.5)">'); // Icon group
    });

    it('buildNumberedStationMarkerSvg generates valid SVG with text', () => {
      const svg = buildNumberedStationMarkerSvg(DEFAULT_STATION_VISUAL, 1);
      expect(svg).toBeTypeOf('string');
      expect(svg).toMatch(/^<svg/);
      expect(svg).toMatch(/<\/svg>$/);
      expect(svg).toContain('<text x="31.5" y="35"'); // Number text
      expect(svg).toContain('>1</text>');
    });
  });

  it('svgToDataUri correctly encodes SVG string', () => {
    const svg = '<svg><path d="M1 1"/></svg>';
    expect(svgToDataUri(svg)).toBe('data:image/svg+xml;charset=UTF-8,%3Csvg%3E%3Cpath%20d%3D%22M1%201%22%2F%3E%3C%2Fsvg%3E');
  });
});
