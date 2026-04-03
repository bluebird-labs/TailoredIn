import { Copy, Download, Loader2, Plus, Wand2, X } from 'lucide-react';
import { useCallback, useRef, useState } from 'react';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';

type Archetype = {
  id: string;
  label: string;
};

type VersionTabsProps = {
  archetypes: Archetype[];
  activeId: string;
  onSwitch: (id: string) => void;
  onCreate: (mode: 'blank' | 'duplicate') => void;
  onRename: (id: string, label: string) => void;
  onDelete: (id: string) => void;
  generating: boolean;
  onGenerate: () => void;
  onSuggest: () => void;
};

export const TAB_COLORS = [
  {
    bg: 'bg-blue-50',
    border: 'border-blue-400',
    text: 'text-blue-700',
    btnBg: 'bg-blue-600 hover:bg-blue-700',
    btnText: 'text-white',
    accent: '#3b82f6',
    hoverBg: 'rgba(59,130,246,0.06)'
  },
  {
    bg: 'bg-emerald-50',
    border: 'border-emerald-400',
    text: 'text-emerald-700',
    btnBg: 'bg-emerald-600 hover:bg-emerald-700',
    btnText: 'text-white',
    accent: '#10b981',
    hoverBg: 'rgba(16,185,129,0.06)'
  },
  {
    bg: 'bg-violet-50',
    border: 'border-violet-400',
    text: 'text-violet-700',
    btnBg: 'bg-violet-600 hover:bg-violet-700',
    btnText: 'text-white',
    accent: '#8b5cf6',
    hoverBg: 'rgba(139,92,246,0.06)'
  },
  {
    bg: 'bg-amber-50',
    border: 'border-amber-400',
    text: 'text-amber-700',
    btnBg: 'bg-amber-600 hover:bg-amber-700',
    btnText: 'text-white',
    accent: '#f59e0b',
    hoverBg: 'rgba(245,158,11,0.06)'
  },
  {
    bg: 'bg-rose-50',
    border: 'border-rose-400',
    text: 'text-rose-700',
    btnBg: 'bg-rose-600 hover:bg-rose-700',
    btnText: 'text-white',
    accent: '#f43f5e',
    hoverBg: 'rgba(244,63,94,0.06)'
  },
  {
    bg: 'bg-cyan-50',
    border: 'border-cyan-400',
    text: 'text-cyan-700',
    btnBg: 'bg-cyan-600 hover:bg-cyan-700',
    btnText: 'text-white',
    accent: '#06b6d4',
    hoverBg: 'rgba(6,182,212,0.06)'
  }
];

export function VersionTabs({
  archetypes,
  activeId,
  onSwitch,
  onCreate,
  onRename,
  onDelete,
  generating,
  onGenerate,
  onSuggest
}: VersionTabsProps) {
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState('');
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const startRename = useCallback(
    (id: string) => {
      const arch = archetypes.find(a => a.id === id);
      if (!arch) return;
      setRenamingId(id);
      setRenameValue(arch.label);
      setTimeout(() => inputRef.current?.select(), 0);
    },
    [archetypes]
  );

  const commitRename = useCallback(() => {
    if (renamingId && renameValue.trim()) {
      onRename(renamingId, renameValue.trim());
    }
    setRenamingId(null);
  }, [renamingId, renameValue, onRename]);

  const deleteTarget = archetypes.find(a => a.id === deleteId);

  const activeIndex = archetypes.findIndex(a => a.id === activeId);
  const activeColor = TAB_COLORS[activeIndex >= 0 ? activeIndex % TAB_COLORS.length : 0];

  return (
    <>
      <div className="flex items-center gap-1 px-6 py-2 border-b border-border bg-muted/30">
        {archetypes.map((arch, index) => {
          const isActive = arch.id === activeId;
          const color = TAB_COLORS[index % TAB_COLORS.length];
          return (
            <div key={arch.id} className="relative group/tab flex items-center">
              {renamingId === arch.id ? (
                <input
                  ref={inputRef}
                  value={renameValue}
                  onChange={e => setRenameValue(e.target.value)}
                  onBlur={commitRename}
                  onKeyDown={e => {
                    if (e.key === 'Enter') commitRename();
                    if (e.key === 'Escape') setRenamingId(null);
                  }}
                  className="text-[13px] px-2 py-1 border border-primary/30 rounded bg-background outline-none w-28"
                />
              ) : (
                <button
                  type="button"
                  onClick={() => onSwitch(arch.id)}
                  onDoubleClick={() => startRename(arch.id)}
                  className={`text-[13px] px-3 py-1.5 rounded-md cursor-pointer transition-colors border ${
                    isActive
                      ? `${color.bg} ${color.text} font-semibold shadow-sm ${color.border}`
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted border-transparent'
                  }`}
                >
                  {arch.label}
                </button>
              )}

              {/* Delete X — shows on hover, only if more than 1 tab */}
              {archetypes.length > 1 && isActive && (
                <button
                  type="button"
                  onClick={() => setDeleteId(arch.id)}
                  className="ml-0.5 p-0.5 rounded opacity-0 group-hover/tab:opacity-40 hover:!opacity-80 transition-opacity cursor-pointer text-muted-foreground"
                  title="Delete version"
                >
                  <X className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}

        <Popover open={addOpen} onOpenChange={setAddOpen}>
          <PopoverTrigger
            className="p-1.5 ml-1 rounded-md cursor-pointer text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
            title="Add version"
          >
            <Plus className="w-4 h-4" />
          </PopoverTrigger>
          <PopoverContent align="start" className="w-44 p-1">
            <button
              type="button"
              onClick={() => {
                onCreate('blank');
                setAddOpen(false);
              }}
              className="w-full text-left text-[13px] px-3 py-2 rounded hover:bg-muted cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5 text-muted-foreground" />
              New blank
            </button>
            <button
              type="button"
              onClick={() => {
                onCreate('duplicate');
                setAddOpen(false);
              }}
              className="w-full text-left text-[13px] px-3 py-2 rounded hover:bg-muted cursor-pointer flex items-center gap-2"
            >
              <Copy className="w-3.5 h-3.5 text-muted-foreground" />
              Duplicate current
            </button>
          </PopoverContent>
        </Popover>

        {/* Spacer */}
        <div className="flex-1" />

        {/* Tailor to Job button */}
        <button
          type="button"
          onClick={onSuggest}
          className="px-4 py-1.5 rounded-md text-[13px] font-medium cursor-pointer flex items-center gap-2 border border-border text-foreground hover:bg-muted transition-colors"
        >
          <Wand2 className="w-4 h-4" />
          Tailor to Job
        </button>

        {/* Generate PDF button */}
        <button
          type="button"
          disabled={generating}
          onClick={onGenerate}
          className={`px-4 py-1.5 rounded-md text-[13px] font-medium cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-colors ${activeColor.btnBg} ${activeColor.btnText}`}
        >
          {generating ? (
            <>
              <Loader2 className="w-4 h-4 animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <Download className="w-4 h-4" />
              Generate PDF
            </>
          )}
        </button>
      </div>

      <AlertDialog open={!!deleteId} onOpenChange={open => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete version</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteTarget?.label}"? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (deleteId) onDelete(deleteId);
                setDeleteId(null);
              }}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
