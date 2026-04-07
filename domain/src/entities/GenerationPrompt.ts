import { Entity } from '../Entity.js';
import { GenerationPromptId } from '../value-objects/GenerationPromptId.js';
import type { GenerationScope } from '../value-objects/GenerationScope.js';

export type GenerationPromptCreateProps = {
  scope: GenerationScope;
  content: string;
};

export class GenerationPrompt extends Entity<GenerationPromptId> {
  public readonly scope: GenerationScope;
  public content: string;
  public readonly createdAt: Date;
  public updatedAt: Date;

  public constructor(props: {
    id: GenerationPromptId;
    scope: GenerationScope;
    content: string;
    createdAt: Date;
    updatedAt: Date;
  }) {
    super(props.id);
    this.scope = props.scope;
    this.content = props.content;
    this.createdAt = props.createdAt;
    this.updatedAt = props.updatedAt;
  }

  public updateContent(content: string): void {
    this.content = content;
    this.updatedAt = new Date();
  }

  public static create(props: GenerationPromptCreateProps): GenerationPrompt {
    const now = new Date();
    return new GenerationPrompt({
      id: GenerationPromptId.generate(),
      ...props,
      createdAt: now,
      updatedAt: now
    });
  }
}
