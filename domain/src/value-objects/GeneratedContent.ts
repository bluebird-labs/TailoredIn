export type GeneratedExperience = {
  experienceId: string;
  bulletTexts: string[];
};

export class GeneratedContent {
  public readonly experiences: GeneratedExperience[];

  public constructor(experiences: GeneratedExperience[]) {
    this.experiences = experiences;
  }

  public isEmpty(): boolean {
    return this.experiences.length === 0;
  }

  public static empty(): GeneratedContent {
    return new GeneratedContent([]);
  }
}
