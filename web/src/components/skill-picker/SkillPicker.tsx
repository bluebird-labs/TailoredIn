import { Search } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { Input } from '@/components/ui/input';
import { type Skill, useSearchSkills } from '@/hooks/use-skills';
import { cn } from '@/lib/utils';
import { SkillChip } from './SkillChip.js';

interface SkillPickerProps {
  readonly selectedSkills: Skill[];
  readonly onAdd: (skill: Skill) => void;
  readonly onRemove: (skillId: string) => void;
  readonly disabled?: boolean;
}

export function SkillPicker({ selectedSkills, onAdd, onRemove, disabled }: SkillPickerProps) {
  const [inputValue, setInputValue] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Debounce the search query (250ms)
  useEffect(() => {
    const timer = setTimeout(() => setDebouncedQuery(inputValue.trim()), 250);
    return () => clearTimeout(timer);
  }, [inputValue]);

  const { data: searchResults, isLoading } = useSearchSkills(debouncedQuery);

  // Filter out already-selected skills
  const selectedIds = useMemo(() => new Set(selectedSkills.map(s => s.id)), [selectedSkills]);
  const availableResults = useMemo(
    () => (searchResults ?? []).filter(s => !selectedIds.has(s.id)),
    [searchResults, selectedIds]
  );

  // Group results by category
  const groupedResults = useMemo(() => {
    const groups = new Map<string, { label: string; skills: Skill[] }>();
    for (const skill of availableResults) {
      const key = skill.category?.id ?? '__uncategorized__';
      const label = skill.category?.label ?? 'Other';
      if (!groups.has(key)) {
        groups.set(key, { label, skills: [] });
      }
      groups.get(key)!.skills.push(skill);
    }
    return [...groups.values()];
  }, [availableResults]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  function handleSelect(skill: Skill) {
    onAdd(skill);
    setInputValue('');
    setDebouncedQuery('');
    inputRef.current?.focus();
  }

  const showDropdown = isOpen && debouncedQuery.length > 0;

  return (
    <div className="space-y-2">
      {selectedSkills.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedSkills.map(skill => (
            <SkillChip key={skill.id} label={skill.label} onRemove={() => onRemove(skill.id)} disabled={disabled} />
          ))}
        </div>
      )}

      <div ref={containerRef} className="relative">
        <div className="relative">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            ref={inputRef}
            value={inputValue}
            onChange={e => {
              setInputValue(e.target.value);
              setIsOpen(true);
            }}
            onFocus={() => {
              if (inputValue.trim().length > 0) setIsOpen(true);
            }}
            placeholder="Search skills..."
            disabled={disabled}
            className="pl-8"
          />
        </div>

        {showDropdown && (
          <div className="absolute z-50 mt-1 max-h-[240px] w-full overflow-y-auto rounded-lg border bg-popover text-popover-foreground">
            {isLoading ? (
              <div className="px-3 py-4 text-center text-[13px] text-muted-foreground">Searching...</div>
            ) : availableResults.length === 0 ? (
              <div className="px-3 py-4 text-center text-[13px] text-muted-foreground">No skills found</div>
            ) : (
              groupedResults.map(group => (
                <div key={group.label}>
                  <div className="sticky top-0 bg-popover px-3 py-1.5 text-[11px] font-medium tracking-wide text-muted-foreground">
                    {group.label}
                  </div>
                  {group.skills.map(skill => (
                    <button
                      key={skill.id}
                      type="button"
                      className={cn(
                        'w-full px-3 py-1.5 text-left text-[13px] transition-colors',
                        'hover:bg-accent/40 focus-visible:bg-accent/40 focus-visible:outline-none'
                      )}
                      onClick={() => handleSelect(skill)}
                    >
                      {skill.label}
                    </button>
                  ))}
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
