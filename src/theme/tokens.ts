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
    primary: 'rgb(var(--stq-color-primary-rgb) / <alpha-value>)',
    background: 'rgb(var(--stq-color-bg-rgb) / <alpha-value>)',
    border: 'rgb(var(--stq-color-border-rgb) / <alpha-value>)',
    surface: 'rgb(var(--stq-color-surface-rgb) / <alpha-value>)',
    text: 'rgb(var(--stq-color-text-rgb) / <alpha-value>)',
    inverted: 'rgb(var(--stq-color-surface-rgb) / <alpha-value>)',
    error: 'rgb(var(--stq-color-danger-rgb) / <alpha-value>)',
    success: 'rgb(var(--stq-color-success-rgb) / <alpha-value>)',
    disabled: 'rgb(var(--stq-color-text-muted-rgb) / <alpha-value>)',
    route: 'rgb(var(--stq-color-route-rgb) / <alpha-value>)',
  },
  fonts: {
    ui: 'var(--stq-font-ui)',
    body: 'var(--stq-font-ui)',
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
    xs: 'var(--stq-radius-xs)',
    sm: 'var(--stq-radius-sm)',
    md: 'var(--stq-radius-md)',
    lg: 'var(--stq-radius-lg)',
    xl: 'var(--stq-radius-xl)',
    pill: 'var(--stq-radius-pill)',
  },
} as const;

export type DesignTokens = typeof tokens;
