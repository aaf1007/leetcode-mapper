import type { CategoryId } from './types';

export interface Category {
  id: CategoryId;
  label: string;
  /** Center x and top y of the node on the roadmap canvas. */
  x: number;
  y: number;
  parents: CategoryId[];
}

export const NODE_W = 152;
export const NODE_H = 52;
export const CANVAS_W = 1000;
export const CANVAS_H = 960;

// Layout mirrors the NeetCode roadmap tree.
export const CATEGORIES: Category[] = [
  { id: 'arrays', label: 'Arrays & Hashing', x: 500, y: 0, parents: [] },
  { id: 'two-pointers', label: 'Two Pointers', x: 400, y: 120, parents: ['arrays'] },
  { id: 'stack', label: 'Stack', x: 600, y: 110, parents: ['arrays'] },
  { id: 'binary-search', label: 'Binary Search', x: 230, y: 240, parents: ['two-pointers'] },
  { id: 'sliding-window', label: 'Sliding Window', x: 420, y: 240, parents: ['two-pointers'] },
  { id: 'linked-list', label: 'Linked List', x: 620, y: 245, parents: ['two-pointers'] },
  { id: 'trees', label: 'Trees', x: 420, y: 360, parents: ['binary-search', 'linked-list'] },
  { id: 'tries', label: 'Tries', x: 250, y: 480, parents: ['trees'] },
  { id: 'backtracking', label: 'Backtracking', x: 600, y: 475, parents: ['trees'] },
  { id: 'heap', label: 'Heap / Priority Queue', x: 380, y: 580, parents: ['trees'] },
  { id: 'graphs', label: 'Graphs', x: 580, y: 610, parents: ['backtracking'] },
  { id: 'dp-1d', label: '1-D Dynamic Programming', x: 790, y: 600, parents: ['backtracking'] },
  { id: 'intervals', label: 'Intervals', x: 80, y: 700, parents: ['heap'] },
  { id: 'greedy', label: 'Greedy', x: 270, y: 750, parents: ['heap'] },
  { id: 'advanced-graphs', label: 'Advanced Graphs', x: 450, y: 725, parents: ['heap', 'graphs'] },
  { id: 'dp-2d', label: '2-D Dynamic Programming', x: 650, y: 750, parents: ['graphs', 'dp-1d'] },
  { id: 'bit', label: 'Bit Manipulation', x: 860, y: 745, parents: ['dp-1d'] },
  { id: 'math', label: 'Math & Geometry', x: 780, y: 880, parents: ['dp-2d', 'bit'] },
  { id: 'other', label: 'Other (SQL, etc.)', x: 80, y: 880, parents: [] },
];

export const CATEGORY_BY_ID = Object.fromEntries(CATEGORIES.map((c) => [c.id, c])) as Record<
  CategoryId,
  Category
>;
