import { useEffect, useMemo, useRef, useState } from 'react';
import { ProblemPanel } from '@/components/ProblemPanel';
import { Roadmap, type Counts } from '@/components/Roadmap';
import { StatsCard } from '@/components/StatsCard';
import { useOverrides } from '@/hooks/useOverrides';
import { fetchList } from '@/lib/api';
import { CATEGORIES } from '@/lib/categories';
import { classify } from '@/lib/classify';
import type { CategoryId, Problem } from '@/lib/types';

type Load = { state: 'loading' } | { state: 'error'; message: string } | { state: 'ready'; problems: Problem[] };

export function App({ slug }: { slug: string | null }) {
  const [open, setOpen] = useState(false);

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
  return (
    <>
      {!open && (
        <button type="button" className="lcm-toggle" onClick={() => setOpen(true)}>
          <span aria-hidden>🗺</span> Roadmap
        </button>
      )}
      {open && <Overlay slug={slug} onClose={() => setOpen(false)} />}
    </>
  );
}

function Overlay({ slug, onClose }: { slug: string; onClose: () => void }) {
  const [load, setLoad] = useState<Load>({ state: 'loading' });
  const [selected, setSelected] = useState<CategoryId | null>(null);
  const { overrides, move } = useOverrides();
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
    fetchList(slug).then(
      (problems) => !cancelled && setLoad({ state: 'ready', problems }),
      (e: unknown) => !cancelled && setLoad({ state: 'error', message: e instanceof Error ? e.message : String(e) }),
    );
    return () => {
      cancelled = true;
    };
  }, [slug]);

  const problems = load.state === 'ready' ? load.problems : [];

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
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <header className="lcm-header">
        <span className="lcm-header__title">Roadmap · {slug}</span>
        <button type="button" className="lcm-close" onClick={onClose} aria-label="Close roadmap">
          ✕
        </button>
      </header>
      {load.state === 'loading' && <div className="lcm-message">Loading problems…</div>}
      {load.state === 'error' && <div className="lcm-message lcm-message--error">{load.message}</div>}
      {load.state === 'ready' && (
        <div className="lcm-body">
          <Roadmap counts={counts} selected={selected} onSelect={setSelected} />
          <aside className="lcm-side">
            <StatsCard problems={problems} />
            <ProblemPanel
              category={selected}
              problems={selected ? byCategory[selected] : []}
              movedSlugs={movedSlugs}
              onMove={move}
            />
          </aside>
        </div>
      )}
    </div>
  );
}
