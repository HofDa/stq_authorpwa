import { tokens } from './src/theme/tokens.ts';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: tokens.colors.primary,
        background: tokens.colors.background,
        border: tokens.colors.border,
        surface: tokens.colors.surface,
        text: tokens.colors.text,
        inverted: tokens.colors.inverted,
        error: tokens.colors.error,
        success: tokens.colors.success,
        disabled: tokens.colors.disabled,
      },
      fontFamily: {
        ui: [tokens.fonts.ui],
        body: [tokens.fonts.body],
      },
      fontSize: {
        h3: [tokens.textStyles.h3.fontSize, { fontWeight: tokens.textStyles.h3.fontWeight }],
        h4: [tokens.textStyles.h4.fontSize, { fontWeight: tokens.textStyles.h4.fontWeight }],
        h5: [tokens.textStyles.h5.fontSize, { fontWeight: tokens.textStyles.h5.fontWeight }],
        h6: [tokens.textStyles.h6.fontSize, { fontWeight: tokens.textStyles.h6.fontWeight }],
        body: [
          tokens.textStyles.body.fontSize,
          { fontWeight: tokens.textStyles.body.fontWeight },
        ],
        bodySm: [
          tokens.textStyles.bodySmall.fontSize,
          { fontWeight: tokens.textStyles.bodySmall.fontWeight },
        ],
        labelLg: [
          tokens.textStyles.labelLarge.fontSize,
          { fontWeight: tokens.textStyles.labelLarge.fontWeight },
        ],
        labelSm: [
          tokens.textStyles.labelSmall.fontSize,
          { fontWeight: tokens.textStyles.labelSmall.fontWeight },
        ],
      },
      borderRadius: {
        xs: tokens.radius.xs,
        sm: tokens.radius.sm,
        md: tokens.radius.md,
        lg: tokens.radius.lg,
        xl: tokens.radius.xl,
        pill: tokens.radius.pill,
      },
    },
  },
  plugins: [],
};
