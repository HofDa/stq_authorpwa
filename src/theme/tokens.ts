/**
 * Tailwind bridge for the canonical design tokens in src/styles/tokens.css.
 * Keep actual token values in CSS so runtime styles, inline React styles and
 * Tailwind utilities all resolve through the same custom properties.
 */
export const tokens = {
  colors: {
    primary: 'rgb(var(--stq-color-primary-rgb) / <alpha-value>)',
    background: 'rgb(var(--stq-color-bg-rgb) / <alpha-value>)',
    border: 'rgb(var(--stq-color-border-rgb) / <alpha-value>)',
    surface: 'rgb(var(--stq-color-surface-rgb) / <alpha-value>)',
    text: 'rgb(var(--stq-color-text-rgb) / <alpha-value>)',
    inverted: 'rgb(var(--stq-color-text-inverted-rgb) / <alpha-value>)',
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
    h3: {
      fontFamily: 'ui',
      fontSize: 'var(--stq-font-size-h3)',
      fontWeight: 'var(--stq-font-weight-bold)',
    },
    h4: {
      fontFamily: 'ui',
      fontSize: 'var(--stq-font-size-h4)',
      fontWeight: 'var(--stq-font-weight-bold)',
    },
    h5: {
      fontFamily: 'ui',
      fontSize: 'var(--stq-font-size-h5)',
      fontWeight: 'var(--stq-font-weight-bold)',
    },
    h6: {
      fontFamily: 'ui',
      fontSize: 'var(--stq-font-size-h6)',
      fontWeight: 'var(--stq-font-weight-bold)',
    },
    body: {
      fontFamily: 'body',
      fontSize: 'var(--stq-font-size-body)',
      fontWeight: 'var(--stq-font-weight-regular)',
    },
    bodySmall: {
      fontFamily: 'ui',
      fontSize: 'var(--stq-font-size-body-small)',
      fontWeight: 'var(--stq-font-weight-regular)',
    },
    labelLarge: {
      fontFamily: 'ui',
      fontSize: 'var(--stq-font-size-label-large)',
      fontWeight: 'var(--stq-font-weight-semibold)',
    },
    labelSmall: {
      fontFamily: 'ui',
      fontSize: 'var(--stq-font-size-label-small)',
      fontWeight: 'var(--stq-font-weight-semibold)',
    },
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
