export type ResumeTemplate = {
  /** Unique identifier used as cache key and registry key. */
  id: string;
  pageSize: 'us-letter' | 'a4';
  margins: { top: number; bottom: number; left: number; right: number }; // cm
  bodyFontSizePt: number;
  lineHeightEm: number;
  headerFontSizePt: number;
  /** Space before each section title, in pt. */
  sectionSpacingPt: number;
  /** Space before each cv-entry block, in pt. */
  entrySpacingPt: number;
};

export const DEFAULT_RESUME_TEMPLATE: ResumeTemplate = {
  id: 'brilliant-cv-default',
  pageSize: 'us-letter',
  margins: { top: 1.4, bottom: 1.4, left: 1.4, right: 1.4 },
  bodyFontSizePt: 10,
  lineHeightEm: 0.65,
  headerFontSizePt: 32,
  sectionSpacingPt: 4,
  entrySpacingPt: 4
};
