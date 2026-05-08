import {
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
import { RrrInteractionJsonEditor } from './RrrInteractionJsonEditor';
import { RrrMockPreview } from './RrrMockPreview';
import { RrrTemplatePicker } from './RrrTemplatePicker';
import { RrrWarningsPanel } from './RrrWarningsPanel';
import { Icon, type IconName } from '@/components/studio/Icon';
import { recommendGpsRadius } from '@/rrr-sensors';
import type { RrrInteractionEditorProps } from './types';

type FlatConditionType = RrrFlatConditionType;

const CONDITION_TYPE_LABELS: Record<FlatConditionType, string> = {
  none: 'Keine Lösungsregel',
  module: 'Einzelner Baustein',
  sequence: 'Nacheinander',
  all_of: 'Alles muss erfüllt sein',
  any_of: 'Eine Lösung reicht',
};

const COMPASS_DIRECTION_PRESETS = [
  { label: 'Norden', degrees: 0 },
  { label: 'Osten', degrees: 90 },
  { label: 'Süden', degrees: 180 },
  { label: 'Westen', degrees: 270 },
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
  const [moduleTypeToAdd, setModuleTypeToAdd] =
    useState<RrrModuleType>('text_answer');
  const [expertMode, setExpertMode] = useState(false);
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
      label: `${fallbackModule.label} für ${targetModule.label}`,
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
    <section className="stq-rrr-editor" aria-label="Modulares Rätsel">
      <div className="stq-rrr-editor__header">
        <div>
          <h3>Modulares Rätsel</h3>
          <p>
            Baue ein Rätsel aus mehreren Bausteinen und lege fest, wann es
            gelöst ist.
          </p>
        </div>
        <label className="stq-rrr-expert-toggle">
          <input
            type="checkbox"
            checked={expertMode}
            onChange={(event) => setExpertMode(event.target.checked)}
          />
          <span>Expertenmodus</span>
        </label>
      </div>

      <dl className="stq-rrr-editor__summary">
        <div>
          <dt>Bausteine</dt>
          <dd>{moduleCount}</dd>
        </div>
        <div>
          <dt>Lösungsregel</dt>
          <dd>{CONDITION_TYPE_LABELS[conditionType]}</dd>
        </div>
      </dl>

      <RrrTemplatePicker
        hasExistingInteraction={interaction.modules.length > 0}
        variant={moduleCount === 0 ? 'wizard' : 'compact'}
        onApply={(nextInteraction) => onChange(nextInteraction)}
      />

      <div className="stq-rrr-editor__add">
        <label className="stq-edit-panel-label" htmlFor="rrr-module-type">
          Baustein hinzufügen
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
            Hinzufügen
          </button>
        </div>
        <ModulePresetHints preset={selectedModulePreset} />
      </div>

      {moduleCount === 0 && (
        <div className="stq-rrr-editor__empty">
          Noch keine Bausteine vorhanden.
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

      <RrrWarningsPanel warnings={warnings} expertMode={expertMode} />

      {expertMode && (
        <div
          className={`stq-rrr-validation ${
            validation.success ? 'is-valid' : 'is-invalid'
          }`}
        >
          <div className="stq-rrr-validation__header">
            <strong>{validation.success ? 'Gültig' : 'Ungültig'}</strong>
          </div>
          {!validation.success && (
            <ul>
              {validationMessages.map((message) => (
                <li key={message}>{message}</li>
              ))}
            </ul>
          )}
        </div>
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
  const reliabilityLabel = getModuleReliabilityLabel(preset.reliability);
  const difficultyLabel = getModuleDifficultyLabel(preset.difficulty);
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
        <span>{preset.needsFallback ? 'Ersatzlösung empfohlen' : 'Robust'}</span>
        {shouldFieldTest && <span>Für Feldtests prüfen</span>}
      </div>
    </div>
  );
}

function getModuleDifficultyLabel(
  difficulty: (typeof RRR_MODULE_PRESETS)[RrrModuleType]['difficulty'],
): string {
  switch (difficulty) {
    case 'easy':
      return 'Einfach';
    case 'medium':
      return 'Mittel';
    case 'advanced':
      return 'Fortgeschritten';
  }
}

function getModuleReliabilityLabel(
  reliability: (typeof RRR_MODULE_PRESETS)[RrrModuleType]['reliability'],
): string {
  switch (reliability) {
    case 'high':
      return 'Sehr zuverlässig';
    case 'medium':
      return 'Zuverlässig';
    case 'device-dependent':
      return 'Geräteabhängig';
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
          <strong>Lösungsregel</strong>
          <span>Lege fest, wie die Bausteine zum Lösen kombiniert werden.</span>
        </div>
      </div>

      <label className="stq-rrr-field">
        <span>Art der Lösungsregel</span>
        <select
          className="stq-rrr-editor__select"
          value={conditionType}
          onChange={(event) =>
            setConditionType(event.target.value as FlatConditionType)
          }
          disabled={moduleIds.length === 0 || unsupportedNestedCondition}
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
          Füge zuerst mindestens einen Baustein hinzu.
        </div>
      )}

      {unsupportedNestedCondition && (
        <div className="stq-rrr-condition__warning">
          <span>
            Diese Lösungsregel ist zu komplex für die aktuelle Eingabemaske.
            Setze sie zurück, um sie wieder hier zu bearbeiten.
          </span>
          <button
            type="button"
            className="stq-rrr-editor__button stq-rrr-editor__button--ghost"
            onClick={resetCondition}
          >
            Lösungsregel zurücksetzen
          </button>
        </div>
      )}

      {invalidIds.length > 0 && (
        <div className="stq-rrr-condition__warning">
          {expertMode
            ? `Ungültige Baustein-Referenz${
                invalidIds.length === 1 ? '' : 'en'
              }: ${invalidIds.join(', ')}`
            : 'Die Lösungsregel enthält einen gelöschten Baustein.'}
        </div>
      )}

      {!unsupportedNestedCondition && conditionType === 'module' && moduleIds.length > 0 && (
        <label className="stq-rrr-field">
          <span>Baustein</span>
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
                  Schritt {index + 1}:{' '}
                  {getModuleDisplayLabel(moduleId, modules, expertMode)}
                </strong>
                {!moduleIdSet.has(moduleId) && (
                  <span>Dieser Baustein fehlt oder wurde gelöscht.</span>
                )}
              </div>
              {moduleIdSet.has(moduleId) && (
                <select
                  className="stq-rrr-editor__select"
                  value={moduleId}
                  aria-label={`Baustein für Schritt ${index + 1}`}
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
                Nach oben
              </button>
              <button
                type="button"
                className="stq-rrr-editor__button stq-rrr-editor__button--ghost"
                disabled={index === sequenceStepIds.length - 1}
                onClick={() => moveListModule(index, 1)}
              >
                Nach unten
              </button>
              <button
                type="button"
                className="stq-rrr-editor__button stq-rrr-editor__button--danger"
                onClick={() => removeListModule(index)}
              >
                Entfernen
              </button>
            </div>
          ))}
          <div className="stq-rrr-condition__add-step">
            <select
              className="stq-rrr-editor__select"
              value={moduleIdToAdd}
              aria-label="Baustein für neuen Schritt"
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
              Schritt hinzufügen
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
  const config = module.config;
  const [isEditing, setIsEditing] = useState(false);
  const cardMeta = getModuleCardMeta(module);
  const modulePreset = RRR_MODULE_PRESETS[module.type];
  const fallbackOptions = modules.filter((entry) => entry.id !== module.id);
  const fallbackSuggestions = module.fallbackModuleId
    ? []
    : modulePreset.recommendedFallbackTypes;
  const summary = [
    ...getModuleSettingsSummary(module),
    ...getFallbackSettingsSummary(module, modules, expertMode),
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
            {expertMode && <code>{module.id}</code>}
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
            {isEditing ? 'Schließen' : 'Bearbeiten'}
          </button>
          <button
            type="button"
            className="stq-rrr-editor__button stq-rrr-editor__button--danger"
            onClick={onRemove}
          >
            <Icon name="trash" size={14} />
            Entfernen
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
              toleranceLabel="Erfolgstoleranz"
              toleranceHint="Innerhalb dieser Abweichung gilt die Richtung als korrekt. Außerhalb davon sehen Spieler warm/kalt-Feedback."
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
              radiusLabel="Erfolgsradius"
              radiusHint="Innerhalb dieses Radius ist der Schritt erfüllt. Außerhalb davon sehen Spieler Nähe-Hinweise."
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
            <span>Ersatzlösung (Fallback)</span>
            <select
              className="stq-rrr-editor__select"
              value={module.fallbackModuleId ?? ''}
              onChange={(event) => setFallbackModuleId(event.target.value)}
            >
              <option value="">Keine Ersatzlösung</option>
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
                      ? `Fehlender Baustein (${module.fallbackModuleId})`
                      : 'Fehlender Baustein'}
                  </option>
                )}
            </select>
            <small className="stq-rrr-field__hint">
              Optionaler Baustein, den Autoren als Ersatzlösung vormerken.
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
  return (
    <section
      className="stq-rrr-fallback-suggestion"
      aria-label="Vorgeschlagene Ersatzlösung"
    >
      <div className="stq-rrr-fallback-suggestion__text">
        <strong>Ersatzlösung empfohlen</strong>
        <span>
          Falls "{moduleLabel}" im Feld nicht zuverlässig funktioniert, kann ein
          einfacher Ersatzbaustein helfen.
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
            {RRR_MODULE_PRESETS[fallbackType].label} anlegen
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
  const answer = readString(config.answer);
  const hasAnswer = answer.trim() !== '';
  const caseSensitive = Boolean(config.caseSensitive);

  return (
    <div className="stq-rrr-text-answer-editor">
      <section
        className={`stq-rrr-text-answer ${
          hasAnswer ? '' : 'stq-rrr-text-answer--empty'
        }`}
        aria-label="Textantwort einstellen"
      >
        <div className="stq-rrr-text-answer__header">
          <div>
            <span>Erwartete Antwort</span>
            <strong>{hasAnswer ? 'Antwort festgelegt' : 'Antwort fehlt'}</strong>
          </div>
          <span
            className={`stq-rrr-text-answer__badge ${
              hasAnswer ? '' : 'stq-rrr-text-answer__badge--empty'
            }`}
          >
            {caseSensitive ? 'Exakte Schreibweise' : 'Schreibweise flexibel'}
          </span>
        </div>

        <label className="stq-rrr-field">
          <span>Antwort</span>
          <input
            type="text"
            value={answer}
            placeholder="z. B. Turm"
            onChange={(event) => onPatchConfig({ answer: event.target.value })}
          />
          <small className="stq-rrr-field__hint">
            Spieler müssen diese Antwort eingeben, um den Baustein zu lösen.
          </small>
        </label>

        {!hasAnswer && (
          <p className="stq-rrr-text-answer__warning">
            Lege eine Antwort fest, damit dieser Baustein lösbar ist.
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
          <span>Groß-/Kleinschreibung beachten</span>
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
        aria-label="Auswahlfrage einstellen"
      >
        <div className="stq-rrr-text-answer__header">
          <div>
            <span>Auswahlfrage</span>
            <strong>
              {hasQuestion && hasOptions && hasCorrectOption
                ? 'Frage bereit'
                : 'Angaben fehlen'}
            </strong>
          </div>
          <span
            className={`stq-rrr-text-answer__badge ${
              hasQuestion && hasOptions && hasCorrectOption
                ? ''
                : 'stq-rrr-text-answer__badge--empty'
            }`}
          >
            {allowMultiple ? 'Mehrfachauswahl' : 'Einzelauswahl'}
          </span>
        </div>

        <label className="stq-rrr-field">
          <span>Frage</span>
          <input
            type="text"
            value={question}
            placeholder="z. B. Welche Spur siehst du am Brunnen?"
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
          <span>Mehrere richtige Antworten erlauben</span>
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
                  aria-label={`Option ${index + 1} als richtig markieren`}
                />
                <span>Richtig</span>
              </label>
              <input
                type="text"
                value={option}
                placeholder={`Option ${index + 1}`}
                onChange={(event) => setOption(index, event.target.value)}
              />
              <button
                type="button"
                className="stq-rrr-editor__button stq-rrr-editor__button--ghost"
                onClick={() => removeOption(index)}
                disabled={options.length <= 1}
              >
                Entfernen
              </button>
            </div>
          ))}
        </div>

        <button
          type="button"
          className="stq-rrr-editor__button stq-rrr-editor__button--ghost"
          onClick={addOption}
        >
          Option hinzufügen
        </button>

        {(!hasQuestion || !hasOptions || !hasCorrectOption) && (
          <p className="stq-rrr-text-answer__warning">
            Lege Frage, Antwortoptionen und mindestens eine richtige Option fest.
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
  const durationMs = normalizeDurationMs(readNumber(config.durationMs));
  const durationSliderValue = clampNumber(durationMs, 500, 8000);
  const durationMeta = getHoldStillDurationMeta(durationMs);

  function setDurationMs(value: number) {
    onPatchConfig({ durationMs: normalizeDurationMs(value) });
  }

  return (
    <div className="stq-rrr-hold-editor">
      <section
        className="stq-rrr-hold-duration"
        aria-label="Stillhalte-Dauer einstellen"
      >
        <div className="stq-rrr-hold-duration__header">
          <div>
            <span>Dauer</span>
            <strong>{formatDurationSeconds(durationMs)}</strong>
          </div>
          <span
            className={`stq-rrr-hold-duration__badge stq-rrr-hold-duration__badge--${durationMeta.tone}`}
          >
            {durationMeta.label}
          </span>
        </div>

        <label className="stq-rrr-field">
          <span>Dauer per Schieberegler</span>
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

        <div className="stq-rrr-hold-duration__presets" aria-label="Schnelle Dauer">
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
          label="Dauer in ms"
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
  toleranceLabel = 'Toleranz',
  toleranceHint = 'Je größer die Toleranz, desto großzügiger gilt die Blickrichtung als richtig.',
  onPatchConfig,
}: {
  config: RrrModule['config'];
  expertMode: boolean;
  toleranceConfigKey?: 'tolerance' | 'successTolerance';
  toleranceLabel?: string;
  toleranceHint?: string;
  onPatchConfig: (patch: Record<string, unknown>) => void;
}) {
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
          aria-label="Richtung auf dem Kompass wählen"
        >
          <span className="stq-rrr-compass-picker__cardinal stq-rrr-compass-picker__cardinal--north">
            N
          </span>
          <span className="stq-rrr-compass-picker__cardinal stq-rrr-compass-picker__cardinal--east">
            O
          </span>
          <span className="stq-rrr-compass-picker__cardinal stq-rrr-compass-picker__cardinal--south">
            S
          </span>
          <span className="stq-rrr-compass-picker__cardinal stq-rrr-compass-picker__cardinal--west">
            W
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
          <span>Ausgewählte Richtung</span>
          <strong>{formatNumber(targetDegrees, 0)}°</strong>
          <small>{getCompassDirectionLabel(targetDegrees)}</small>
        </div>
      </div>

      <div className="stq-rrr-compass-picker__presets" aria-label="Schnelle Richtungen">
        {COMPASS_DIRECTION_PRESETS.map((preset) => (
          <button
            key={preset.degrees}
            type="button"
            className={`stq-rrr-compass-picker__preset ${
              targetDegrees === preset.degrees ? 'is-active' : ''
            }`}
            onClick={() => setTargetDegrees(preset.degrees)}
          >
            {preset.label} {preset.degrees}°
          </button>
        ))}
      </div>

      <div className="stq-rrr-compass-picker__tolerance">
        <label className="stq-rrr-field">
          <span>{toleranceLabel}: ±{formatNumber(tolerance, 0)}°</span>
          <input
            type="range"
            min="0"
            max="90"
            step="1"
            value={toleranceSliderValue}
            onChange={(event) => setTolerance(Number(event.target.value))}
          />
          <small className="stq-rrr-field__hint">
            {toleranceHint}
          </small>
        </label>
        <NumberField
          label={`${toleranceLabel} in Grad`}
          value={tolerance}
          onChange={setTolerance}
        />
      </div>

      {expertMode && (
        <NumberField
          label="Zielrichtung in Grad"
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
  radiusLabel = 'Radius',
  radiusHint,
  onPatchConfig,
}: {
  config: RrrModule['config'];
  radiusConfigKey?: 'radiusMeters' | 'successRadiusMeters';
  radiusLabel?: string;
  radiusHint?: string;
  onPatchConfig: (patch: Record<string, unknown>) => void;
}) {
  const radiusMeters = Math.max(0, readNumber(config[radiusConfigKey]));
  const radiusSliderValue = Math.min(radiusMeters, 100);
  const radiusMeta = getGpsRadiusMeta(radiusMeters);

  function setRadiusMeters(value: number) {
    onPatchConfig({ [radiusConfigKey]: Math.max(0, Math.round(value)) });
  }

  return (
    <div className="stq-rrr-gps-editor">
      <div className="stq-rrr-field-grid">
        <NumberField
          label="Breitengrad"
          value={readNumber(config.lat)}
          onChange={(value) => onPatchConfig({ lat: value })}
        />
        <NumberField
          label="Längengrad"
          value={readNumber(config.lng)}
          onChange={(value) => onPatchConfig({ lng: value })}
        />
      </div>

      <section
        className="stq-rrr-gps-radius"
        aria-label="GPS-Radius einstellen"
      >
        <div className="stq-rrr-gps-radius__header">
          <div>
            <span>{radiusLabel}</span>
            <strong>{formatNumber(radiusMeters, 0)} m</strong>
          </div>
          <span
            className={`stq-rrr-gps-radius__badge stq-rrr-gps-radius__badge--${radiusMeta.tone}`}
          >
            {radiusMeta.label}
          </span>
        </div>

        <label className="stq-rrr-field">
          <span>{radiusLabel} per Schieberegler</span>
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
          label={`${radiusLabel} in Metern`}
          value={radiusMeters}
          onChange={setRadiusMeters}
        />
        <p className="stq-rrr-gps-radius__calibration">
          Im Feld sollte der Radius mindestens so groß sein wie die aktuelle
          GPS-Genauigkeit. Ohne Live-Messung ist {recommendGpsRadius()} m ein
          sinnvoller Startwert.
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
  const expectedValue = readString(config.expectedValue);
  const hasExpectedValue = expectedValue.trim() !== '';

  return (
    <div className="stq-rrr-text-answer-editor">
      <section
        className={`stq-rrr-text-answer ${
          hasExpectedValue ? '' : 'stq-rrr-text-answer--empty'
        }`}
        aria-label="QR-Code einstellen"
      >
        <div className="stq-rrr-text-answer__header">
          <div>
            <span>Erwarteter QR-Wert</span>
            <strong>
              {hasExpectedValue ? 'QR-Wert festgelegt' : 'QR-Wert fehlt'}
            </strong>
          </div>
          <span
            className={`stq-rrr-text-answer__badge ${
              hasExpectedValue ? '' : 'stq-rrr-text-answer__badge--empty'
            }`}
          >
            Exakter Wert
          </span>
        </div>

        <label className="stq-rrr-field">
          <span>Erwarteter Wert</span>
          <input
            type="text"
            value={expectedValue}
            placeholder="z. B. station-3-gate"
            onChange={(event) =>
              onPatchConfig({ expectedValue: event.target.value })
            }
          />
          <small className="stq-rrr-field__hint">
            Dieser Wert wird später mit dem gescannten QR-Code verglichen.
          </small>
        </label>

        <div className="stq-rrr-editor__empty">
          <strong>Kamera wird benötigt</strong>
          <span>
            Im Spiel wird dafür eine Kamera-Freigabe vorbereitet. Kamera
            aktivieren, Kamera nicht verfügbar und QR-Code konnte nicht gelesen
            werden sind eigene UI-Zustände. Der geführte Test bleibt über den
            simulierten QR-Wert bedienbar.
          </span>
        </div>

        {!hasExpectedValue && (
          <p className="stq-rrr-text-answer__warning">
            Lege einen erwarteten QR-Wert fest, damit dieser Baustein lösbar ist.
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
  const code = readString(config.code);
  const hasCode = code.trim() !== '';
  const caseSensitive = Boolean(config.caseSensitive);

  return (
    <div className="stq-rrr-text-answer-editor">
      <section
        className={`stq-rrr-text-answer ${
          hasCode ? '' : 'stq-rrr-text-answer--empty'
        }`}
        aria-label="Codewort einstellen"
      >
        <div className="stq-rrr-text-answer__header">
          <div>
            <span>Codewort</span>
            <strong>{hasCode ? 'Codewort festgelegt' : 'Codewort fehlt'}</strong>
          </div>
          <span
            className={`stq-rrr-text-answer__badge ${
              hasCode ? '' : 'stq-rrr-text-answer__badge--empty'
            }`}
          >
            {caseSensitive ? 'Exakte Schreibweise' : 'Schreibweise flexibel'}
          </span>
        </div>

        <label className="stq-rrr-field">
          <span>Codewort</span>
          <input
            type="text"
            value={code}
            placeholder="z. B. Adler"
            onChange={(event) => onPatchConfig({ code: event.target.value })}
          />
          <small className="stq-rrr-field__hint">
            Spieler geben dieses Codewort ein, um den Baustein zu lösen.
          </small>
        </label>

        {!hasCode && (
          <p className="stq-rrr-text-answer__warning">
            Lege ein Codewort fest, damit dieser Baustein lösbar ist.
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
          <span>Groß-/Kleinschreibung beachten</span>
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
        aria-label="Gesammelten Code einstellen"
      >
        <div className="stq-rrr-text-answer__header">
          <div>
            <span>Gesammelter Code</span>
            <strong>{hasCode ? 'Code festgelegt' : 'Code fehlt'}</strong>
          </div>
          <span
            className={`stq-rrr-text-answer__badge ${
              hasCode ? '' : 'stq-rrr-text-answer__badge--empty'
            }`}
          >
            {caseSensitive ? 'Exakte Schreibweise' : 'Schreibweise flexibel'}
          </span>
        </div>

        <label className="stq-rrr-field">
          <span>Code</span>
          <input
            type="text"
            value={code}
            placeholder="z. B. 1842"
            onChange={(event) => onPatchConfig({ code: event.target.value })}
          />
          <small className="stq-rrr-field__hint">
            Spieler geben den unterwegs gesammelten Code am Ende ein.
          </small>
        </label>

        <label className="stq-rrr-field">
          <span>Hinweis (optional)</span>
          <input
            type="text"
            value={hint}
            placeholder="z. B. Vier Zeichen aus den Stationen"
            onChange={(event) => onPatchConfig({ hint: event.target.value })}
          />
        </label>

        {!hasCode && (
          <p className="stq-rrr-text-answer__warning">
            Lege einen Code fest, damit dieser Baustein lösbar ist.
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
          <span>Groß-/Kleinschreibung beachten</span>
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
  const durationMs = normalizeDurationMs(readNumber(config.durationMs));
  const durationSliderValue = clampNumber(durationMs, 500, 30000);
  const durationMeta = getTimerWaitDurationMeta(durationMs);

  function setDurationMs(value: number) {
    onPatchConfig({ durationMs: normalizeDurationMs(value) });
  }

  return (
    <div className="stq-rrr-hold-editor">
      <section
        className="stq-rrr-hold-duration"
        aria-label="Wartezeit einstellen"
      >
        <div className="stq-rrr-hold-duration__header">
          <div>
            <span>Wartezeit</span>
            <strong>{formatDurationSeconds(durationMs)}</strong>
          </div>
          <span
            className={`stq-rrr-hold-duration__badge stq-rrr-hold-duration__badge--${durationMeta.tone}`}
          >
            {durationMeta.label}
          </span>
        </div>

        <label className="stq-rrr-field">
          <span>Wartezeit per Schieberegler</span>
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

        <div className="stq-rrr-hold-duration__presets" aria-label="Schnelle Wartezeit">
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
          label="Wartezeit in ms"
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
  const prompt = readString(config.prompt);
  const confirmLabel = readString(config.confirmLabel);
  const hasPrompt = prompt.trim() !== '';

  return (
    <div className="stq-rrr-text-answer-editor">
      <section
        className={`stq-rrr-text-answer ${
          hasPrompt ? '' : 'stq-rrr-text-answer--empty'
        }`}
        aria-label="Objektfund einstellen"
      >
        <div className="stq-rrr-text-answer__header">
          <div>
            <span>Fund-Anweisung</span>
            <strong>
              {hasPrompt ? 'Anweisung festgelegt' : 'Anweisung fehlt'}
            </strong>
          </div>
          <span
            className={`stq-rrr-text-answer__badge ${
              hasPrompt ? '' : 'stq-rrr-text-answer__badge--empty'
            }`}
          >
            Manuelle Bestätigung
          </span>
        </div>

        <label className="stq-rrr-field">
          <span>Anweisung</span>
          <input
            type="text"
            value={prompt}
            placeholder="z. B. Finde den roten Marker am Baum"
            onChange={(event) => onPatchConfig({ prompt: event.target.value })}
          />
          <small className="stq-rrr-field__hint">
            Beschreibe, welches Objekt, Schild oder welcher Hinweis gefunden
            werden soll.
          </small>
        </label>

        <label className="stq-rrr-field">
          <span>Bestätigungstext</span>
          <input
            type="text"
            value={confirmLabel}
            placeholder="Gefunden"
            onChange={(event) =>
              onPatchConfig({ confirmLabel: event.target.value })
            }
          />
          <small className="stq-rrr-field__hint">
            Text auf dem Button für die manuelle Bestätigung.
          </small>
        </label>

        {!hasPrompt && (
          <p className="stq-rrr-text-answer__warning">
            Lege eine Fund-Anweisung fest, damit dieser Baustein verständlich ist.
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
  const prompt = readString(config.prompt);
  const confirmLabel = readString(config.confirmLabel);
  const hasPrompt = prompt.trim() !== '';

  return (
    <div className="stq-rrr-text-answer-editor">
      <section
        className={`stq-rrr-text-answer ${
          hasPrompt ? '' : 'stq-rrr-text-answer--empty'
        }`}
        aria-label="Foto-Aufgabe einstellen"
      >
        <div className="stq-rrr-text-answer__header">
          <div>
            <span>Foto-Aufgabe</span>
            <strong>
              {hasPrompt ? 'Aufgabe festgelegt' : 'Aufgabe fehlt'}
            </strong>
          </div>
          <span
            className={`stq-rrr-text-answer__badge ${
              hasPrompt ? '' : 'stq-rrr-text-answer__badge--empty'
            }`}
          >
            Manuelle Bestätigung
          </span>
        </div>

        <label className="stq-rrr-field">
          <span>Anweisung</span>
          <input
            type="text"
            value={prompt}
            placeholder="z. B. Vergleiche dein Foto mit dem Schild"
            onChange={(event) => onPatchConfig({ prompt: event.target.value })}
          />
          <small className="stq-rrr-field__hint">
            Beschreibe, welches Foto aufgenommen oder verglichen werden soll.
          </small>
        </label>

        <label className="stq-rrr-field">
          <span>Bestätigungstext</span>
          <input
            type="text"
            value={confirmLabel}
            placeholder="Bestätigt"
            onChange={(event) =>
              onPatchConfig({ confirmLabel: event.target.value })
            }
          />
          <small className="stq-rrr-field__hint">
            Text auf dem Button für die manuelle Bestätigung.
          </small>
        </label>

        {!hasPrompt && (
          <p className="stq-rrr-text-answer__warning">
            Lege eine Foto-Aufgabe fest, damit dieser Baustein verständlich ist.
          </p>
        )}
      </section>
    </div>
  );
}

function getModuleCardMeta(module: RrrModule): {
  title: string;
  description: string;
  icon: IconName;
} {
  switch (module.type) {
    case 'text_answer':
      return {
        title: 'Antwort eingeben',
        description: 'Spieler lösen den Schritt mit einer Texteingabe.',
        icon: 'type',
      };
    case 'multi_choice':
      return {
        title: 'Auswahlfrage',
        description: 'Spieler wählen eine oder mehrere Antwortoptionen.',
        icon: 'check',
      };
    case 'gps_enter':
      return {
        title: 'Am richtigen Ort stehen',
        description: 'Der Schritt prüft eine simulierte Position am Zielort.',
        icon: 'map-pin',
      };
    case 'proximity_hint':
      return {
        title: 'Nähe-Hinweis',
        description: 'Spieler erhalten Nähe-Feedback beim Annähern an den Zielort.',
        icon: 'map-pin',
      };
    case 'compass_align':
      return {
        title: 'In eine Richtung schauen',
        description: 'Der Schritt prüft die Blickrichtung per Kompasswert.',
        icon: 'compass',
      };
    case 'direction_hotcold':
      return {
        title: 'Richtung warm/kalt',
        description: 'Spieler erhalten wärmer/kälter-Feedback zur Zielrichtung.',
        icon: 'compass',
      };
    case 'hold_still':
      return {
        title: 'Handy ruhig halten',
        description: 'Der Schritt wartet auf ruhiges Halten des Geräts.',
        icon: 'hand',
      };
    case 'qr_scan':
      return {
        title: 'QR-Code scannen',
        description: 'Der Schritt erwartet einen bestimmten QR-Code-Wert.',
        icon: 'qr-code',
      };
    case 'code_word':
      return {
        title: 'Codewort eingeben',
        description: 'Spieler lösen den Schritt mit einem Codewort.',
        icon: 'type',
      };
    case 'sequential_code':
      return {
        title: 'Gesammelten Code eingeben',
        description: 'Spieler lösen den Schritt mit einem gesammelten Code.',
        icon: 'type',
      };
    case 'timer_wait':
      return {
        title: 'Warten',
        description: 'Der Schritt ist nach einer Wartezeit erfüllt.',
        icon: 'clock',
      };
    case 'photo_check_manual':
      return {
        title: 'Foto-Aufgabe bestätigen',
        description: 'Spieler bestätigen eine Foto-Aufgabe manuell.',
        icon: 'image',
      };
    case 'object_found':
      return {
        title: 'Objekt gefunden',
        description: 'Spieler bestätigen manuell, dass sie etwas gefunden haben.',
        icon: 'check-circle',
      };
  }
}

function getModuleSettingsSummary(
  module: RrrModule,
): Array<{ label: string; value: string }> {
  const config = module.config;
  switch (module.type) {
    case 'text_answer': {
      const answer = readString(config.answer).trim();
      return [
        {
          label: 'Antwort',
          value: answer ? `"${answer}"` : 'Noch nicht festgelegt',
        },
        {
          label: 'Schreibweise',
          value: Boolean(config.caseSensitive)
            ? 'Groß-/Kleinschreibung wichtig'
            : 'Groß-/Kleinschreibung egal',
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
          label: 'Frage',
          value: question || 'Noch nicht festgelegt',
        },
        {
          label: 'Optionen',
          value:
            filledOptions.length > 0
              ? `${filledOptions.length} Optionen, ${correctCount} richtig`
              : 'Noch nicht festgelegt',
        },
      ];
    }
    case 'gps_enter':
      return [
        {
          label: 'Zielort',
          value: hasFiniteNumber(config.lat) && hasFiniteNumber(config.lng)
            ? `${formatNumber(readNumber(config.lat), 5)}, ${formatNumber(
                readNumber(config.lng),
                5,
              )}`
            : 'Koordinaten fehlen',
        },
        {
          label: 'Radius',
          value: `${formatNumber(readNumber(config.radiusMeters), 0)} m`,
        },
      ];
    case 'proximity_hint':
      return [
        {
          label: 'Zielort',
          value: hasFiniteNumber(config.lat) && hasFiniteNumber(config.lng)
            ? `${formatNumber(readNumber(config.lat), 5)}, ${formatNumber(
                readNumber(config.lng),
                5,
              )}`
            : 'Koordinaten fehlen',
        },
        {
          label: 'Erfolgsradius',
          value: `${formatNumber(readNumber(config.successRadiusMeters), 0)} m`,
        },
      ];
    case 'compass_align':
      return [
        {
          label: 'Richtung',
          value: `${formatNumber(readNumber(config.targetDegrees), 0)}°`,
        },
        {
          label: 'Toleranz',
          value: `±${formatNumber(readNumber(config.tolerance), 0)}°`,
        },
      ];
    case 'direction_hotcold':
      return [
        {
          label: 'Richtung',
          value: `${formatNumber(readNumber(config.targetDegrees), 0)}°`,
        },
        {
          label: 'Erfolgstoleranz',
          value: `±${formatNumber(readNumber(config.successTolerance), 0)}°`,
        },
      ];
    case 'hold_still': {
      const durationMs = readNumber(config.durationMs);
      return [
        {
          label: 'Dauer',
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
          label: 'QR-Wert',
          value: expectedValue ? `"${expectedValue}"` : 'Noch nicht festgelegt',
        },
      ];
    }
    case 'code_word': {
      const code = readString(config.code).trim();
      return [
        {
          label: 'Codewort',
          value: code ? `"${code}"` : 'Noch nicht festgelegt',
        },
        {
          label: 'Schreibweise',
          value: Boolean(config.caseSensitive)
            ? 'Groß-/Kleinschreibung wichtig'
            : 'Groß-/Kleinschreibung egal',
        },
      ];
    }
    case 'sequential_code': {
      const code = readString(config.code).trim();
      const hint = readString(config.hint).trim();
      return [
        {
          label: 'Code',
          value: code ? `"${code}"` : 'Noch nicht festgelegt',
        },
        {
          label: 'Hinweis',
          value: hint || 'Kein Hinweis',
        },
        {
          label: 'Schreibweise',
          value: Boolean(config.caseSensitive)
            ? 'Groß-/Kleinschreibung wichtig'
            : 'Groß-/Kleinschreibung egal',
        },
      ];
    }
    case 'timer_wait': {
      const durationMs = readNumber(config.durationMs);
      return [
        {
          label: 'Wartezeit',
          value: formatDurationSeconds(durationMs),
        },
      ];
    }
    case 'photo_check_manual': {
      const prompt = readString(config.prompt).trim();
      const confirmLabel = readString(config.confirmLabel).trim();
      return [
        {
          label: 'Anweisung',
          value: prompt || 'Noch nicht festgelegt',
        },
        {
          label: 'Button',
          value: confirmLabel || 'Bestätigt',
        },
      ];
    }
    case 'object_found': {
      const prompt = readString(config.prompt).trim();
      const confirmLabel = readString(config.confirmLabel).trim();
      return [
        {
          label: 'Anweisung',
          value: prompt || 'Noch nicht festgelegt',
        },
        {
          label: 'Button',
          value: confirmLabel || 'Gefunden',
        },
      ];
    }
  }
}

function getFallbackSettingsSummary(
  module: RrrModule,
  modules: RrrModule[],
  expertMode: boolean,
): Array<{ label: string; value: string }> {
  if (!module.fallbackModuleId) {
    return [];
  }

  return [
    {
      label: 'Ersatzlösung',
      value: getModuleDisplayLabel(module.fallbackModuleId, modules, expertMode),
    },
  ];
}

function getModuleDisplayLabel(
  moduleId: string,
  modules: RrrModule[],
  expertMode: boolean,
): string {
  const module = modules.find((entry) => entry.id === moduleId);
  if (module) {
    return module.label;
  }
  return expertMode ? `Fehlender Baustein (${moduleId})` : 'Fehlender Baustein';
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
        <small className="stq-rrr-field__hint">Gib eine gültige Zahl ein.</small>
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
  return new Intl.NumberFormat('de-DE', {
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

function getGpsRadiusMeta(radiusMeters: number): {
  label: string;
  description: string;
  tone: 'precise' | 'normal' | 'forgiving';
} {
  if (radiusMeters < 5) {
    return {
      label: 'Sehr präzise / riskant',
      description:
        'Unter 5 m kann GPS unzuverlässig sein. Spieler müssen sehr genau am Ort stehen.',
      tone: 'precise',
    };
  }

  if (radiusMeters <= 20) {
    return {
      label: 'Normal',
      description:
        '5 bis 20 m ist meist gut verständlich und verzeiht normale GPS-Abweichungen.',
      tone: 'normal',
    };
  }

  return {
    label: 'Großzügig',
    description:
      'Über 20 m ist leichter zu treffen und eignet sich für größere Plätze oder schwaches GPS.',
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

function getHoldStillDurationMeta(durationMs: number): {
  label: string;
  description: string;
  tone: 'short' | 'normal' | 'long';
} {
  if (durationMs < 2000) {
    return {
      label: 'Kurz',
      description:
        'Kurze Dauer ist schnell geschafft und eignet sich für einfache Schritte.',
      tone: 'short',
    };
  }

  if (durationMs <= 3000) {
    return {
      label: 'Normal',
      description:
        'Normale Dauer ist gut verständlich, ohne den Spielfluss stark zu bremsen.',
      tone: 'normal',
    };
  }

  return {
    label: 'Lang',
    description:
      'Lange Dauer macht den Schritt anspruchsvoller und verlangt ruhigeres Halten.',
    tone: 'long',
  };
}

function getTimerWaitDurationMeta(durationMs: number): {
  label: string;
  description: string;
  tone: 'short' | 'normal' | 'long';
} {
  if (durationMs <= 5000) {
    return {
      label: 'Kurz',
      description:
        'Kurze Wartezeit eignet sich als leichter Rhythmus- oder Verzögerungsschritt.',
      tone: 'short',
    };
  }

  if (durationMs <= 30000) {
    return {
      label: 'Normal',
      description:
        'Mittlere Wartezeit ist gut testbar und bleibt im Spielfluss verständlich.',
      tone: 'normal',
    };
  }

  return {
    label: 'Lang',
    description:
      'Lange Wartezeit kann Spieler ausbremsen und sollte bewusst eingesetzt werden.',
    tone: 'long',
  };
}

function normalizeCompassDegrees(value: number): number {
  const normalized = value % 360;
  return Math.round(normalized < 0 ? normalized + 360 : normalized);
}

function getCompassDirectionLabel(degrees: number): string {
  const nearestPreset = COMPASS_DIRECTION_PRESETS.reduce(
    (best, preset) =>
      getDegreeDistance(degrees, preset.degrees) <
      getDegreeDistance(degrees, best.degrees)
        ? preset
        : best,
    COMPASS_DIRECTION_PRESETS[0],
  );

  return `Nahe ${nearestPreset.label}`;
}

function getDegreeDistance(left: number, right: number): number {
  const difference = Math.abs(normalizeCompassDegrees(left - right));
  return Math.min(difference, 360 - difference);
}
