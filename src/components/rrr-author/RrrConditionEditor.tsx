import { useEffect, useMemo, useState } from 'react';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import {
  buildFlatCondition,
  conditionToFlatModuleIds,
  isFlatCondition,
  type RrrCondition,
  type RrrModule,
} from '@/rrr';
import {
  CONDITION_TYPE_LABEL_KEYS,
  type FlatConditionType,
  formatEditorText,
  formatModuleOption,
  getConditionTypeLabel,
  getModuleDisplayLabel,
} from './rrrInteractionEditorModel';

interface RrrConditionEditorProps {
  modules: RrrModule[];
  condition: RrrCondition | undefined;
  expertMode: boolean;
  onChange: (condition: RrrCondition | undefined) => void;
}

export function RrrConditionEditor({
  modules,
  condition,
  expertMode,
  onChange,
}: RrrConditionEditorProps) {
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
