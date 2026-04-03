import { useState } from 'react';
import { ChevronDown, ChevronRight, Plus } from 'lucide-react';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useExperiences } from '@/hooks/use-experiences';
import { useAddAccomplishment } from '@/hooks/use-accomplishments';
import { api } from '@/lib/api';
import { queryKeys } from '@/lib/query-keys';
import { AccomplishmentEditor } from './AccomplishmentEditor.js';
type AccomplishmentDto = {
  id: string;
  title: string;
  narrative: string;
  skillTags: string[];
  ordinal: number;
};

type Experience = {
  id: string;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  location: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  narrative: string | null;
  ordinal: number;
  accomplishments: AccomplishmentDto[];
};

export function ExperienceTab() {
  const { data: experiences = [], isLoading } = useExperiences();
  const [expandedId, setExpandedId] = useState<string | null>(null);

  if (isLoading) return <div className="text-sm text-muted-foreground">Loading...</div>;

  return (
    <div className="space-y-3">
      {(experiences as Experience[]).map(exp => (
        <ExperienceCard
          key={exp.id}
          experience={exp}
          expanded={expandedId === exp.id}
          onToggle={() => setExpandedId(expandedId === exp.id ? null : exp.id)}
        />
      ))}
    </div>
  );
}

function ExperienceCard({
  experience,
  expanded,
  onToggle
}: {
  experience: Experience;
  expanded: boolean;
  onToggle: () => void;
}) {
  const queryClient = useQueryClient();
  const [narrative, setNarrative] = useState(experience.narrative ?? '');
  const addAccomplishment = useAddAccomplishment(experience.id);

  async function saveNarrative() {
    // biome-ignore lint/suspicious/noExplicitAny: Eden Treaty merges inconsistent route param names causing union type conflicts
    const segment = api.experiences({ id: experience.id, experienceId: experience.id } as any) as any;
    await segment.put({
      title: experience.title,
      company_name: experience.companyName,
      company_website: experience.companyWebsite ?? undefined,
      location: experience.location,
      start_date: experience.startDate,
      end_date: experience.endDate,
      summary: experience.summary ?? undefined,
      narrative: narrative,
      ordinal: experience.ordinal
    });
    queryClient.invalidateQueries({ queryKey: queryKeys.experiences.list() });
    toast.success('Narrative saved');
  }

  function handleAddAccomplishment() {
    addAccomplishment.mutate(
      { title: '', narrative: '', skill_tags: [], ordinal: experience.accomplishments.length },
      {
        onError: () => toast.error('Failed to add accomplishment')
      }
    );
  }

  return (
    <div className="border rounded-lg">
      <button
        type="button"
        className="w-full flex items-center justify-between px-4 py-3 hover:bg-muted/30 transition-colors text-left"
        onClick={onToggle}
      >
        <div>
          <span className="font-semibold">{experience.companyName}</span>
          <span className="text-muted-foreground text-sm ml-2">· {experience.title}</span>
        </div>
        <div className="flex items-center gap-2 text-muted-foreground text-xs">
          <span>{experience.accomplishments.length} accomplishments</span>
          {expanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </div>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-4 border-t pt-4">
          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Role Narrative</p>
            <textarea
              value={narrative}
              onChange={e => setNarrative(e.target.value)}
              onBlur={saveNarrative}
              className="w-full text-sm min-h-20 resize-none rounded-md border border-input bg-transparent px-3 py-2 text-base shadow-sm placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
              placeholder="Overall context for this role — scope, team, why it mattered..."
            />
          </div>

          <div>
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Accomplishments</p>
            <div className="space-y-2">
              {experience.accomplishments.map(acc => (
                <AccomplishmentEditor key={acc.id} experienceId={experience.id} accomplishment={acc} />
              ))}
              <Button
                variant="outline"
                size="sm"
                className="w-full border-dashed"
                onClick={handleAddAccomplishment}
                disabled={addAccomplishment.isPending}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add accomplishment
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
