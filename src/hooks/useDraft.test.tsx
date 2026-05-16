/** @vitest-environment happy-dom */
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { TourDraft } from '@/schema';
import { buildValidDraft } from '@/test/fixtures';

const storageMock = vi.hoisted(() => ({
  getDraft: vi.fn(),
  saveDraft: vi.fn(),
}));

vi.mock('@/storage', () => storageMock);

import { useDraft } from './useDraft';

(
  globalThis as typeof globalThis & { IS_REACT_ACT_ENVIRONMENT?: boolean }
).IS_REACT_ACT_ENVIRONMENT = true;

let container: HTMLDivElement;
let root: Root;
let storedDraft: TourDraft;
let consoleInfoSpy: ReturnType<typeof vi.spyOn>;

beforeEach(() => {
  consoleInfoSpy = vi.spyOn(console, 'info').mockImplementation(() => undefined);
  storageMock.getDraft.mockReset();
  storageMock.saveDraft.mockReset();
  storedDraft = buildDraftWithIntroParagraphs();
  storageMock.getDraft.mockImplementation(async () => cloneDraft(storedDraft));

  container = document.createElement('div');
  document.body.append(container);
  root = createRoot(container);
});

afterEach(() => {
  act(() => {
    root.unmount();
  });
  container.remove();
  consoleInfoSpy.mockRestore();
});

describe('useDraft', () => {
  it('serializes draft writes so paragraph delete wins after pending text saves', async () => {
    let updateDraft: ReturnType<typeof useDraft>['update'] | undefined;
    let firstSaveStarted: (() => void) | undefined;
    let releaseFirstSave: (() => void) | undefined;
    const firstSavePending = new Promise<void>((resolve) => {
      firstSaveStarted = resolve;
    });
    let saveCount = 0;

    storageMock.saveDraft.mockImplementation(async (draft: TourDraft) => {
      saveCount += 1;
      if (saveCount === 1) {
        firstSaveStarted?.();
        await new Promise<void>((resolve) => {
          releaseFirstSave = resolve;
        });
      }
      storedDraft = cloneDraft(draft);
    });

    function Probe() {
      updateDraft = useDraft(storedDraft.draftId).update;
      return null;
    }

    act(() => {
      root.render(<Probe />);
    });

    let firstUpdate: Promise<void> | undefined;
    await act(async () => {
      firstUpdate = updateDraft?.((prev) => setIntroParagraphs(prev, [
        'First paragraph edited',
        'Second paragraph',
      ]));
      await firstSavePending;
    });

    const secondUpdate = updateDraft?.((prev) =>
      setIntroParagraphs(
        prev,
        prev.tour.de.introSection
          .filter((_, index) => index !== 1)
          .map((block) => ('text' in block ? block.text : '')),
      ),
    );

    expect(storageMock.saveDraft).toHaveBeenCalledTimes(1);

    releaseFirstSave?.();
    await act(async () => {
      await Promise.all([firstUpdate, secondUpdate]);
    });

    expect(
      storedDraft.tour.de.introSection.map((block) =>
        'text' in block ? block.text : '',
      ),
    ).toEqual(['First paragraph edited']);
  });
});

function buildDraftWithIntroParagraphs(): TourDraft {
  const draft = buildValidDraft();
  draft.tour.de.introSection = [
    { type: 'paragraph', text: 'First paragraph' },
    { type: 'paragraph', text: 'Second paragraph' },
  ];
  return draft;
}

function setIntroParagraphs(draft: TourDraft, paragraphs: string[]): TourDraft {
  return {
    ...draft,
    tour: {
      ...draft.tour,
      de: {
        ...draft.tour.de,
        introSection: paragraphs.map((text) => ({ type: 'paragraph', text })),
      },
    },
  };
}

function cloneDraft(draft: TourDraft): TourDraft {
  return structuredClone(draft) as TourDraft;
}
