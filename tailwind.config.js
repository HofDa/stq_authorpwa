import { tokens } from './src/theme/tokens.ts';

export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: tokens.colors.primary,
        background: tokens.colors.background,
        border: tokens.colors.border,
        text: tokens.colors.text,
        error: tokens.colors.error,
        success: tokens.colors.success,
        disabled: tokens.colors.disabled,
      },
      fontFamily: {
        ui: ['"Open Sans"', 'system-ui', 'sans-serif'],
        body: ['"Open Sans"', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        h3: ['20.8px', { fontWeight: '700' }],
        h4: ['19.2px', { fontWeight: '700' }],
        h5: ['17.6px', { fontWeight: '700' }],
        h6: ['16px', { fontWeight: '700' }],
        body: ['16px', { fontWeight: '400' }],
        bodySm: ['12px', { fontWeight: '400' }],
        labelLg: ['14px', { fontWeight: '600' }],
        labelSm: ['12px', { fontWeight: '600' }],
      },
      borderRadius: {
        sm: '8px',
        md: '12px',
      },
    },
  },
  plugins: [],
};
