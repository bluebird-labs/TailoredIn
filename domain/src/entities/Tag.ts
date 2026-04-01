import { AggregateRoot } from '../AggregateRoot.js';
import { TagId } from '../value-objects/TagId.js';

export enum TagDimension {
  ROLE = 'ROLE',
  SKILL = 'SKILL',
}

export type TagCreateProps = {
  name: string;
  dimension: TagDimension;
};

export class Tag extends AggregateRoot<TagId> {
  public readonly name: string;
  public readonly dimension: TagDimension;
  public readonly createdAt: Date;

  public constructor(props: {
    id: TagId;
    name: string;
    dimension: TagDimension;
    createdAt: Date;
  }) {
    super(props.id);
    this.name = props.name;
    this.dimension = props.dimension;
    this.createdAt = props.createdAt;
  }

  private static normalize(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, '-')
      .replace(/[^a-z0-9-]/g, '');
  }

  public static create(props: TagCreateProps): Tag {
    return new Tag({
      id: TagId.generate(),
      name: Tag.normalize(props.name),
      dimension: props.dimension,
      createdAt: new Date(),
    });
  }
}
