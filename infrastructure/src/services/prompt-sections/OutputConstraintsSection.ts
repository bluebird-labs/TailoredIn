import type { PromptBlock } from '@tailoredin/application';
import { PromptSection } from '@tailoredin/application';
import { CacheTier, type GenerationContext, ResumeConstraints } from '@tailoredin/domain';

export class OutputConstraintsSection extends PromptSection {
  public readonly name = 'output-constraints';
  public readonly cacheTier = CacheTier.SYSTEM_STABLE;

  public render(_context: GenerationContext): PromptBlock {
    return {
      cacheTier: this.cacheTier,
      content: `## Length Constraints

- **Headline:** ${ResumeConstraints.HEADLINE_MIN_LENGTH}-${ResumeConstraints.HEADLINE_MAX_LENGTH} characters. This is a hard system limit.
- **Summary:** ${ResumeConstraints.SUMMARY_MIN_LENGTH}-${ResumeConstraints.SUMMARY_MAX_LENGTH} characters per experience. Must end with a period.
- **Bullet:** ${ResumeConstraints.BULLET_MIN_LENGTH}-${ResumeConstraints.BULLET_MAX_LENGTH} characters per bullet. This is a hard system limit - bullets outside this range will be rejected.

## Counting Hint

Before finalizing each field, mentally count its characters. Reference strings at boundary lengths:
- Bullet at ~${ResumeConstraints.BULLET_MIN_LENGTH} chars: "Led migration of the core payment systems from legacy monolith to microservices."
- Bullet at ~${ResumeConstraints.BULLET_MAX_LENGTH} chars: "Led the end-to-end migration of the core payment processing system from a legacy monolithic architecture to event-driven microservices, reducing latency by 40%."
- Headline at ~${ResumeConstraints.HEADLINE_MIN_LENGTH} chars: "Senior Engineering Leader with 15+ years building high-performance distributed systems across fintech and e-commerce, leading teams of 50+ engineers."

Return ONLY a valid JSON object matching the required schema.`
    };
  }
}
