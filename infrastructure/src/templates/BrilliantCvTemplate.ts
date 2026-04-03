import type { ResumeTemplate } from '@tailoredin/domain';

/**
 * brilliant-cv v3.3.0 layout constants.
 * These mirror the values currently hardcoded in TypstFileGenerator's RESUME_LAYOUT.
 * TypstFileGenerator will consume this object in Task 4 instead of RESUME_LAYOUT.
 */
export const BrilliantCvTemplate: ResumeTemplate = {
  id: 'brilliant-cv',
  pageSize: 'us-letter',
  margins: { top: 1.5, bottom: 1.5, left: 1.5, right: 1.5 }, // cm
  bodyFontSizePt: 10.5,
  lineHeightEm: 0.75,
  headerFontSizePt: 30,
  sectionSpacingPt: 4,
  entrySpacingPt: 3,
};
