import { resolveRendererAssetPath } from './assetPaths';
import {
  buildStationIconSvg,
  svgToDataUri,
  type StationVisualChoice,
} from '@/stations/visuals';

interface Props {
  iconPath?: string;
  fallback: string | number;
  visual?: StationVisualChoice;
}

export function CenterIcon({ iconPath, fallback, visual }: Props) {
  if (visual) {
    return <img src={svgToDataUri(buildStationIconSvg(visual))} alt="" />;
  }

  const iconSrc = resolveRendererAssetPath(iconPath);

  if (iconSrc) {
    return <img src={iconSrc} alt="" onError={(event) => event.currentTarget.remove()} />;
  }

  return <span>{fallback}</span>;
}
