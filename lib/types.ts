export type Difficulty = 'EASY' | 'MEDIUM' | 'HARD';
export type Status = 'SOLVED' | 'ATTEMPTED' | 'TO_DO';

export interface Problem {
  id: string; // frontend id, e.g. "1"
  title: string;
  titleSlug: string;
  difficulty: Difficulty;
  status: Status;
  paidOnly: boolean;
  tags: string[]; // tag slugs, e.g. ["array", "hash-table"]
  tagNames: string[]; // display names, same order, e.g. ["Array", "Hash Table"]
  acRate: number | null; // acceptance, in percent
  // Premium-only on LeetCode: null (or 0) unless you have Premium.
  frequency: number | null;
  contestPoint: number | null;
}

export type CategoryId =
  | 'arrays'
  | 'two-pointers'
  | 'stack'
  | 'binary-search'
  | 'sliding-window'
  | 'linked-list'
  | 'trees'
  | 'tries'
  | 'backtracking'
  | 'heap'
  | 'graphs'
  | 'dp-1d'
  | 'intervals'
  | 'greedy'
  | 'advanced-graphs'
  | 'dp-2d'
  | 'bit'
  | 'math'
  | 'other';

/** Order of your last submissions (slug → rank, 0 = most recent), fetched only once someone sorts by it. */
export type LastSubmitted = Map<string, number> | 'loading' | 'error' | null;

export type Overrides = Partial<Record<string, CategoryId>>;
