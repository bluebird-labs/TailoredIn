import { SkillChip } from '@/components/skill-picker/SkillChip';
import type { Skill } from '@/hooks/use-skills';

interface SkillCategoryGroupProps {
  readonly categoryLabel: string;
  readonly skills: Skill[];
}

export function SkillCategoryGroup({ categoryLabel, skills }: SkillCategoryGroupProps) {
  return (
    <div className="mb-5">
      <h3 className="mb-3 text-[15px] font-medium">{categoryLabel}</h3>
      <div className="flex flex-wrap gap-2">
        {skills.map(skill => (
          <SkillChip key={skill.id} label={skill.label} />
        ))}
      </div>
    </div>
  );
}
