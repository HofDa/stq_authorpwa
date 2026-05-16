import { useCallback, useState } from 'react';
import { RrrInteractionSchema } from '@/schema';
import {
  RRR_MODULE_PRESET_GROUPS,
  RRR_MODULE_PRESETS,
  createRrrModuleFromPreset,
  getRrrWarnings,
  repairRrrCondition,
  type RrrModule,
  type RrrModuleType,
} from '@/rrr';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import { RrrInteractionJsonEditor } from './RrrInteractionJsonEditor';
import { RrrMockPreview } from './RrrMockPreview';
import { ModulePresetHints } from './ModulePresetHints';
import { RrrConditionEditor } from './RrrConditionEditor';
import { RrrModuleEditor } from './RrrModuleEditor';
import { RrrTemplatePicker } from './RrrTemplatePicker';
import { RrrWarningsPanel } from './RrrWarningsPanel';
import type { RrrInteractionEditorProps } from './types';
import {
  formatEditorText,
  getConditionTypeLabel,
} from './rrrInteractionEditorModel';

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

