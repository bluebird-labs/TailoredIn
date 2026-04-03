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
