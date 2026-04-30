import type { LocalizedString, Riddle } from './riddle.schema';

export interface Tour {
  id: string;
  title: LocalizedString;
  description: LocalizedString;
  location: LocalizedString;
  imagePath: string;
  riddles: Riddle[];
}
