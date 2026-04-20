import { z } from 'zod';

export const LOCALES = ['en', 'de', 'it'] as const;
export const LocaleSchema = z.enum(LOCALES);
export type Locale = z.infer<typeof LocaleSchema>;

export const LOCALE_LABELS: Record<Locale, string> = {
  en: 'English',
  de: 'Deutsch',
  it: 'Italiano',
};
