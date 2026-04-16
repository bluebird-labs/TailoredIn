import { Entity, PrimaryKey, Property } from '@mikro-orm/decorators/es';
import { Entity as DomainEntity } from '../Entity.js';

export type ConceptDependencyCreateProps = {
  skillId: string;
  conceptId: string;
};

@Entity({ tableName: 'concept_dependencies' })
export class ConceptDependency extends DomainEntity {
  @PrimaryKey({ type: 'uuid', fieldName: 'id' })
  public readonly id!: string;

  @Property({ fieldName: 'skill_id', type: 'uuid' })
  public readonly skillId: string;

  @Property({ fieldName: 'concept_id', type: 'uuid' })
  public readonly conceptId: string;

  @Property({ fieldName: 'created_at', type: 'timestamp(3)', defaultRaw: 'CURRENT_TIMESTAMP' })
  public readonly createdAt: Date;

  public constructor(props: { id: string; skillId: string; conceptId: string; createdAt: Date }) {
    super();
    this.id = props.id;
    this.skillId = props.skillId;
    this.conceptId = props.conceptId;
    this.createdAt = props.createdAt;
  }

  public static create(props: ConceptDependencyCreateProps): ConceptDependency {
    return new ConceptDependency({
      id: crypto.randomUUID(),
      ...props,
      createdAt: new Date()
    });
  }
}
