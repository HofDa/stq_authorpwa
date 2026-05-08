import JSZip from 'jszip';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import {
  ExportRiddleEntrySchema,
  ExportTourEntrySchema,
  createDefaultRrrInteraction,
  type RrrInteraction,
  type TourDraft,
} from '@/schema';
import { db, type StoredBlob } from '@/storage/db';
import { buildValidDraft, buildValidStation } from '@/test/fixtures';
import { buildDraftExportZip } from './tourExport';

async function seedBlob(id: string, draftId: string, body = 'fake-bytes') {
  const blob: StoredBlob = {
    id,
    draftId,
    mime: 'image/webp',
    blob: new Blob([body], { type: 'image/webp' }),
    createdAt: 0,
  };
  await db.blobs.put(blob);
}

async function draftWithAllBlobs(): Promise<TourDraft> {
  const draft = buildValidDraft();
  await seedBlob('blob-cover', draft.draftId);
  await seedBlob('blob-station-hero', draft.draftId);
  await seedBlob('blob-station-body', draft.draftId);
  return draft;
}

function buildGpsCompassSequenceInteraction(): RrrInteraction {
  return {
    schemaVersion: 1 as const,
    modules: [
      {
        id: 'gps_enter_1',
        type: 'gps_enter' as const,
        label: 'Enter GPS radius',
        config: { lat: 46.4983, lng: 11.3548, radiusMeters: 25 },
      },
      {
        id: 'face_direction_1',
        type: 'compass_align' as const,
        label: 'Face direction',
        config: { targetDegrees: 180, tolerance: 20 },
      },
      {
        id: 'hold_still_1',
        type: 'hold_still' as const,
        label: 'Hold still',
        config: { durationMs: 3000 },
      },
    ],
    condition: {
      type: 'sequence' as const,
      steps: [
        { type: 'module' as const, moduleId: 'gps_enter_1' },
        { type: 'module' as const, moduleId: 'face_direction_1' },
        { type: 'module' as const, moduleId: 'hold_still_1' },
      ],
    },
  };
}

const AUTHOR_ONLY_EXPORT_KEYS = [
  'coverBlobId',
  'imageBlobId',
  'iconKey',
  'iconColorKey',
  'acceptedAnswers',
  'fieldTestStatus',
  'fieldTestIssueTags',
  'fieldTestTags',
  'fieldTestNotes',
  'fieldTestTestedAt',
  'testedAt',
  'testedBy',
  'debugMetadata',
  'debugMeta',
  'debug',
  'expertMode',
  'editorOnly',
  'editorNotes',
  'adminMeta',
  'authoringMeta',
  'aiContext',
  'storyMeta',
  'storyline',
] as const;

function expectNoAuthorOnlyKeys(value: unknown) {
  const found = new Set<string>();
  collectAuthorOnlyKeys(value, found);
  expect([...found].sort()).toEqual([]);
}

function collectAuthorOnlyKeys(value: unknown, found: Set<string>) {
  if (!value || typeof value !== 'object') {
    return;
  }

  if (Array.isArray(value)) {
    value.forEach((entry) => collectAuthorOnlyKeys(entry, found));
    return;
  }

  for (const [key, nested] of Object.entries(value)) {
    if ((AUTHOR_ONLY_EXPORT_KEYS as readonly string[]).includes(key)) {
      found.add(key);
    }
    collectAuthorOnlyKeys(nested, found);
  }
}

beforeEach(async () => {
  await db.blobs.clear();
  await db.drafts.clear();
});

afterEach(async () => {
  await db.blobs.clear();
  await db.drafts.clear();
});

