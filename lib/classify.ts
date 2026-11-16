import { CATEGORY_BY_ID } from './categories';
import { NEETCODE_150 } from './neetcode150';
import type { CategoryId, Overrides, Problem } from './types';

type Rule = (p: Problem, has: (...tags: string[]) => boolean) => CategoryId | null;

const TWO_D_TITLE = /subsequence|distance|interleav|matching|grid|paths?\b/i;
const INTERVAL_TITLE = /interval|meeting/i;

// First match wins, so more specific topics come first.
const RULES: Rule[] = [
  (_, has) => (has('trie') ? 'tries' : null),
  (_, has) =>
    has('union-find', 'topological-sort', 'shortest-path', 'minimum-spanning-tree', 'strongly-connected-component', 'eulerian-circuit')
      ? 'advanced-graphs'
      : null,
  (_, has) => (has('backtracking') ? 'backtracking' : null),
  (p, has) => {
    if (!has('dynamic-programming', 'memoization')) return null;
    return has('matrix') || TWO_D_TITLE.test(p.title) ? 'dp-2d' : 'dp-1d';
  },
  (_, has) => (has('heap-priority-queue') ? 'heap' : null),
  (_, has) => (has('tree', 'binary-tree', 'binary-search-tree') ? 'trees' : null),
  (_, has) => (has('graph', 'graph-theory', 'breadth-first-search', 'depth-first-search') ? 'graphs' : null),
  (_, has) => (has('linked-list', 'doubly-linked-list') ? 'linked-list' : null),
  (_, has) => (has('sliding-window') ? 'sliding-window' : null),
  (_, has) => (has('binary-search') ? 'binary-search' : null),
  (_, has) => (has('stack', 'monotonic-stack') ? 'stack' : null),
  (_, has) => (has('two-pointers') ? 'two-pointers' : null),
  (p, has) => (INTERVAL_TITLE.test(p.title) || has('line-sweep', 'sweep-line') ? 'intervals' : null),
  (_, has) => (has('greedy') ? 'greedy' : null),
  (_, has) => (has('bit-manipulation') ? 'bit' : null),
  (_, has) => (has('math', 'geometry', 'matrix') ? 'math' : null),
  (_, has) =>
    has('hash-table', 'array', 'string', 'prefix-sum', 'sorting', 'counting', 'design', 'hash-function')
      ? 'arrays'
      : null,
];

export function classify(problem: Problem, overrides: Overrides = {}): CategoryId {
  // Ignore saved moves to a topic that no longer exists (e.g. renamed in an update).
  const manual = overrides[problem.titleSlug];
  if (manual && Object.hasOwn(CATEGORY_BY_ID, manual)) return manual;
  const neet = NEETCODE_150[problem.titleSlug];
  if (neet) return neet;
  const tags = new Set(problem.tags);
  const has = (...t: string[]) => t.some((x) => tags.has(x));
  for (const rule of RULES) {
    const cat = rule(problem, has);
    if (cat) return cat;
  }
  return 'other';
}
