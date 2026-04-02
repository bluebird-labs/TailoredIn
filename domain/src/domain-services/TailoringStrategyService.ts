import { ArchetypeKey } from '../value-objects/Archetype.js';
import { TailoringScore } from '../value-objects/TailoringScore.js';

/**
 * Selects the resume template archetype to use for a given job archetype,
 * and computes the tailoring score for a set of keywords.
 *
 * Template selection logic extracted from libs/resume/src/templates/makeResumeContent.ts.
 */
export class TailoringStrategyService {
  /**
   * Maps a job archetype to the resume template archetype used for generation.
   * Currently all archetypes default to LEAD_IC template — extend as templates are added.
   */
  public resolveTemplateArchetype(archetype: ArchetypeKey): ArchetypeKey {
    switch (archetype) {
      case ArchetypeKey.IC:
      case ArchetypeKey.LEAD_IC:
        return ArchetypeKey.LEAD_IC;
      default:
        return ArchetypeKey.LEAD_IC;
    }
  }

  /**
   * Computes what fraction of the requested keywords appear in the job description.
   */
  public computeTailoringScore(keywords: string[], jobDescription: string): TailoringScore {
    const desc = jobDescription.toLowerCase();
    const matched = keywords.filter(kw => desc.includes(kw.toLowerCase())).length;
    return new TailoringScore(matched, keywords.length);
  }
}
