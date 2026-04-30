export function resolveRendererAssetPath(path: string | undefined): string | undefined {
  if (!path) return undefined;
  if (/^(https?:|blob:|data:)/.test(path)) return path;
  return `/${path.replace(/^\/+/, '')}`;
}
