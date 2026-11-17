import type { Difficulty, Problem, Status } from './types';

// Matches the query LeetCode's own list page sends. Without version "v2" LeetCode ignores sortBy,
// skip and limit, and leaves acRate empty.
const listQuery = (fields: string) => `query favoriteQuestionList($favoriteSlug: String!, $sortBy: QuestionSortByInput, $skip: Int!, $limit: Int!) {
  favoriteQuestionList(favoriteSlug: $favoriteSlug, sortBy: $sortBy, skip: $skip, limit: $limit, version: "v2") {
    questions { ${fields} }
    totalLength
    hasMore
  }
}`;
const FULL_QUERY = listQuery(
  'difficulty paidOnly questionFrontendId status title titleSlug acRate frequency contestPoint topicTags { name slug }',
);
const ORDER_QUERY = listQuery('titleSlug status');

interface SortBy {
  sortField: 'CUSTOM' | 'LAST_SUBMITTED_TIME';
  sortOrder: 'ASCENDING' | 'DESCENDING';
}
// "Custom" is the list's own order, the default on LeetCode's list page.
const LIST_ORDER: SortBy = { sortField: 'CUSTOM', sortOrder: 'ASCENDING' };

const NAME_QUERY = `query favoriteDetailV2($favoriteSlug: String!) {
  favoriteDetailV2(favoriteSlug: $favoriteSlug) { name }
}`;

interface RawQuestion {
  difficulty: Difficulty;
  paidOnly: boolean;
  questionFrontendId: string;
  status: Status | null;
  title: string;
  titleSlug: string;
  acRate?: number | null; // a fraction, 0.581 = 58.1%
  frequency?: number | null;
  contestPoint?: number | null;
  topicTags: { slug: string; name?: string }[];
}

interface RawPage<Q = RawQuestion> {
  questions: Q[];
  totalLength: number;
  hasMore: boolean;
}

interface RawResponse<T> {
  data?: T;
  errors?: { message: string }[];
}

export interface ListResult {
  name: string | null;
  problems: Problem[];
}

const PAGE = 100;
const CONCURRENCY = 4; // enough to load 2,000 problems quickly without tripping LeetCode's rate limit

function csrfToken(): string {
  return document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/)?.[1] ?? '';
}

function httpMessage(status: number): string {
  if (status === 429) return 'LeetCode is limiting requests right now. Wait a minute, then try again.';
  if (status === 401 || status === 403) return "LeetCode refused the request. Make sure you're signed in, then try again.";
  if (status >= 500) return 'LeetCode is having trouble right now. Try again in a moment.';
  return `Couldn't load this list (LeetCode returned ${status}).`;
}

async function gql<T>(query: string, variables: object, fake?: Response | null): Promise<RawResponse<T>> {
  let res: Response;
  try {
    res =
      fake ??
      (await fetch('/graphql/', {
        method: 'POST',
        credentials: 'include',
        headers: { 'content-type': 'application/json', 'x-csrftoken': csrfToken() },
        body: JSON.stringify({ query, variables }),
      }));
  } catch {
    throw new Error("Couldn't reach LeetCode. Check your connection, then try again.");
  }
  if (!res.ok) throw new Error(httpMessage(res.status));
  return (await res.json()) as RawResponse<T>;
}

async function fetchPage<Q>(query: string, slug: string, skip: number, sortBy: SortBy): Promise<RawPage<Q>> {
  const fake = import.meta.env.DEV ? await (await import('./dev/fixtures')).devResponse(skip, PAGE, sortBy) : null;
  const json = await gql<{ favoriteQuestionList: RawPage<Q> | null }>(
    query,
    { favoriteSlug: slug, skip, limit: PAGE, sortBy },
    fake,
  );
  const page = json.data?.favoriteQuestionList;
  if (!page) {
    throw new Error("Couldn't open this list. Make sure you're signed in and can see it on LeetCode.");
  }
  return page;
}

async function fetchName(slug: string): Promise<string | null> {
  try {
    const json = await gql<{ favoriteDetailV2: { name: string } | null }>(NAME_QUERY, { favoriteSlug: slug });
    return json.data?.favoriteDetailV2?.name ?? null;
  } catch {
    return null; // the name is cosmetic; fall back to the slug
  }
}

const num = (v: number | null | undefined) => (typeof v === 'number' && Number.isFinite(v) ? v : null);
// "depth-first-search" → "Depth First Search", for tags that arrive without a name.
const tagName = (slug: string) => slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());

const toProblem = (q: RawQuestion): Problem => ({
  id: q.questionFrontendId,
  title: q.title,
  titleSlug: q.titleSlug,
  difficulty: q.difficulty,
  status: q.status ?? 'TO_DO',
  paidOnly: q.paidOnly,
  tags: q.topicTags.map((t) => t.slug),
  tagNames: q.topicTags.map((t) => t.name ?? tagName(t.slug)),
  acRate: q.acRate == null ? null : num(q.acRate * 100),
  frequency: num(q.frequency),
  contestPoint: num(q.contestPoint),
});

/** Every question in a list, in order. The first page gives the total; the rest load in parallel. */
async function fetchAll<Q extends { titleSlug: string }>(
  query: string,
  slug: string,
  sortBy: SortBy,
  onProgress?: (loaded: number, total: number) => void,
): Promise<Q[]> {
  const first = await fetchPage<Q>(query, slug, 0, sortBy);
  const total = first.totalLength;
  let loaded = first.questions.length;
  onProgress?.(loaded, total);

  const skips: number[] = [];
  if (first.hasMore) for (let s = PAGE; s < total; s += PAGE) skips.push(s);
  const pages: Q[][] = [first.questions];
  let next = 0;
  const worker = async () => {
    while (next < skips.length) {
      const i = next++;
      const page = await fetchPage<Q>(query, slug, skips[i]!, sortBy);
      pages[i + 1] = page.questions;
      loaded += page.questions.length;
      onProgress?.(loaded, total);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, skips.length) }, worker));

  // The list can change between pages; drop any question that shifted into two pages.
  const seen = new Set<string>();
  return pages.flat().filter((q) => !seen.has(q.titleSlug) && seen.add(q.titleSlug));
}

/** Loads every problem in a list, with the list's name. */
export async function fetchList(slug: string, onProgress?: (loaded: number, total: number) => void): Promise<ListResult> {
  const [questions, name] = await Promise.all([
    fetchAll<RawQuestion>(FULL_QUERY, slug, LIST_ORDER, onProgress),
    fetchName(slug),
  ]);
  return { name, problems: questions.map(toProblem) };
}

/** Rank of each problem you've submitted, most recent first (0). Never-submitted problems are left out.
    LeetCode doesn't send submission times with the list, only this ordering. */
export async function fetchLastSubmittedOrder(slug: string): Promise<Map<string, number>> {
  const questions = await fetchAll<Pick<RawQuestion, 'titleSlug' | 'status'>>(ORDER_QUERY, slug, {
    sortField: 'LAST_SUBMITTED_TIME',
    sortOrder: 'DESCENDING',
  });
  const ranks = new Map<string, number>();
  for (const q of questions) if (q.status && q.status !== 'TO_DO') ranks.set(q.titleSlug, ranks.size);
  return ranks;
}
