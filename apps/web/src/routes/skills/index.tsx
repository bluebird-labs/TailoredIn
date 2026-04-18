import { createFileRoute } from '@tanstack/react-router';
import { Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { SkillCategorySidebar } from '@/components/skills/SkillCategorySidebar';
import { SkillsContent } from '@/components/skills/SkillsContent';
import { Input } from '@/components/ui/input';
import { useAllSkills, useSkillCategories } from '@/hooks/use-skills';

export const Route = createFileRoute('/skills/')({
  component: SkillsPage
});

function SkillsPage() {
  const { data: allSkills = [], isLoading: skillsLoading } = useAllSkills();
  const { data: categories = [], isLoading: categoriesLoading } = useSkillCategories();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);

  const filteredSkills = useMemo(() => {
    if (!searchQuery.trim()) return allSkills;
    const q = searchQuery.toLowerCase();
    return allSkills.filter(s => s.label.toLowerCase().includes(q));
  }, [allSkills, searchQuery]);

  const { groupedSkills, uncategorizedSkills, countByCategory } = useMemo(() => {
    const grouped = new Map<string, typeof filteredSkills>();
    const uncategorized: typeof filteredSkills = [];
    const counts = new Map<string | null, number>();

    for (const skill of filteredSkills) {
      if (skill.categoryId) {
        const existing = grouped.get(skill.categoryId);
        if (existing) {
          existing.push(skill);
        } else {
          grouped.set(skill.categoryId, [skill]);
        }
        counts.set(skill.categoryId, (counts.get(skill.categoryId) ?? 0) + 1);
      } else {
        uncategorized.push(skill);
      }
    }

    return { groupedSkills: grouped, uncategorizedSkills: uncategorized, countByCategory: counts };
  }, [filteredSkills]);

  const isLoading = skillsLoading || categoriesLoading;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="page-heading">Skills</h1>
        <p className="text-sm text-muted-foreground">Browse the skills taxonomy across all categories.</p>
      </div>
      <div className="relative">
        <Search className="absolute left-2.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          placeholder="Search skills across all categories..."
          value={searchQuery}
          onChange={e => setSearchQuery(e.target.value)}
          className="pl-9"
        />
      </div>
      {isLoading ? (
        <p className="text-sm text-muted-foreground">Loading skills...</p>
      ) : (
        <div className="flex min-h-[400px] rounded-lg border">
          <SkillCategorySidebar
            categories={categories}
            countByCategory={countByCategory}
            totalCount={filteredSkills.length}
            selectedCategoryId={selectedCategoryId}
            onSelectCategory={setSelectedCategoryId}
            hasSearchQuery={searchQuery.trim().length > 0}
          />
          <div className="flex-1 overflow-y-auto p-6">
            <SkillsContent
              groupedSkills={groupedSkills}
              categories={categories}
              selectedCategoryId={selectedCategoryId}
              uncategorizedSkills={uncategorizedSkills}
            />
          </div>
        </div>
      )}
    </div>
  );
}
