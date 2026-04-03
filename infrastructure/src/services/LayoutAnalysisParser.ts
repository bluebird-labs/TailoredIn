import type { BlockLayout, LayoutAnalysis, ResumeTemplate } from '@tailoredin/domain';
import type { ResumeContentDto } from '@tailoredin/application';

type RawPosition = { page: number; y: number };
type RawPositions = Record<string, RawPosition>;

/**
 * Converts the JSON output of:
 *   typst query cv.typ "<all-layout-positions>" --field value
 * into a structured LayoutAnalysis.
 *
 * @param queryOutput - Raw string output from the typst query command
 * @param content - The content that was compiled (used to know array sizes)
 * @param template - Used to compute lineCount from raw y-coordinates
 */
export function parseLayoutAnalysis(
  queryOutput: string,
  content: ResumeContentDto,
  template: ResumeTemplate,
): LayoutAnalysis {
  const parsed = JSON.parse(queryOutput) as [RawPositions];
  const positions = parsed[0];

  const lineHeightPt = template.bodyFontSizePt * template.lineHeightEm;

  // Compute page height in points based on template page size
  const pageHeightPt = template.pageSize === 'us-letter' ? 792 : 842; // us-letter = 11" * 72, a4 = 297mm / 25.4 * 72

  function blockLayout(startKey: string, endKey: string): BlockLayout {
    const start = positions[startKey];
    const end = positions[endKey];

    if (!start || !end) {
      return { lineCount: 0, pageNumbers: [] };
    }

    const pageNumbers = Array.from(
      { length: end.page - start.page + 1 },
      (_, i) => start.page + i,
    );

    const heightPt =
      end.page === start.page
        ? end.y - start.y
        : (end.page - start.page) * pageHeightPt + (end.y - start.y);
    const lineCount = Math.max(1, Math.ceil(heightPt / lineHeightPt));

    return { lineCount, pageNumbers };
  }

  // Re-derive groups to know how many roles per group (mirrors TypstFileGenerator grouping logic)
  const groups: Array<{ expIndices: number[] }> = [];
  for (let i = 0; i < content.experience.length; i++) {
    const exp = content.experience[i];
    const last = groups[groups.length - 1];
    if (last && content.experience[last.expIndices[0]].society === exp.society) {
      last.expIndices.push(i);
    } else {
      groups.push({ expIndices: [i] });
    }
  }

  const parsedExperiences = groups.map((group, gi) => {
    const company = blockLayout(`exp-${gi}-company-start`, `exp-${gi}-company-end`);
    const roles = group.expIndices.map((expIdx, ri) => {
      const exp = content.experience[expIdx];
      const title = blockLayout(`exp-${gi}-role-${ri}-title-start`, `exp-${gi}-role-${ri}-title-end`);
      const bullets = exp.highlights.map((_, bi) =>
        blockLayout(`exp-${gi}-role-${ri}-bullet-${bi}-start`, `exp-${gi}-role-${ri}-bullet-${bi}-end`),
      );
      return { title, bullets };
    });
    return { company, roles };
  });

  const relevantSkills = content.skills.filter((s) => s.type !== 'interests');
  const parsedSkills = relevantSkills.map((_, si) => blockLayout(`skill-${si}-start`, `skill-${si}-end`));

  const parsedEducation = content.education.map((_, ei) => blockLayout(`edu-${ei}-start`, `edu-${ei}-end`));

  const allPages = [...new Set(Object.values(positions).map((p) => p.page))].sort((a, b) => a - b);

  // Header: approximated from font sizes since brilliant-cv renders the header
  // from metadata.toml and it cannot be instrumented with markers directly.
  const nameLinesApprox = Math.ceil(template.headerFontSizePt / lineHeightPt);

  return {
    totalPages: allPages.length > 0 ? Math.max(...allPages) : 1,
    header: {
      name: { lineCount: nameLinesApprox, pageNumbers: [1] },
      headline: { lineCount: 1, pageNumbers: [1] },
      infoLine: { lineCount: 1, pageNumbers: [1] },
    },
    experiences: parsedExperiences,
    education: parsedEducation,
    skills: parsedSkills,
  };
}
