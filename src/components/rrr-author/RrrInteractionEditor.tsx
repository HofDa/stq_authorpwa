import { useState } from 'react';
import { RrrInteractionSchema } from '@/schema';
import {
  RRR_MODULE_TYPES,
  RRR_MODULE_PRESETS,
  createRrrModuleFromPreset,
  getRrrWarnings,
  repairRrrCondition,
  type RrrCondition,
  type RrrModule,
  type RrrModuleType,
} from '@/rrr';
import { RrrInteractionJsonEditor } from './RrrInteractionJsonEditor';
import { RrrMockPreview } from './RrrMockPreview';
import { RrrTemplatePicker } from './RrrTemplatePicker';
import { RrrWarningsPanel } from './RrrWarningsPanel';
import type { RrrInteractionEditorProps } from './types';

type FlatConditionType = 'none' | RrrCondition['type'];

const CONDITION_TYPE_LABELS: Record<FlatConditionType, string> = {
  none: 'No condition',
  module: 'Single module',
  sequence: 'Sequence',
  all_of: 'All of',
  any_of: 'Any of',
};

export function RrrInteractionEditor({
  interaction,
  onChange,
}: RrrInteractionEditorProps) {
  const [moduleTypeToAdd, setModuleTypeToAdd] =
    useState<RrrModuleType>('text_answer');
  const moduleCount = interaction.modules.length;
  const conditionType = interaction.condition?.type ?? 'None';
  const validation = RrrInteractionSchema.safeParse(interaction);
  const validationMessages = validation.success
    ? []
    : validation.error.issues.slice(0, 4).map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
        return `${path}${issue.message}`;
      });
  const warnings = getRrrWarnings(interaction);

  function addModule() {
    const module = createRrrModuleFromPreset(
      moduleTypeToAdd,
      interaction.modules,
    );
    onChange({
      ...interaction,
      modules: [...interaction.modules, module],
    });
  }

  function updateModule(moduleId: string, nextModule: RrrModule) {
    onChange({
      ...interaction,
      modules: interaction.modules.map((module) =>
        module.id === moduleId ? nextModule : module,
      ),
    });
  }

  function removeModule(moduleId: string) {
    const nextModules = interaction.modules.filter(
      (module) => module.id !== moduleId,
    );

    onChange({
      ...interaction,
      modules: nextModules,
      condition: repairRrrCondition(
        interaction.condition,
        nextModules.map((module) => module.id),
      ),
    });
  }

  return (
    <section className="stq-rrr-editor" aria-label="Reactive Riddle Runtime">
      <div className="stq-rrr-editor__header">
        <h3>Reactive Riddle Runtime</h3>
        <p>
          Authoring shell for modular sensor-based riddles. Runtime evaluation
          will live outside React.
        </p>
      </div>

      <dl className="stq-rrr-editor__summary">
        <div>
          <dt>Modules</dt>
          <dd>{moduleCount}</dd>
        </div>
        <div>
          <dt>Condition</dt>
          <dd>{conditionType}</dd>
        </div>
      </dl>

      <RrrTemplatePicker
        hasExistingInteraction={interaction.modules.length > 0}
        onApply={(nextInteraction) => onChange(nextInteraction)}
      />

      <div className="stq-rrr-editor__add">
        <label className="stq-edit-panel-label" htmlFor="rrr-module-type">
          Add module
        </label>
        <div className="stq-rrr-editor__add-row">
          <select
            id="rrr-module-type"
            className="stq-rrr-editor__select"
            value={moduleTypeToAdd}
            onChange={(event) =>
              setModuleTypeToAdd(event.target.value as RrrModuleType)
            }
          >
            {RRR_MODULE_TYPES.map((type) => (
              <option key={type} value={type}>
                {RRR_MODULE_PRESETS[type].label}
              </option>
            ))}
          </select>
          <button
            type="button"
            className="stq-rrr-editor__button"
            onClick={addModule}
          >
            Add
          </button>
        </div>
      </div>

      {moduleCount === 0 && (
        <div className="stq-rrr-editor__empty">
          No modules yet. Module and condition editing will be added in a later
          PR.
        </div>
      )}

      {moduleCount > 0 && (
        <div className="stq-rrr-editor__modules">
          {interaction.modules.map((module) => (
            <RrrModuleEditor
              key={module.id}
              module={module}
              onChange={(nextModule) => updateModule(module.id, nextModule)}
              onRemove={() => removeModule(module.id)}
            />
          ))}
        </div>
      )}

      <RrrConditionEditor
        modules={interaction.modules}
        condition={interaction.condition}
        onChange={(condition) =>
          onChange({
            ...interaction,
            condition,
          })
        }
      />

      <RrrMockPreview interaction={interaction} />

      <RrrWarningsPanel warnings={warnings} />

      <div
        className={`stq-rrr-validation ${
          validation.success ? 'is-valid' : 'is-invalid'
        }`}
      >
        <div className="stq-rrr-validation__header">
          <strong>{validation.success ? 'Valid' : 'Invalid'}</strong>
        </div>
        {!validation.success && (
          <ul>
            {validationMessages.map((message) => (
              <li key={message}>{message}</li>
            ))}
          </ul>
        )}
      </div>

      <RrrInteractionJsonEditor interaction={interaction} onApply={onChange} />
    </section>
  );
}

