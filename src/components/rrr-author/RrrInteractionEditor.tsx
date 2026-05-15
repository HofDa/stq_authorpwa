import {
  useCallback,
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react';
import { RrrInteractionSchema } from '@/schema';
import {
  RRR_MODULE_PRESET_GROUPS,
  RRR_MODULE_PRESETS,
  buildFlatCondition,
  conditionToFlatModuleIds,
  createRrrModuleFromPreset,
  getRrrWarnings,
  isFlatCondition,
  repairRrrCondition,
  type RrrCondition,
  type RrrFlatConditionType,
  type RrrModule,
  type RrrModuleType,
} from '@/rrr';
import {
  useEditorLanguage,
  type EditorTextKey,
} from '@/i18n/editorLanguage';
import { RrrInteractionJsonEditor } from './RrrInteractionJsonEditor';
import { RrrMockPreview } from './RrrMockPreview';
import { RrrTemplatePicker } from './RrrTemplatePicker';
import { RrrWarningsPanel } from './RrrWarningsPanel';
import { Icon, type IconName } from '@/components/studio/Icon';
import { recommendGpsRadius } from '@/rrr/sensors';
import type { RrrInteractionEditorProps } from './types';

type FlatConditionType = RrrFlatConditionType;
type EditorT = ReturnType<typeof useEditorLanguage>['t'];

const CONDITION_TYPE_LABEL_KEYS: Record<FlatConditionType, EditorTextKey> = {
  none: 'rrr.editor.condition.none',
  module: 'rrr.editor.condition.module',
  sequence: 'rrr.editor.condition.sequence',
  all_of: 'rrr.editor.condition.allOf',
  any_of: 'rrr.editor.condition.anyOf',
};

const COMPASS_DIRECTION_PRESETS = [
  { labelKey: 'rrr.editor.compass.north', degrees: 0 },
  { labelKey: 'rrr.editor.compass.east', degrees: 90 },
  { labelKey: 'rrr.editor.compass.south', degrees: 180 },
  { labelKey: 'rrr.editor.compass.west', degrees: 270 },
] as const;

const HOLD_STILL_DURATION_PRESETS = [
  { label: '1 s', durationMs: 1000 },
  { label: '2 s', durationMs: 2000 },
  { label: '3 s', durationMs: 3000 },
  { label: '5 s', durationMs: 5000 },
] as const;

const TIMER_WAIT_DURATION_PRESETS = [
  { label: '3 s', durationMs: 3000 },
  { label: '5 s', durationMs: 5000 },
  { label: '10 s', durationMs: 10000 },
  { label: '30 s', durationMs: 30000 },
] as const;

type CompassNeedleStyle = CSSProperties & {
  '--stq-rrr-compass-degrees': string;
};

export function RrrInteractionEditor({
  interaction,
  stationId,
  stationTitle,
  fieldTestIssueTags,
  onChange,
}: RrrInteractionEditorProps) {
  const { t } = useEditorLanguage();
  const [moduleTypeToAdd, setModuleTypeToAdd] =
    useState<RrrModuleType>('text_answer');

  const [expertMode, setExpertMode] = useState(() => {
    if (typeof window === 'undefined') {
      return false; // Default for SSR or non-browser environments
    }
    try {
      const storedValue = localStorage.getItem('stq-rrr-expert-mode');
      return storedValue === 'true';
    } catch {
      return false; // Fallback if localStorage is not accessible
    }
  });
  const moduleCount = interaction.modules.length;
  const conditionType = interaction.condition?.type ?? 'none';
  const selectedModulePreset = RRR_MODULE_PRESETS[moduleTypeToAdd];
  const validation = RrrInteractionSchema.safeParse(interaction);
  const validationMessages = validation.success
    ? []
    : validation.error.issues.slice(0, 4).map((issue) => {
        const path = issue.path.length > 0 ? `${issue.path.join('.')}: ` : '';
        return `${path}${issue.message}`;
      });
  const warnings = getRrrWarnings(interaction);

  const handleExpertModeChange = useCallback((checked: boolean) => {
    setExpertMode(checked);
    if (typeof window !== 'undefined') {
      localStorage.setItem('stq-rrr-expert-mode', String(checked));
    }
  }, []);

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

  function createFallbackModule(moduleId: string, fallbackType: RrrModuleType) {
    const targetModule = interaction.modules.find(
      (module) => module.id === moduleId,
    );
    if (!targetModule) {
      return;
    }

    const fallbackModule = createRrrModuleFromPreset(
      fallbackType,
      interaction.modules,
    );
    const labeledFallbackModule = {
      ...fallbackModule,
      label: formatEditorText(t('rrr.editor.fallback.generatedLabel'), {
        fallback: fallbackModule.label,
        target: targetModule.label,
      }),
    };

    onChange({
      ...interaction,
      modules: [
        ...interaction.modules.map((module) =>
          module.id === moduleId
            ? { ...module, fallbackModuleId: labeledFallbackModule.id }
            : module,
        ),
        labeledFallbackModule,
      ],
    });
  }

  return (
    <section className="stq-rrr-editor" aria-label={t('rrr.editor.title')}>
      <div className="stq-rrr-editor__header">
        <div>
          <h3>{t('rrr.editor.title')}</h3>
          <p>{t('studio.riddleSettingsHint')}</p>
        </div>
        <label className="stq-rrr-expert-toggle">
          <input
            type="checkbox"
            checked={expertMode}
            onChange={(event) => handleExpertModeChange(event.target.checked)}
          />
          <span>{t('rrr.expertMode')}</span>
          <small className="stq-rrr-field__hint">
            {t('rrr.expertModeHint')}
          </small>
        </label>
      </div>

      <dl className="stq-rrr-editor__summary">
        <div>
          <dt>{t('rrr.editor.summary.modules')}</dt>
          <dd>{moduleCount}</dd>
        </div>{' '}
        {expertMode && (
          <div>
            <dt>{t('rrr.condition')}</dt>
            <dd>{getConditionTypeLabel(conditionType, t)}</dd>
          </div>
        )}
      </dl>

      <RrrTemplatePicker
        hasExistingInteraction={interaction.modules.length > 0}
        variant={moduleCount === 0 ? 'wizard' : 'compact'}
        onApply={(nextInteraction) => onChange(nextInteraction)}
      />

      <div className="stq-rrr-editor__add">
        <label className="stq-edit-panel-label" htmlFor="rrr-module-type">
          {t('rrr.editor.addModule')}
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
            {RRR_MODULE_PRESET_GROUPS.map((group) => (
              <optgroup key={group.label} label={group.label}>
                {group.types.map((type) => (
                  <option key={type} value={type}>
                    {RRR_MODULE_PRESETS[type].label}
                  </option>
                ))}
              </optgroup>
            ))}
          </select>
          <button
            type="button"
            className="stq-rrr-editor__button"
            onClick={addModule}
          >
            {t('rrr.editor.add')}
          </button>
        </div>
        <ModulePresetHints preset={selectedModulePreset} />
      </div>

      {moduleCount === 0 && (
        <div className="stq-rrr-editor__empty">
          {t('rrr.editor.emptyModules')}
        </div>
      )}

      {moduleCount > 0 && (
        <div className="stq-rrr-editor__modules">
          {interaction.modules.map((module) => (
            <RrrModuleEditor
              key={module.id}
              module={module}
              modules={interaction.modules}
              expertMode={expertMode}
              onChange={(nextModule) => updateModule(module.id, nextModule)}
              onCreateFallback={(fallbackType) =>
                createFallbackModule(module.id, fallbackType)
              }
              onRemove={() => removeModule(module.id)}
            />
          ))}
        </div>
      )}

      <RrrConditionEditor
        modules={interaction.modules}
        condition={interaction.condition}
        expertMode={expertMode}
        onChange={(condition) =>
          onChange({
            ...interaction,
            condition,
          })
        }
      />

      <RrrMockPreview
        interaction={interaction}
        expertMode={expertMode}
        stationId={stationId}
        stationTitle={stationTitle}
        fieldTestIssueTags={fieldTestIssueTags}
      />

      {expertMode && (
        <>
          <RrrWarningsPanel warnings={warnings} expertMode={expertMode} />

          <div
            className={`stq-rrr-validation ${
              validation.success ? 'is-valid' : 'is-invalid'
            }`}
          >
            <div className="stq-rrr-validation__header">
              <strong>
                {validation.success
                  ? t('rrr.editor.validation.valid')
                  : t('rrr.editor.validation.invalid')}
              </strong>
            </div>
            {!validation.success && (
              <ul>
                {validationMessages.map((message) => (
                  <li key={message}>{message}</li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}

      {expertMode && (
        <RrrInteractionJsonEditor interaction={interaction} onApply={onChange} />
      )}
    </section>
  );
}

function ModulePresetHints({
  preset,
}: {
  preset: (typeof RRR_MODULE_PRESETS)[RrrModuleType];
}) {
  const { t } = useEditorLanguage();
  const reliabilityLabel = getModuleReliabilityLabel(preset.reliability, t);
  const difficultyLabel = getModuleDifficultyLabel(preset.difficulty, t);
  const shouldFieldTest =
    preset.reliability === 'medium' ||
    preset.reliability === 'device-dependent' ||
    preset.difficulty === 'advanced';

  return (
    <div
      className={`stq-rrr-module-preset-hints stq-rrr-module-preset-hints--${preset.reliability}`}
      aria-live="polite"
    >
      <div className="stq-rrr-module-preset-hints__header">
        <strong>{preset.label}</strong>
        <span>{preset.category}</span>
      </div>
      <div className="stq-rrr-module-preset-hints__badges">
        <span>{difficultyLabel}</span>
        <span>{reliabilityLabel}</span>
        <span>
          {preset.needsFallback
            ? t('rrr.editor.preset.fallbackRecommended')
            : t('rrr.editor.preset.robust')}
        </span>
        {shouldFieldTest && <span>{t('rrr.editor.preset.fieldTest')}</span>}
      </div>
    </div>
  );
}

function getModuleDifficultyLabel(
  difficulty: (typeof RRR_MODULE_PRESETS)[RrrModuleType]['difficulty'],
  t: EditorT,
): string {
  switch (difficulty) {
    case 'easy':
      return t('rrr.editor.difficulty.easy');
    case 'medium':
      return t('rrr.editor.difficulty.medium');
    case 'advanced':
      return t('rrr.editor.difficulty.advanced');
  }
}

function getModuleReliabilityLabel(
  reliability: (typeof RRR_MODULE_PRESETS)[RrrModuleType]['reliability'],
  t: EditorT,
): string {
  switch (reliability) {
    case 'high':
      return t('rrr.editor.reliability.high');
    case 'medium':
      return t('rrr.editor.reliability.medium');
    case 'device-dependent':
      return t('rrr.editor.reliability.deviceDependent');
  }
}

function RrrConditionEditor({
  modules,
  condition,
  expertMode,
  onChange,
}: {
  modules: RrrModule[];
  condition: RrrCondition | undefined;
  expertMode: boolean;
  onChange: (condition: RrrCondition | undefined) => void;
}) {
  const { t } = useEditorLanguage();
  const moduleIds = useMemo(
    () => modules.map((module) => module.id),
    [modules],
  );
  const moduleIdSet = useMemo(() => new Set(moduleIds), [moduleIds]);
  const conditionType: FlatConditionType = condition?.type ?? 'none';
  const flatModuleIds = conditionToFlatModuleIds(condition);
  const selectedIds = flatModuleIds.filter((moduleId) =>
    moduleIdSet.has(moduleId),
  );
  const invalidIds = flatModuleIds.filter((moduleId) => !moduleIdSet.has(moduleId));
  const sequenceStepIds = conditionType === 'sequence' ? flatModuleIds : selectedIds;
  const unsupportedNestedCondition = condition
    ? !isFlatCondition(condition)
    : false;
  const [moduleIdToAdd, setModuleIdToAdd] = useState(moduleIds[0] ?? '');

  useEffect(() => {
    if (!moduleIdToAdd || !moduleIdSet.has(moduleIdToAdd)) {
      setModuleIdToAdd(moduleIds[0] ?? '');
    }
  }, [moduleIdSet, moduleIdToAdd, moduleIds]);

  function setConditionType(nextType: FlatConditionType) {
    if (nextType === 'none') {
      onChange(undefined);
      return;
    }

    if (moduleIds.length === 0) {
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
    const nextIds = [...getEditableListIds()];
    nextIds[index] = moduleId;
    onChange(buildFlatCondition(conditionType, nextIds));
  }

  function addListModule() {
    if (moduleIds.length === 0) {
      return;
    }

    const currentIds = getEditableListIds();
    const nextModuleId =
      moduleIdToAdd ||
      (moduleIds.find((moduleId) => !currentIds.includes(moduleId)) ??
        moduleIds[0]);
    if (!nextModuleId) {
      return;
    }
    onChange(buildFlatCondition(conditionType, [...currentIds, nextModuleId]));
  }

  function removeListModule(index: number) {
    const nextIds = getEditableListIds().filter(
      (_, currentIndex) => currentIndex !== index,
    );
    onChange(buildFlatCondition(conditionType, nextIds));
  }

  function moveListModule(index: number, delta: -1 | 1) {
    const currentIds = getEditableListIds();
    const nextIndex = index + delta;
    if (nextIndex < 0 || nextIndex >= currentIds.length) {
      return;
    }
    const nextIds = [...currentIds];
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

  function resetCondition() {
    onChange(undefined);
  }

  function getEditableListIds(): string[] {
    return conditionType === 'sequence' ? sequenceStepIds : selectedIds;
  }

  return (
    <section className="stq-rrr-condition">
      <div className="stq-rrr-condition__header">
        <div>
          <strong>{t('rrr.condition')}</strong>
          <span>{t('rrr.editor.condition.description')}</span>
        </div>
      </div>

      <label className="stq-rrr-field">
        <span>{t('rrr.editor.condition.type')}</span>
        <select
          className="stq-rrr-editor__select"
          value={conditionType}
          onChange={(event) =>
            setConditionType(event.target.value as FlatConditionType)
          }
          disabled={moduleIds.length === 0 || unsupportedNestedCondition}
        >
          {Object.keys(CONDITION_TYPE_LABEL_KEYS).map((type) => (
            <option key={type} value={type}>
              {getConditionTypeLabel(type as FlatConditionType, t)}
            </option>
          ))}
        </select>
      </label>

      {moduleIds.length === 0 && (
        <div className="stq-rrr-editor__empty">
          {t('rrr.editor.condition.emptyModules')}
        </div>
      )}

      {unsupportedNestedCondition && (
        <div className="stq-rrr-condition__warning">
          <span>{t('rrr.editor.condition.unsupported')}</span>
          <button
            type="button"
            className="stq-rrr-editor__button stq-rrr-editor__button--ghost"
            onClick={resetCondition}
          >
            {t('rrr.editor.condition.reset')}
          </button>
        </div>
      )}

      {invalidIds.length > 0 && (
        <div className="stq-rrr-condition__warning">
          {expertMode
            ? formatEditorText(
                t(
                  invalidIds.length === 1
                    ? 'rrr.editor.condition.invalidReference'
                    : 'rrr.editor.condition.invalidReferences',
                ),
                { ids: invalidIds.join(', ') },
              )
            : t('rrr.editor.condition.deletedModule')}
        </div>
      )}

      {!unsupportedNestedCondition && conditionType === 'module' && moduleIds.length > 0 && (
        <label className="stq-rrr-field">
          <span>{t('rrr.editor.condition.moduleLabel')}</span>
          <select
            className="stq-rrr-editor__select"
            value={selectedIds[0] ?? moduleIds[0]}
            onChange={(event) => setSingleModule(event.target.value)}
          >
            {modules.map((module) => (
              <option key={module.id} value={module.id}>
                {formatModuleOption(module, expertMode)}
              </option>
            ))}
          </select>
        </label>
      )}

      {!unsupportedNestedCondition && conditionType === 'sequence' && moduleIds.length > 0 && (
        <div className="stq-rrr-condition__list">
          {sequenceStepIds.map((moduleId, index) => (
            <div key={`${moduleId}-${index}`} className="stq-rrr-condition__row">
              <div className="stq-rrr-condition__step">
                <strong>
                  {formatEditorText(t('rrr.editor.condition.stepLabel'), {
                    index: String(index + 1),
                    module: getModuleDisplayLabel(moduleId, modules, expertMode, t),
                  })}
                </strong>
                {!moduleIdSet.has(moduleId) && (
                  <span>{t('rrr.editor.condition.missingStepModule')}</span>
                )}
              </div>
              {moduleIdSet.has(moduleId) && (
                <select
                  className="stq-rrr-editor__select"
                  value={moduleId}
                  aria-label={formatEditorText(
                    t('rrr.editor.condition.stepModuleAria'),
                    { index: String(index + 1) },
                  )}
                  onChange={(event) => setListModule(index, event.target.value)}
                >
                  {modules.map((module) => (
                    <option key={module.id} value={module.id}>
                      {formatModuleOption(module, expertMode)}
                    </option>
                  ))}
                </select>
              )}
              <button
                type="button"
                className="stq-rrr-editor__button stq-rrr-editor__button--ghost"
                disabled={index === 0}
                onClick={() => moveListModule(index, -1)}
              >
                {t('studio.moveUp')}
              </button>
              <button
                type="button"
                className="stq-rrr-editor__button stq-rrr-editor__button--ghost"
                disabled={index === sequenceStepIds.length - 1}
                onClick={() => moveListModule(index, 1)}
              >
                {t('studio.moveDown')}
              </button>
              <button
                type="button"
                className="stq-rrr-editor__button stq-rrr-editor__button--danger"
                onClick={() => removeListModule(index)}
              >
                {t('studio.deleteEntry')}
              </button>
            </div>
          ))}
          <div className="stq-rrr-condition__add-step">
            <select
              className="stq-rrr-editor__select"
              value={moduleIdToAdd}
              aria-label={t('rrr.editor.condition.newStepModuleAria')}
              onChange={(event) => setModuleIdToAdd(event.target.value)}
            >
              {modules.map((module) => (
                <option key={module.id} value={module.id}>
                  {formatModuleOption(module, expertMode)}
                </option>
              ))}
            </select>
            <button
              type="button"
              className="stq-rrr-editor__button"
              onClick={addListModule}
            >
              {t('rrr.editor.condition.addStep')}
            </button>
          </div>
        </div>
      )}

      {!unsupportedNestedCondition &&
        (conditionType === 'all_of' || conditionType === 'any_of') &&
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
                  {formatModuleOption(module, expertMode)}
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
  modules,
  expertMode,
  onChange,
  onCreateFallback,
  onRemove,
}: {
  module: RrrModule;
  modules: RrrModule[];
  expertMode: boolean;
  onChange: (module: RrrModule) => void;
  onCreateFallback: (fallbackType: RrrModuleType) => void;
  onRemove: () => void;
}) {
  const { t } = useEditorLanguage();
  const config = module.config;
  const [isEditing, setIsEditing] = useState(false);
  const cardMeta = getModuleCardMeta(module, t);
  const modulePreset = RRR_MODULE_PRESETS[module.type];
  const fallbackOptions = modules.filter((entry) => entry.id !== module.id);
  const fallbackSuggestions = module.fallbackModuleId
    ? []
    : modulePreset.recommendedFallbackTypes;
  const summary = [
    ...getModuleSettingsSummary(module, t),
    ...getFallbackSettingsSummary(module, modules, expertMode, t),
  ];

  function patchConfig(patch: Record<string, unknown>) {
    onChange({
      ...module,
      config: {
        ...module.config,
        ...patch,
      },
    });
  }

  function setFallbackModuleId(moduleId: string) {
    if (!moduleId) {
      const { fallbackModuleId, ...nextModule } = module;
      onChange(nextModule);
      return;
    }

    onChange({
      ...module,
      fallbackModuleId: moduleId,
    });
  }

  return (
    <article className="stq-rrr-module">
      <div className="stq-rrr-module__header">
        <div className="stq-rrr-module__title-row">
          <span className="stq-rrr-module__icon" aria-hidden="true">
            <Icon name={cardMeta.icon} size={18} />
          </span>
          <div>
            <strong>{cardMeta.title}</strong>
            <span>{cardMeta.description}</span>
            {expertMode && <code className="stq-rrr-module__id">{module.id}</code>}
          </div>
        </div>
        <div className="stq-rrr-module__actions">
          <button
            type="button"
            className="stq-rrr-editor__button stq-rrr-editor__button--ghost"
            onClick={() => setIsEditing((current) => !current)}
            aria-expanded={isEditing}
          >
            <Icon name="edit" size={14} />
            {isEditing ? t('studio.close') : t('studio.edit')}
          </button>
          <button
            type="button"
            className="stq-rrr-editor__button stq-rrr-editor__button--danger"
            onClick={onRemove}
          >
            <Icon name="trash" size={14} />
            {t('studio.deleteEntry')}
          </button>
        </div>
      </div>

      <dl className="stq-rrr-module__summary">
        {summary.map((item) => (
          <div key={item.label}>
            <dt>{item.label}</dt>
            <dd>{item.value}</dd>
          </div>
        ))}
      </dl>

      {isEditing && (
        <div className="stq-rrr-module__editor">
          {module.type === 'text_answer' && (
            <TextAnswerEditor config={config} onPatchConfig={patchConfig} />
          )}

          {module.type === 'multi_choice' && (
            <MultiChoiceEditor
              moduleId={module.id}
              config={config}
              onPatchConfig={patchConfig}
            />
          )}

          {module.type === 'compass_align' && (
            <CompassDirectionPicker
              config={config}
              expertMode={expertMode}
              onPatchConfig={patchConfig}
            />
          )}

          {module.type === 'direction_hotcold' && (
            <CompassDirectionPicker
              config={config}
              expertMode={expertMode}
              toleranceConfigKey="successTolerance"
              toleranceLabel={t('rrr.editor.module.directionHotcoldToleranceLabel')}
              toleranceHint={t('rrr.editor.module.directionHotcoldToleranceHint')}
              onPatchConfig={patchConfig}
            />
          )}

          {module.type === 'hold_still' && (
            <HoldStillDurationEditor
              config={config}
              expertMode={expertMode}
              onPatchConfig={patchConfig}
            />
          )}

          {module.type === 'gps_enter' && (
            <GpsRadiusEditor config={config} onPatchConfig={patchConfig} />
          )}

          {module.type === 'proximity_hint' && (
            <GpsRadiusEditor
              config={config}
              radiusConfigKey="successRadiusMeters"
              radiusLabel={t('rrr.editor.module.proximityRadiusLabel')}
              radiusHint={t('rrr.editor.module.proximityRadiusHint')}
              onPatchConfig={patchConfig}
            />
          )}

          {module.type === 'qr_scan' && (
            <QrScanEditor config={config} onPatchConfig={patchConfig} />
          )}

          {module.type === 'code_word' && (
            <CodeWordEditor config={config} onPatchConfig={patchConfig} />
          )}

          {module.type === 'sequential_code' && (
            <SequentialCodeEditor
              config={config}
              onPatchConfig={patchConfig}
            />
          )}

          {module.type === 'timer_wait' && (
            <TimerWaitDurationEditor
              config={config}
              expertMode={expertMode}
              onPatchConfig={patchConfig}
            />
          )}

          {module.type === 'photo_check_manual' && (
            <PhotoCheckManualEditor
              config={config}
              onPatchConfig={patchConfig}
            />
          )}

          {module.type === 'object_found' && (
            <ObjectFoundEditor config={config} onPatchConfig={patchConfig} />
          )}

          {fallbackSuggestions.length > 0 && (
            <FallbackSuggestion
              moduleLabel={module.label}
              fallbackTypes={fallbackSuggestions}
              onCreateFallback={onCreateFallback}
            />
          )}

          <label className="stq-rrr-field">
            <span>{t('rrr.editor.fallback.label')}</span>
            <select
              className="stq-rrr-editor__select"
              value={module.fallbackModuleId ?? ''}
              onChange={(event) => setFallbackModuleId(event.target.value)}
            >
              <option value="">{t('rrr.editor.fallback.none')}</option>
              {fallbackOptions.map((fallbackModule) => (
                <option key={fallbackModule.id} value={fallbackModule.id}>
                  {formatModuleOption(fallbackModule, expertMode)}
                </option>
              ))}
              {module.fallbackModuleId &&
                !modules.some(
                  (fallbackModule) =>
                    fallbackModule.id === module.fallbackModuleId,
                ) && (
                  <option value={module.fallbackModuleId}>
                    {expertMode
                      ? `${t('rrr.editor.fallback.missing')} (${module.fallbackModuleId})`
                      : t('rrr.editor.fallback.missing')}
                  </option>
                )}
            </select>
            <small className="stq-rrr-field__hint">
              {t('rrr.editor.fallback.hint')}
            </small>
          </label>
        </div>
      )}
    </article>
  );
}

function FallbackSuggestion({
  moduleLabel,
  fallbackTypes,
  onCreateFallback,
}: {
  moduleLabel: string;
  fallbackTypes: readonly RrrModuleType[];
  onCreateFallback: (fallbackType: RrrModuleType) => void;
}) {
  const { t } = useEditorLanguage();
  return (
    <section
      className="stq-rrr-fallback-suggestion"
      aria-label={t('rrr.editor.fallback.suggestionAria')}
    >
      <div className="stq-rrr-fallback-suggestion__text">
        <strong>{t('rrr.editor.fallback.suggestionTitle')}</strong>
        <span>
          {formatEditorText(t('rrr.editor.fallback.suggestionDescription'), {
            module: moduleLabel,
          })}
        </span>
      </div>
      <div className="stq-rrr-fallback-suggestion__actions">
        {fallbackTypes.map((fallbackType) => (
          <button
            key={fallbackType}
            type="button"
            className="stq-rrr-editor__button stq-rrr-editor__button--ghost"
            onClick={() => onCreateFallback(fallbackType)}
          >
            {formatEditorText(t('rrr.editor.fallback.create'), {
              label: RRR_MODULE_PRESETS[fallbackType].label,
            })}
          </button>
        ))}
      </div>
    </section>
  );
}

function TextAnswerEditor({
  config,
  onPatchConfig,
}: {
  config: RrrModule['config'];
  onPatchConfig: (patch: Record<string, unknown>) => void;
}) {
  const { t } = useEditorLanguage();
  const answer = readString(config.answer);
  const hasAnswer = answer.trim() !== '';
  const caseSensitive = Boolean(config.caseSensitive);

  return (
    <div className="stq-rrr-text-answer-editor">
      <section
        className={`stq-rrr-text-answer ${
          hasAnswer ? '' : 'stq-rrr-text-answer--empty'
        }`}
        aria-label={t('rrr.editor.textAnswer.aria')}
      >
        <div className="stq-rrr-text-answer__header">
          <div>
            <span>{t('rrr.editor.textAnswer.eyebrow')}</span>
            <strong>
              {hasAnswer
                ? t('rrr.editor.textAnswer.set')
                : t('rrr.editor.textAnswer.missing')}
            </strong>
          </div>
          <span
            className={`stq-rrr-text-answer__badge ${
              hasAnswer ? '' : 'stq-rrr-text-answer__badge--empty'
            }`}
          >
            {caseSensitive
              ? t('rrr.editor.case.exact')
              : t('rrr.editor.case.flexible')}
          </span>
        </div>

        <label className="stq-rrr-field">
          <span>{t('rrr.editor.textAnswer.label')}</span>
          <input
            type="text"
            value={answer}
            placeholder={t('rrr.editor.textAnswer.placeholder')}
            onChange={(event) => onPatchConfig({ answer: event.target.value })}
          />
          <small className="stq-rrr-field__hint">
            {t('rrr.editor.textAnswer.hint')}
          </small>
        </label>

        {!hasAnswer && (
          <p className="stq-rrr-text-answer__warning">
            {t('rrr.editor.textAnswer.warning')}
          </p>
        )}

        <label className="stq-rrr-check stq-rrr-text-answer__toggle">
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={(event) =>
              onPatchConfig({ caseSensitive: event.target.checked })
            }
          />
          <span>{t('rrr.editor.case.respect')}</span>
        </label>
      </section>
    </div>
  );
}

function MultiChoiceEditor({
  moduleId,
  config,
  onPatchConfig,
}: {
  moduleId: string;
  config: RrrModule['config'];
  onPatchConfig: (patch: Record<string, unknown>) => void;
}) {
  const { t } = useEditorLanguage();
  const question = readString(config.question);
  const options = normalizeMultiChoiceOptions(config.options);
  const correctOptionIndexes = normalizeMultiChoiceIndexes(
    config.correctOptionIndexes,
    options,
  );
  const allowMultiple = Boolean(config.allowMultiple);
  const hasQuestion = question.trim() !== '';
  const hasOptions = options.some((option) => option.trim() !== '');
  const hasCorrectOption = correctOptionIndexes.length > 0;

  function setOption(index: number, value: string) {
    const nextOptions = options.map((option, optionIndex) =>
      optionIndex === index ? value : option,
    );
    onPatchConfig({
      options: nextOptions,
      correctOptionIndexes: normalizeMultiChoiceIndexes(
        correctOptionIndexes,
        nextOptions,
      ),
    });
  }

  function addOption() {
    onPatchConfig({ options: [...options, ''] });
  }

  function removeOption(index: number) {
    if (options.length <= 1) {
      return;
    }
    const nextOptions = options.filter((_, optionIndex) => optionIndex !== index);
    onPatchConfig({
      options: nextOptions,
      correctOptionIndexes: correctOptionIndexes
        .filter((entry) => entry !== index)
        .map((entry) => (entry > index ? entry - 1 : entry)),
    });
  }

  function toggleCorrectOption(index: number, checked: boolean) {
    const nextCorrect = allowMultiple
      ? checked
        ? [...new Set([...correctOptionIndexes, index])]
        : correctOptionIndexes.filter((entry) => entry !== index)
      : checked
        ? [index]
        : [];
    onPatchConfig({ correctOptionIndexes: nextCorrect });
  }

  function setAllowMultiple(nextAllowMultiple: boolean) {
    onPatchConfig({
      allowMultiple: nextAllowMultiple,
      correctOptionIndexes: nextAllowMultiple
        ? correctOptionIndexes
        : correctOptionIndexes.slice(0, 1),
    });
  }

  return (
    <div className="stq-rrr-text-answer-editor">
      <section
        className={`stq-rrr-text-answer ${
          hasQuestion && hasOptions && hasCorrectOption
            ? ''
            : 'stq-rrr-text-answer--empty'
        }`}
        aria-label={t('rrr.editor.multiChoice.aria')}
      >
        <div className="stq-rrr-text-answer__header">
          <div>
            <span>{t('rrr.editor.multiChoice.eyebrow')}</span>
            <strong>
              {hasQuestion && hasOptions && hasCorrectOption
                ? t('rrr.editor.multiChoice.ready')
                : t('rrr.editor.multiChoice.missing')}
            </strong>
          </div>
          <span
            className={`stq-rrr-text-answer__badge ${
              hasQuestion && hasOptions && hasCorrectOption
                ? ''
                : 'stq-rrr-text-answer__badge--empty'
            }`}
          >
            {allowMultiple
              ? t('rrr.editor.multiChoice.multiple')
              : t('rrr.editor.multiChoice.single')}
          </span>
        </div>

        <label className="stq-rrr-field">
          <span>{t('rrr.editor.multiChoice.question')}</span>
          <input
            type="text"
            value={question}
            placeholder={t('rrr.editor.multiChoice.questionPlaceholder')}
            onChange={(event) =>
              onPatchConfig({ question: event.target.value })
            }
          />
        </label>

        <label className="stq-rrr-check stq-rrr-text-answer__toggle">
          <input
            type="checkbox"
            checked={allowMultiple}
            onChange={(event) => setAllowMultiple(event.target.checked)}
          />
          <span>{t('rrr.editor.multiChoice.allowMultiple')}</span>
        </label>

        <div className="stq-rrr-multi-choice-editor__options">
          {options.map((option, index) => (
            <div key={index} className="stq-rrr-multi-choice-editor__option">
              <label className="stq-rrr-check">
                <input
                  type={allowMultiple ? 'checkbox' : 'radio'}
                  name={`multi-choice-correct-${moduleId}`}
                  checked={correctOptionIndexes.includes(index)}
                  onChange={(event) =>
                    toggleCorrectOption(index, event.target.checked)
                  }
                  aria-label={formatEditorText(
                    t('rrr.editor.multiChoice.correctAria'),
                    { index: String(index + 1) },
                  )}
                />
                <span>{t('rrr.editor.multiChoice.correct')}</span>
              </label>
              <input
                type="text"
                value={option}
                placeholder={formatEditorText(
                  t('rrr.editor.multiChoice.optionPlaceholder'),
                  { index: String(index + 1) },
                )}
                onChange={(event) => setOption(index, event.target.value)}
              />
              <button
                type="button"
                className="stq-rrr-editor__button stq-rrr-editor__button--ghost"
                onClick={() => removeOption(index)}
                disabled={options.length <= 1}
              >
                {t('studio.deleteEntry')}
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="stq-rrr-editor__button stq-rrr-editor__button--ghost"
          onClick={addOption}
        >
          {t('rrr.editor.multiChoice.addOption')}
        </button>

        {(!hasQuestion || !hasOptions || !hasCorrectOption) && (
          <p className="stq-rrr-text-answer__warning">
            {t('rrr.editor.multiChoice.warning')}
          </p>
        )}
      </section>
    </div>
  );
}

function HoldStillDurationEditor({
  config,
  expertMode,
  onPatchConfig,
}: {
  config: RrrModule['config'];
  expertMode: boolean;
  onPatchConfig: (patch: Record<string, unknown>) => void;
}) {
  const { t } = useEditorLanguage();
  const durationMs = normalizeDurationMs(readNumber(config.durationMs));
  const durationSliderValue = clampNumber(durationMs, 500, 8000);
  const durationMeta = getHoldStillDurationMeta(durationMs, t);

  function setDurationMs(value: number) {
    onPatchConfig({ durationMs: normalizeDurationMs(value) });
  }

  return (
    <div className="stq-rrr-hold-editor">
      <section
        className="stq-rrr-hold-duration"
        aria-label={t('rrr.editor.hold.aria')}
      >
        <div className="stq-rrr-hold-duration__header">
          <div>
            <span>{t('rrr.editor.hold.duration')}</span>
            <strong>{formatDurationSeconds(durationMs)}</strong>
          </div>
          <span
            className={`stq-rrr-hold-duration__badge stq-rrr-hold-duration__badge--${durationMeta.tone}`}
          >
            {durationMeta.label}
          </span>
        </div>

        <label className="stq-rrr-field">
          <span>{t('rrr.editor.hold.slider')}</span>
          <input
            type="range"
            min="500"
            max="8000"
            step="100"
            value={durationSliderValue}
            onChange={(event) => setDurationMs(Number(event.target.value))}
          />
          <small className="stq-rrr-field__hint">
            {durationMeta.description}
          </small>
        </label>

        <div
          className="stq-rrr-hold-duration__presets"
          aria-label={t('rrr.editor.hold.presetsAria')}
        >
          {HOLD_STILL_DURATION_PRESETS.map((preset) => (
            <button
              key={preset.durationMs}
              type="button"
              className={`stq-rrr-hold-duration__preset ${
                durationMs === preset.durationMs ? 'is-active' : ''
              }`}
              onClick={() => setDurationMs(preset.durationMs)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      {expertMode && (
        <NumberField
          label={t('rrr.editor.hold.expertLabel')}
          value={durationMs}
          onChange={setDurationMs}
        />
      )}
    </div>
  );
}

function CompassDirectionPicker({
  config,
  expertMode,
  toleranceConfigKey = 'tolerance',
  toleranceLabel,
  toleranceHint,
  onPatchConfig,
}: {
  config: RrrModule['config'];
  expertMode: boolean;
  toleranceConfigKey?: 'tolerance' | 'successTolerance';
  toleranceLabel?: string;
  toleranceHint?: string;
  onPatchConfig: (patch: Record<string, unknown>) => void;
}) {
  const { t } = useEditorLanguage();
  const resolvedToleranceLabel =
    toleranceLabel ?? t('rrr.editor.compass.defaultToleranceLabel');
  const resolvedToleranceHint =
    toleranceHint ?? t('rrr.editor.compass.defaultToleranceHint');
  const targetDegrees = normalizeCompassDegrees(readNumber(config.targetDegrees));
  const tolerance = Math.max(0, readNumber(config[toleranceConfigKey]));
  const toleranceSliderValue = Math.min(tolerance, 90);

  function setTargetDegrees(value: number) {
    onPatchConfig({ targetDegrees: normalizeCompassDegrees(value) });
  }

  function setTolerance(value: number) {
    onPatchConfig({ [toleranceConfigKey]: Math.max(0, value) });
  }

  function handleDialPointer(event: PointerEvent<HTMLButtonElement>) {
    const bounds = event.currentTarget.getBoundingClientRect();
    const centerX = bounds.left + bounds.width / 2;
    const centerY = bounds.top + bounds.height / 2;
    const x = event.clientX - centerX;
    const y = event.clientY - centerY;
    const degrees = (Math.atan2(x, -y) * 180) / Math.PI;
    setTargetDegrees(degrees);
  }

  return (
    <div className="stq-rrr-compass-picker">
      <div className="stq-rrr-compass-picker__main">
        <button
          type="button"
          className="stq-rrr-compass-picker__dial"
          onPointerDown={handleDialPointer}
          aria-label={t('rrr.editor.compass.aria')}
        >
          <span className="stq-rrr-compass-picker__cardinal stq-rrr-compass-picker__cardinal--north">
            {getCompassCardinalInitial('rrr.editor.compass.north', t)}
          </span>
          <span className="stq-rrr-compass-picker__cardinal stq-rrr-compass-picker__cardinal--east">
            {getCompassCardinalInitial('rrr.editor.compass.east', t)}
          </span>
          <span className="stq-rrr-compass-picker__cardinal stq-rrr-compass-picker__cardinal--south">
            {getCompassCardinalInitial('rrr.editor.compass.south', t)}
          </span>
          <span className="stq-rrr-compass-picker__cardinal stq-rrr-compass-picker__cardinal--west">
            {getCompassCardinalInitial('rrr.editor.compass.west', t)}
          </span>
          <span
            className="stq-rrr-compass-picker__needle"
            style={
              {
                '--stq-rrr-compass-degrees': `${targetDegrees}deg`,
              } as CompassNeedleStyle
            }
          />
          <span className="stq-rrr-compass-picker__center" />
        </button>

        <div className="stq-rrr-compass-picker__readout">
          <span>{t('rrr.editor.compass.selected')}</span>
          <strong>{formatNumber(targetDegrees, 0)}°</strong>
          <small>{getCompassDirectionLabel(targetDegrees, t)}</small>
        </div>
      </div>

      <div
        className="stq-rrr-compass-picker__presets"
        aria-label={t('rrr.editor.compass.presetsAria')}
      >
        {COMPASS_DIRECTION_PRESETS.map((preset) => (
          <button
            key={preset.degrees}
            type="button"
            className={`stq-rrr-compass-picker__preset ${
              targetDegrees === preset.degrees ? 'is-active' : ''
            }`}
            onClick={() => setTargetDegrees(preset.degrees)}
          >
            {t(preset.labelKey)} {preset.degrees}°
          </button>
        ))}
      </div>

      <div className="stq-rrr-compass-picker__tolerance">
        <label className="stq-rrr-field">
          <span>
            {resolvedToleranceLabel}: ±{formatNumber(tolerance, 0)}°
          </span>
          <input
            type="range"
            min="0"
            max="90"
            step="1"
            value={toleranceSliderValue}
            onChange={(event) => setTolerance(Number(event.target.value))}
          />
          <small className="stq-rrr-field__hint">
            {resolvedToleranceHint}
          </small>
        </label>
        <NumberField
          label={formatEditorText(t('rrr.editor.compass.toleranceDegrees'), {
            label: resolvedToleranceLabel,
          })}
          value={tolerance}
          onChange={setTolerance}
        />
      </div>

      {expertMode && (
        <NumberField
          label={t('rrr.editor.compass.targetDegrees')}
          value={targetDegrees}
          onChange={setTargetDegrees}
        />
      )}
    </div>
  );
}

function GpsRadiusEditor({
  config,
  radiusConfigKey = 'radiusMeters',
  radiusLabel,
  radiusHint,
  onPatchConfig,
}: {
  config: RrrModule['config'];
  radiusConfigKey?: 'radiusMeters' | 'successRadiusMeters';
  radiusLabel?: string;
  radiusHint?: string;
  onPatchConfig: (patch: Record<string, unknown>) => void;
}) {
  const { t } = useEditorLanguage();
  const resolvedRadiusLabel = radiusLabel ?? t('rrr.editor.gps.radius');
  const radiusMeters = Math.max(0, readNumber(config[radiusConfigKey]));
  const radiusSliderValue = Math.min(radiusMeters, 100);
  const radiusMeta = getGpsRadiusMeta(radiusMeters, t);

  function setRadiusMeters(value: number) {
    onPatchConfig({ [radiusConfigKey]: Math.max(0, Math.round(value)) });
  }

  return (
    <div className="stq-rrr-gps-editor">
      <div className="stq-rrr-field-grid">
        <NumberField
          label={t('rrr.editor.gps.lat')}
          value={readNumber(config.lat)}
          onChange={(value) => onPatchConfig({ lat: value })}
        />
        <NumberField
          label={t('rrr.editor.gps.lng')}
          value={readNumber(config.lng)}
          onChange={(value) => onPatchConfig({ lng: value })}
        />
      </div>

      <section
        className="stq-rrr-gps-radius"
        aria-label={t('rrr.editor.gps.aria')}
      >
        <div className="stq-rrr-gps-radius__header">
          <div>
            <span>{resolvedRadiusLabel}</span>
            <strong>{formatNumber(radiusMeters, 0)} m</strong>
          </div>
          <span
            className={`stq-rrr-gps-radius__badge stq-rrr-gps-radius__badge--${radiusMeta.tone}`}
          >
            {radiusMeta.label}
          </span>
        </div>

        <label className="stq-rrr-field">
          <span>
            {formatEditorText(t('rrr.editor.gps.slider'), {
              label: resolvedRadiusLabel,
            })}
          </span>
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={radiusSliderValue}
            onChange={(event) => setRadiusMeters(Number(event.target.value))}
          />
          <small className="stq-rrr-field__hint">
            {radiusHint ?? radiusMeta.description}
          </small>
        </label>

        <NumberField
          label={formatEditorText(t('rrr.editor.gps.meters'), {
            label: resolvedRadiusLabel,
          })}
          value={radiusMeters}
          onChange={setRadiusMeters}
        />
        <p className="stq-rrr-gps-radius__calibration">
          {formatEditorText(t('rrr.editor.gps.calibration'), {
            radius: String(recommendGpsRadius()),
          })}
        </p>
      </section>
    </div>
  );
}

function QrScanEditor({
  config,
  onPatchConfig,
}: {
  config: RrrModule['config'];
  onPatchConfig: (patch: Record<string, unknown>) => void;
}) {
  const { t } = useEditorLanguage();
  const expectedValue = readString(config.expectedValue);
  const hasExpectedValue = expectedValue.trim() !== '';

  return (
    <div className="stq-rrr-text-answer-editor">
      <section
        className={`stq-rrr-text-answer ${
          hasExpectedValue ? '' : 'stq-rrr-text-answer--empty'
        }`}
        aria-label={t('rrr.editor.qr.aria')}
      >
        <div className="stq-rrr-text-answer__header">
          <div>
            <span>{t('rrr.editor.qr.eyebrow')}</span>
            <strong>
              {hasExpectedValue
                ? t('rrr.editor.qr.set')
                : t('rrr.editor.qr.missing')}
            </strong>
          </div>
          <span
            className={`stq-rrr-text-answer__badge ${
              hasExpectedValue ? '' : 'stq-rrr-text-answer__badge--empty'
            }`}
          >
            {t('rrr.editor.qr.exact')}
          </span>
        </div>

        <label className="stq-rrr-field">
          <span>{t('rrr.editor.qr.expected')}</span>
          <input
            type="text"
            value={expectedValue}
            placeholder={t('rrr.editor.qr.placeholder')}
            onChange={(event) =>
              onPatchConfig({ expectedValue: event.target.value })
            }
          />
          <small className="stq-rrr-field__hint">
            {t('rrr.editor.qr.hint')}
          </small>
        </label>

        <div className="stq-rrr-editor__empty">
          <strong>{t('rrr.editor.qr.cameraTitle')}</strong>
          <span>{t('rrr.editor.qr.cameraHint')}</span>
        </div>

        {!hasExpectedValue && (
          <p className="stq-rrr-text-answer__warning">
            {t('rrr.editor.qr.warning')}
          </p>
        )}
      </section>
    </div>
  );
}

function CodeWordEditor({
  config,
  onPatchConfig,
}: {
  config: RrrModule['config'];
  onPatchConfig: (patch: Record<string, unknown>) => void;
}) {
  const { t } = useEditorLanguage();
  const code = readString(config.code);
  const hasCode = code.trim() !== '';
  const caseSensitive = Boolean(config.caseSensitive);

  return (
    <div className="stq-rrr-text-answer-editor">
      <section
        className={`stq-rrr-text-answer ${
          hasCode ? '' : 'stq-rrr-text-answer--empty'
        }`}
        aria-label={t('rrr.editor.codeWord.aria')}
      >
        <div className="stq-rrr-text-answer__header">
          <div>
            <span>{t('rrr.editor.codeWord.eyebrow')}</span>
            <strong>
              {hasCode
                ? t('rrr.editor.codeWord.set')
                : t('rrr.editor.codeWord.missing')}
            </strong>
          </div>
          <span
            className={`stq-rrr-text-answer__badge ${
              hasCode ? '' : 'stq-rrr-text-answer__badge--empty'
            }`}
          >
            {caseSensitive
              ? t('rrr.editor.case.exact')
              : t('rrr.editor.case.flexible')}
          </span>
        </div>

        <label className="stq-rrr-field">
          <span>{t('rrr.editor.codeWord.label')}</span>
          <input
            type="text"
            value={code}
            placeholder={t('rrr.editor.codeWord.placeholder')}
            onChange={(event) => onPatchConfig({ code: event.target.value })}
          />
          <small className="stq-rrr-field__hint">
            {t('rrr.editor.codeWord.hint')}
          </small>
        </label>

        {!hasCode && (
          <p className="stq-rrr-text-answer__warning">
            {t('rrr.editor.codeWord.warning')}
          </p>
        )}

        <label className="stq-rrr-check stq-rrr-text-answer__toggle">
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={(event) =>
              onPatchConfig({ caseSensitive: event.target.checked })
            }
          />
          <span>{t('rrr.editor.case.respect')}</span>
        </label>
      </section>
    </div>
  );
}

function SequentialCodeEditor({
  config,
  onPatchConfig,
}: {
  config: RrrModule['config'];
  onPatchConfig: (patch: Record<string, unknown>) => void;
}) {
  const { t } = useEditorLanguage();
  const code = readString(config.code);
  const hint = readString(config.hint);
  const hasCode = code.trim() !== '';
  const caseSensitive = Boolean(config.caseSensitive);

  return (
    <div className="stq-rrr-text-answer-editor">
      <section
        className={`stq-rrr-text-answer ${
          hasCode ? '' : 'stq-rrr-text-answer--empty'
        }`}
        aria-label={t('rrr.editor.sequential.aria')}
      >
        <div className="stq-rrr-text-answer__header">
          <div>
            <span>{t('rrr.editor.sequential.eyebrow')}</span>
            <strong>
              {hasCode
                ? t('rrr.editor.sequential.set')
                : t('rrr.editor.sequential.missing')}
            </strong>
          </div>
          <span
            className={`stq-rrr-text-answer__badge ${
              hasCode ? '' : 'stq-rrr-text-answer__badge--empty'
            }`}
          >
            {caseSensitive
              ? t('rrr.editor.case.exact')
              : t('rrr.editor.case.flexible')}
          </span>
        </div>

        <label className="stq-rrr-field">
          <span>{t('rrr.editor.sequential.code')}</span>
          <input
            type="text"
            value={code}
            placeholder={t('rrr.editor.sequential.codePlaceholder')}
            onChange={(event) => onPatchConfig({ code: event.target.value })}
          />
          <small className="stq-rrr-field__hint">
            {t('rrr.editor.sequential.hint')}
          </small>
        </label>

        <label className="stq-rrr-field">
          <span>{t('rrr.editor.sequential.hintLabel')}</span>
          <input
            type="text"
            value={hint}
            placeholder={t('rrr.editor.sequential.hintPlaceholder')}
            onChange={(event) => onPatchConfig({ hint: event.target.value })}
          />
        </label>

        {!hasCode && (
          <p className="stq-rrr-text-answer__warning">
            {t('rrr.editor.sequential.warning')}
          </p>
        )}

        <label className="stq-rrr-check stq-rrr-text-answer__toggle">
          <input
            type="checkbox"
            checked={caseSensitive}
            onChange={(event) =>
              onPatchConfig({ caseSensitive: event.target.checked })
            }
          />
          <span>{t('rrr.editor.case.respect')}</span>
        </label>
      </section>
    </div>
  );
}

function TimerWaitDurationEditor({
  config,
  expertMode,
  onPatchConfig,
}: {
  config: RrrModule['config'];
  expertMode: boolean;
  onPatchConfig: (patch: Record<string, unknown>) => void;
}) {
  const { t } = useEditorLanguage();
  const durationMs = normalizeDurationMs(readNumber(config.durationMs));
  const durationSliderValue = clampNumber(durationMs, 500, 30000);
  const durationMeta = getTimerWaitDurationMeta(durationMs, t);

  function setDurationMs(value: number) {
    onPatchConfig({ durationMs: normalizeDurationMs(value) });
  }

  return (
    <div className="stq-rrr-hold-editor">
      <section
        className="stq-rrr-hold-duration"
        aria-label={t('rrr.editor.timer.aria')}
      >
        <div className="stq-rrr-hold-duration__header">
          <div>
            <span>{t('rrr.editor.timer.wait')}</span>
            <strong>{formatDurationSeconds(durationMs)}</strong>
          </div>
          <span
            className={`stq-rrr-hold-duration__badge stq-rrr-hold-duration__badge--${durationMeta.tone}`}
          >
            {durationMeta.label}
          </span>
        </div>

        <label className="stq-rrr-field">
          <span>{t('rrr.editor.timer.slider')}</span>
          <input
            type="range"
            min="500"
            max="30000"
            step="500"
            value={durationSliderValue}
            onChange={(event) => setDurationMs(Number(event.target.value))}
          />
          <small className="stq-rrr-field__hint">
            {durationMeta.description}
          </small>
        </label>

        <div
          className="stq-rrr-hold-duration__presets"
          aria-label={t('rrr.editor.timer.presetsAria')}
        >
          {TIMER_WAIT_DURATION_PRESETS.map((preset) => (
            <button
              key={preset.durationMs}
              type="button"
              className={`stq-rrr-hold-duration__preset ${
                durationMs === preset.durationMs ? 'is-active' : ''
              }`}
              onClick={() => setDurationMs(preset.durationMs)}
            >
              {preset.label}
            </button>
          ))}
        </div>
      </section>

      {expertMode && (
        <NumberField
          label={t('rrr.editor.timer.expertLabel')}
          value={durationMs}
          onChange={setDurationMs}
        />
      )}
    </div>
  );
}

function ObjectFoundEditor({
  config,
  onPatchConfig,
}: {
  config: RrrModule['config'];
  onPatchConfig: (patch: Record<string, unknown>) => void;
}) {
  const { t } = useEditorLanguage();
  const prompt = readString(config.prompt);
  const confirmLabel = readString(config.confirmLabel);
  const hasPrompt = prompt.trim() !== '';

  return (
    <div className="stq-rrr-text-answer-editor">
      <section
        className={`stq-rrr-text-answer ${
          hasPrompt ? '' : 'stq-rrr-text-answer--empty'
        }`}
        aria-label={t('rrr.editor.object.aria')}
      >
        <div className="stq-rrr-text-answer__header">
          <div>
            <span>{t('rrr.editor.object.eyebrow')}</span>
            <strong>
              {hasPrompt
                ? t('rrr.editor.object.set')
                : t('rrr.editor.object.missing')}
            </strong>
          </div>
          <span
            className={`stq-rrr-text-answer__badge ${
              hasPrompt ? '' : 'stq-rrr-text-answer__badge--empty'
            }`}
          >
            {t('rrr.editor.manual.confirmation')}
          </span>
        </div>

        <label className="stq-rrr-field">
          <span>{t('rrr.editor.manual.instruction')}</span>
          <input
            type="text"
            value={prompt}
            placeholder={t('rrr.editor.object.placeholder')}
            onChange={(event) => onPatchConfig({ prompt: event.target.value })}
          />
          <small className="stq-rrr-field__hint">
            {t('rrr.editor.object.hint')}
          </small>
        </label>

        <label className="stq-rrr-field">
          <span>{t('rrr.editor.manual.confirmLabel')}</span>
          <input
            type="text"
            value={confirmLabel}
            placeholder={t('rrr.editor.manual.confirmPlaceholderFound')}
            onChange={(event) =>
              onPatchConfig({ confirmLabel: event.target.value })
            }
          />
          <small className="stq-rrr-field__hint">
            {t('rrr.editor.manual.confirmHint')}
          </small>
        </label>

        {!hasPrompt && (
          <p className="stq-rrr-text-answer__warning">
            {t('rrr.editor.object.warning')}
          </p>
        )}
      </section>
    </div>
  );
}

function PhotoCheckManualEditor({
  config,
  onPatchConfig,
}: {
  config: RrrModule['config'];
  onPatchConfig: (patch: Record<string, unknown>) => void;
}) {
  const { t } = useEditorLanguage();
  const prompt = readString(config.prompt);
  const confirmLabel = readString(config.confirmLabel);
  const hasPrompt = prompt.trim() !== '';

  return (
    <div className="stq-rrr-text-answer-editor">
      <section
        className={`stq-rrr-text-answer ${
          hasPrompt ? '' : 'stq-rrr-text-answer--empty'
        }`}
        aria-label={t('rrr.editor.photo.aria')}
      >
        <div className="stq-rrr-text-answer__header">
          <div>
            <span>{t('rrr.editor.photo.eyebrow')}</span>
            <strong>
              {hasPrompt
                ? t('rrr.editor.photo.set')
                : t('rrr.editor.photo.missing')}
            </strong>
          </div>
          <span
            className={`stq-rrr-text-answer__badge ${
              hasPrompt ? '' : 'stq-rrr-text-answer__badge--empty'
            }`}
          >
            {t('rrr.editor.manual.confirmation')}
          </span>
        </div>

        <label className="stq-rrr-field">
          <span>{t('rrr.editor.manual.instruction')}</span>
          <input
            type="text"
            value={prompt}
            placeholder={t('rrr.editor.photo.placeholder')}
            onChange={(event) => onPatchConfig({ prompt: event.target.value })}
          />
          <small className="stq-rrr-field__hint">
            {t('rrr.editor.photo.hint')}
          </small>
        </label>

        <label className="stq-rrr-field">
          <span>{t('rrr.editor.manual.confirmLabel')}</span>
          <input
            type="text"
            value={confirmLabel}
            placeholder={t('rrr.editor.manual.confirmPlaceholderConfirmed')}
            onChange={(event) =>
              onPatchConfig({ confirmLabel: event.target.value })
            }
          />
          <small className="stq-rrr-field__hint">
            {t('rrr.editor.manual.confirmHint')}
          </small>
        </label>

        {!hasPrompt && (
          <p className="stq-rrr-text-answer__warning">
            {t('rrr.editor.photo.warning')}
          </p>
        )}
      </section>
    </div>
  );
}

function getModuleCardMeta(module: RrrModule, t: EditorT): {
  title: string;
  description: string;
  icon: IconName;
} {
  switch (module.type) {
    case 'text_answer':
      return {
        title: t('rrr.editor.card.textAnswerTitle'),
        description: t('rrr.editor.card.textAnswerDescription'),
        icon: 'type',
      };
    case 'multi_choice':
      return {
        title: t('rrr.editor.card.multiChoiceTitle'),
        description: t('rrr.editor.card.multiChoiceDescription'),
        icon: 'check',
      };
    case 'gps_enter':
      return {
        title: t('rrr.editor.card.gpsTitle'),
        description: t('rrr.editor.card.gpsDescription'),
        icon: 'map-pin',
      };
    case 'proximity_hint':
      return {
        title: t('rrr.editor.card.proximityTitle'),
        description: t('rrr.editor.card.proximityDescription'),
        icon: 'map-pin',
      };
    case 'compass_align':
      return {
        title: t('rrr.editor.card.compassTitle'),
        description: t('rrr.editor.card.compassDescription'),
        icon: 'compass',
      };
    case 'direction_hotcold':
      return {
        title: t('rrr.editor.card.directionHotcoldTitle'),
        description: t('rrr.editor.card.directionHotcoldDescription'),
        icon: 'compass',
      };
    case 'hold_still':
      return {
        title: t('rrr.editor.card.holdStillTitle'),
        description: t('rrr.editor.card.holdStillDescription'),
        icon: 'hand',
      };
    case 'qr_scan':
      return {
        title: t('rrr.editor.card.qrTitle'),
        description: t('rrr.editor.card.qrDescription'),
        icon: 'qr-code',
      };
    case 'code_word':
      return {
        title: t('rrr.editor.card.codeWordTitle'),
        description: t('rrr.editor.card.codeWordDescription'),
        icon: 'type',
      };
    case 'sequential_code':
      return {
        title: t('rrr.editor.card.sequentialTitle'),
        description: t('rrr.editor.card.sequentialDescription'),
        icon: 'type',
      };
    case 'timer_wait':
      return {
        title: t('rrr.editor.card.timerTitle'),
        description: t('rrr.editor.card.timerDescription'),
        icon: 'clock',
      };
    case 'photo_check_manual':
      return {
        title: t('rrr.editor.card.photoTitle'),
        description: t('rrr.editor.card.photoDescription'),
        icon: 'image',
      };
    case 'object_found':
      return {
        title: t('rrr.editor.card.objectTitle'),
        description: t('rrr.editor.card.objectDescription'),
        icon: 'check-circle',
      };
  }
}

function getModuleSettingsSummary(
  module: RrrModule,
  t: EditorT,
): Array<{ label: string; value: string }> {
  const config = module.config;
  const notSet = t('rrr.editor.summary.notSet');
  switch (module.type) {
    case 'text_answer': {
      const answer = readString(config.answer).trim();
      return [
        {
          label: t('rrr.editor.summary.answer'),
          value: answer ? `"${answer}"` : notSet,
        },
        {
          label: t('rrr.editor.case.exact'),
          value: Boolean(config.caseSensitive)
            ? t('rrr.editor.case.important')
            : t('rrr.editor.case.ignored'),
        },
      ];
    }
    case 'multi_choice': {
      const question = readString(config.question).trim();
      const options = normalizeMultiChoiceOptions(config.options);
      const filledOptions = options.filter((option) => option.trim() !== '');
      const correctCount = normalizeMultiChoiceIndexes(
        config.correctOptionIndexes,
        options,
      ).length;
      return [
        {
          label: t('rrr.editor.summary.question'),
          value: question || notSet,
        },
        {
          label: t('rrr.editor.summary.options'),
          value:
            filledOptions.length > 0
              ? formatEditorText(t('rrr.editor.multiChoice.optionsSummary'), {
                  options: String(filledOptions.length),
                  correct: String(correctCount),
                })
              : notSet,
        },
      ];
    }
    case 'gps_enter':
      return [
        {
          label: t('rrr.editor.summary.target'),
          value: hasFiniteNumber(config.lat) && hasFiniteNumber(config.lng)
            ? `${formatNumber(readNumber(config.lat), 5)}, ${formatNumber(
                readNumber(config.lng),
                5,
              )}`
            : t('rrr.editor.summary.coordinatesMissing'),
        },
        {
          label: t('rrr.editor.summary.radius'),
          value: `${formatNumber(readNumber(config.radiusMeters), 0)} m`,
        },
      ];
    case 'proximity_hint':
      return [
        {
          label: t('rrr.editor.summary.target'),
          value: hasFiniteNumber(config.lat) && hasFiniteNumber(config.lng)
            ? `${formatNumber(readNumber(config.lat), 5)}, ${formatNumber(
                readNumber(config.lng),
                5,
              )}`
            : t('rrr.editor.summary.coordinatesMissing'),
        },
        {
          label: t('rrr.editor.summary.successRadius'),
          value: `${formatNumber(readNumber(config.successRadiusMeters), 0)} m`,
        },
      ];
    case 'compass_align':
      return [
        {
          label: t('rrr.editor.summary.direction'),
          value: `${formatNumber(readNumber(config.targetDegrees), 0)}°`,
        },
        {
          label: t('rrr.editor.summary.tolerance'),
          value: `±${formatNumber(readNumber(config.tolerance), 0)}°`,
        },
      ];
    case 'direction_hotcold':
      return [
        {
          label: t('rrr.editor.summary.direction'),
          value: `${formatNumber(readNumber(config.targetDegrees), 0)}°`,
        },
        {
          label: t('rrr.editor.summary.successTolerance'),
          value: `±${formatNumber(readNumber(config.successTolerance), 0)}°`,
        },
      ];
    case 'hold_still': {
      const durationMs = readNumber(config.durationMs);
      return [
        {
          label: t('rrr.editor.summary.duration'),
          value:
            durationMs >= 1000
              ? `${formatNumber(durationMs / 1000, 1)} s`
              : `${formatNumber(durationMs, 0)} ms`,
        },
      ];
    }
    case 'qr_scan': {
      const expectedValue = readString(config.expectedValue).trim();
      return [
        {
          label: t('rrr.editor.summary.qrValue'),
          value: expectedValue ? `"${expectedValue}"` : notSet,
        },
      ];
    }
    case 'code_word': {
      const code = readString(config.code).trim();
      return [
        {
          label: t('rrr.editor.summary.codeWord'),
          value: code ? `"${code}"` : notSet,
        },
        {
          label: t('rrr.editor.case.exact'),
          value: Boolean(config.caseSensitive)
            ? t('rrr.editor.case.important')
            : t('rrr.editor.case.ignored'),
        },
      ];
    }
    case 'sequential_code': {
      const code = readString(config.code).trim();
      const hint = readString(config.hint).trim();
      return [
        {
          label: t('rrr.editor.summary.code'),
          value: code ? `"${code}"` : notSet,
        },
        {
          label: t('rrr.editor.summary.hint'),
          value: hint || t('rrr.editor.sequential.noHint'),
        },
        {
          label: t('rrr.editor.case.exact'),
          value: Boolean(config.caseSensitive)
            ? t('rrr.editor.case.important')
            : t('rrr.editor.case.ignored'),
        },
      ];
    }
    case 'timer_wait': {
      const durationMs = readNumber(config.durationMs);
      return [
        {
          label: t('rrr.editor.summary.wait'),
          value: formatDurationSeconds(durationMs),
        },
      ];
    }
    case 'photo_check_manual': {
      const prompt = readString(config.prompt).trim();
      const confirmLabel = readString(config.confirmLabel).trim();
      return [
        {
          label: t('rrr.editor.summary.instruction'),
          value: prompt || notSet,
        },
        {
          label: t('rrr.editor.summary.button'),
          value:
            confirmLabel || t('rrr.editor.manual.confirmPlaceholderConfirmed'),
        },
      ];
    }
    case 'object_found': {
      const prompt = readString(config.prompt).trim();
      const confirmLabel = readString(config.confirmLabel).trim();
      return [
        {
          label: t('rrr.editor.summary.instruction'),
          value: prompt || notSet,
        },
        {
          label: t('rrr.editor.summary.button'),
          value: confirmLabel || t('rrr.editor.manual.confirmPlaceholderFound'),
        },
      ];
    }
  }
}

function getFallbackSettingsSummary(
  module: RrrModule,
  modules: RrrModule[],
  expertMode: boolean,
  t: EditorT,
): Array<{ label: string; value: string }> {
  if (!module.fallbackModuleId) {
    return [];
  }

  return [
    {
      label: t('rrr.editor.fallback.label'),
      value: getModuleDisplayLabel(module.fallbackModuleId, modules, expertMode, t),
    },
  ];
}

function getModuleDisplayLabel(
  moduleId: string,
  modules: RrrModule[],
  expertMode: boolean,
  t: EditorT,
): string {
  const module = modules.find((entry) => entry.id === moduleId);
  if (module) {
    return module.label;
  }
  return expertMode
    ? `${t('rrr.editor.fallback.missing')} (${moduleId})`
    : t('rrr.editor.fallback.missing');
}

function formatModuleOption(module: RrrModule, expertMode: boolean): string {
  return expertMode ? `${module.label} (${module.id})` : module.label;
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
  const { t } = useEditorLanguage();
  const externalValue = Number.isFinite(value) ? String(value) : '';
  const [inputValue, setInputValue] = useState(externalValue);
  const parsedValue = Number(inputValue);
  const invalid = inputValue.trim() !== '' && !Number.isFinite(parsedValue);

  useEffect(() => {
    setInputValue(externalValue);
  }, [externalValue]);

  function handleChange(nextValue: string) {
    setInputValue(nextValue);
    const parsed = Number(nextValue);
    if (nextValue.trim() !== '' && Number.isFinite(parsed)) {
      onChange(parsed);
    }
  }

  return (
    <label className="stq-rrr-field">
      <span>{label}</span>
      <input
        type="number"
        value={inputValue}
        onChange={(event) => handleChange(event.target.value)}
        aria-invalid={invalid || undefined}
      />
      {invalid && (
        <small className="stq-rrr-field__hint">
          {t('rrr.editor.number.invalid')}
        </small>
      )}
    </label>
  );
}

function readString(value: unknown): string {
  return typeof value === 'string' ? value : '';
}

function normalizeMultiChoiceOptions(value: unknown): string[] {
  const options = Array.isArray(value)
    ? value.map((entry) => (typeof entry === 'string' ? entry : ''))
    : [];
  return options.length > 0 ? options : [''];
}

function normalizeMultiChoiceIndexes(
  value: unknown,
  options: readonly string[],
): number[] {
  const maxIndex = options.length - 1;
  const indexes = Array.isArray(value)
    ? value
        .map((entry) => {
          if (typeof entry === 'number') return entry;
          if (typeof entry === 'string') return Number(entry);
          return Number.NaN;
        })
        .filter(
          (entry) =>
            Number.isInteger(entry) &&
            entry >= 0 &&
            entry <= maxIndex,
        )
    : [];
  return [...new Set(indexes)];
}

function hasFiniteNumber(value: unknown): boolean {
  return typeof value === 'number' && Number.isFinite(value);
}

function formatNumber(value: number, maximumFractionDigits: number): string {
  return new Intl.NumberFormat(undefined, {
    maximumFractionDigits,
  }).format(value);
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

function getGpsRadiusMeta(radiusMeters: number, t: EditorT): {
  label: string;
  description: string;
  tone: 'precise' | 'normal' | 'forgiving';
} {
  if (radiusMeters < 5) {
    return {
      label: t('rrr.editor.gps.radiusPrecise'),
      description: t('rrr.editor.gps.radiusPreciseHint'),
      tone: 'precise',
    };
  }

  if (radiusMeters <= 20) {
    return {
      label: t('rrr.editor.gps.radiusNormal'),
      description: t('rrr.editor.gps.radiusNormalHint'),
      tone: 'normal',
    };
  }

  return {
    label: t('rrr.editor.gps.radiusForgiving'),
    description: t('rrr.editor.gps.radiusForgivingHint'),
    tone: 'forgiving',
  };
}

function normalizeDurationMs(value: number): number {
  return Math.max(0, Math.round(value));
}

function clampNumber(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

function formatDurationSeconds(durationMs: number): string {
  if (durationMs < 1000) {
    return `${formatNumber(durationMs, 0)} ms`;
  }

  return `${formatNumber(durationMs / 1000, 1)} s`;
}

function getHoldStillDurationMeta(durationMs: number, t: EditorT): {
  label: string;
  description: string;
  tone: 'short' | 'normal' | 'long';
} {
  if (durationMs < 2000) {
    return {
      label: t('rrr.editor.duration.short'),
      description: t('rrr.editor.duration.shortHint'),
      tone: 'short',
    };
  }

  if (durationMs <= 3000) {
    return {
      label: t('rrr.editor.duration.normal'),
      description: t('rrr.editor.duration.normalHint'),
      tone: 'normal',
    };
  }

  return {
    label: t('rrr.editor.duration.long'),
    description: t('rrr.editor.duration.longHint'),
    tone: 'long',
  };
}

function getTimerWaitDurationMeta(durationMs: number, t: EditorT): {
  label: string;
  description: string;
  tone: 'short' | 'normal' | 'long';
} {
  if (durationMs <= 5000) {
    return {
      label: t('rrr.editor.wait.short'),
      description: t('rrr.editor.wait.shortHint'),
      tone: 'short',
    };
  }

  if (durationMs <= 30000) {
    return {
      label: t('rrr.editor.wait.normal'),
      description: t('rrr.editor.wait.normalHint'),
      tone: 'normal',
    };
  }

  return {
    label: t('rrr.editor.wait.long'),
    description: t('rrr.editor.wait.longHint'),
    tone: 'long',
  };
}

function normalizeCompassDegrees(value: number): number {
  const normalized = value % 360;
  return Math.round(normalized < 0 ? normalized + 360 : normalized);
}

function getCompassDirectionLabel(degrees: number, t: EditorT): string {
  const nearestPreset = COMPASS_DIRECTION_PRESETS.reduce(
    (best, preset) =>
      getDegreeDistance(degrees, preset.degrees) <
      getDegreeDistance(degrees, best.degrees)
        ? preset
        : best,
    COMPASS_DIRECTION_PRESETS[0],
  );

  return formatEditorText(t('rrr.editor.compass.near'), {
    direction: t(nearestPreset.labelKey),
  });
}

function getCompassCardinalInitial(key: EditorTextKey, t: EditorT): string {
  return t(key).trim().slice(0, 1).toUpperCase();
}

function getConditionTypeLabel(type: FlatConditionType, t: EditorT): string {
  return t(CONDITION_TYPE_LABEL_KEYS[type]);
}

function formatEditorText(
  template: string,
  values: Record<string, string>,
): string {
  return Object.entries(values).reduce(
    (result, [key, value]) => result.replaceAll(`{${key}}`, value),
    template,
  );
}

function getDegreeDistance(left: number, right: number): number {
  const difference = Math.abs(normalizeCompassDegrees(left - right));
  return Math.min(difference, 360 - difference);
}
