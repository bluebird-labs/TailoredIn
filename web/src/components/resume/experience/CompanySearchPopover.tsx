import { Link2, Link2Off, Plus, Search } from 'lucide-react';
import { useMemo, useState } from 'react';
import { CompanyFormModal } from '@/components/companies/CompanyFormModal.js';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import type { Company } from '@/hooks/use-companies';
import { useCompanies } from '@/hooks/use-companies';

interface Props {
  readonly linkedCompany: Company | null;
  readonly onLink: (company: Company) => void;
  readonly onUnlink: () => void;
  readonly disabled?: boolean;
}

export function CompanySearchPopover({ linkedCompany, onLink, onUnlink, disabled }: Props) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [createOpen, setCreateOpen] = useState(false);
  const { data: companies = [] } = useCompanies();

  const filtered = useMemo(() => {
    if (!search.trim()) return companies.slice(0, 8);
    const lower = search.toLowerCase();
    return companies.filter(c => c.name.toLowerCase().includes(lower)).slice(0, 8);
  }, [companies, search]);

  function handleSelect(company: Company) {
    onLink(company);
    setOpen(false);
    setSearch('');
  }

  function handleCreated(company: Company) {
    onLink(company);
    setCreateOpen(false);
    setOpen(false);
    setSearch('');
  }

  if (linkedCompany) {
    return (
      <Button
        type="button"
        size="icon"
        variant="ghost"
        className="h-7 w-7 shrink-0"
        onClick={onUnlink}
        disabled={disabled}
        title="Unlink company"
      >
        <Link2Off className="h-3.5 w-3.5" />
      </Button>
    );
  }

  return (
    <>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger
          className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-md text-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50"
          disabled={disabled}
          title="Link to a company"
        >
          <Link2 className="h-3.5 w-3.5" />
        </PopoverTrigger>
        <PopoverContent className="w-72 p-2" align="start">
          <div className="flex items-center gap-1.5 px-1 pb-2">
            <Search className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
            <Input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search companies..."
              className="h-7 text-sm border-0 shadow-none focus-visible:ring-0 px-0"
              autoFocus
            />
          </div>
          <div className="max-h-48 overflow-y-auto space-y-0.5">
            {filtered.map(company => (
              <button
                type="button"
                key={company.id}
                onClick={() => handleSelect(company)}
                className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2"
              >
                {company.logoUrl ? (
                  <img
                    src={company.logoUrl}
                    alt=""
                    className="h-5 w-5 rounded object-contain shrink-0"
                    onError={e => {
                      (e.target as HTMLImageElement).style.display = 'none';
                    }}
                  />
                ) : (
                  <span className="flex h-5 w-5 items-center justify-center rounded bg-muted text-[10px] font-medium shrink-0">
                    {company.name.slice(0, 2).toUpperCase()}
                  </span>
                )}
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium text-sm">{company.name}</p>
                  {company.website && <p className="truncate text-xs text-muted-foreground">{company.website}</p>}
                </div>
              </button>
            ))}
            {filtered.length === 0 && search.trim() && (
              <p className="px-2 py-1.5 text-xs text-muted-foreground">No companies found</p>
            )}
          </div>
          <div className="border-t mt-1 pt-1">
            <button
              type="button"
              onClick={() => {
                setOpen(false);
                setCreateOpen(true);
              }}
              className="w-full rounded-md px-2 py-1.5 text-left text-sm hover:bg-accent transition-colors flex items-center gap-2 text-muted-foreground"
            >
              <Plus className="h-3.5 w-3.5" />
              Create new company
            </button>
          </div>
        </PopoverContent>
      </Popover>
      <CompanyFormModal open={createOpen} onOpenChange={setCreateOpen} onCreated={handleCreated} />
    </>
  );
}
