import { useMemo, useState } from 'react';
import { Virtuoso } from 'react-virtuoso';
import { CATEGORIES, CATEGORY_BY_ID } from '@/lib/categories';
import { fmt } from '@/lib/format';
import { hasValues, sortProblems, type Sort, type SortKey } from '@/lib/sort';
import type { CategoryId, LastSubmitted, Problem, Status } from '@/lib/types';
import { SortMenu } from './SortMenu';

interface Props {
  category: CategoryId | null;
  problems: Problem[];
  movedSlugs: Set<string>;
  onMove: (titleSlug: string, category: CategoryId | null) => void;
  sort: Sort;
  onSort: (sort: Sort) => void;
  lastSubmitted: LastSubmitted;
  onRetryLastSubmitted: () => void;
  showTags: boolean;
  onShowTags: (show: boolean) => void;
}

// Same marks as LeetCode's own lists: a check for solved, a ring for attempted, nothing for the rest.
const STATUS_ICON: Record<Status, JSX.Element | null> = {
  SOLVED: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.8" aria-hidden>
      <path d="M2.5 7.5 5.5 10.5 11.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  ),
  ATTEMPTED: (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
      <circle cx="7" cy="7" r="5" />
    </svg>
  ),
  TO_DO: null,
};
const STATUS_LABEL: Record<Status, string> = { SOLVED: 'Solved', ATTEMPTED: 'Attempted', TO_DO: 'Not started' };
const DIFF_LABEL = { EASY: 'Easy', MEDIUM: 'Med.', HARD: 'Hard' } as const;
const ROW_ESTIMATE = 38;

// The number a sort is based on, shown in the row so the order makes sense. Like LeetCode's
// acceptance column, but only while you sort by it. Frequency is left out: its scale isn't documented.
const percent = new Intl.NumberFormat(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
const METRIC: Partial<Record<SortKey, (p: Problem) => string | null>> = {
  acRate: (p) => (p.acRate === null ? null : `${percent.format(p.acRate)}%`),
  contestPoint: (p) => (p.contestPoint === null ? null : fmt(p.contestPoint)),
};

export function ProblemPanel(props: Props) {
  const { category, problems, movedSlugs, onMove, sort, onSort, lastSubmitted, showTags } = props;
  // Height of all rows; the list shrinks to fit the side column and virtualizes beyond that.
  const [listHeight, setListHeight] = useState(problems.length * ROW_ESTIMATE);
  const ranks = lastSubmitted instanceof Map ? lastSubmitted : null;
  const sorted = useMemo(() => sortProblems(problems, sort, { lastSubmitted: ranks }), [problems, sort, ranks]);
  const metric = METRIC[sort.key];

  if (!category) {
    return <div className="lcm-card lcm-hint">Click a topic to see its problems.</div>;
  }
  return (
    <div className="lcm-card lcm-panel">
      <div className="lcm-panel__head">
        <h3 className="lcm-panel__title">
          {CATEGORY_BY_ID[category].label}
          <span className="lcm-panel__count">{fmt(problems.length)}</span>
        </h3>
        {problems.length > 0 && (
          <SortMenu
            sort={sort}
            onSort={onSort}
            showTags={showTags}
            onShowTags={props.onShowTags}
            available={(key) => hasValues(problems, key)}
          />
        )}
      </div>
      {sort.key === 'lastSubmitted' && lastSubmitted === 'loading' && (
        <p className="lcm-note">Loading your submission history…</p>
      )}
      {sort.key === 'lastSubmitted' && lastSubmitted === 'error' && (
        <p className="lcm-note lcm-note--error">
          Couldn't load your submission history.{' '}
          <button type="button" className="lcm-link" onClick={props.onRetryLastSubmitted}>
            Try again
          </button>
        </p>
      )}
      {problems.length === 0 ? (
        <p className="lcm-empty">No problems from this list in this topic.</p>
      ) : (
        <div className="lcm-panel__list" style={{ height: listHeight }}>
          <Virtuoso
            style={{ height: '100%' }}
            data={sorted}
            computeItemKey={(_, p) => p.titleSlug}
            totalListHeightChanged={setListHeight}
            itemContent={(i, p) => (
              <Row
                problem={p}
                alt={i % 2 === 0}
                category={category}
                moved={movedSlugs.has(p.titleSlug)}
                onMove={onMove}
                metric={metric?.(p) ?? null}
                showTags={showTags}
              />
            )}
          />
        </div>
      )}
    </div>
  );
}

function Row({
  problem: p,
  alt,
  category,
  moved,
  onMove,
  metric,
  showTags,
}: {
  problem: Problem;
  alt: boolean;
  category: CategoryId;
  moved: boolean;
  onMove: Props['onMove'];
  metric: string | null;
  showTags: boolean;
}) {
  return (
    <div className={`lcm-row${alt ? ' lcm-row--alt' : ''}`}>
      <span
        className={`lcm-status lcm-status--${p.status.toLowerCase()}`}
        title={STATUS_LABEL[p.status]}
        aria-label={STATUS_LABEL[p.status]}
      >
        {STATUS_ICON[p.status]}
      </span>
      <span className="lcm-row__id">{p.id}.</span>
      <a
        className="lcm-row__title"
        data-id={p.id}
        href={`/problems/${p.titleSlug}/`}
        title={p.tagNames.length ? `${p.title}\nTags: ${p.tagNames.join(', ')}` : p.title}
      >
        {p.paidOnly && (
          <span className="lcm-lock" title="Premium" aria-label="Premium">
            🔒{' '}
          </span>
        )}
        {p.title}
      </a>
      <span className="lcm-row__meta">
        {metric && <span className="lcm-row__metric">{metric}</span>}
        <span className={`lcm-diff lcm-diff--${p.difficulty.toLowerCase()}`}>{DIFF_LABEL[p.difficulty]}</span>
      </span>
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
      {showTags && p.tagNames.length > 0 && (
        <span className="lcm-row__tags">
          {p.tagNames.map((name) => (
            <span key={name} className="lcm-tag">
              {name}
            </span>
          ))}
        </span>
      )}
    </div>
  );
}
