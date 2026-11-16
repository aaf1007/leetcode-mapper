import type { Difficulty, Problem, Status } from './types';

const QUERY = `query favoriteQuestionList($favoriteSlug: String!, $filter: FavoriteQuestionFilterInput, $skip: Int!, $limit: Int!) {
  favoriteQuestionList(favoriteSlug: $favoriteSlug, filter: $filter, skip: $skip, limit: $limit) {
    questions { difficulty paidOnly questionFrontendId status title titleSlug topicTags { slug } }
    totalLength
    hasMore
  }
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

interface RawResponse {
  data?: { favoriteQuestionList: { questions: RawQuestion[]; hasMore: boolean } | null };
  errors?: { message: string }[];
}

const PAGE = 100;

function csrfToken(): string {
  return document.cookie.match(/(?:^|;\s*)csrftoken=([^;]+)/)?.[1] ?? '';
}

export async function fetchList(slug: string): Promise<Problem[]> {
  const out: Problem[] = [];
  for (let skip = 0; ; skip += PAGE) {
    const res = await fetch('/graphql/', {
      method: 'POST',
      credentials: 'include',
      headers: { 'content-type': 'application/json', 'x-csrftoken': csrfToken() },
      body: JSON.stringify({
        query: QUERY,
        variables: { favoriteSlug: slug, skip, limit: PAGE, filter: { positionRoleTagSlug: '' } },
      }),
    });
    if (!res.ok) throw new Error(`LeetCode returned HTTP ${res.status}`);
    const json = (await res.json()) as RawResponse;
    const list = json.data?.favoriteQuestionList;
    if (!list) {
      throw new Error(json.errors?.[0]?.message ?? 'List not found (are you logged in, and can you open it?)');
    }
    for (const q of list.questions) {
      out.push({
        id: q.questionFrontendId,
        title: q.title,
        titleSlug: q.titleSlug,
        difficulty: q.difficulty,
        status: q.status ?? 'TO_DO',
        paidOnly: q.paidOnly,
        tags: q.topicTags.map((t) => t.slug),
      });
    }
    if (!list.hasMore || list.questions.length === 0) return out;
  }
}
