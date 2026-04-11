import type { PromptBlock } from '@tailoredin/application';
import { PromptSection } from '@tailoredin/application';
import { CacheTier, type GenerationContext } from '@tailoredin/domain';

export type BulletParams = {
  readonly existingBullets: string[];
  readonly bulletIndex: number;
  readonly instructions: string;
};

export class BulletParamsSection extends PromptSection {
  public readonly name = 'bullet-params';
  public readonly cacheTier = CacheTier.REQUEST_VARIABLE;

  public constructor(private readonly params?: BulletParams) {
    super();
  }

  public render(_context: GenerationContext): PromptBlock {
    if (!this.params) {
      return { cacheTier: this.cacheTier, content: '' };
    }

    const lines = ['## Bullet Generation Parameters', ''];

    if (this.params.existingBullets.length > 0) {
      lines.push(
        'Existing bullets for this experience (do NOT repeat these):',
        ...this.params.existingBullets.map((b, i) => `${i + 1}. ${b}`),
        ''
      );
    }

    lines.push(`Generate a single new bullet for position ${this.params.bulletIndex + 1}.`);

    if (this.params.instructions) {
      lines.push('', `Specific instructions for this bullet: ${this.params.instructions}`);
    }

    return { cacheTier: this.cacheTier, content: lines.join('\n') };
  }
}
