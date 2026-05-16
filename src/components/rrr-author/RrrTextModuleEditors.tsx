import { normalizeMorseSymbolPattern, type RrrModule } from '@/rrr';
import { useEditorLanguage } from '@/i18n/editorLanguage';
import {
  formatEditorText,
  normalizeMultiChoiceIndexes,
  normalizeMultiChoiceOptions,
  readString,
} from './rrrInteractionEditorModel';

type PatchConfig = (patch: Record<string, unknown>) => void;

export function TextAnswerEditor({
  config,
  onPatchConfig,
}: {
  config: RrrModule['config'];
  onPatchConfig: PatchConfig;
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

export function MultiChoiceEditor({
  moduleId,
  config,
  onPatchConfig,
}: {
  moduleId: string;
  config: RrrModule['config'];
  onPatchConfig: PatchConfig;
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

export function QrScanEditor({
  config,
  onPatchConfig,
}: {
  config: RrrModule['config'];
  onPatchConfig: PatchConfig;
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

export function MorseCodeEditor({
  config,
  onPatchConfig,
}: {
  config: RrrModule['config'];
  onPatchConfig: PatchConfig;
}) {
  const { t } = useEditorLanguage();
  const pattern = normalizeMorseSymbolPattern(readString(config.pattern));
  const shortAudioUrl = readString(config.shortAudioUrl);
  const longAudioUrl = readString(config.longAudioUrl);
  const hasPattern = pattern !== '';
  const hasAudio = shortAudioUrl.trim() !== '' && longAudioUrl.trim() !== '';

  return (
    <div className="stq-rrr-text-answer-editor">
      <section
        className={`stq-rrr-text-answer ${
          hasPattern ? '' : 'stq-rrr-text-answer--empty'
        }`}
        aria-label={t('rrr.editor.morse.aria')}
      >
        <div className="stq-rrr-text-answer__header">
          <div>
            <span>{t('rrr.editor.morse.eyebrow')}</span>
            <strong>
              {hasPattern
                ? t('rrr.editor.morse.set')
                : t('rrr.editor.morse.missing')}
            </strong>
          </div>
          <span
            className={`stq-rrr-text-answer__badge ${
              hasPattern ? '' : 'stq-rrr-text-answer__badge--empty'
            }`}
          >
            {hasAudio
              ? t('rrr.editor.morse.audioReady')
              : t('rrr.editor.morse.syntheticAudio')}
          </span>
        </div>

        <label className="stq-rrr-field">
          <span>{t('rrr.editor.morse.pattern')}</span>
          <input
            type="text"
            value={pattern}
            placeholder={t('rrr.editor.morse.patternPlaceholder')}
            onChange={(event) =>
              onPatchConfig({
                pattern: normalizeMorseSymbolPattern(event.target.value),
              })
            }
          />
          <small className="stq-rrr-field__hint">
            {t('rrr.editor.morse.patternHint')}
          </small>
        </label>

        <label className="stq-rrr-field">
          <span>{t('rrr.editor.morse.shortAudio')}</span>
          <input
            type="text"
            value={shortAudioUrl}
            placeholder={t('rrr.editor.morse.shortAudioPlaceholder')}
            onChange={(event) =>
              onPatchConfig({ shortAudioUrl: event.target.value })
            }
          />
        </label>

        <label className="stq-rrr-field">
          <span>{t('rrr.editor.morse.longAudio')}</span>
          <input
            type="text"
            value={longAudioUrl}
            placeholder={t('rrr.editor.morse.longAudioPlaceholder')}
            onChange={(event) =>
              onPatchConfig({ longAudioUrl: event.target.value })
            }
          />
          <small className="stq-rrr-field__hint">
            {t('rrr.editor.morse.audioHint')}
          </small>
        </label>

        {!hasPattern && (
          <p className="stq-rrr-text-answer__warning">
            {t('rrr.editor.morse.warning')}
          </p>
        )}
      </section>
    </div>
  );
}

export function CodeWordEditor({
  config,
  onPatchConfig,
}: {
  config: RrrModule['config'];
  onPatchConfig: PatchConfig;
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

export function SequentialCodeEditor({
  config,
  onPatchConfig,
}: {
  config: RrrModule['config'];
  onPatchConfig: PatchConfig;
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

export function ObjectFoundEditor({
  config,
  onPatchConfig,
}: {
  config: RrrModule['config'];
  onPatchConfig: PatchConfig;
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

export function PhotoCheckManualEditor({
  config,
  onPatchConfig,
}: {
  config: RrrModule['config'];
  onPatchConfig: PatchConfig;
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