describe('buildDraftExportZip', () => {
  it('produces tours.json and riddles.json at expected paths', async () => {
    const draft = await draftWithAllBlobs();

    const result = await buildDraftExportZip(draft);

    expect(result.missingBlobIds).toEqual([]);
    expect(result.validationErrors).toEqual([]);

    const zip = await JSZip.loadAsync(await result.blob.arrayBuffer());
    expect(zip.file('tours.json')).toBeTruthy();
    expect(zip.file('bolzano-classic/riddles.json')).toBeTruthy();
    expect(zip.file('bolzano-classic/images/blob-cover.webp')).toBeTruthy();
    expect(zip.file('bolzano-classic/icons/station-1.png')).toBeTruthy();
    expect(zip.file('bolzano-classic/markers/station-1.png')).toBeTruthy();
    expect(
      zip.file('bolzano-classic/images/blob-station-hero.webp'),
    ).toBeTruthy();
    expect(
      zip.file('bolzano-classic/images/blob-station-body.webp'),
    ).toBeTruthy();
  });

  it('rewrites cover and station imagePaths to the ZIP-relative location', async () => {
    const draft = await draftWithAllBlobs();
    const result = await buildDraftExportZip(draft);

    const toursJson = result.tourJson as Array<Record<string, unknown>>;
    expect(toursJson[0].imagePath).toBe(
      'bolzano-classic/images/blob-cover.webp',
    );

    const riddlesJson = result.riddlesJson as Array<Record<string, unknown>>;
    expect(riddlesJson[0].imagePath).toBe(
      'bolzano-classic/images/blob-station-hero.webp',
    );
    expect(riddlesJson[0].iconPath).toBe('bolzano-classic/icons/station-1.png');
    expect(riddlesJson[0].markerIconPath).toBe(
      'bolzano-classic/markers/station-1.png',
    );
  });

  it('rewrites image blocks inside content sections', async () => {
    const draft = await draftWithAllBlobs();
    const result = await buildDraftExportZip(draft);
    const riddlesJson = result.riddlesJson as Array<Record<string, unknown>>;
    const history = (
      riddlesJson[0].en as { historySection: Array<Record<string, unknown>> }
    ).historySection;
    const imageBlock = history.find((b) => b.type === 'image');
    expect(imageBlock?.imagePath).toBe(
      'bolzano-classic/images/blob-station-body.webp',
    );
    // Authoring-only localBlobId must be stripped from the exported block.
    expect(imageBlock).not.toHaveProperty('localBlobId');
  });

  it('strips authoring-only blob id fields from the tour entry', async () => {
    const draft = await draftWithAllBlobs();
    const result = await buildDraftExportZip(draft);
    const tour = (result.tourJson as Array<Record<string, unknown>>)[0];
    expect(tour).not.toHaveProperty('coverBlobId');
    const station = (result.riddlesJson as Array<Record<string, unknown>>)[0];
    expect(station).not.toHaveProperty('imageBlobId');
    expect(station).not.toHaveProperty('iconKey');
    expect(station).not.toHaveProperty('iconColorKey');
  });

  it('does not export stale interaction data for text riddles', async () => {
    const draft = await draftWithAllBlobs();
    draft.stations[0].interaction = createDefaultRrrInteraction();
    draft.stations[0].fieldTestStatus = 'tested_ok';
    draft.stations[0].fieldTestIssueTags = ['gps_ungenau'];
    draft.stations[0].fieldTestNotes = 'Worked in office test.';
    draft.stations[0].fieldTestTestedAt = '2026-05-08T09:30:00.000Z';

    const result = await buildDraftExportZip(draft);

    expect(result.validationErrors).toEqual([]);
    const station = (result.riddlesJson as Array<Record<string, unknown>>)[0];
    expect(station.riddleType).toBe('text');
    expect(station).not.toHaveProperty('interaction');
    expect(station).not.toHaveProperty('interactionVersion');
    expect(station).not.toHaveProperty('fieldTestStatus');
    expect(station).not.toHaveProperty('fieldTestIssueTags');
    expect(station).not.toHaveProperty('fieldTestNotes');
    expect(station).not.toHaveProperty('fieldTestTestedAt');
  });

  it('produces JSON that re-parses through the Flutter-facing schemas', async () => {
    const draft = await draftWithAllBlobs();
    const result = await buildDraftExportZip(draft);

    const tours = result.tourJson as unknown[];
    expect(tours).toHaveLength(1);
    expect(() => ExportTourEntrySchema.parse(tours[0])).not.toThrow();

    const riddles = result.riddlesJson as unknown[];
    for (const riddle of riddles) {
      expect(() => ExportRiddleEntrySchema.parse(riddle)).not.toThrow();
    }
  });

  it('exports modular riddles with their interaction object', async () => {
    const draft = await draftWithAllBlobs();
    const interaction = createDefaultRrrInteraction();
    draft.stations[0] = {
      ...draft.stations[0],
      riddleType: 'modular',
      fieldTestStatus: 'tested_with_warnings',
      fieldTestIssueTags: ['kompass_instabil', 'ersatzloesung_noetig'],
      fieldTestNotes: 'Compass drifted near the building.',
      fieldTestTestedAt: '2026-05-08T09:30:00.000Z',
      interaction,
    };

    const result = await buildDraftExportZip(draft);

    expect(result.validationErrors).toEqual([]);
    const station = (result.riddlesJson as Array<Record<string, unknown>>)[0];
    expect(station.riddleType).toBe('modular');
    expect(station.interactionVersion).toBe(1);
    expect(station.interaction).toEqual(interaction);
    expect(() => ExportRiddleEntrySchema.parse(station)).not.toThrow();
  });

  it('keeps author-only draft and field-test metadata out of player JSON', async () => {
    const draft = await draftWithAllBlobs();
    draft.storyline = {
      markdown: 'Editor-only story bible',
      updatedAt: 1_700_000_000_000,
      chat: [
        {
          role: 'assistant',
          content: 'Internal planning note',
          ts: 1_700_000_000_000,
        },
      ],
    };
    draft.tour.adminMeta = {
      owner: 'Internal team',
      reviewedBy: 'Editor',
      approvedForPublishing: true,
    };
    draft.tour.authoringMeta = {
      primaryAudience: 'Families',
      editorialRules: ['Do not export this.'],
    };
    draft.tour.aiContext = {
      assistantRole: 'Internal editor assistant',
      guardrails: ['Private prompt rule'],
    };
    draft.tour.storyMeta = {
      premise: 'Internal narrative plan',
      finale: 'Secret ending',
    };
    (draft.tour as Record<string, unknown>).debugMetadata = {
      source: 'test',
    };
    (draft.tour as Record<string, unknown>).editorOnly = true;

    draft.stations[0] = {
      ...draft.stations[0],
      fieldTestStatus: 'tested_with_warnings',
      fieldTestIssueTags: ['gps_ungenau', 'ersatzloesung_noetig'],
      fieldTestNotes: 'GPS was unstable near the wall.',
      fieldTestTestedAt: '2026-05-08T09:30:00.000Z',
    };
    Object.assign(draft.stations[0] as Record<string, unknown>, {
      fieldTestTags: ['legacy-alias'],
      testedAt: '2026-05-08T09:30:00.000Z',
      testedBy: 'Field tester',
      debugMetadata: { sensor: 'mock' },
      debug: true,
      expertMode: true,
      editorNotes: 'Internal station note',
    });

    const result = await buildDraftExportZip(draft);

    expect(result.validationErrors).toEqual([]);
    expectNoAuthorOnlyKeys(result.tourJson);
    expectNoAuthorOnlyKeys(result.riddlesJson);
    expect(draft.storyline.markdown).toBe('Editor-only story bible');
    expect(draft.tour.authoringMeta?.primaryAudience).toBe('Families');
    expect(draft.stations[0].fieldTestNotes).toBe(
      'GPS was unstable near the wall.',
    );
    expect(draft.stations[0].fieldTestIssueTags).toEqual([
      'gps_ungenau',
      'ersatzloesung_noetig',
    ]);
  });

  it('reports a serialized validation error when a modular riddle has no interaction', async () => {
    const draft = await draftWithAllBlobs();
    draft.stations[0] = {
      ...draft.stations[0],
      riddleType: 'modular',
      interaction: undefined,
    };

    const result = await buildDraftExportZip(draft);

    expect(result.validationErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'stations.0.interaction',
          message: 'Required',
        }),
      ]),
    );
  });

  it('reports a serialized validation error for invalid modular interaction data', async () => {
    const draft = await draftWithAllBlobs();
    draft.stations[0] = {
      ...draft.stations[0],
      riddleType: 'modular',
      interaction: {
        schemaVersion: 1,
        modules: [
          {
            id: 'module_1',
            type: 'text_answer',
            label: 'Text answer',
            config: {},
          },
          {
            id: 'module_1',
            type: 'text_answer',
            label: 'Duplicate',
            config: {},
          },
        ],
        condition: { type: 'module', moduleId: 'module_1' },
      },
    };

    const result = await buildDraftExportZip(draft);

    expect(result.validationErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'stations.0.interaction.modules.1.id',
          message: 'Module id "module_1" is duplicated.',
        }),
      ]),
    );
  });

  it('exports a modular GPS-then-compass sequence with the full condition tree', async () => {
    const draft = await draftWithAllBlobs();
    draft.stations[0] = {
      ...draft.stations[0],
      riddleType: 'modular',
      interaction: buildGpsCompassSequenceInteraction(),
    };

    const result = await buildDraftExportZip(draft);

    expect(result.validationErrors).toEqual([]);
    const station = (result.riddlesJson as Array<Record<string, unknown>>)[0];
    expect(station.riddleType).toBe('modular');
    expect(station.interactionVersion).toBe(1);
    expect(station.interaction).toEqual(buildGpsCompassSequenceInteraction());
    expect(() => ExportRiddleEntrySchema.parse(station)).not.toThrow();
  });

  it('preserves module config fields (targetDegrees, tolerance, durationMs, radiusMeters) through export', async () => {
    const draft = await draftWithAllBlobs();
    draft.stations[0] = {
      ...draft.stations[0],
      riddleType: 'modular',
      interaction: buildGpsCompassSequenceInteraction(),
    };

    const result = await buildDraftExportZip(draft);

    const station = (result.riddlesJson as Array<Record<string, unknown>>)[0];
    const interaction = station.interaction as {
      modules: Array<{ id: string; type: string; config: Record<string, unknown> }>;
    };
    const modulesById = Object.fromEntries(
      interaction.modules.map((module) => [module.id, module]),
    );

    expect(modulesById.gps_enter_1.config).toMatchObject({
      lat: 46.4983,
      lng: 11.3548,
      radiusMeters: 25,
    });
    expect(modulesById.face_direction_1.config).toMatchObject({
      targetDegrees: 180,
      tolerance: 20,
    });
    expect(modulesById.hold_still_1.config).toMatchObject({
      durationMs: 3000,
    });
  });

  it('preserves optional RRR timeout and retry metadata through export', async () => {
    const draft = await draftWithAllBlobs();
    const interaction = buildGpsCompassSequenceInteraction();
    interaction.modules[0] = {
      ...interaction.modules[0],
      timeoutMs: 30000,
      retry: { maxAttempts: 3, resetOnFail: true },
    };
    draft.stations[0] = {
      ...draft.stations[0],
      riddleType: 'modular',
      interaction,
    };

    const result = await buildDraftExportZip(draft);

    expect(result.validationErrors).toEqual([]);
    const station = (result.riddlesJson as Array<Record<string, unknown>>)[0];
    const exported = station.interaction as {
      modules: Array<{
        id: string;
        timeoutMs?: number;
        retry?: { maxAttempts?: number; resetOnFail?: boolean };
      }>;
    };
    expect(exported.modules[0]).toMatchObject({
      id: 'gps_enter_1',
      timeoutMs: 30000,
      retry: { maxAttempts: 3, resetOnFail: true },
    });
  });

  it('exports a modular QR scan interaction with its expected value', async () => {
    const draft = await draftWithAllBlobs();
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'qr_scan_1',
          type: 'qr_scan',
          label: 'QR-Code scannen',
          config: { expectedValue: 'station-3-gate' },
        },
      ],
      condition: { type: 'module', moduleId: 'qr_scan_1' },
    };
    draft.stations[0] = {
      ...draft.stations[0],
      riddleType: 'modular',
      interaction,
    };

    const result = await buildDraftExportZip(draft);

    expect(result.validationErrors).toEqual([]);
    const station = (result.riddlesJson as Array<Record<string, unknown>>)[0];
    expect(station.interactionVersion).toBe(1);
    expect(station.interaction).toEqual(interaction);
    expect(() => ExportRiddleEntrySchema.parse(station)).not.toThrow();
  });

  it('exports a modular code word interaction with its code config', async () => {
    const draft = await draftWithAllBlobs();
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'code_word_1',
          type: 'code_word',
          label: 'Codewort eingeben',
          config: { code: 'Adler', caseSensitive: false },
        },
      ],
      condition: { type: 'module', moduleId: 'code_word_1' },
    };
    draft.stations[0] = {
      ...draft.stations[0],
      riddleType: 'modular',
      interaction,
    };

    const result = await buildDraftExportZip(draft);

    expect(result.validationErrors).toEqual([]);
    const station = (result.riddlesJson as Array<Record<string, unknown>>)[0];
    expect(station.interactionVersion).toBe(1);
    expect(station.interaction).toEqual(interaction);
    expect(() => ExportRiddleEntrySchema.parse(station)).not.toThrow();
  });

  it('exports a modular sequential code interaction with its simple config', async () => {
    const draft = await draftWithAllBlobs();
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'sequential_code_1',
          type: 'sequential_code',
          label: 'Gesammelten Code eingeben',
          config: {
            code: 'A1B2',
            hint: 'Symbole aus den Stationen',
            caseSensitive: false,
          },
        },
      ],
      condition: { type: 'module', moduleId: 'sequential_code_1' },
    };
    draft.stations[0] = {
      ...draft.stations[0],
      riddleType: 'modular',
      interaction,
    };

    const result = await buildDraftExportZip(draft);

    expect(result.validationErrors).toEqual([]);
    const station = (result.riddlesJson as Array<Record<string, unknown>>)[0];
    expect(station.interactionVersion).toBe(1);
    expect(station.interaction).toEqual(interaction);
    expect(() => ExportRiddleEntrySchema.parse(station)).not.toThrow();
  });

  it('exports a modular direction hot/cold interaction with its compass config', async () => {
    const draft = await draftWithAllBlobs();
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'direction_hotcold_1',
          type: 'direction_hotcold',
          label: 'Richtung warm/kalt',
          config: { targetDegrees: 90, successTolerance: 15 },
        },
      ],
      condition: { type: 'module', moduleId: 'direction_hotcold_1' },
    };
    draft.stations[0] = {
      ...draft.stations[0],
      riddleType: 'modular',
      interaction,
    };

    const result = await buildDraftExportZip(draft);

    expect(result.validationErrors).toEqual([]);
    const station = (result.riddlesJson as Array<Record<string, unknown>>)[0];
    expect(station.interactionVersion).toBe(1);
    expect(station.interaction).toEqual(interaction);
    expect(() => ExportRiddleEntrySchema.parse(station)).not.toThrow();
  });

  it('exports a modular proximity hint interaction with its GPS config', async () => {
    const draft = await draftWithAllBlobs();
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'proximity_hint_1',
          type: 'proximity_hint',
          label: 'Nähe-Hinweis',
          config: { lat: 46.4983, lng: 11.3548, successRadiusMeters: 20 },
        },
      ],
      condition: { type: 'module', moduleId: 'proximity_hint_1' },
    };
    draft.stations[0] = {
      ...draft.stations[0],
      riddleType: 'modular',
      interaction,
    };

    const result = await buildDraftExportZip(draft);

    expect(result.validationErrors).toEqual([]);
    const station = (result.riddlesJson as Array<Record<string, unknown>>)[0];
    expect(station.interactionVersion).toBe(1);
    expect(station.interaction).toEqual(interaction);
    expect(() => ExportRiddleEntrySchema.parse(station)).not.toThrow();
  });

  it('preserves module fallback metadata through export', async () => {
    const draft = await draftWithAllBlobs();
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'face_north',
          type: 'compass_align',
          label: 'Face north',
          config: { targetDegrees: 0, tolerance: 10 },
          fallbackModuleId: 'north_code',
        },
        {
          id: 'north_code',
          type: 'code_word',
          label: 'North code',
          config: { code: 'north', caseSensitive: false },
        },
      ],
      condition: { type: 'module', moduleId: 'face_north' },
    };
    draft.stations[0] = {
      ...draft.stations[0],
      riddleType: 'modular',
      interaction,
    };

    const result = await buildDraftExportZip(draft);

    expect(result.validationErrors).toEqual([]);
    const station = (result.riddlesJson as Array<Record<string, unknown>>)[0];
    expect(station.interaction).toEqual(interaction);
    expect(station).not.toHaveProperty('fieldTestStatus');
    expect(station).not.toHaveProperty('fieldTestIssueTags');
    expect(station).not.toHaveProperty('fieldTestNotes');
    expect(station).not.toHaveProperty('fieldTestTestedAt');
    expect(() => ExportRiddleEntrySchema.parse(station)).not.toThrow();
  });

  it('exports a modular timer wait interaction with its duration config', async () => {
    const draft = await draftWithAllBlobs();
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'timer_wait_1',
          type: 'timer_wait',
          label: 'Warten',
          config: { durationMs: 3000 },
        },
      ],
      condition: { type: 'module', moduleId: 'timer_wait_1' },
    };
    draft.stations[0] = {
      ...draft.stations[0],
      riddleType: 'modular',
      interaction,
    };

    const result = await buildDraftExportZip(draft);

    expect(result.validationErrors).toEqual([]);
    const station = (result.riddlesJson as Array<Record<string, unknown>>)[0];
    expect(station.interaction).toEqual(interaction);
    expect(() => ExportRiddleEntrySchema.parse(station)).not.toThrow();
  });

  it('exports a modular object found interaction with its prompt config', async () => {
    const draft = await draftWithAllBlobs();
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'object_found_1',
          type: 'object_found',
          label: 'Objekt gefunden',
          config: {
            prompt: 'Finde den roten Marker am Baum.',
            confirmLabel: 'Gefunden',
          },
        },
      ],
      condition: { type: 'module', moduleId: 'object_found_1' },
    };
    draft.stations[0] = {
      ...draft.stations[0],
      riddleType: 'modular',
      interaction,
    };

    const result = await buildDraftExportZip(draft);

    expect(result.validationErrors).toEqual([]);
    const station = (result.riddlesJson as Array<Record<string, unknown>>)[0];
    expect(station.interaction).toEqual(interaction);
    expect(() => ExportRiddleEntrySchema.parse(station)).not.toThrow();
  });

  it('exports a modular manual photo-check interaction with its prompt config', async () => {
    const draft = await draftWithAllBlobs();
    const interaction: RrrInteraction = {
      schemaVersion: 1,
      modules: [
        {
          id: 'photo_check_manual_1',
          type: 'photo_check_manual',
          label: 'Foto-Aufgabe bestätigen',
          config: {
            prompt: 'Vergleiche dein Foto mit dem Schild.',
            confirmLabel: 'Bestätigt',
          },
        },
      ],
      condition: { type: 'module', moduleId: 'photo_check_manual_1' },
    };
    draft.stations[0] = {
      ...draft.stations[0],
      riddleType: 'modular',
      interaction,
    };

    const result = await buildDraftExportZip(draft);

    expect(result.validationErrors).toEqual([]);
    const station = (result.riddlesJson as Array<Record<string, unknown>>)[0];
    expect(station.interaction).toEqual(interaction);
    expect(() => ExportRiddleEntrySchema.parse(station)).not.toThrow();
  });

  it('reports missing blobs without throwing', async () => {
    const draft = buildValidDraft();
    // Only seed the cover; station blobs are missing.
    await seedBlob('blob-cover', draft.draftId);

    const result = await buildDraftExportZip(draft);

    expect(result.missingBlobIds.sort()).toEqual(
      ['blob-station-body', 'blob-station-hero'].sort(),
    );
    expect(result.validationWarnings).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          severity: 'warning',
          entityType: 'blob',
          path: 'stations.0.imageBlobId',
        }),
        expect.objectContaining({
          severity: 'warning',
          entityType: 'blob',
          path: 'stations.0.en.historySection.2.localBlobId',
        }),
      ]),
    );
    expect(result.validationErrors).toEqual([]);

    const zip = await JSZip.loadAsync(await result.blob.arrayBuffer());
    expect(
      zip.file('bolzano-classic/images/blob-station-hero.webp'),
    ).toBeNull();

    // Missing blobs leave imagePath at its fallback (empty string in fixtures).
    const station = (
      result.riddlesJson as Array<Record<string, unknown>>
    )[0];
    expect(station.imagePath).toBe('');
  });

  it('surfaces validation errors for an invalid serialized tour', async () => {
    const draft = buildValidDraft();
    await seedBlob('blob-cover', draft.draftId);
    await seedBlob('blob-station-hero', draft.draftId);
    await seedBlob('blob-station-body', draft.draftId);
    // Corrupt the draft post-fixture — the schema allows this in authoring
    // (factories start at 0), but once users start editing we want the
    // export to catch obvious mistakes. Use a negative number, which the
    // schema explicitly rejects.
    draft.tour.number = -5;

    const result = await buildDraftExportZip(draft);

    expect(result.validationErrors.length).toBeGreaterThan(0);
    expect(result.validationErrors[0].path).toContain('tour.number');

    const zip = await JSZip.loadAsync(await result.blob.arrayBuffer());
    expect(zip.file('tours.json')).toBeTruthy();
    expect(zip.file('bolzano-classic/riddles.json')).toBeTruthy();
  });

  it('flags per-station errors with the station index in the path', async () => {
    const draft = buildValidDraft();
    draft.stations.push(buildValidStation('station-2', 2));
    await seedBlob('blob-cover', draft.draftId);
    await seedBlob('blob-station-hero', draft.draftId);
    await seedBlob('blob-station-body', draft.draftId);
    // Fourth hint is one too many for the schema's max(3).
    draft.stations[1].en.hints = ['a', 'b', 'c', 'd'];

    const result = await buildDraftExportZip(draft);

    expect(
      result.validationErrors.some((e) => e.path.startsWith('stations.1.')),
    ).toBe(true);
  });

  it('fails validation when tour.id is empty', async () => {
    const draft = buildValidDraft();
    draft.tour.id = '';
    draft.tour.riddlesPath = '';
    await seedBlob('blob-cover', draft.draftId);
    await seedBlob('blob-station-hero', draft.draftId);
    await seedBlob('blob-station-body', draft.draftId);

    const result = await buildDraftExportZip(draft);

    expect(result.validationErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'tour.id',
          message: 'Tour id is required for export.',
        }),
      ]),
    );
    expect(result.tourJson).toEqual([]);
    expect(result.riddlesJson).toEqual([]);
    const zip = await JSZip.loadAsync(await result.blob.arrayBuffer());
    expect(Object.keys(zip.files)).toEqual([]);
  });

  it('fails validation when tour.id is not a safe slug', async () => {
    const draft = buildValidDraft();
    draft.tour.id = '../Bolzano Classic';
    draft.tour.riddlesPath = `${draft.tour.id}/riddles.json`;
    await seedBlob('blob-cover', draft.draftId);
    await seedBlob('blob-station-hero', draft.draftId);
    await seedBlob('blob-station-body', draft.draftId);

    const result = await buildDraftExportZip(draft);

    expect(result.validationErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'tour.id',
        }),
      ]),
    );
    expect(result.tourJson).toEqual([]);
    expect(result.riddlesJson).toEqual([]);
    const zip = await JSZip.loadAsync(await result.blob.arrayBuffer());
    expect(Object.keys(zip.files)).toEqual([]);
  });

  it('fails validation when riddlesPath does not match the tour id', async () => {
    const draft = buildValidDraft();
    draft.tour.riddlesPath = 'other-tour/riddles.json';
    await seedBlob('blob-cover', draft.draftId);
    await seedBlob('blob-station-hero', draft.draftId);
    await seedBlob('blob-station-body', draft.draftId);

    const result = await buildDraftExportZip(draft);

    expect(result.validationErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'tour.riddlesPath',
          message: 'Riddles path must equal "bolzano-classic/riddles.json".',
        }),
      ]),
    );
    expect(result.tourJson).toEqual([]);
    expect(result.riddlesJson).toEqual([]);
    const zip = await JSZip.loadAsync(await result.blob.arrayBuffer());
    expect(Object.keys(zip.files)).toEqual([]);
  });

  it('still exports a valid draft with a stable id and riddlesPath', async () => {
    const draft = await draftWithAllBlobs();

    const result = await buildDraftExportZip(draft);

    expect(result.validationErrors).toEqual([]);
    const toursJson = result.tourJson as Array<Record<string, unknown>>;
    expect(toursJson[0].id).toBe('bolzano-classic');
    expect(toursJson[0].riddlesPath).toBe('bolzano-classic/riddles.json');
  });

  it('serializes the English answer into the English locale export', async () => {
    const draft = await draftWithAllBlobs();

    const result = await buildDraftExportZip(draft);

    const station = (result.riddlesJson as Array<Record<string, unknown>>)[0];
    expect((station.en as { solution: string }).solution).toBe('tower');
    expect(station).not.toHaveProperty('solution');
  });

  it('serializes the German answer into the German locale export', async () => {
    const draft = await draftWithAllBlobs();

    const result = await buildDraftExportZip(draft);

    const station = (result.riddlesJson as Array<Record<string, unknown>>)[0];
    expect((station.de as { solution: string }).solution).toBe('turm');
  });

  it('serializes the Italian answer into the Italian locale export', async () => {
    const draft = await draftWithAllBlobs();

    const result = await buildDraftExportZip(draft);

    const station = (result.riddlesJson as Array<Record<string, unknown>>)[0];
    expect((station.it as { solution: string }).solution).toBe('torre');
  });

  it('fails validation when a locale-specific accepted answer is missing', async () => {
    const draft = await draftWithAllBlobs();
    draft.stations[0].acceptedAnswers.de = [];

    const result = await buildDraftExportZip(draft);

    expect(result.validationErrors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          path: 'stations.0.acceptedAnswers.de',
          message: 'Accepted answers for DE are required for export.',
        }),
      ]),
    );
    expect(result.tourJson).toEqual([]);
    expect(result.riddlesJson).toEqual([]);
  });
});
