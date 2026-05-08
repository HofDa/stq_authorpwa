import {
  DesktopStudioShell,
  type DesktopStudioShellProps,
} from './DesktopStudioShell';
import { useMediaQuery } from '@/hooks/useMediaQuery';
import { MobileStudioShell } from './mobile/MobileStudioShell';

const MOBILE_STUDIO_QUERY = '(max-width: 767px)';

export function Studio(props: DesktopStudioShellProps) {
  const isMobileStudio = useMediaQuery(MOBILE_STUDIO_QUERY);

  if (isMobileStudio) {
    return <MobileStudioShell {...props} />;
  }

  return <DesktopStudioShell {...props} />;
}
