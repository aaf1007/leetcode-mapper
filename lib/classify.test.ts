import { describe, expect, it } from 'vitest';
import { classify } from './classify';
import { NEETCODE_150 } from './neetcode150';
import { getListSlug } from './listSlug';
import type { Problem } from './types';

const p = (titleSlug: string, title: string, tags: string[]): Problem => ({
  id: '0',
  title,
  titleSlug,
  difficulty: 'MEDIUM',
  status: 'TO_DO',
  paidOnly: false,
  tags,
});

describe('classify', () => {
  it('uses the NeetCode 150 category when the problem is in it', () => {
    expect(classify(p('two-sum', 'Two Sum', ['array', 'hash-table']))).toBe('arrays');
    expect(classify(p('lru-cache', 'LRU Cache', ['hash-table', 'linked-list', 'design']))).toBe('linked-list');
    expect(classify(p('number-of-islands', 'Number of Islands', ['array', 'depth-first-search', 'matrix']))).toBe('graphs');
    expect(
      classify(p('course-schedule-ii', 'Course Schedule II', ['depth-first-search', 'graph', 'topological-sort'])),
    ).toBe('graphs');
  });

  it('falls back to tag-priority rules', () => {
    expect(
      classify(
        p('maximum-coins-from-k-consecutive-bags', 'Maximum Coins From K Consecutive Bags', [
          'array', 'binary-search', 'greedy', 'sliding-window', 'sorting', 'prefix-sum',
        ]),
      ),
    ).toBe('sliding-window');
    expect(classify(p('evaluate-division', 'Evaluate Division', ['array', 'string', 'depth-first-search', 'breadth-first-search', 'union-find', 'graph', 'shortest-path']))).toBe('advanced-graphs');
    expect(classify(p('word-break-ii', 'Word Break II', ['array', 'hash-table', 'string', 'dynamic-programming', 'backtracking', 'trie', 'memoization']))).toBe('tries');
    expect(classify(p('lowest-common-ancestor-of-a-binary-tree', 'Lowest Common Ancestor of a Binary Tree', ['tree', 'depth-first-search', 'binary-tree']))).toBe('trees');
    expect(classify(p('subarray-sum-equals-k', 'Subarray Sum Equals K', ['array', 'hash-table', 'prefix-sum']))).toBe('arrays');
    expect(classify(p('logger-rate-limiter', 'Logger Rate Limiter', ['hash-table', 'design', 'data-stream']))).toBe('arrays');
  });

  it('splits DP into 1-D and 2-D', () => {
    expect(classify(p('x', 'Minimum Path Sum', ['array', 'dynamic-programming', 'matrix']))).toBe('dp-2d');
    expect(classify(p('x', 'Shortest Common Supersequence', ['string', 'dynamic-programming']))).toBe('dp-1d');
    expect(classify(p('x', 'Longest Palindromic Subsequence', ['string', 'dynamic-programming']))).toBe('dp-2d');
  });

  it('detects intervals by title', () => {
    expect(classify(p('x', 'Employee Free Time', ['array', 'line-sweep', 'sorting', 'heap-priority-queue']))).toBe('heap');
    expect(classify(p('x', 'Remove Covered Intervals', ['array', 'sorting']))).toBe('intervals');
  });

  it('puts SQL and untagged problems in Other', () => {
    expect(classify(p('market-analysis-i', 'Market Analysis I', ['database']))).toBe('other');
    expect(classify(p('x', 'Mystery', []))).toBe('other');
  });

  it('manual overrides beat everything', () => {
    expect(classify(p('two-sum', 'Two Sum', ['array']), { 'two-sum': 'greedy' })).toBe('greedy');
  });

  it('ignores overrides pointing at a topic that no longer exists', () => {
    const stale = { 'two-sum': 'hashing' } as unknown as Parameters<typeof classify>[1];
    expect(classify(p('two-sum', 'Two Sum', ['array']), stale)).toBe('arrays');
  });
});

describe('NEETCODE_150', () => {
  it('has 150 unique problems', () => {
    expect(Object.keys(NEETCODE_150)).toHaveLength(150);
  });
});

describe('getListSlug', () => {
  it('reads favoriteSlug or problem-list path', () => {
    expect(getListSlug('https://leetcode.com/company/amazon/?favoriteSlug=amazon-thirty-days')).toBe('amazon-thirty-days');
    expect(getListSlug('https://leetcode.com/problem-list/top-interview-questions/')).toBe('top-interview-questions');
    expect(getListSlug('https://leetcode.com/problems/two-sum/')).toBeNull();
  });
});
