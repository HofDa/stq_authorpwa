import { describe, expect, it } from 'vitest';
import {
  isSupportedRrrInteractionVersion,
  migrateRrrInteraction,
  RrrInteractionMigrationError,
} from './migrateInteraction';

describe('isSupportedRrrInteractionVersion', () => {
  it('accepts version 1', () => {
    expect(isSupportedRrrInteractionVersion(1)).toBe(true);
  });

  it('rejects other values', () => {
    expect(isSupportedRrrInteractionVersion(2)).toBe(false);
    expect(isSupportedRrrInteractionVersion('1')).toBe(false);
    expect(isSupportedRrrInteractionVersion(undefined)).toBe(false);
    expect(isSupportedRrrInteractionVersion(null)).toBe(false);
  });
});

describe('migrateRrrInteraction', () => {
  it('passes a valid v1 interaction through with explicit version', () => {
    const result = migrateRrrInteraction({
      interactionVersion: 1,
      interaction: {
        schemaVersion: 1,
        modules: [
          {
            id: 'a',
            type: 'text_answer',
            label: 'A',
            config: { answer: 'Eiffel' },
          },
        ],
        condition: { type: 'module', moduleId: 'a' },
      },
    });

    expect(result.interactionVersion).toBe(1);
    expect(result.interaction.modules).toHaveLength(1);
    expect(result.interaction.condition).toEqual({
      type: 'module',
      moduleId: 'a',
    });
  });

  it('treats missing version as version 1', () => {
    const result = migrateRrrInteraction({
      interaction: {
        schemaVersion: 1,
        modules: [],
      },
    });

    expect(result.interactionVersion).toBe(1);
    expect(result.interaction.modules).toEqual([]);
    expect(result.interaction.condition).toBeUndefined();
  });

  it('fills in missing modules array when input is an object', () => {
    const result = migrateRrrInteraction({
      interaction: {},
    });

    expect(result.interaction.modules).toEqual([]);
    expect(result.interaction.condition).toBeUndefined();
  });

  it('treats null/undefined interaction as a safe empty interaction', () => {
    const fromUndefined = migrateRrrInteraction({ interaction: undefined });
    const fromNull = migrateRrrInteraction({ interaction: null });

    expect(fromUndefined.interaction.modules).toEqual([]);
    expect(fromNull.interaction.modules).toEqual([]);
  });

  it('preserves unknown module config fields (passthrough)', () => {
    const result = migrateRrrInteraction({
      interaction: {
        modules: [
          {
            id: 'a',
            type: 'text_answer',
            label: 'A',
            config: { answer: 'Eiffel', extraField: 42 },
          },
        ],
      },
    });

    expect(result.interaction.modules[0].config).toMatchObject({
      answer: 'Eiffel',
      extraField: 42,
    });
  });

  it('throws on unsupported version', () => {
    expect(() =>
      migrateRrrInteraction({
        interactionVersion: 99,
        interaction: { modules: [] },
      }),
    ).toThrow(RrrInteractionMigrationError);

    try {
      migrateRrrInteraction({
        interactionVersion: 99,
        interaction: { modules: [] },
      });
    } catch (error) {
      expect(error).toBeInstanceOf(RrrInteractionMigrationError);
      expect((error as RrrInteractionMigrationError).code).toBe(
        'unsupported_version',
      );
    }
  });

  it('throws when interaction is not an object', () => {
    expect(() =>
      migrateRrrInteraction({ interaction: 'oops' }),
    ).toThrow(RrrInteractionMigrationError);

    try {
      migrateRrrInteraction({ interaction: 'oops' });
    } catch (error) {
      expect((error as RrrInteractionMigrationError).code).toBe('invalid_input');
    }
  });

  it('throws on a structurally invalid interaction', () => {
    expect(() =>
      migrateRrrInteraction({
        interaction: {
          modules: [{ id: 'a', type: 'text_answer', label: 'A' }],
          condition: { type: 'module', moduleId: 'missing' },
        },
      }),
    ).toThrow(RrrInteractionMigrationError);

    try {
      migrateRrrInteraction({
        interaction: {
          modules: [{ id: 'a', type: 'text_answer', label: 'A' }],
          condition: { type: 'module', moduleId: 'missing' },
        },
      });
    } catch (error) {
      const migrationError = error as RrrInteractionMigrationError;
      expect(migrationError.code).toBe('invalid_interaction');
      expect(migrationError.issues).toBeDefined();
    }
  });
});
