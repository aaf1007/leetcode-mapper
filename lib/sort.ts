import type { Difficulty, Problem, Status } from './types';

// LeetCode's own sort options first, in its order, then two of ours.
export const SORT_KEYS = [
  'list',
  'frequency',
  'contestPoint',
  'difficulty',
  'acRate',
  'id',
  'lastSubmitted',
  'status',
  'title',
] as const;
export type SortKey = (typeof SORT_KEYS)[number];
export interface Sort {
  key: SortKey;
  desc: boolean;
}

export const SORT_LABELS: Record<SortKey, string> = {
  list: 'Custom',
  frequency: 'Frequency',
  contestPoint: 'Contest Point',
  difficulty: 'Difficulty',
  acRate: 'Acceptance',
  id: 'Question ID',
  lastSubmitted: 'Last Submitted Time',
  status: 'Status',
  title: 'Title',
};

/** Options LeetCode only fills in for Premium members. */
export const PREMIUM_KEYS: ReadonlySet<SortKey> = new Set(['frequency', 'contestPoint']);

/** Picking these starts with the biggest / most recent first, which is what you'd want from them. */
export const STARTS_DESC: ReadonlySet<SortKey> = new Set(['frequency', 'lastSubmitted']);

export interface SortContext {
  /** From fetchLastSubmittedOrder: 0 = most recent. Problems you never submitted aren't in it. */
  lastSubmitted?: ReadonlyMap<string, number> | null;
}

const DIFF_RANK: Record<Difficulty, number> = { EASY: 0, MEDIUM: 1, HARD: 2 };
// Ascending puts what you're working on first, then what's left, then what's done.
const STATUS_RANK: Record<Status, number> = { ATTEMPTED: 0, TO_DO: 1, SOLVED: 2 };

// Numeric sort value per key; null means "no value", which always sorts last.
const VALUE: Record<Exclude<SortKey, 'list' | 'title'>, (p: Problem, ctx: SortContext) => number | null> = {
  frequency: (p) => p.frequency,
  contestPoint: (p) => p.contestPoint,
  difficulty: (p) => DIFF_RANK[p.difficulty],
  acRate: (p) => p.acRate,
  id: (p) => (Number.isFinite(Number(p.id)) ? Number(p.id) : null),
  // Larger = more recent, so "descending" means most recent first like every other key.
  lastSubmitted: (p, ctx) => {
    const rank = ctx.lastSubmitted?.get(p.titleSlug);
    return rank === undefined ? null : -rank;
  },
  status: (p) => STATUS_RANK[p.status],
};

/** Whether any of these problems has a value for the key (Premium fields are empty without Premium). */
export function hasValues(problems: Problem[], key: SortKey, ctx: SortContext = {}): boolean {
  if (key === 'list' || key === 'title') return true;
  if (key === 'lastSubmitted') return true; // loads on demand, so assume yes
  return problems.some((p) => VALUE[key](p, ctx) !== null);
}

/** Returns a sorted copy. Ties keep list order, and problems with no value go last in either direction. */
export function sortProblems(problems: Problem[], { key, desc }: Sort, ctx: SortContext = {}): Problem[] {
  if (key === 'list') return desc ? [...problems].reverse() : problems;
  const dir = desc ? -1 : 1;
  const rows = problems.map((p, i) => ({
    p,
    i,
    v: key === 'title' ? p.title : VALUE[key](p, ctx),
  }));
  rows.sort((a, b) => {
    if (a.v === null || b.v === null) return a.v === b.v ? a.i - b.i : a.v === null ? 1 : -1;
    const c = typeof a.v === 'string' ? a.v.localeCompare(b.v as string) : a.v - (b.v as number);
    return c * dir || a.i - b.i;
  });
  return rows.map((r) => r.p);
}
