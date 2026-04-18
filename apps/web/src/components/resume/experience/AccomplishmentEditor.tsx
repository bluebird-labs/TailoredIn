import { ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { ConfirmDialog } from '@/components/shared/ConfirmDialog.js';
import { EditableField } from '@/components/shared/EditableField.js';
import { Button } from '@/components/ui/button';

export interface AccomplishmentItem {
  id: string | null;
  tempId: string;
  title: string;
  narrative: string;
  ordinal: number;
}

interface Props {
  readonly accomplishment: AccomplishmentItem;
  readonly isFirst: boolean;
  readonly isLast: boolean;
  readonly onMoveUp: () => void;
  readonly onMoveDown: () => void;
  readonly onChange: (tempId: string, field: 'title' | 'narrative', value: string) => void;
  readonly onDelete: (tempId: string) => void;
  readonly disabled?: boolean;
}

export function AccomplishmentEditor({
  accomplishment,
  isFirst,
  isLast,
  onMoveUp,
  onMoveDown,
  onChange,
  onDelete,
  disabled
}: Props) {
  return (
    <div className="border rounded-lg p-3 space-y-3">
      <div className="flex items-start gap-2">
        <div className="flex flex-col gap-0.5 shrink-0 pt-5">
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            disabled={isFirst || disabled}
            onClick={onMoveUp}
            aria-label="Move up"
          >
            <ChevronUp className="h-3.5 w-3.5" />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            disabled={isLast || disabled}
            onClick={onMoveDown}
            aria-label="Move down"
          >
            <ChevronDown className="h-3.5 w-3.5" />
          </Button>
        </div>
        <div className="flex-1 space-y-3">
          <EditableField
            type="text"
            label="Title"
            required
            value={accomplishment.title}
            onChange={v => onChange(accomplishment.tempId, 'title', v)}
            disabled={disabled}
            placeholder="Accomplishment title"
          />
          <EditableField
            type="textarea"
            label="Narrative"
            value={accomplishment.narrative}
            onChange={v => onChange(accomplishment.tempId, 'narrative', v)}
            rows={3}
            disabled={disabled}
            placeholder="Describe what you did, why, and the outcome in detail..."
          />
        </div>
        <ConfirmDialog
          title="Delete accomplishment?"
          description="This accomplishment will be removed when you save."
          onConfirm={() => onDelete(accomplishment.tempId)}
          trigger={
            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive shrink-0" disabled={disabled}>
              <Trash2 className="h-3 w-3" />
            </Button>
          }
        />
      </div>
    </div>
  );
}
