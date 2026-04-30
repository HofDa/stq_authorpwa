import type { Tour } from '@/schema/tour.schema';

export const sampleTour: Tour = {
  id: 'sample-southtyrolquest',
  title: {
    de: 'Sisis süße Spur',
    en: 'Sisi’s Sweet Trail',
    it: 'La dolce traccia di Sisi',
  },
  description: {
    de: 'Eine fake-native Vorschau für Autor:innen.',
    en: 'A fake-native author preview.',
    it: 'Anteprima fake-native per autori.',
  },
  location: { de: 'Meran', en: 'Merano', it: 'Merano' },
  imagePath: '',
  riddles: [],
};
