export type ExperienceSelection = {
  experienceId: string;
  bulletVariantIds: string[];
};

export class ContentSelection {
  public readonly experienceSelections: ExperienceSelection[];
  public readonly projectIds: string[];
  public readonly educationIds: string[];
  public readonly skillCategoryIds: string[];
  public readonly skillItemIds: string[];

  public constructor(props: {
    experienceSelections: ExperienceSelection[];
    projectIds: string[];
    educationIds: string[];
    skillCategoryIds: string[];
    skillItemIds: string[];
  }) {
    this.experienceSelections = props.experienceSelections;
    this.projectIds = props.projectIds;
    this.educationIds = props.educationIds;
    this.skillCategoryIds = props.skillCategoryIds;
    this.skillItemIds = props.skillItemIds;
  }

  public static empty(): ContentSelection {
    return new ContentSelection({
      experienceSelections: [],
      projectIds: [],
      educationIds: [],
      skillCategoryIds: [],
      skillItemIds: []
    });
  }
}
