// Dev-only worst-case data for the roadmap. Swapped in at the network boundary in lib/api.ts,
// selected with the `lcm-data` URL param (see components/DevDataToggle.tsx). Never in production builds.

import { currentDataMode, type DataMode } from './dataMode';

type D = 'EASY' | 'MEDIUM' | 'HARD';
type S = 'SOLVED' | 'ATTEMPTED' | 'TO_DO' | null;
interface Raw {
  difficulty: D;
  paidOnly: boolean;
  questionFrontendId: string;
  status: S;
  title: string;
  titleSlug: string;
  topicTags: { slug: string }[];
}

const q = (id: string, title: string, difficulty: D, status: S, tags: string[], paidOnly = false): Raw => ({
  difficulty,
  paidOnly,
  questionFrontendId: id,
  status,
  title,
  titleSlug: title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, ''),
  topicTags: tags.map((slug) => ({ slug })),
});

// Real LeetCode titles and tag sets, chosen so each box's first rows hit a different failure.
const WORST: Raw[] = [
  // Arrays & Hashing: long titles, premium-only, null status (logged-out shape), 9 tags.
  q('2840', 'Check if Strings Can be Made Equal With Operations II', 'MEDIUM', null, ['hash-table', 'string', 'sorting']),
  q('1152', 'Analyze User Website Visit Pattern', 'MEDIUM', 'TO_DO', ['array', 'hash-table', 'sorting'], true),
  q('1640', 'Check Array Formation Through Concatenation', 'EASY', 'SOLVED', ['array', 'hash-table']),
  q('2913', 'Subarrays Distinct Element Sum of Squares I', 'EASY', 'ATTEMPTED', ['array', 'hash-table']),
  q('3', 'Longest Substring Without Repeating Characters', 'MEDIUM', 'SOLVED', ['hash-table', 'string', 'sliding-window']),
  q('2', 'Add Two Numbers', 'MEDIUM', 'SOLVED', ['linked-list', 'math', 'recursion']),
  // Linked List: the longest real title.
  q('2058', 'Find the Minimum and Maximum Number of Nodes Between Critical Points', 'MEDIUM', 'TO_DO', ['linked-list']),
  // Greedy: long + null status.
  q('1546', 'Maximum Number of Non-Overlapping Subarrays With Sum Equals Target', 'MEDIUM', null, ['array', 'hash-table', 'greedy', 'prefix-sum']),
  q('1520', 'Maximum Number of Non-Overlapping Substrings', 'HARD', 'TO_DO', ['string', 'greedy']),
  // Math: punctuation in titles, design problem landing in math via its `math` tag.
  q('50', 'Pow(x, n)', 'MEDIUM', 'ATTEMPTED', ['math', 'recursion']),
  q('381', 'Insert Delete GetRandom O(1) - Duplicates allowed', 'HARD', 'TO_DO', ['array', 'hash-table', 'math', 'design', 'randomized']),
  q('1512', 'Number of Good Pairs', 'EASY', 'SOLVED', ['array', 'hash-table', 'math', 'counting']),
  // Tries: exactly one problem.
  q('1268', 'Search Suggestions System', 'MEDIUM', 'ATTEMPTED', ['array', 'string', 'binary-search', 'trie', 'sorting', 'heap-priority-queue']),
  // Other: SQL (premium), a brand-new problem with no tags yet.
  q('1398', 'Customers Who Bought Products A and B but Not C', 'MEDIUM', 'TO_DO', ['database'], true),
  q('3963', 'Create Grid With Exactly One Path', 'EASY', 'TO_DO', []),
  // Trees / Graphs / DP: every status in one box.
  q('1530', 'Number of Good Leaf Nodes Pairs', 'MEDIUM', 'SOLVED', ['tree', 'depth-first-search', 'binary-tree']),
  q('2385', 'Amount of Time for Binary Tree to Be Infected', 'MEDIUM', 'ATTEMPTED', ['hash-table', 'tree', 'depth-first-search', 'breadth-first-search', 'binary-tree']),
  q('987', 'Vertical Order Traversal of a Binary Tree', 'HARD', 'TO_DO', ['hash-table', 'tree', 'depth-first-search', 'breadth-first-search', 'sorting', 'binary-tree']),
  q('1824', 'Minimum Sideway Jumps', 'MEDIUM', 'TO_DO', ['array', 'dynamic-programming', 'greedy']),
  q('1639', 'Number of Ways to Form a Target String Given a Dictionary', 'HARD', 'TO_DO', ['array', 'string', 'dynamic-programming']),
];

const ONE: Raw[] = [q('1', 'Two Sum', 'EASY', 'SOLVED', ['array', 'hash-table'])];

// Amazon's all-time list is 2,017 problems, fetched 100 per page.
const POOL: Omit<Raw, 'questionFrontendId'>[] = [...WORST, ...ONE].map(({ questionFrontendId: _, ...r }) => r);
const HUGE: Raw[] = Array.from({ length: 2017 }, (_, i) => {
  const base = POOL[i % POOL.length]!;
  const statuses: S[] = ['SOLVED', 'TO_DO', 'TO_DO', 'ATTEMPTED', 'TO_DO'];
  return { ...base, questionFrontendId: String(i + 1), titleSlug: `${base.titleSlug}-${i}`, status: statuses[i % 5]! };
});

const DATA: Partial<Record<DataMode, Raw[]>> = { worst: WORST, empty: [], one: ONE, huge: HUGE };

const delay = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** A fake GraphQL `Response` for the selected mode, or null to hit the real network. */
export async function devResponse(skip: number, limit: number): Promise<Response | null> {
  const mode = currentDataMode();
  if (mode === 'live') return null;
  if (mode === 'loading') return new Promise<Response>(() => {});
  if (mode === 'error') {
    await delay(400);
    return new Response('Too Many Requests', { status: 429 });
  }
  await delay(250); // realistic per-page latency
  const all = DATA[mode] ?? [];
  const questions = all.slice(skip, skip + limit);
  const body = { data: { favoriteQuestionList: { questions, totalLength: all.length, hasMore: skip + limit < all.length } } };
  return new Response(JSON.stringify(body), { status: 200, headers: { 'content-type': 'application/json' } });
}