function RrrConditionEditor({
  modules,
  condition,
  onChange,
}: {
  modules: RrrModule[];
  condition: RrrCondition | undefined;
  onChange: (condition: RrrCondition | undefined) => void;
}) {
  const moduleIds = modules.map((module) => module.id);
  const moduleIdSet = new Set(moduleIds);
  const conditionType: FlatConditionType = condition?.type ?? 'none';
  const selectedIds = conditionToFlatModuleIds(condition).filter((moduleId) =>
    moduleIdSet.has(moduleId),
  );
  const invalidIds = conditionToFlatModuleIds(condition).filter(
    (moduleId) => !moduleIdSet.has(moduleId),
  );
  const unsupportedNestedCondition = condition
    ? !isFlatCondition(condition)
    : false;

  function setConditionType(nextType: FlatConditionType) {
    if (nextType === 'none' || moduleIds.length === 0) {
      onChange(undefined);
      return;
    }

    const fallbackIds =
      selectedIds.length > 0
        ? selectedIds
        : nextType === 'module'
          ? [moduleIds[0]]
          : moduleIds;
    onChange(buildFlatCondition(nextType, fallbackIds));
  }

  function setSingleModule(moduleId: string) {
    onChange(buildFlatCondition('module', [moduleId]));
  }

  function setListModule(index: number, moduleId: string) {
    const nextIds = [...selectedIds];
    nextIds[index] = moduleId;
    onChange(buildFlatCondition(conditionType, nextIds));
  }

  function addListModule() {
    const nextModuleId =
      moduleIds.find((moduleId) => !selectedIds.includes(moduleId)) ??
      moduleIds[0];
    if (!nextModuleId) {
      return;
    }
    onChange(buildFlatCondition(conditionType, [...selectedIds, nextModuleId]));
  }

  function removeListModule(index: number) {
    const nextIds = selectedIds.filter((_, currentIndex) => currentIndex !== index);
    onChange(buildFlatCondition(conditionType, nextIds));
  }

  function moveListModule(index: number, delta: -1 | 1) {
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= selectedIds.length) {
      return;
    }
    const nextIds = [...selectedIds];
    const [moved] = nextIds.splice(index, 1);
    nextIds.splice(nextIndex, 0, moved);
    onChange(buildFlatCondition(conditionType, nextIds));
  }

  function toggleSetModule(moduleId: string, checked: boolean) {
    const nextIds = checked
      ? [...selectedIds, moduleId]
      : selectedIds.filter((selectedId) => selectedId !== moduleId);
    onChange(buildFlatCondition(conditionType, nextIds));
  }

  return (
    <section className="stq-rrr-condition">
      <div className="stq-rrr-condition__header">
        <div>
          <strong>Condition</strong>
          <span>Choose how authored modules are combined.</span>
        </div>
      </div>

      <label className="stq-rrr-field">
        <span>Condition type</span>
        <select
          className="stq-rrr-editor__select"
          value={conditionType}
          onChange={(event) =>
            setConditionType(event.target.value as FlatConditionType)
          }
          disabled={moduleIds.length === 0}
        >
          {Object.entries(CONDITION_TYPE_LABELS).map(([type, label]) => (
            <option key={type} value={type}>
              {label}
            </option>
          ))}
        </select>
      </label>

      {moduleIds.length === 0 && (
        <div className="stq-rrr-editor__empty">
          Add at least one module before creating a condition.
        </div>
      )}

      {unsupportedNestedCondition && (
        <div className="stq-rrr-condition__warning">
          This condition contains nested logic. The MVP editor only supports flat
          module IDs; choose a condition type above to replace it.
        </div>
      )}

      {invalidIds.length > 0 && (
        <div className="stq-rrr-condition__warning">
          Invalid module reference{invalidIds.length === 1 ? '' : 's'}:{' '}
          {invalidIds.join(', ')}
        </div>
      )}

      {conditionType === 'module' && moduleIds.length > 0 && (
        <label className="stq-rrr-field">
          <span>Module</span>
          <select
            className="stq-rrr-editor__select"
            value={selectedIds[0] ?? moduleIds[0]}
            onChange={(event) => setSingleModule(event.target.value)}
          >
            {modules.map((module) => (
              <option key={module.id} value={module.id}>
                {module.label} ({module.id})
              </option>
            ))}
          </select>
        </label>
      )}

      {conditionType === 'sequence' && moduleIds.length > 0 && (
        <div className="stq-rrr-condition__list">
          {selectedIds.map((moduleId, index) => (
            <div key={`${moduleId}-${index}`} className="stq-rrr-condition__row">
              <select
                className="stq-rrr-editor__select"
                value={moduleId}
                onChange={(event) => setListModule(index, event.target.value)}
              >
                {modules.map((module) => (
                  <option key={module.id} value={module.id}>
                    {module.label} ({module.id})
                  </option>
                ))}
              </select>
              <button
                type="button"
                className="stq-rrr-editor__button stq-rrr-editor__button--ghost"
                disabled={index === 0}
                onClick={() => moveListModule(index, -1)}
              >
                Up
              </button>
              <button
                type="button"
                className="stq-rrr-editor__button stq-rrr-editor__button--ghost"
                disabled={index === selectedIds.length - 1}
                onClick={() => moveListModule(index, 1)}
              >
                Down
              </button>
              <button
                type="button"
                className="stq-rrr-editor__button stq-rrr-editor__button--danger"
                onClick={() => removeListModule(index)}
              >
                Remove
              </button>
            </div>
          ))}
          <button
            type="button"
            className="stq-rrr-editor__button"
            onClick={addListModule}
          >
            Add step
          </button>
        </div>
      )}

      {(conditionType === 'all_of' || conditionType === 'any_of') &&
        moduleIds.length > 0 && (
          <div className="stq-rrr-condition__checks">
            {modules.map((module) => (
              <label key={module.id} className="stq-rrr-check">
                <input
                  type="checkbox"
                  checked={selectedIds.includes(module.id)}
                  onChange={(event) =>
                    toggleSetModule(module.id, event.target.checked)
                  }
                />
                <span>
                  {module.label} ({module.id})
                </span>
              </label>
            ))}
          </div>
        )}
    </section>
  );
}

