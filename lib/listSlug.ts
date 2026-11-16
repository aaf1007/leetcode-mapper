/** Returns the LeetCode list slug for a list page URL, or null if the page isn't a list. */
export function getListSlug(href: string): string | null {
  const url = new URL(href);
  const fromQuery = url.searchParams.get('favoriteSlug');
  if (fromQuery) return fromQuery;
  const m = url.pathname.match(/^\/problem-list\/([^/]+)/);
  return m?.[1] ?? null;
}
