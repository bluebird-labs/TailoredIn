import { ValueObject } from '../ValueObject.js';

export class TagSet extends ValueObject<{ roleTags: string[]; skillTags: string[] }> {
  public constructor(props: { roleTags: string[]; skillTags: string[] }) {
    super({ roleTags: [...props.roleTags].sort(), skillTags: [...props.skillTags].sort() });
  }

  public get roleTags(): readonly string[] {
    return this.props.roleTags;
  }

  public get skillTags(): readonly string[] {
    return this.props.skillTags;
  }

  public get isEmpty(): boolean {
    return this.props.roleTags.length === 0 && this.props.skillTags.length === 0;
  }

  public merge(other: TagSet): TagSet {
    const roleTags = [...new Set([...this.props.roleTags, ...other.props.roleTags])];
    const skillTags = [...new Set([...this.props.skillTags, ...other.props.skillTags])];
    return new TagSet({ roleTags, skillTags });
  }

  public static empty(): TagSet {
    return new TagSet({ roleTags: [], skillTags: [] });
  }
}
