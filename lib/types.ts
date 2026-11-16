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

export type Overrides = Partial<Record<string, CategoryId>>;
