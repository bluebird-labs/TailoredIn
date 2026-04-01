export type TemplateLayoutConfig = {
  beforeSectionSkip: string;
  beforeEntrySkip: string;
  beforeEntryDescriptionSkip: string;
  bodyFontSize: string;
  headerFontSize: string;
  lineSpacing: string;
  pageMargin: string;
  sectionOrder: ('professional' | 'skills' | 'education')[];
  maxBulletsPerEntry: number;
  showEntrySummary: boolean;
};
