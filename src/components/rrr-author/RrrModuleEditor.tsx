import { useState } from 'react';
import {
  RRR_MODULE_PRESETS,
  type RrrModule,
  type RrrModuleType,
} from '@/rrr';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import { Icon } from '@/components/studio/Icon';
import {
  BalanceRunEditor,
  CompassDirectionPicker,
  GpsRadiusEditor,
  HoldStillDurationEditor,
  SafeDialEditor,
  TimerWaitDurationEditor,
} from './RrrSensorModuleEditors';
import {
  CodeWordEditor,
  MorseCodeEditor,
  MultiChoiceEditor,
  ObjectFoundEditor,
  PhotoCheckManualEditor,
  QrScanEditor,
  SequentialCodeEditor,
  TextAnswerEditor,
} from './RrrTextModuleEditors';
import {
  formatEditorText,
  formatModuleOption,
  getFallbackSettingsSummary,
  getModuleCardMeta,
  getModuleSettingsSummary,
} from './rrrInteractionEditorModel';

export function RrrModuleEditor({
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

          {module.type === 'safe_dial' && (
            <SafeDialEditor
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

          {module.type === 'proximity_hint' && (
            <GpsRadiusEditor
              config={config}
              radiusConfigKey="successRadiusMeters"
              radiusLabel={t('rrr.editor.module.proximityRadiusLabel')}
              radiusHint={t('rrr.editor.module.proximityRadiusHint')}
              onPatchConfig={patchConfig}
            />
          )}

          {module.type === 'balance_run' && (
            <BalanceRunEditor config={config} onPatchConfig={patchConfig} />
          )}

          {module.type === 'qr_scan' && (
            <QrScanEditor config={config} onPatchConfig={patchConfig} />
          )}

          {module.type === 'morse_code' && (
            <MorseCodeEditor config={config} onPatchConfig={patchConfig} />
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