function RrrModuleEditor({
  module,
  onChange,
  onRemove,
}: {
  module: RrrModule;
  onChange: (module: RrrModule) => void;
  onRemove: () => void;
}) {
  const config = module.config;

  function patchConfig(patch: Record<string, unknown>) {
    onChange({
      ...module,
      config: {
        ...module.config,
        ...patch,
      },
    });
  }

  return (
    <article className="stq-rrr-module">
      <div className="stq-rrr-module__header">
        <div>
          <strong>{module.label}</strong>
          <span>{module.id}</span>
        </div>
        <button
          type="button"
          className="stq-rrr-editor__button stq-rrr-editor__button--danger"
          onClick={onRemove}
        >
          Remove
        </button>
      </div>

      {module.type === 'text_answer' && (
        <>
          <label className="stq-rrr-field">
            <span>Answer</span>
            <input
              type="text"
              value={readString(config.answer)}
              onChange={(event) => patchConfig({ answer: event.target.value })}
            />
          </label>
          <label className="stq-rrr-check">
            <input
              type="checkbox"
              checked={Boolean(config.caseSensitive)}
              onChange={(event) =>
                patchConfig({ caseSensitive: event.target.checked })
              }
            />
            <span>Case sensitive</span>
          </label>
        </>
      )}

      {module.type === 'compass_align' && (
        <div className="stq-rrr-field-grid">
          <NumberField
            label="Target degrees"
            value={readNumber(config.targetDegrees)}
            onChange={(value) => patchConfig({ targetDegrees: value })}
          />
          <NumberField
            label="Tolerance"
            value={readNumber(config.tolerance)}
            onChange={(value) => patchConfig({ tolerance: value })}
          />
        </div>
      )}

      {module.type === 'hold_still' && (
        <NumberField
          label="Duration ms"
          value={readNumber(config.durationMs)}
          onChange={(value) => patchConfig({ durationMs: value })}
        />
      )}

      {module.type === 'gps_enter' && (
        <div className="stq-rrr-field-grid">
          <NumberField
            label="Latitude"
            value={readNumber(config.lat)}
            onChange={(value) => patchConfig({ lat: value })}
          />
          <NumberField
            label="Longitude"
            value={readNumber(config.lng)}
            onChange={(value) => patchConfig({ lng: value })}
          />
          <NumberField
            label="Radius meters"
            value={readNumber(config.radiusMeters)}
            onChange={(value) => patchConfig({ radiusMeters: value })}
          />
        </div>
      )}
    </article>
  );
}

