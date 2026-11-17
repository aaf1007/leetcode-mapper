import { useEffect, useMemo, useRef, useState } from 'react';
import { ProblemPanel } from '@/components/ProblemPanel';
import { DevDataToggle } from '@/components/DevDataToggle';
import { Roadmap, type Counts } from '@/components/Roadmap';
import { currentDataMode } from '@/lib/dev/dataMode';
import { StatsCard } from '@/components/StatsCard';
import { useOverrides } from '@/hooks/useOverrides';
import { useShowTags, useSort } from '@/hooks/useSort';
import { useLeetCodeTheme, type Theme } from '@/hooks/useLeetCodeTheme';
import { fetchLastSubmittedOrder, fetchList, type ListResult } from '@/lib/api';
import { CATEGORIES } from '@/lib/categories';
import { classify } from '@/lib/classify';
import { fmt } from '@/lib/format';
import type { CategoryId, LastSubmitted, Problem } from '@/lib/types';

type Load =
  | { state: 'loading'; loaded: number; total: number | null }
  | { state: 'error'; message: string }
  | ({ state: 'ready' } & ListResult);

export function App({ slug }: { slug: string | null }) {
  const [open, setOpen] = useState(false);
  const theme = useLeetCodeTheme();

  // Close the overlay when navigating to a non-list page or another list.
  useEffect(() => setOpen(false), [slug]);

  useEffect(() => {
    if (!open) return;
    const prev = document.documentElement.style.overflow;
    document.documentElement.style.overflow = 'hidden';
    return () => {
      document.documentElement.style.overflow = prev;
    };
  }, [open]);

  if (!slug) return null;
  const dataMode = import.meta.env.DEV ? currentDataMode() : 'live';
  return (
    <>
      {!open && (
        <button type="button" className="lcm-toggle" data-theme={theme} onClick={() => setOpen(true)}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.4" aria-hidden>
            <rect x="5.5" y="1.5" width="5" height="3.5" rx="1" />
            <rect x="1.5" y="11" width="5" height="3.5" rx="1" />
            <rect x="9.5" y="11" width="5" height="3.5" rx="1" />
            <path d="M8 5v3M4 11V8h8v3" />
          </svg>
          Roadmap
        </button>
      )}
      {open && <Overlay key={dataMode} slug={slug} theme={theme} onClose={() => setOpen(false)} />}
      {import.meta.env.DEV && <DevDataToggle mode={dataMode} />}
    </>
  );
}

function Overlay({ slug, theme, onClose }: { slug: string; theme: Theme; onClose: () => void }) {
  const [load, setLoad] = useState<Load>({ state: 'loading', loaded: 0, total: null });
  const [attempt, setAttempt] = useState(0);
  const [selected, setSelected] = useState<CategoryId | null>(null);
  const { overrides, move } = useOverrides();
  const [sort, setSort] = useSort();
  const [showTags, setShowTags] = useShowTags();
  const [lastSubmitted, setLastSubmitted] = useState<LastSubmitted>(null);
  const root = useRef<HTMLDivElement>(null);

  // Esc closes the overlay. Keys pressed inside the shadow root are handled by onKeyDown below
  // (WXT stops them from bubbling out); this catches them when focus is back on the page.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  useEffect(() => {
    root.current?.focus();
    let cancelled = false;
    setLoad({ state: 'loading', loaded: 0, total: null });
    fetchList(slug, (loaded, total) => !cancelled && setLoad({ state: 'loading', loaded, total })).then(
      (result) => !cancelled && setLoad({ state: 'ready', ...result }),
      (e: unknown) => !cancelled && setLoad({ state: 'error', message: e instanceof Error ? e.message : String(e) }),
    );
    return () => {
      cancelled = true;
    };
  }, [slug, attempt]);

  const problems = load.state === 'ready' ? load.problems : [];

  // Not cancelled on re-render: setting 'loading' re-runs this effect, and the overlay remounts per list.
  const wantLastSubmitted = sort.key === 'lastSubmitted' && load.state === 'ready';
  useEffect(() => {
    if (!wantLastSubmitted || lastSubmitted !== null) return;
    setLastSubmitted('loading');
    fetchLastSubmittedOrder(slug).then(setLastSubmitted, () => setLastSubmitted('error'));
  }, [wantLastSubmitted, lastSubmitted, slug]);

  const byCategory = useMemo(() => {
    const groups = Object.fromEntries(CATEGORIES.map((c) => [c.id, [] as Problem[]])) as Record<CategoryId, Problem[]>;
    for (const p of problems) groups[classify(p, overrides)].push(p);
    return groups;
  }, [problems, overrides]);

  const counts = useMemo(
    () =>
      Object.fromEntries(
        CATEGORIES.map((c) => {
          const list = byCategory[c.id];
          return [c.id, { total: list.length, solved: list.filter((p) => p.status === 'SOLVED').length }];
        }),
      ) as Record<CategoryId, Counts>,
    [byCategory],
  );

  const movedSlugs = useMemo(() => new Set(Object.keys(overrides)), [overrides]);

  return (
    <div
      ref={root}
      className="lcm-overlay"
      data-theme={theme}
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <header className="lcm-header">
        <span className="lcm-header__title">
          Roadmap{load.state === 'ready' ? ` · ${load.name ?? slug}` : ''}
        </span>
        <button type="button" className="lcm-close" onClick={onClose} aria-label="Close roadmap">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
            <path d="M3 3l8 8M11 3l-8 8" strokeLinecap="round" />
          </svg>
        </button>
      </header>
      {load.state === 'loading' && (
        <div className="lcm-message">
          {load.total ? `Loading ${fmt(load.loaded)} of ${fmt(load.total)} problems…` : 'Loading problems…'}
        </div>
      )}
      {load.state === 'error' && (
        <div className="lcm-message">
          <p className="lcm-message--error">{load.message}</p>
          <button type="button" className="lcm-retry" onClick={() => setAttempt((n) => n + 1)}>
            Try again
          </button>
        </div>
      )}
      {load.state === 'ready' && problems.length === 0 && (
        <div className="lcm-message">This list has no problems yet.</div>
      )}
      {load.state === 'ready' && problems.length > 0 && (
        <div className="lcm-body">
          <Roadmap counts={counts} selected={selected} onSelect={setSelected} />
          <aside className="lcm-side">
            <StatsCard problems={problems} />
            <ProblemPanel
              key={selected ?? 'none'}
              category={selected}
              problems={selected ? byCategory[selected] : []}
              movedSlugs={movedSlugs}
              onMove={move}
              sort={sort}
              onSort={setSort}
              lastSubmitted={lastSubmitted}
              onRetryLastSubmitted={() => setLastSubmitted(null)}
              showTags={showTags}
              onShowTags={setShowTags}
            />
          </aside>
        </div>
      )}
    </div>
  );
}
