import { Copy, MoreHorizontal, Pencil, Plus, Trash2 } from 'lucide-react';
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
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
};

export function VersionTabs({ archetypes, activeId, onSwitch, onCreate, onRename, onDelete }: VersionTabsProps) {
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

  return (
    <>
      <div className="flex items-center gap-1 px-6 py-2 border-b border-[#e5e7eb] bg-[#f8f9fa]">
        {archetypes.map(arch => (
          <div key={arch.id} className="flex items-center">
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
                className="text-[13px] px-2 py-1 border border-[#c7d2fe] rounded bg-white outline-none w-28"
              />
            ) : (
              <button
                type="button"
                onClick={() => onSwitch(arch.id)}
                className={`text-[13px] px-3 py-1.5 rounded-md cursor-pointer transition-colors ${
                  arch.id === activeId
                    ? 'bg-white text-[#111] font-semibold shadow-sm border border-[#e5e7eb]'
                    : 'text-[#6b7280] hover:text-[#374151] hover:bg-[#f0f0f0]'
                }`}
              >
                {arch.label}
              </button>
            )}

            <DropdownMenu>
              <DropdownMenuTrigger
                className="p-0.5 ml-0.5 rounded cursor-pointer opacity-0 hover:opacity-100 focus:opacity-100 group-hover:opacity-60 transition-opacity text-[#999] hover:text-[#666]"
                style={{ opacity: arch.id === activeId ? 0.4 : undefined }}
                data-testid={`version-menu-${arch.id}`}
              >
                <MoreHorizontal className="w-3.5 h-3.5" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" className="w-36">
                <DropdownMenuItem onClick={() => startRename(arch.id)}>
                  <Pencil className="w-3.5 h-3.5 mr-2" />
                  Rename
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => setDeleteId(arch.id)}
                  disabled={archetypes.length <= 1}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        ))}

        <Popover open={addOpen} onOpenChange={setAddOpen}>
          <PopoverTrigger
            className="p-1.5 ml-1 rounded-md cursor-pointer text-[#999] hover:text-[#666] hover:bg-[#f0f0f0] transition-colors"
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
              className="w-full text-left text-[13px] px-3 py-2 rounded hover:bg-[#f5f5f5] cursor-pointer flex items-center gap-2"
            >
              <Plus className="w-3.5 h-3.5 text-[#888]" />
              New blank
            </button>
            <button
              type="button"
              onClick={() => {
                onCreate('duplicate');
                setAddOpen(false);
              }}
              className="w-full text-left text-[13px] px-3 py-2 rounded hover:bg-[#f5f5f5] cursor-pointer flex items-center gap-2"
            >
              <Copy className="w-3.5 h-3.5 text-[#888]" />
              Duplicate current
            </button>
          </PopoverContent>
        </Popover>
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