function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
}) {
  return (
    <label className="stq-rrr-field">
      <span>{label}</span>
      <input
        type="number"
        value={Number.isFinite(value) ? String(value) : '0'}
        onChange={(event) => onChange(readNumber(event.target.value))}
      />
    </label>
  );
}

function buildFlatCondition(
  conditionType: FlatConditionType,
  moduleIds: string[],
): RrrCondition | undefined {
  const cleanIds = moduleIds.filter(Boolean);
  if (conditionType === 'none' || cleanIds.length === 0) {
    return undefined;
  }
  if (conditionType === 'module') {
    return {
      type: 'module',
      moduleId: cleanIds[0],
    };
  }
  if (conditionType === 'sequence') {
    return {
      type: 'sequence',
      children: cleanIds.map((moduleId) => ({
        type: 'module',
        moduleId,
      })),
    };
  }
  return {
    type: conditionType,
    children: cleanIds.map((moduleId) => ({
      type: 'module',
      moduleId,
    })),
  };
}

function conditionToFlatModuleIds(
  condition: RrrCondition | undefined,
): string[] {
  if (!condition) {
    return [];
  }
  if (condition.type === 'module') {
    return [condition.moduleId];
  }
  return getConditionChildren(condition).flatMap((child) =>
    child.type === 'module' ? [child.moduleId] : conditionToFlatModuleIds(child),
  );
}

function isFlatCondition(condition: RrrCondition): boolean {
  if (condition.type === 'module') {
    return true;
  }
  return getConditionChildren(condition).every((child) => child.type === 'module');
}

function getConditionChildren(
  condition: Exclude<RrrCondition, { type: 'module' }>,
): RrrCondition[] {
  return 'steps' in condition ? condition.steps : condition.children;
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function readNumber(value: unknown): number {
  if (typeof value === 'number') {
    return value;
  }
  if (typeof value === 'string') {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
}
