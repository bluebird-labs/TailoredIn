export type SkillItemDto = {
  id: string;
  name: string;
  ordinal: number;
};

export type SkillCategoryDto = {
  id: string;
  name: string;
  ordinal: number;
  items: SkillItemDto[];
};
