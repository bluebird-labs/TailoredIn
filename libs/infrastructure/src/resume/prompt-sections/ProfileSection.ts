import type { PromptBlock } from '@tailoredin/application';
import { PromptSection } from '@tailoredin/application';
import { CacheTier, type GenerationContext } from '@tailoredin/domain';

export class ProfileSection extends PromptSection {
  public readonly name = 'profile';
  public readonly cacheTier = CacheTier.PROFILE_STABLE;

  public render(context: GenerationContext): PromptBlock {
    const { profile } = context;
    const lines = ['## Candidate Profile', '', `Name: ${profile.firstName} ${profile.lastName}`];
    if (profile.location) lines.push(`Location: ${profile.location}`);
    return { cacheTier: this.cacheTier, content: lines.join('\n') };
  }
}
