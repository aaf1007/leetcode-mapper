import type { Difficulty, Problem, Status } from './types';

const LIST_QUERY = `query favoriteQuestionList($favoriteSlug: String!, $filter: FavoriteQuestionFilterInput, $skip: Int!, $limit: Int!) {
  favoriteQuestionList(favoriteSlug: $favoriteSlug, filter: $filter, skip: $skip, limit: $limit) {
    questions { difficulty paidOnly questionFrontendId status title titleSlug topicTags { slug } }
    totalLength
    hasMore
  }
}`;

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
  topicTags: { slug: string }[];
}

interface RawPage {
  questions: RawQuestion[];
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

async function fetchPage(slug: string, skip: number): Promise<RawPage> {
  const fake = import.meta.env.DEV ? await (await import('./dev/fixtures')).devResponse(skip, PAGE) : null;
  const json = await gql<{ favoriteQuestionList: RawPage | null }>(
    LIST_QUERY,
    { favoriteSlug: slug, skip, limit: PAGE, filter: { positionRoleTagSlug: '' } },
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

const toProblem = (q: RawQuestion): Problem => ({
  id: q.questionFrontendId,
  title: q.title,
  titleSlug: q.titleSlug,
  difficulty: q.difficulty,
  status: q.status ?? 'TO_DO',
  paidOnly: q.paidOnly,
  tags: q.topicTags.map((t) => t.slug),
});

/** Loads every problem in a list. The first page gives the total; the rest load in parallel. */
export async function fetchList(slug: string, onProgress?: (loaded: number, total: number) => void): Promise<ListResult> {
  const [first, name] = await Promise.all([fetchPage(slug, 0), fetchName(slug)]);
  const total = first.totalLength;
  let loaded = first.questions.length;
  onProgress?.(loaded, total);

  const skips: number[] = [];
  if (first.hasMore) for (let s = PAGE; s < total; s += PAGE) skips.push(s);
  const pages: RawQuestion[][] = [first.questions];
  let next = 0;
  const worker = async () => {
    while (next < skips.length) {
      const i = next++;
      const page = await fetchPage(slug, skips[i]!);
      pages[i + 1] = page.questions;
      loaded += page.questions.length;
      onProgress?.(loaded, total);
    }
  };
  await Promise.all(Array.from({ length: Math.min(CONCURRENCY, skips.length) }, worker));

  // The list can change between pages; drop any problem that shifted into two pages.
  const bySlug = new Map<string, Problem>();
  for (const q of pages.flat()) if (!bySlug.has(q.titleSlug)) bySlug.set(q.titleSlug, toProblem(q));
  return { name, problems: [...bySlug.values()] };
}
