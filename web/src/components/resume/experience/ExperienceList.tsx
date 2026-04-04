import { Plus } from 'lucide-react';
import { useCallback, useState } from 'react';
import { EmptyState } from '@/components/shared/EmptyState.js';
import { LoadingSkeleton } from '@/components/shared/LoadingSkeleton.js';
import { Button } from '@/components/ui/button';
import { type Experience, useExperiences } from '@/hooks/use-experiences';
import { ExperienceCard } from './ExperienceCard.js';
import { ExperienceFormModal } from './ExperienceFormModal.js';

type ModalState = { mode: 'closed' } | { mode: 'create' } | { mode: 'edit'; experienceId: string };

export function ExperienceList() {
  const { data: experiences = [], isLoading } = useExperiences();
  const [modalState, setModalState] = useState<ModalState>({ mode: 'closed' });

  const handleAccomplishmentDirtyChange = useCallback((_id: string, _isDirty: boolean) => {
    // Accomplishment dirty state is tracked within the modal's own context
  }, []);

  if (isLoading) return <LoadingSkeleton variant="list" count={3} />;

  const modalOpen = modalState.mode !== 'closed';

  // Resolve the live experience from query data so the modal always has fresh data
  const editingExperience =
    modalState.mode === 'edit' ? (experiences as Experience[]).find(e => e.id === modalState.experienceId) : undefined;

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
            <ExperienceCard
              key={exp.id}
              experience={exp}
              onEdit={() => setModalState({ mode: 'edit', experienceId: exp.id })}
            />
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

      {modalState.mode !== 'closed' && editingExperience !== null && (
        <ExperienceFormModal
          open={modalOpen}
          onOpenChange={next => {
            if (!next) setModalState({ mode: 'closed' });
          }}
          modalMode={
            modalState.mode === 'create'
              ? { mode: 'create', experienceCount: experiences.length }
              : { mode: 'edit', experience: editingExperience! }
          }
          onAccomplishmentDirtyChange={handleAccomplishmentDirtyChange}
        />
      )}
    </>
  );
}
