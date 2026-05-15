export function resolveMapLibrePaintColor(color: string): string {
  if (
    !color.startsWith('var(') ||
    typeof window === 'undefined' ||
    typeof document === 'undefined'
  ) {
    return color;
  }

  const tokenName = getMapLibreCssVariableName(color);
  if (!tokenName) {
    return color;
  }

  return (
    getComputedStyle(document.documentElement).getPropertyValue(tokenName).trim() ||
    color
  );
}

export function getMapLibreCssVariableName(color: string): string | null {
  return color.match(/var\(\s*(--[^,\s)]+)/)?.[1] ?? null;
}
