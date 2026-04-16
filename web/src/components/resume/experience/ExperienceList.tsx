import { useNavigate } from '@tanstack/react-router';
import { Plus } from 'lucide-react';
import { useState } from 'react';
import { EmptyState } from '@/components/shared/EmptyState.js';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton.js';
import { Button } from '@/components/ui/button';
import { type Experience, useExperiences } from '@/hooks/use-experiences';
import { ExperienceCard } from './ExperienceCard.js';
import { ExperienceFormModal } from './ExperienceFormModal.js';

type ModalState = { mode: 'closed' } | { mode: 'create' };

export function ExperienceList() {
  const navigate = useNavigate();
  const { data: experiences = [], isLoading } = useExperiences();
  const [modalState, setModalState] = useState<ModalState>({ mode: 'closed' });

  if (isLoading) return <LoadingSkeleton variant="list" count={3} />;

  const modalOpen = modalState.mode !== 'closed';

  return (
    <>
      {experiences.length === 0 && !modalOpen ? (
        <EmptyState
          message="No experiences yet."
          actionLabel="Add experience"
          onAction={() => setModalState({ mode: 'create' })}
        />
      ) : (
        <div className="space-y-3">
          {(experiences as Experience[]).map(exp => (
            <ExperienceCard key={exp.id} experience={exp} />
          ))}

          <Button
            variant="outline"
            size="sm"
            className="w-full border-dashed"
            onClick={() => setModalState({ mode: 'create' })}
          >
            <Plus className="h-3 w-3 mr-1" />
            Add experience
          </Button>
        </div>
      )}

      {modalState.mode === 'create' && (
        <ExperienceFormModal
          open
          onOpenChange={next => {
            if (!next) setModalState({ mode: 'closed' });
          }}
          modalMode={{ mode: 'create', experienceCount: experiences.length }}
          onCreated={exp => navigate({ to: '/experiences/$experienceId', params: { experienceId: exp.id } })}
        />
      )}
    </>
  );
}
