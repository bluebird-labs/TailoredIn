import { GenerationPromptId } from '../value-objects/GenerationPromptId.js';
import { ValueObjectIdType } from './ValueObjectIdType.js';

export class GenerationPromptIdType extends ValueObjectIdType<GenerationPromptId> {
  public create(value: string) {
    return new GenerationPromptId(value);
  }
}
