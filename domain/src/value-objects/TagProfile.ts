export class TagProfile {
  public readonly roleWeights: ReadonlyMap<string, number>;
  public readonly skillWeights: ReadonlyMap<string, number>;

  public constructor(props: {
    roleWeights: Map<string, number>;
    skillWeights: Map<string, number>;
  }) {
    this.roleWeights = new Map(props.roleWeights);
    this.skillWeights = new Map(props.skillWeights);
  }

  public overlapWith(other: TagProfile): number {
    let score = 0;
    for (const [tag, weight] of this.roleWeights) {
      score += weight * (other.roleWeights.get(tag) ?? 0);
    }
    for (const [tag, weight] of this.skillWeights) {
      score += weight * (other.skillWeights.get(tag) ?? 0);
    }
    return score;
  }

  public static empty(): TagProfile {
    return new TagProfile({ roleWeights: new Map(), skillWeights: new Map() });
  }
}
