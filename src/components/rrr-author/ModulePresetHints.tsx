import { useEditorLanguage } from '@/i18n/editorLanguage';
import { RRR_MODULE_PRESETS, type RrrModuleType } from '@/rrr';
import {
  getModuleDifficultyLabel,
  getModuleReliabilityLabel,
} from './rrrInteractionEditorModel';

interface ModulePresetHintsProps {
  preset: (typeof RRR_MODULE_PRESETS)[RrrModuleType];
}

export function ModulePresetHints({ preset }: ModulePresetHintsProps) {
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
