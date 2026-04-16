import type { SkillCategory } from '@/hooks/use-skills';
import { cn } from '@/lib/utils';

interface SkillCategorySidebarProps {
  readonly categories: SkillCategory[];
  readonly countByCategory: Map<string | null, number>;
  readonly totalCount: number;
  readonly selectedCategoryId: string | null;
  readonly onSelectCategory: (categoryId: string | null) => void;
  readonly hasSearchQuery: boolean;
}

export function SkillCategorySidebar({
  categories,
  countByCategory,
  totalCount,
  selectedCategoryId,
  onSelectCategory,
  hasSearchQuery
}: SkillCategorySidebarProps) {
  return (
    <nav className="w-56 shrink-0 border-r py-3">
      <button
        type="button"
        onClick={() => onSelectCategory(null)}
        className={cn(
          'flex w-full items-center justify-between px-4 py-1.5 text-left text-sm',
          selectedCategoryId === null ? 'border-l-2 border-foreground bg-accent font-medium' : 'text-muted-foreground'
        )}
      >
        <span>All</span>
        <span className="text-xs text-muted-foreground">{totalCount}</span>
      </button>
      {categories.map(category => {
        const count = countByCategory.get(category.id) ?? 0;
        if (hasSearchQuery && count === 0) return null;
        return (
          <button
            key={category.id}
            type="button"
            onClick={() => onSelectCategory(category.id)}
            className={cn(
              'flex w-full items-center justify-between px-4 py-1.5 text-left text-sm',
              selectedCategoryId === category.id
                ? 'border-l-2 border-foreground bg-accent font-medium'
                : 'text-muted-foreground'
            )}
          >
            <span>{category.label}</span>
            <span className="text-xs text-muted-foreground">{count}</span>
          </button>
        );
      })}
    </nav>
  );
}
