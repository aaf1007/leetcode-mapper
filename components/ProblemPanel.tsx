import { CATEGORIES, CATEGORY_BY_ID } from '@/lib/categories';
import type { CategoryId, Problem, Status } from '@/lib/types';

interface Props {
  category: CategoryId | null;
  problems: Problem[];
  movedSlugs: Set<string>;
  onMove: (titleSlug: string, category: CategoryId | null) => void;
}

const STATUS_ICON: Record<Status, string> = { SOLVED: '✓', ATTEMPTED: '◐', TO_DO: '○' };
const DIFF_LABEL = { EASY: 'Easy', MEDIUM: 'Med.', HARD: 'Hard' } as const;

export function ProblemPanel({ category, problems, movedSlugs, onMove }: Props) {
  if (!category) {
    return <div className="lcm-card lcm-muted lcm-hint">Click a topic to see its problems.</div>;
  }
  return (
    <div className="lcm-card lcm-panel">
      <h3 className="lcm-panel__title">
        {CATEGORY_BY_ID[category].label}
        <span className="lcm-muted"> · {problems.length}</span>
      </h3>
      {problems.length === 0 && <p className="lcm-muted">No problems from this list in this topic.</p>}
      <ul className="lcm-list">
        {problems.map((p) => (
          <li key={p.titleSlug} className="lcm-row">
            <span className={`lcm-status lcm-status--${p.status.toLowerCase()}`} title={p.status}>
              {STATUS_ICON[p.status]}
            </span>
            <a className="lcm-row__title" href={`/problems/${p.titleSlug}/`} title={p.tags.join(', ')}>
              {p.id}. {p.title}
            </a>
            <span className={`lcm-diff lcm-diff--${p.difficulty.toLowerCase()}`}>{DIFF_LABEL[p.difficulty]}</span>
            <select
              className="lcm-move"
              value={category}
              title="Move to another topic"
              onChange={(e) => onMove(p.titleSlug, e.target.value as CategoryId)}
            >
              {CATEGORIES.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
            {movedSlugs.has(p.titleSlug) && (
              <button
                type="button"
                className="lcm-reset"
                title="Undo manual move"
                onClick={() => onMove(p.titleSlug, null)}
              >
                ↺
              </button>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
