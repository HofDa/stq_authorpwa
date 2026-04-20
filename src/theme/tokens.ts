/**
 * Design tokens mirrored from the SouthTyrolQuests Flutter theme.
 *
 * Source of truth lives in the Flutter repo:
 *   - lib/theme/colors.dart
 *   - lib/theme/text_styles.dart
 *
 * Keep in sync manually when the native theme changes.
 */
export const tokens = {
  colors: {
    primary: 'rgb(144, 74, 72)',
    background: 'rgb(255, 248, 247)',
    border: 'rgb(216, 193, 192)',
    text: 'rgb(35, 25, 25)',
    error: 'rgb(186, 26, 26)',
    success: 'rgb(65, 104, 52)',
    disabled: 'rgb(112, 112, 112)',
    route: '#2196f3',
  },
  fonts: {
    ui: '"Open Sans", system-ui, sans-serif',
    body: 'Lato, Georgia, serif',
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
