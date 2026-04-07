import { Input } from '@/components/ui/input';

export function BulletRangeInput({
  min,
  max,
  onMinChange,
  onMaxChange
}: {
  min: number;
  max: number;
  onMinChange: (value: number) => void;
  onMaxChange: (value: number) => void;
}) {
  return (
    <div className="space-y-2">
      <p className="text-[11px] uppercase tracking-[0.06em] text-muted-foreground">Default Bullet Range</p>
      <div className="flex items-center gap-3">
        <div className="flex-1 space-y-1">
          <label className="text-[12px] text-muted-foreground" htmlFor="bullet-min">
            Min
          </label>
          <Input
            id="bullet-min"
            type="number"
            min={1}
            max={20}
            value={min}
            onChange={e => onMinChange(Number(e.target.value))}
            className="h-7 text-[13px]"
          />
        </div>
        <div className="flex-1 space-y-1">
          <label className="text-[12px] text-muted-foreground" htmlFor="bullet-max">
            Max
          </label>
          <Input
            id="bullet-max"
            type="number"
            min={1}
            max={20}
            value={max}
            onChange={e => onMaxChange(Number(e.target.value))}
            className="h-7 text-[13px]"
          />
        </div>
      </div>
    </div>
  );
}
