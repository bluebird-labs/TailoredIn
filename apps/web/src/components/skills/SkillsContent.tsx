import type { Skill, SkillCategory } from '@/hooks/use-skills';
import { SkillCategoryGroup } from './SkillCategoryGroup';

interface SkillsContentProps {
  readonly groupedSkills: Map<string, Skill[]>;
  readonly categories: SkillCategory[];
  readonly selectedCategoryId: string | null;
  readonly uncategorizedSkills: Skill[];
}

export function SkillsContent({
  groupedSkills,
  categories,
  selectedCategoryId,
  uncategorizedSkills
}: SkillsContentProps) {
  if (selectedCategoryId !== null) {
    const skills = groupedSkills.get(selectedCategoryId) ?? [];
    const category = categories.find(c => c.id === selectedCategoryId);
    if (!category || skills.length === 0) {
      return <p className="text-sm text-muted-foreground">No skills in this category.</p>;
    }
    return <SkillCategoryGroup categoryLabel={category.label} skills={skills} />;
  }

  const visibleCategories = categories.filter(c => (groupedSkills.get(c.id)?.length ?? 0) > 0);

  return (
    <>
      {visibleCategories.map(category => (
        <SkillCategoryGroup key={category.id} categoryLabel={category.label} skills={groupedSkills.get(category.id)!} />
      ))}
      {uncategorizedSkills.length > 0 && <SkillCategoryGroup categoryLabel="Other" skills={uncategorizedSkills} />}
    </>
  );
}
