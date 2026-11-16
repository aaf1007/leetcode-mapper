import { useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { CATEGORIES, CATEGORY_BY_ID } from '@/lib/categories';
import { fmt } from '@/lib/format';
import type { CategoryId, Problem, Status } from '@/lib/types';

interface Props {
  category: CategoryId | null;
  problems: Problem[];
  movedSlugs: Set<string>;
  onMove: (titleSlug: string, category: CategoryId | null) => void;
}

const STATUS_ICON: Record<Status, string> = { SOLVED: '✓', ATTEMPTED: '◐', TO_DO: '○' };
const STATUS_LABEL: Record<Status, string> = { SOLVED: 'Solved', ATTEMPTED: 'Attempted', TO_DO: 'Not started' };
const DIFF_LABEL = { EASY: 'Easy', MEDIUM: 'Med.', HARD: 'Hard' } as const;
const ROW_ESTIMATE = 41;

export function ProblemPanel({ category, problems, movedSlugs, onMove }: Props) {
  // Height of all rows; the list shrinks to fit the side column and virtualizes beyond that.
  const [listHeight, setListHeight] = useState(problems.length * ROW_ESTIMATE);

  if (!category) {
    return <div className="lcm-card lcm-muted lcm-hint">Click a topic to see its problems.</div>;
  }
  return (
    <div className="lcm-card lcm-panel">
      <h3 className="lcm-panel__title">
        {CATEGORY_BY_ID[category].label}
        <span className="lcm-muted"> · {fmt(problems.length)}</span>
      </h3>
      {problems.length === 0 ? (
        <p className="lcm-muted">No problems from this list in this topic.</p>
      ) : (
        <div className="lcm-panel__list" style={{ height: listHeight }}>
          <Virtuoso
            style={{ height: '100%' }}
            data={problems}
            computeItemKey={(_, p) => p.titleSlug}
            totalListHeightChanged={setListHeight}
            itemContent={(i, p) => (
              <Row problem={p} first={i === 0} category={category} moved={movedSlugs.has(p.titleSlug)} onMove={onMove} />
            )}
          />
        </div>
      )}
    </div>
  );
}

function Row({
  problem: p,
  first,
  category,
  moved,
  onMove,
}: {
  problem: Problem;
  first: boolean;
  category: CategoryId;
  moved: boolean;
  onMove: Props['onMove'];
}) {
  return (
    <div className={`lcm-row${first ? ' lcm-row--first' : ''}`}>
      <span className={`lcm-status lcm-status--${p.status.toLowerCase()}`} title={STATUS_LABEL[p.status]}>
        {STATUS_ICON[p.status]}
      </span>
      <span className="lcm-row__id">{p.id}.</span>
      <a
        className="lcm-row__title"
        data-id={p.id}
        href={`/problems/${p.titleSlug}/`}
        title={p.tags.length ? `${p.title}\nTags: ${p.tags.join(', ')}` : p.title}
      >
        {p.paidOnly && (
          <span className="lcm-lock" title="Premium" aria-label="Premium">
            🔒{' '}
          </span>
        )}
        {p.title}
      </a>
      <span className={`lcm-diff lcm-diff--${p.difficulty.toLowerCase()}`}>{DIFF_LABEL[p.difficulty]}</span>
      <span className="lcm-row__actions">
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
        {moved && (
          <button type="button" className="lcm-reset" title="Undo manual move" onClick={() => onMove(p.titleSlug, null)}>
            ↺
          </button>
        )}
      </span>
    </div>
  );
}
