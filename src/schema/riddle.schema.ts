import type { ContentSection } from './content-section.schema';

export interface LocalizedString {
  de: string;
  en: string;
  it: string;
}

export interface Riddle {
  id: string;
  number: number;
  title: LocalizedString;
  imagePath: string;
  iconPath: string;
  sections: {
    firstSection: Record<keyof LocalizedString, ContentSection>;
    historySection: Record<keyof LocalizedString, ContentSection>;
    riddleSection: Record<keyof LocalizedString, ContentSection>;
    successSection: Record<keyof LocalizedString, ContentSection>;
  };
  hints: Record<keyof LocalizedString, string[]>;
  acceptedAnswers: Record<keyof LocalizedString, string[]>;
}
