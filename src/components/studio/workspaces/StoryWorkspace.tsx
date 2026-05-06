import { useEditorLanguage } from '@/i18n/editorLanguage';
import { DeviceMockup } from '../DeviceMockup';
import { IntroPhonePreview } from './IntroPhonePreview';
import type { BaseWorkspaceProps } from './workspaceTypes';

type Props = BaseWorkspaceProps;

interface StoryWorkspaceProps extends Props {
  mode?: 'intro' | 'outro';
  onSelectTourOverview?: () => void;
}

/**
 * Intro/outro workspace.
 *
 * The desktop mockup treats the sidebar as the author chrome and keeps the
 * selected app screen centered on the canvas.
 */
export function StoryWorkspace({
  draft,
  locale,
  onChange,
  mode = 'intro',
  onSelectTourOverview,
}: StoryWorkspaceProps) {
  const { t } = useEditorLanguage();
  const detail =
    mode === 'outro' ? t('studio.outroPage') : t('studio.introPage');
  return (
    <div
      style={{
        height: '100%',
        width: '100%',
        display: 'grid',
        placeItems: 'center',
        overflow: 'hidden',
        position: 'relative',
      }}
    >
      <DeviceMockup label={t('studio.appPreview')} detail={detail}>
        <IntroPhonePreview
          draft={draft}
          locale={locale}
          onChange={onChange}
          mode={mode}
          onSelectTourOverview={onSelectTourOverview}
        />
      </DeviceMockup>
    </div>
  );
}
