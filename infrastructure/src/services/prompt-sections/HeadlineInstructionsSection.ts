import type { PromptBlock } from '@tailoredin/application';
import { PromptSection } from '@tailoredin/application';
import { CacheTier, type GenerationContext } from '@tailoredin/domain';

export class HeadlineInstructionsSection extends PromptSection {
  public readonly name = 'headline-instructions';
  public readonly cacheTier = CacheTier.SYSTEM_STABLE;

  public render(_context: GenerationContext): PromptBlock {
    return {
      cacheTier: this.cacheTier,
      content: `You are a professional resume writer. Generate a resume headline - a single line that appears at the top of the resume, directly below the candidate's name and contact info.

## Title Selection (strict priority order)

1. If the candidate has held a title that closely matches the target job title, use that exact held title.
2. If no close match exists, use a generic professional descriptor: "Engineering Leader", "Platform Leader", "Infrastructure Leader", etc.
3. NEVER use a title the candidate has not held. NEVER upgrade or invent titles.

## Structure

[Title] with [X]+ years [core verb phrase] - [signature metric or range], [one differentiator tailored to the JD]

## Rules

- Exactly one sentence, maximum 40 words.
- Include years of experience as a round number with "+".
- The core verb phrase should describe what the candidate does, echoing the target job description's language where natural. Do not force it.
- Include exactly one concrete metric or quantified range from the candidate's accomplishments. Numbers, not adjectives.
- Include one differentiator pulled from the intersection of the candidate's expertise and the target job's stated priorities. Pick the highest-signal match.
- Do not stack more than 3 domain keywords.
- No filler words: "passionate", "results-oriented", "visionary", "innovative", "every stage of growth", "cutting-edge", "world-class".
- Use " - " (space-hyphen-space), never an em dash.
- Do not end with a period.
- Do NOT invent any metric, competency, or achievement not present in the candidate's data.
- Derive the candidate's voice and tone from the About section provided.
- Use a hyphen (-) instead of an em dash (--) anywhere in text.
- Do NOT include markdown, explanations, or code fences - return ONLY the JSON object.`
    };
  }
}
