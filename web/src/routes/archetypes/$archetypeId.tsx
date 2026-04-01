import { createFileRoute, Link } from '@tanstack/react-router';
import { ArrowLeft } from 'lucide-react';
import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import {
  useArchetypes,
  useSetArchetypeContent,
  useSetArchetypeTagProfile,
  useUpdateArchetype
} from '@/hooks/use-archetypes';
import { useEducations } from '@/hooks/use-education';
import { useExperiences } from '@/hooks/use-experiences';
import { useHeadlines } from '@/hooks/use-headlines';
import { useSkillCategories } from '@/hooks/use-skills';
import { useTags } from '@/hooks/use-tags';

export const Route = createFileRoute('/archetypes/$archetypeId')({
  component: ArchetypeDetailPage
});

type Archetype = {
  id: string;
  key: string;
  label: string;
  headlineId: string | null;
  tagProfile: { roleWeights: Record<string, number>; skillWeights: Record<string, number> };
  contentSelection: {
    experienceSelections: { experienceId: string; bulletVariantIds: string[] }[];
    projectIds: string[];
    educationIds: string[];
    skillCategoryIds: string[];
    skillItemIds: string[];
  };
};

function ArchetypeDetailPage() {
  const { archetypeId } = Route.useParams();

  const { data: archetypes = [], isLoading } = useArchetypes();
  const archetype = (archetypes as Archetype[]).find(a => a.id === archetypeId);

  if (isLoading) {
    return (
      <div className="space-y-6 max-w-4xl">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="h-48 w-full rounded-xl" />
      </div>
    );
  }

  if (!archetype) {
    return (
      <div className="space-y-4">
        <Link
          to="/archetypes"
          className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to archetypes
        </Link>
        <p className="text-muted-foreground">Archetype not found.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <Link
        to="/archetypes"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to archetypes
      </Link>

      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-bold">{archetype.label}</h1>
        <Badge variant="secondary">{archetype.key}</Badge>
      </div>

      <MetadataSection archetype={archetype} />
      <TagProfileSection archetype={archetype} />
      <ContentSelectionSection archetype={archetype} />
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Metadata Section                                                  */
/* ------------------------------------------------------------------ */

function MetadataSection({ archetype }: { archetype: Archetype }) {
  const { data: headlines = [] } = useHeadlines();
  const updateArchetype = useUpdateArchetype();

  const [key, setKey] = useState(archetype.key);
  const [label, setLabel] = useState(archetype.label);
  const [headlineId, setHeadlineId] = useState<string | null>(archetype.headlineId);

  useEffect(() => {
    setKey(archetype.key);
    setLabel(archetype.label);
    setHeadlineId(archetype.headlineId);
  }, [archetype.key, archetype.label, archetype.headlineId]);

  const headlineOptions = headlines as { id: string; label: string }[];
  const NoneValue = '__none__';

  function handleSave() {
    updateArchetype.mutate({
      id: archetype.id,
      key,
      label,
      headline_id: headlineId
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Metadata</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="archetype-key">Key</Label>
            <Input id="archetype-key" value={key} onChange={e => setKey(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="archetype-label">Label</Label>
            <Input id="archetype-label" value={label} onChange={e => setLabel(e.target.value)} />
          </div>
        </div>

        <div className="space-y-1.5">
          <Label>Headline</Label>
          <Select value={headlineId ?? NoneValue} onValueChange={v => setHeadlineId(v === NoneValue ? null : v)}>
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={NoneValue}>None</SelectItem>
              {headlineOptions.map(h => (
                <SelectItem key={h.id} value={h.id}>
                  {h.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button onClick={handleSave} disabled={updateArchetype.isPending}>
          {updateArchetype.isPending ? 'Saving...' : 'Save metadata'}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Tag Profile Section                                               */
/* ------------------------------------------------------------------ */

function TagProfileSection({ archetype }: { archetype: Archetype }) {
  const { data: roleTags = [] } = useTags('ROLE');
  const { data: skillTags = [] } = useTags('SKILL');
  const setTagProfile = useSetArchetypeTagProfile();

  type Tag = { id: string; name: string; dimension: string };

  const [roleWeights, setRoleWeights] = useState<Record<string, number>>(archetype.tagProfile.roleWeights);
  const [skillWeights, setSkillWeights] = useState<Record<string, number>>(archetype.tagProfile.skillWeights);

  useEffect(() => {
    setRoleWeights(archetype.tagProfile.roleWeights);
    setSkillWeights(archetype.tagProfile.skillWeights);
  }, [archetype.tagProfile.roleWeights, archetype.tagProfile.skillWeights]);

  function handleSave() {
    const filteredRole: Record<string, number> = {};
    for (const [k, v] of Object.entries(roleWeights)) {
      if (v > 0) filteredRole[k] = v;
    }
    const filteredSkill: Record<string, number> = {};
    for (const [k, v] of Object.entries(skillWeights)) {
      if (v > 0) filteredSkill[k] = v;
    }
    setTagProfile.mutate({
      id: archetype.id,
      role_weights: filteredRole,
      skill_weights: filteredSkill
    });
  }

  function renderTagWeights(
    tags: Tag[],
    weights: Record<string, number>,
    onChange: (tagId: string, value: number) => void
  ) {
    return (
      <div className="grid grid-cols-2 gap-x-6 gap-y-2">
        {(tags as Tag[]).map(tag => (
          <div key={tag.id} className="flex items-center gap-2">
            <Label className="min-w-32 text-sm">{tag.name}</Label>
            <Input
              type="number"
              step={0.1}
              min={0}
              max={1}
              className="w-20"
              value={weights[tag.id] ?? 0}
              onChange={e => onChange(tag.id, Number.parseFloat(e.target.value) || 0)}
            />
          </div>
        ))}
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Tag Profile</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Role Tag Weights</h3>
          {renderTagWeights(roleTags as Tag[], roleWeights, (id, v) => setRoleWeights(prev => ({ ...prev, [id]: v })))}
        </div>

        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Skill Tag Weights</h3>
          {renderTagWeights(skillTags as Tag[], skillWeights, (id, v) =>
            setSkillWeights(prev => ({ ...prev, [id]: v }))
          )}
        </div>

        <Button onClick={handleSave} disabled={setTagProfile.isPending}>
          {setTagProfile.isPending ? 'Saving...' : 'Save tag profile'}
        </Button>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Content Selection Section                                         */
/* ------------------------------------------------------------------ */

type Experience = {
  id: string;
  title: string;
  companyName: string;
  startDate: string;
  endDate: string;
  bullets: {
    id: string;
    content: string;
    variants: { id: string; text: string; angle: string; approvalStatus: string }[];
  }[];
};

type EducationEntry = {
  id: string;
  degreeTitle: string;
  institutionName: string;
};

type SkillCategory = {
  id: string;
  name: string;
  ordinal: number;
  items: { id: string; name: string; ordinal: number }[];
};

type ExperienceSelection = { experienceId: string; bulletVariantIds: string[] };

function ContentSelectionSection({ archetype }: { archetype: Archetype }) {
  const { data: experiences = [] } = useExperiences();
  const { data: educations = [] } = useEducations();
  const { data: skillCategories = [] } = useSkillCategories();
  const setContent = useSetArchetypeContent();

  const [expSelections, setExpSelections] = useState<ExperienceSelection[]>(
    archetype.contentSelection.experienceSelections
  );
  const [educationIds, setEducationIds] = useState<string[]>(archetype.contentSelection.educationIds);
  const [skillCategoryIds, setSkillCategoryIds] = useState<string[]>(archetype.contentSelection.skillCategoryIds);
  const [skillItemIds, setSkillItemIds] = useState<string[]>(archetype.contentSelection.skillItemIds);

  useEffect(() => {
    setExpSelections(archetype.contentSelection.experienceSelections);
    setEducationIds(archetype.contentSelection.educationIds);
    setSkillCategoryIds(archetype.contentSelection.skillCategoryIds);
    setSkillItemIds(archetype.contentSelection.skillItemIds);
  }, [archetype.contentSelection]);

  /* -- Experience helpers -- */

  function isExperienceSelected(expId: string) {
    return expSelections.some(s => s.experienceId === expId);
  }

  function toggleExperience(expId: string) {
    if (isExperienceSelected(expId)) {
      setExpSelections(prev => prev.filter(s => s.experienceId !== expId));
    } else {
      setExpSelections(prev => [...prev, { experienceId: expId, bulletVariantIds: [] }]);
    }
  }

  function isVariantSelected(expId: string, variantId: string) {
    const sel = expSelections.find(s => s.experienceId === expId);
    return sel?.bulletVariantIds.includes(variantId) ?? false;
  }

  function toggleVariant(expId: string, variantId: string) {
    setExpSelections(prev =>
      prev.map(s => {
        if (s.experienceId !== expId) return s;
        const has = s.bulletVariantIds.includes(variantId);
        return {
          ...s,
          bulletVariantIds: has ? s.bulletVariantIds.filter(id => id !== variantId) : [...s.bulletVariantIds, variantId]
        };
      })
    );
  }

  /* -- Education helpers -- */

  function toggleEducation(id: string) {
    setEducationIds(prev => (prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]));
  }

  /* -- Skill helpers -- */

  function toggleSkillCategory(id: string) {
    setSkillCategoryIds(prev => (prev.includes(id) ? prev.filter(c => c !== id) : [...prev, id]));
  }

  function toggleSkillItem(id: string) {
    setSkillItemIds(prev => (prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]));
  }

  /* -- Save -- */

  function handleSave() {
    setContent.mutate({
      id: archetype.id,
      experience_selections: expSelections.map(s => ({
        experience_id: s.experienceId,
        bullet_variant_ids: s.bulletVariantIds
      })),
      education_ids: educationIds,
      skill_category_ids: skillCategoryIds,
      skill_item_ids: skillItemIds
    });
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Content Selection</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Experiences */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Experiences</h3>
          <div className="space-y-3">
            {(experiences as Experience[]).map(exp => (
              <div key={exp.id} className="space-y-2">
                <div className="flex items-center gap-2">
                  <Checkbox checked={isExperienceSelected(exp.id)} onCheckedChange={() => toggleExperience(exp.id)} />
                  <span className="text-sm font-medium">
                    {exp.title} at {exp.companyName}
                  </span>
                </div>

                {isExperienceSelected(exp.id) && (
                  <div className="ml-6 space-y-2">
                    {exp.bullets.map(bullet => (
                      <div key={bullet.id} className="space-y-1">
                        <p className="text-xs text-muted-foreground">{bullet.content}</p>
                        <div className="ml-4 space-y-1">
                          {bullet.variants.map(variant => (
                            <div key={variant.id} className="flex items-center gap-2">
                              <Checkbox
                                checked={isVariantSelected(exp.id, variant.id)}
                                onCheckedChange={() => toggleVariant(exp.id, variant.id)}
                              />
                              <span className="text-xs">
                                {variant.text} ({variant.angle})
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Education */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Education</h3>
          <div className="space-y-2">
            {(educations as EducationEntry[]).map(edu => (
              <div key={edu.id} className="flex items-center gap-2">
                <Checkbox checked={educationIds.includes(edu.id)} onCheckedChange={() => toggleEducation(edu.id)} />
                <span className="text-sm">
                  {edu.degreeTitle} — {edu.institutionName}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Skills */}
        <div className="space-y-3">
          <h3 className="text-sm font-medium text-muted-foreground">Skills</h3>
          <div className="space-y-3">
            {(skillCategories as SkillCategory[]).map(cat => (
              <div key={cat.id} className="space-y-1">
                <div className="flex items-center gap-2">
                  <Checkbox
                    checked={skillCategoryIds.includes(cat.id)}
                    onCheckedChange={() => toggleSkillCategory(cat.id)}
                  />
                  <span className="text-sm font-medium">{cat.name}</span>
                </div>
                <div className="ml-6 space-y-1">
                  {cat.items.map(item => (
                    <div key={item.id} className="flex items-center gap-2">
                      <Checkbox
                        checked={skillItemIds.includes(item.id)}
                        onCheckedChange={() => toggleSkillItem(item.id)}
                      />
                      <span className="text-xs">{item.name}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <Button onClick={handleSave} disabled={setContent.isPending}>
          {setContent.isPending ? 'Saving...' : 'Save content selection'}
        </Button>
      </CardContent>
    </Card>
  );
}
