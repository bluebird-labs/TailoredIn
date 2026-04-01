import { arrayMove } from '@dnd-kit/sortable';
import { Save } from 'lucide-react';
import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { SortableItem, SortableList } from '@/components/shared/sortable-list';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import { useSetArchetypeSkills } from '@/hooks/use-archetypes';

type SkillCategory = {
  id: string;
  name: string;
  ordinal: number;
  items: { id: string; name: string; ordinal: number }[];
};

type CategorySelection = { categoryId: string; ordinal: number };
type ItemSelection = { itemId: string; ordinal: number };

type SkillsSectionProps = {
  archetypeId: string;
  categorySelections: CategorySelection[];
  itemSelections: ItemSelection[];
  allCategories: SkillCategory[];
};

export function SkillsSection({ archetypeId, categorySelections, itemSelections, allCategories }: SkillsSectionProps) {
  const [selectedCats, setSelectedCats] = useState<CategorySelection[]>([]);
  const [selectedItems, setSelectedItems] = useState<ItemSelection[]>([]);
  const setSkills = useSetArchetypeSkills();

  useEffect(() => {
    setSelectedCats([...categorySelections].sort((a, b) => a.ordinal - b.ordinal));
    setSelectedItems([...itemSelections].sort((a, b) => a.ordinal - b.ordinal));
  }, [categorySelections, itemSelections]);

  const isDirty =
    JSON.stringify(selectedCats) !== JSON.stringify([...categorySelections].sort((a, b) => a.ordinal - b.ordinal)) ||
    JSON.stringify(selectedItems) !== JSON.stringify([...itemSelections].sort((a, b) => a.ordinal - b.ordinal));

  function isCategoryChecked(categoryId: string) {
    return selectedCats.some(s => s.categoryId === categoryId);
  }

  function isItemChecked(itemId: string) {
    return selectedItems.some(s => s.itemId === itemId);
  }

  function toggleCategory(categoryId: string) {
    if (isCategoryChecked(categoryId)) {
      setSelectedCats(prev => {
        const filtered = prev.filter(s => s.categoryId !== categoryId);
        return filtered.map((s, i) => ({ ...s, ordinal: i }));
      });
      // Also remove all items from this category
      const category = allCategories.find(c => c.id === categoryId);
      if (category) {
        const itemIds = new Set(category.items.map(i => i.id));
        setSelectedItems(prev => {
          const filtered = prev.filter(s => !itemIds.has(s.itemId));
          return filtered.map((s, i) => ({ ...s, ordinal: i }));
        });
      }
    } else {
      setSelectedCats(prev => [...prev, { categoryId, ordinal: prev.length }]);
    }
  }

  function toggleItem(itemId: string) {
    if (isItemChecked(itemId)) {
      setSelectedItems(prev => {
        const filtered = prev.filter(s => s.itemId !== itemId);
        return filtered.map((s, i) => ({ ...s, ordinal: i }));
      });
    } else {
      setSelectedItems(prev => [...prev, { itemId, ordinal: prev.length }]);
    }
  }

  function handleReorderCategories(activeId: string, overId: string) {
    setSelectedCats(prev => {
      const oldIndex = prev.findIndex(s => s.categoryId === activeId);
      const newIndex = prev.findIndex(s => s.categoryId === overId);
      const reordered = arrayMove(prev, oldIndex, newIndex);
      return reordered.map((s, i) => ({ ...s, ordinal: i }));
    });
  }

  function handleSave() {
    setSkills.mutate(
      {
        id: archetypeId,
        category_selections: selectedCats.map(s => ({ category_id: s.categoryId, ordinal: s.ordinal })),
        item_selections: selectedItems.map(s => ({ item_id: s.itemId, ordinal: s.ordinal }))
      },
      {
        onSuccess: () => toast.success('Skill selections saved'),
        onError: () => toast.error('Failed to save skill selections')
      }
    );
  }

  const sortedCategories = [...allCategories].sort((a, b) => a.ordinal - b.ordinal);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Skills</CardTitle>
        {isDirty && (
          <Button size="sm" onClick={handleSave} disabled={setSkills.isPending}>
            <Save className="mr-1 h-4 w-4" />
            {setSkills.isPending ? 'Saving...' : 'Save Skills'}
          </Button>
        )}
      </CardHeader>
      <CardContent className="space-y-4">
        {sortedCategories.length === 0 ? (
          <p className="text-sm text-muted-foreground">No skill categories found. Add some in the Skills page first.</p>
        ) : (
          <>
            <p className="text-sm text-muted-foreground">Select skill categories and items to include.</p>
            <div className="space-y-4">
              {sortedCategories.map(category => {
                const catChecked = isCategoryChecked(category.id);
                const sortedItems = [...category.items].sort((a, b) => a.ordinal - b.ordinal);

                return (
                  <div key={category.id} className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Checkbox checked={catChecked} onCheckedChange={() => toggleCategory(category.id)} />
                      <Label className="font-medium cursor-pointer" onClick={() => toggleCategory(category.id)}>
                        {category.name}
                      </Label>
                    </div>
                    {catChecked && sortedItems.length > 0 && (
                      <div className="ml-6 space-y-1">
                        {sortedItems.map(item => (
                          <div key={item.id} className="flex items-center gap-2">
                            <Checkbox checked={isItemChecked(item.id)} onCheckedChange={() => toggleItem(item.id)} />
                            <Label className="font-normal cursor-pointer" onClick={() => toggleItem(item.id)}>
                              {item.name}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {selectedCats.length > 1 && (
              <>
                <p className="text-sm text-muted-foreground mt-4">Drag to reorder selected categories:</p>
                <SortableList items={selectedCats.map(s => ({ id: s.categoryId }))} onReorder={handleReorderCategories}>
                  <div className="flex flex-col gap-1">
                    {selectedCats.map(sel => {
                      const cat = allCategories.find(c => c.id === sel.categoryId);
                      if (!cat) return null;
                      return (
                        <SortableItem key={sel.categoryId} id={sel.categoryId}>
                          <span className="text-sm">{cat.name}</span>
                        </SortableItem>
                      );
                    })}
                  </div>
                </SortableList>
              </>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
