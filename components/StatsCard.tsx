import { fmt } from '@/lib/format';
import type { Difficulty, Problem } from '@/lib/types';

const ROWS: { key: Difficulty; label: string }[] = [
  { key: 'EASY', label: 'Easy' },
  { key: 'MEDIUM', label: 'Med.' },
  { key: 'HARD', label: 'Hard' },
];

export function StatsCard({ problems }: { problems: Problem[] }) {
  const solved = problems.filter((p) => p.status === 'SOLVED').length;
  return (
    <div className="lcm-card lcm-stats">
      <div className="lcm-stats__total">
        <span>
          <span className="lcm-stats__big">{fmt(solved)}</span>
          <span className="lcm-stats__of">/{fmt(problems.length)}</span>
        </span>
        <span className="lcm-stats__label">Solved</span>
      </div>
      <div className="lcm-stats__chips">
        {ROWS.map(({ key, label }) => {
          const all = problems.filter((p) => p.difficulty === key);
          const done = all.filter((p) => p.status === 'SOLVED').length;
          return (
            <div key={key} className="lcm-stats__chip">
              <span className={`lcm-diff lcm-diff--${key.toLowerCase()}`}>{label}</span>
              <span>
                {fmt(done)}/{fmt(all.length)}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
