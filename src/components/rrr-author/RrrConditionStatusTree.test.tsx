import { renderToStaticMarkup } from 'react-dom/server';
import { describe, expect, it } from 'vitest';
import type { RrrCondition } from '@/rrr';
import type { RrrModuleResult } from '@/rrr-runtime';
import { RrrConditionStatusTree } from './RrrConditionStatusTree';

const modules: Record<string, RrrModuleResult> = {
  module_1: {
    id: 'module_1',
    label: 'Text answer',
    type: 'text_answer',
    status: 'success',
    message: 'Answer matches',
  },
  hold_still_1: {
    id: 'hold_still_1',
    label: 'Hold still',
    type: 'hold_still',
    status: 'running',
    message: 'Waiting for stillness',
  },
};

describe('RrrConditionStatusTree', () => {
  it('shows the active running sequence step', () => {
    const condition: RrrCondition = {
      type: 'sequence',
      steps: [
        { type: 'module', moduleId: 'module_1' },
        { type: 'module', moduleId: 'hold_still_1' },
      ],
    };

    const html = renderToStaticMarkup(
      <RrrConditionStatusTree condition={condition} modules={modules} />,
    );

    expect(html).toContain('Step 2 of 2 is active');
    expect(html).toContain('Active step');
    expect(html).toContain('Hold still');
  });

  it('shows missing module references', () => {
    const condition: RrrCondition = {
      type: 'module',
      moduleId: 'deleted_module',
    };

    const html = renderToStaticMarkup(
      <RrrConditionStatusTree condition={condition} modules={modules} />,
    );

    expect(html).toContain('Missing module deleted_module');
    expect(html).toContain('failed');
  });

  it('explains all_of and any_of progress', () => {
    const allOf: RrrCondition = {
      type: 'all_of',
      children: [
        { type: 'module', moduleId: 'module_1' },
        { type: 'module', moduleId: 'hold_still_1' },
      ],
    };
    const anyOf: RrrCondition = {
      type: 'any_of',
      children: [
        { type: 'module', moduleId: 'hold_still_1' },
        { type: 'module', moduleId: 'module_1' },
      ],
    };

    expect(
      renderToStaticMarkup(
        <RrrConditionStatusTree condition={allOf} modules={modules} />,
      ),
    ).toContain('1 required item still missing');
    expect(
      renderToStaticMarkup(
        <RrrConditionStatusTree condition={anyOf} modules={modules} />,
      ),
    ).toContain('Solved by option 2');
  });
});
