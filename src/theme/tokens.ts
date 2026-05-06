/**
 * Design tokens aligned to the SouthTyrolQuests Author Tool mockup.
 *
 * Native source of truth still lives in the Flutter repo:
 *   - lib/theme/colors.dart
 *   - lib/theme/text_styles.dart
 *
 * Keep in sync manually when the native theme changes.
 */
export const tokens = {
  colors: {
    primary: '#a0463d',
    background: '#f8efe8',
    border: '#e7ddd3',
    text: '#1a1a1a',
    error: '#c84a3a',
    success: '#4a8a4a',
    disabled: '#8a807a',
    route: '#2196f3',
  },
  fonts: {
    ui: '"Open Sans", system-ui, sans-serif',
    body: '"Open Sans", system-ui, sans-serif',
  },
  textStyles: {
    h3: { fontFamily: 'ui', fontSize: 20.8, fontWeight: 700 },
    h4: { fontFamily: 'ui', fontSize: 19.2, fontWeight: 700 },
    h5: { fontFamily: 'ui', fontSize: 17.6, fontWeight: 700 },
    h6: { fontFamily: 'ui', fontSize: 16, fontWeight: 700 },
    body: { fontFamily: 'body', fontSize: 16, fontWeight: 400 },
    bodySmall: { fontFamily: 'ui', fontSize: 12, fontWeight: 400 },
    labelLarge: { fontFamily: 'ui', fontSize: 14, fontWeight: 600 },
    labelSmall: { fontFamily: 'ui', fontSize: 12, fontWeight: 600 },
  },
  radius: {
    sm: 8,
    md: 12,
    pill: 9999,
  },
} as const;

export type DesignTokens = typeof tokens;
