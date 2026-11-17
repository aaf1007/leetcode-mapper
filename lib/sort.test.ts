import { describe, expect, it } from 'vitest';
import { hasValues, sortProblems } from './sort';
import type { Problem } from './types';

const p = (
  id: string,
  difficulty: Problem['difficulty'],
  status: Problem['status'],
  title: string,
  extra: Partial<Problem> = {},
): Problem => ({
  id,
  title,
  titleSlug: `p-${id}`,
  difficulty,
  status,
  paidOnly: false,
  tags: [],
  tagNames: [],
  acRate: null,
  frequency: null,
  contestPoint: null,
  ...extra,
});
const list = [
  p('560', 'MEDIUM', 'TO_DO', 'b', { acRate: 48.4, frequency: 30 }),
  p('1', 'EASY', 'SOLVED', 'c', { acRate: 58.1, frequency: 90 }),
  p('41', 'HARD', 'ATTEMPTED', 'a', { acRate: 40.2 }),
  p('36', 'EASY', 'TO_DO', 'd', { acRate: 61.1, frequency: 30 }),
];
const ids = (ps: Problem[]) => ps.map((x) => x.id);

describe('sortProblems', () => {
  it('keeps or reverses list order', () => {
    expect(sortProblems(list, { key: 'list', desc: false })).toBe(list);
    expect(ids(sortProblems(list, { key: 'list', desc: true }))).toEqual(['36', '41', '1', '560']);
  });
  it('sorts ids numerically, not as text', () => {
    expect(ids(sortProblems(list, { key: 'id', desc: false }))).toEqual(['1', '36', '41', '560']);
  });
  it('keeps list order within a tie, in both directions', () => {
    expect(ids(sortProblems(list, { key: 'difficulty', desc: false }))).toEqual(['1', '36', '560', '41']);
    expect(ids(sortProblems(list, { key: 'difficulty', desc: true }))).toEqual(['41', '560', '1', '36']);
  });
  it('puts attempted, then unsolved, then solved', () => {
    expect(ids(sortProblems(list, { key: 'status', desc: false }))).toEqual(['41', '560', '36', '1']);
  });
  it('sorts by title', () => {
    expect(ids(sortProblems(list, { key: 'title', desc: false }))).toEqual(['41', '560', '1', '36']);
  });
  it('sorts by acceptance', () => {
    expect(ids(sortProblems(list, { key: 'acRate', desc: false }))).toEqual(['41', '560', '1', '36']);
  });
  it('puts problems with no value last in both directions', () => {
    expect(ids(sortProblems(list, { key: 'frequency', desc: true }))).toEqual(['1', '560', '36', '41']);
    expect(ids(sortProblems(list, { key: 'frequency', desc: false }))).toEqual(['560', '36', '1', '41']);
  });
  it('sorts by last submission, never-submitted last', () => {
    const lastSubmitted = new Map([
      ['p-41', 0],
      ['p-1', 1],
    ]);
    expect(ids(sortProblems(list, { key: 'lastSubmitted', desc: true }, { lastSubmitted }))).toEqual(['41', '1', '560', '36']);
    expect(ids(sortProblems(list, { key: 'lastSubmitted', desc: false }, { lastSubmitted }))).toEqual(['1', '41', '560', '36']);
    // Not loaded yet: everything ties, so list order.
    expect(ids(sortProblems(list, { key: 'lastSubmitted', desc: true }))).toEqual(['560', '1', '41', '36']);
  });
});

describe('hasValues', () => {
  it('is false when LeetCode sent nothing for a Premium field', () => {
    expect(hasValues(list, 'frequency')).toBe(true);
    expect(hasValues(list, 'contestPoint')).toBe(false);
  });
});
