import { CompanyId } from '../value-objects/CompanyId.js';
import { ValueObjectIdType } from './ValueObjectIdType.js';

export class CompanyIdType extends ValueObjectIdType<CompanyId> {
  public create(value: string) {
    return new CompanyId(value);
  }
}
