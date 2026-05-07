import { describe, expect, it } from 'vitest';
import { getGpsQuality, recommendGpsRadius } from './gpsQuality';

describe('gpsQuality', () => {
  it('classifies GPS accuracy into plain quality buckets', () => {
    expect(getGpsQuality()).toBe('unknown');
    expect(getGpsQuality(0)).toBe('unknown');
    expect(getGpsQuality(8)).toBe('good');
    expect(getGpsQuality(20)).toBe('ok');
    expect(getGpsQuality(21)).toBe('poor');
  });

  it('recommends a radius that leaves room for current GPS accuracy', () => {
    expect(recommendGpsRadius()).toBe(20);
    expect(recommendGpsRadius(6)).toBe(10);
    expect(recommendGpsRadius(12)).toBe(20);
    expect(recommendGpsRadius(30)).toBe(45);
  });
});
