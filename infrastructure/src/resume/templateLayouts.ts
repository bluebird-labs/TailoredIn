import { TemplateStyle } from '@tailoredin/domain';
import type { TemplateLayoutConfig } from './TemplateLayoutConfig.js';

export const TEMPLATE_LAYOUTS: Record<TemplateStyle, TemplateLayoutConfig> = {
  [TemplateStyle.IC]: {
    beforeSectionSkip: '1pt',
    beforeEntrySkip: '1pt',
    beforeEntryDescriptionSkip: '1pt',
    bodyFontSize: '10pt',
    headerFontSize: '28pt',
    lineSpacing: '0.65em',
    pageMargin: '1.2cm',
    sectionOrder: ['professional', 'skills', 'education'],
    maxBulletsPerEntry: 6,
    showEntrySummary: true
  },
  [TemplateStyle.ARCHITECT]: {
    beforeSectionSkip: '4pt',
    beforeEntrySkip: '3pt',
    beforeEntryDescriptionSkip: '2pt',
    bodyFontSize: '10.5pt',
    headerFontSize: '30pt',
    lineSpacing: '0.75em',
    pageMargin: '1.5cm',
    sectionOrder: ['professional', 'skills', 'education'],
    maxBulletsPerEntry: 5,
    showEntrySummary: true
  },
  [TemplateStyle.EXECUTIVE]: {
    beforeSectionSkip: '6pt',
    beforeEntrySkip: '5pt',
    beforeEntryDescriptionSkip: '3pt',
    bodyFontSize: '11pt',
    headerFontSize: '32pt',
    lineSpacing: '0.85em',
    pageMargin: '2cm',
    sectionOrder: ['skills', 'professional', 'education'],
    maxBulletsPerEntry: 3,
    showEntrySummary: false
  }
};
