import { ResumeContentId } from '../value-objects/ResumeContentId.js';
import { ValueObjectIdType } from './ValueObjectIdType.js';

export class ResumeContentIdType extends ValueObjectIdType<ResumeContentId> {
  public create(value: string) {
    return new ResumeContentId(value);
  }
}
