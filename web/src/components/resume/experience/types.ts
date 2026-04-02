import type { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

// ── Types ──────────────────────────────────────────────────────────────────

export type Bullet = {
  id: string;
  content: string;
  ordinal: number;
  roleTags: { id: string; name: string; dimension: string }[];
  skillTags: { id: string; name: string; dimension: string }[];
};

export type Experience = {
  id: string;
  title: string;
  companyName: string;
  companyWebsite: string | null;
  location: string;
  startDate: string;
  endDate: string;
  summary: string | null;
  ordinal: number;
  bullets: Bullet[];
};

// ── Helpers ────────────────────────────────────────────────────────────────

export function invalidateExperiences(queryClient: ReturnType<typeof useQueryClient>) {
  queryClient.invalidateQueries({ queryKey: queryKeys.experiences.list() });
}

const MONTH_NAMES = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

export function formatDateRange(start: string, end: string): string {
  const fmt = (ym: string) => {
    const [year, month] = ym.split('-');
    return `${MONTH_NAMES[Number(month) - 1]} ${year}`;
  };
  return `${fmt(start)} – ${fmt(end)}`;
}
