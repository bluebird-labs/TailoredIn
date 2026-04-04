import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { FieldError } from './FieldError.js';

type FieldType = 'text' | 'textarea' | 'select';

interface EditableFieldBaseProps {
  readonly label: string;
  readonly required?: boolean;
  readonly error?: string;
  readonly isDirty?: boolean;
  readonly disabled?: boolean;
  readonly className?: string;
}

interface TextFieldProps extends EditableFieldBaseProps {
  readonly type: 'text';
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
}

interface TextareaFieldProps extends EditableFieldBaseProps {
  readonly type: 'textarea';
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly rows?: number;
}

interface SelectFieldProps extends EditableFieldBaseProps {
  readonly type: 'select';
  readonly value: string;
  readonly onChange: (value: string) => void;
  readonly placeholder?: string;
  readonly options: ReadonlyArray<{ readonly label: string; readonly value: string }>;
}

type EditableFieldProps = TextFieldProps | TextareaFieldProps | SelectFieldProps;

function EditableField(props: EditableFieldProps) {
  const { label, required, error, isDirty, disabled, className, type } = props;

  const fieldId = label.toLowerCase().replace(/\s+/g, '-');

  return (
    <div
      data-slot="editable-field"
      className={cn('space-y-1.5', isDirty && 'border-l-2 border-primary/30 pl-3', className)}
    >
      <Label htmlFor={fieldId}>
        {label}
        {required && <span className="text-destructive ml-0.5">*</span>}
      </Label>

      {type === 'text' && (
        <Input
          id={fieldId}
          value={props.value}
          onChange={e => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          disabled={disabled}
          aria-invalid={!!error}
        />
      )}

      {type === 'textarea' && (
        <Textarea
          id={fieldId}
          value={props.value}
          onChange={e => props.onChange(e.target.value)}
          placeholder={props.placeholder}
          rows={props.rows ?? 3}
          disabled={disabled}
          aria-invalid={!!error}
        />
      )}

      {type === 'select' && (
        <Select value={props.value} onValueChange={v => props.onChange(v ?? '')} disabled={disabled}>
          <SelectTrigger id={fieldId} aria-invalid={!!error || undefined}>
            <SelectValue placeholder={props.placeholder} />
          </SelectTrigger>
          <SelectContent>
            {props.options.map(option => (
              <SelectItem key={option.value} value={option.value}>
                {option.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}

      <FieldError message={error} />
    </div>
  );
}

export type { EditableFieldProps, FieldType };
export { EditableField };
