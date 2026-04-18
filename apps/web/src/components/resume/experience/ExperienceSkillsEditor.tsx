import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { EditableSection } from '@/components/shared/EditableSection.js';
import { InfoCard } from '@/components/shared/InfoCard.js';
import { SkillChip } from '@/components/skill-picker/SkillChip.js';
import { SkillPicker } from '@/components/skill-picker/SkillPicker.js';
import type { Experience } from '@/hooks/use-experiences';
import { type Skill, useSyncExperienceSkills } from '@/hooks/use-skills';

interface ExperienceSkillsEditorProps {
  readonly experience: Experience;
}

function ExperienceSkillsEditor({ experience }: ExperienceSkillsEditorProps) {
  const syncSkills = useSyncExperienceSkills();

  // Local skill state for edit mode — initialized from experience.skills
  const initialSkills: Skill[] = useMemo(() => experience.skills.map(es => es.skill), [experience.skills]);

  const [localSkills, setLocalSkills] = useState<Skill[]>(initialSkills);

  // Re-sync local state when experience data changes (after save + query invalidation)
  const savedSkillIds = useMemo(
    () =>
      experience.skills
        .map(es => es.skillId)
        .sort()
        .join(','),
    [experience.skills]
  );

  // biome-ignore lint/correctness/useExhaustiveDependencies: savedSkillIds is a stable derived string from experience.skills — using it as the dep avoids re-syncing on every render
  useEffect(() => {
    setLocalSkills(experience.skills.map(es => es.skill));
  }, [savedSkillIds]);

  const localSkillIds = localSkills
    .map(s => s.id)
    .sort()
    .join(',');
  const isDirty = localSkillIds !== savedSkillIds;

  function handleSave() {
    syncSkills.mutate(
      {
        experienceId: experience.id,
        skillIds: localSkills.map(s => s.id)
      },
      {
        onSuccess: () => toast.success('Skills updated'),
        onError: () => toast.error('Failed to update skills. Please try again.')
      }
    );
  }

  const handleDiscard = useCallback(() => {
    setLocalSkills(experience.skills.map(es => es.skill));
  }, [experience.skills]);

  return (
    <EditableSection
      variant="card"
      sectionId="experience-skills"
      onSave={handleSave}
      onDiscard={handleDiscard}
      isDirty={isDirty}
      isSaving={syncSkills.isPending}
    >
      <EditableSection.Display>
        <InfoCard label="Skills">
          {experience.skills.length > 0 ? (
            <div className="flex flex-wrap gap-1.5">
              {experience.skills.map(es => (
                <SkillChip key={es.id} label={es.skill.label} />
              ))}
            </div>
          ) : (
            <p className="text-[14px] italic text-muted-foreground">No skills tagged</p>
          )}
        </InfoCard>
      </EditableSection.Display>
      <EditableSection.Editor>
        <SkillPicker
          selectedSkills={localSkills}
          onAdd={skill => setLocalSkills(prev => [...prev, skill])}
          onRemove={skillId => setLocalSkills(prev => prev.filter(s => s.id !== skillId))}
          disabled={syncSkills.isPending}
        />
      </EditableSection.Editor>
    </EditableSection>
  );
}

export { ExperienceSkillsEditor };
