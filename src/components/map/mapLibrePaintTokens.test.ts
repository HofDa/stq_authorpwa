/** @vitest-environment happy-dom */
import { afterEach, describe, expect, it } from 'vitest';
import {
  getMapLibreCssVariableName,
  resolveMapLibrePaintColor,
} from './mapLibrePaintTokens';

afterEach(() => {
  document.documentElement.style.removeProperty('--stq-test-route-color');
});

describe('getMapLibreCssVariableName', () => {
  it('extracts the css variable name from a var color', () => {
    expect(getMapLibreCssVariableName('var(--stq-color-route)')).toBe(
      '--stq-color-route',
    );
    expect(getMapLibreCssVariableName('var( --stq-color-route , #000 )')).toBe(
      '--stq-color-route',
    );
  });

  it('returns null for non-variable colors', () => {
    expect(getMapLibreCssVariableName('#904A48')).toBeNull();
  });
});

describe('resolveMapLibrePaintColor', () => {
  it('leaves literal colors unchanged', () => {
    expect(resolveMapLibrePaintColor('#904A48')).toBe('#904A48');
  });

  it('resolves css variables before they are passed to MapLibre paint', () => {
    document.documentElement.style.setProperty(
      '--stq-test-route-color',
      'rgb(12, 34, 56)',
    );

    expect(resolveMapLibrePaintColor('var(--stq-test-route-color)')).toBe(
      'rgb(12, 34, 56)',
    );
  });

  it('falls back to the original value when a token is missing', () => {
    expect(resolveMapLibrePaintColor('var(--stq-test-route-color)')).toBe(
      'var(--stq-test-route-color)',
    );
  });
});
