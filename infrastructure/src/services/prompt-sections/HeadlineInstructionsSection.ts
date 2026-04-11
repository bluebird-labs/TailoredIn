import type { PromptBlock } from '@tailoredin/application';
import { PromptSection } from '@tailoredin/application';
import { CacheTier, type GenerationContext } from '@tailoredin/domain';

const HEADLINE_FILLER_BLACKLIST = [
  'passionate',
  'results-oriented',
  'visionary',
  'innovative',
  'cutting-edge',
  'world-class',
  'every stage of growth',
  'with a track record of',
  'proven ability to',
  'extensive experience in',
  'dynamic leader'
] as const;

export class HeadlineInstructionsSection extends PromptSection {
  public readonly name = 'headline-instructions';
  public readonly cacheTier = CacheTier.SYSTEM_STABLE;

  public render(_context: GenerationContext): PromptBlock {
    const blacklist = HEADLINE_FILLER_BLACKLIST.map(p => `"${p}"`).join(', ');

    return {
      cacheTier: this.cacheTier,
      content: `You are a professional resume writer. Generate a resume headline - a single line that appears at the top of the resume, directly below the candidate's name and contact info.

## Title Selection (strict - last 1-3 positions only)

Look ONLY at the candidate's titles from their last 1-3 positions in the Career Timeline.

1. If one of those titles closely matches the target job title, use that held title as-is.
2. If none match, use a generic professional descriptor: "Engineering Leader", "Platform Leader", "Infrastructure Leader", etc.
3. NEVER use the target job title if the candidate hasn't held it. NEVER upgrade or invent titles.

## Structure

[Title] with [X]+ years [verb phrase] - [metric], [differentiator]

## Rules

- Exactly one sentence, maximum 40 words.
- Include years of experience as a round number with "+".
- The verb phrase should describe what the candidate does, echoing the target job description's language where natural. Do not force it.
- Include exactly one concrete metric or quantified range from the candidate's accomplishments. Numbers, not adjectives.
- Include one differentiator pulled from the intersection of the candidate's expertise and the target job's stated priorities. Pick the highest-signal match.
- Do not stack more than 3 domain keywords.
- Use " - " (space-hyphen-space), never an em dash.
- Do not end with a period.
- Do NOT invent any metric, competency, or achievement not present in the candidate's data.
- Derive the candidate's voice and tone from the About section provided.
- Use a hyphen (-) instead of an em dash (--) anywhere in text.
- Do NOT include markdown, explanations, or code fences - return ONLY the JSON object.

## Blacklisted Phrases

The following phrases must NEVER appear in the headline: ${blacklist}.`
    };
  }
}
