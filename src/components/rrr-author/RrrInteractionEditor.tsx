import {
  useEffect,
  useMemo,
  useState,
  type CSSProperties,
  type PointerEvent,
} from 'react';
import { RrrInteractionSchema } from '@/schema';
import {
  RRR_MODULE_TYPES,
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

type CompassNeedleStyle = CSSProperties & {
  '--stq-rrr-compass-degrees': string;
};

export function RrrInteractionEditor({
  interaction,
  onChange,
}: RrrInteractionEditorProps) {
  const [moduleTypeToAdd, setModuleTypeToAdd] =
    useState<RrrModuleType>('text_answer');
  const [expertMode, setExpertMode] = useState(false);
  const moduleCount = interaction.modules.length;
  const conditionType = interaction.condition?.type ?? 'none';
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
            Hinzufügen
          </button>
        </div>
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
              expertMode={expertMode}
              onChange={(nextModule) => updateModule(module.id, nextModule)}
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

      <RrrMockPreview interaction={interaction} expertMode={expertMode} />

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
  expertMode,
  onChange,
  onRemove,
}: {
  module: RrrModule;
  expertMode: boolean;
  onChange: (module: RrrModule) => void;
  onRemove: () => void;
}) {
  const config = module.config;
  const [isEditing, setIsEditing] = useState(false);
  const cardMeta = getModuleCardMeta(module);
  const summary = getModuleSettingsSummary(module);

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

          {module.type === 'compass_align' && (
            <CompassDirectionPicker
              config={config}
              expertMode={expertMode}
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
        </div>
      )}
    </article>
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
  onPatchConfig,
}: {
  config: RrrModule['config'];
  expertMode: boolean;
  onPatchConfig: (patch: Record<string, unknown>) => void;
}) {
  const targetDegrees = normalizeCompassDegrees(readNumber(config.targetDegrees));
  const tolerance = Math.max(0, readNumber(config.tolerance));
  const toleranceSliderValue = Math.min(tolerance, 90);

  function setTargetDegrees(value: number) {
    onPatchConfig({ targetDegrees: normalizeCompassDegrees(value) });
  }

  function setTolerance(value: number) {
    onPatchConfig({ tolerance: Math.max(0, value) });
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
          <span>Toleranz: ±{formatNumber(tolerance, 0)}°</span>
          <input
            type="range"
            min="0"
            max="90"
            step="1"
            value={toleranceSliderValue}
            onChange={(event) => setTolerance(Number(event.target.value))}
          />
          <small className="stq-rrr-field__hint">
            Je größer die Toleranz, desto großzügiger gilt die Blickrichtung als
            richtig.
          </small>
        </label>
        <NumberField
          label="Toleranz in Grad"
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
  onPatchConfig,
}: {
  config: RrrModule['config'];
  onPatchConfig: (patch: Record<string, unknown>) => void;
}) {
  const radiusMeters = Math.max(0, readNumber(config.radiusMeters));
  const radiusSliderValue = Math.min(radiusMeters, 100);
  const radiusMeta = getGpsRadiusMeta(radiusMeters);

  function setRadiusMeters(value: number) {
    onPatchConfig({ radiusMeters: Math.max(0, Math.round(value)) });
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
            <span>Radius</span>
            <strong>{formatNumber(radiusMeters, 0)} m</strong>
          </div>
          <span
            className={`stq-rrr-gps-radius__badge stq-rrr-gps-radius__badge--${radiusMeta.tone}`}
          >
            {radiusMeta.label}
          </span>
        </div>

        <label className="stq-rrr-field">
          <span>Radius per Schieberegler</span>
          <input
            type="range"
            min="1"
            max="100"
            step="1"
            value={radiusSliderValue}
            onChange={(event) => setRadiusMeters(Number(event.target.value))}
          />
          <small className="stq-rrr-field__hint">
            {radiusMeta.description}
          </small>
        </label>

        <NumberField
          label="Radius in Metern"
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
    case 'gps_enter':
      return {
        title: 'Am richtigen Ort stehen',
        description: 'Der Schritt prüft eine simulierte Position am Zielort.',
        icon: 'map-pin',
      };
    case 'compass_align':
      return {
        title: 'In eine Richtung schauen',
        description: 'Der Schritt prüft die Blickrichtung per Kompasswert.',
        icon: 'compass',
      };
    case 'hold_still':
      return {
        title: 'Handy ruhig halten',
        description: 'Der Schritt wartet auf ruhiges Halten des Geräts.',
        icon: 'hand',
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
  }
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
