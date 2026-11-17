import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { PREMIUM_KEYS, SORT_KEYS, SORT_LABELS, STARTS_DESC, type Sort, type SortKey } from '@/lib/sort';

interface Props {
  sort: Sort;
  onSort: (sort: Sort) => void;
  showTags: boolean;
  onShowTags: (show: boolean) => void;
  /** False for keys this list has no data for (Premium fields without Premium). */
  available: (key: SortKey) => boolean;
}

/** LeetCode-style sort popover: sort options, then a Tags show/hide toggle. Direction has its own button. */
export function SortMenu({ sort, onSort, showTags, onShowTags, available }: Props) {
  const [open, setOpen] = useState(false);
  const root = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const menu = useRef<HTMLDivElement>(null);

  // Close on any press outside. Capture phase, because map nodes stop pointerdown from bubbling.
  useEffect(() => {
    if (!open) return;
    const host = root.current?.getRootNode() as Document | ShadowRoot | undefined;
    const onDown = (e: Event) => {
      if (!e.composedPath().includes(root.current!)) setOpen(false);
    };
    host?.addEventListener('pointerdown', onDown, true);
    return () => host?.removeEventListener('pointerdown', onDown, true);
  }, [open]);

  // Focus the current option when the menu opens, so arrow keys start from it.
  useEffect(() => {
    if (open) menu.current?.querySelector<HTMLElement>('[aria-checked="true"]:not(:disabled)')?.focus();
  }, [open]);

  const close = () => {
    setOpen(false);
    trigger.current?.focus();
  };

  const onKeyDown = (e: KeyboardEvent) => {
    if (e.key === 'Escape') {
      e.stopPropagation(); // close the menu, not the whole roadmap
      close();
      return;
    }
    if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
    e.preventDefault();
    const items = [...(menu.current?.querySelectorAll<HTMLElement>('[role^="menuitem"]:not(:disabled)') ?? [])];
    const i = items.indexOf(e.target as HTMLElement);
    items[(i + (e.key === 'ArrowDown' ? 1 : -1) + items.length) % items.length]?.focus();
  };

  const pick = (key: SortKey) => {
    if (key !== sort.key) onSort({ key, desc: STARTS_DESC.has(key) });
    close();
  };

  return (
    <div className="lcm-sort" ref={root} onKeyDown={open ? onKeyDown : undefined}>
      <button
        ref={trigger}
        type="button"
        className="lcm-sort__key"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
          <path d="M3.5 1.5v9M1.5 8.5l2 2 2-2M8.5 10.5v-9M6.5 3.5l2-2 2 2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
        {SORT_LABELS[sort.key]}
      </button>
      <button
        type="button"
        className="lcm-sort__dir"
        aria-label={sort.desc ? 'Descending, switch to ascending' : 'Ascending, switch to descending'}
        title={sort.desc ? 'Descending' : 'Ascending'}
        onClick={() => onSort({ ...sort, desc: !sort.desc })}
      >
        <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="1.5" aria-hidden>
          {sort.desc ? <path d="M6 2v8M2.5 6.5 6 10l3.5-3.5" /> : <path d="M6 10V2M2.5 5.5 6 2l3.5 3.5" />}
        </svg>
      </button>
      {open && (
        <div className="lcm-menu" role="menu" ref={menu}>
          {SORT_KEYS.map((key) => {
            const ok = available(key);
            return (
              <button
                key={key}
                type="button"
                role="menuitemradio"
                aria-checked={sort.key === key}
                disabled={!ok}
                title={ok ? undefined : 'LeetCode only shares this with Premium members'}
                className={`lcm-menu__item${PREMIUM_KEYS.has(key) ? ' lcm-menu__item--premium' : ''}`}
                onClick={() => pick(key)}
              >
                {SORT_LABELS[key]}
                {sort.key === key && (
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.6" aria-hidden>
                    <path d="M2.5 7.5 5.5 10.5 11.5 3.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                )}
              </button>
            );
          })}
          <div className="lcm-menu__divider" role="separator" />
          <button
            type="button"
            role="menuitemcheckbox"
            aria-checked={showTags}
            className="lcm-menu__item"
            onClick={() => onShowTags(!showTags)}
          >
            Tags
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.3" aria-hidden>
              <path d="M1.5 8S4 3.5 8 3.5 14.5 8 14.5 8 12 12.5 8 12.5 1.5 8 1.5 8Z" strokeLinejoin="round" />
              <circle cx="8" cy="8" r="2" />
              {!showTags && <path d="M2.5 2.5l11 11" strokeLinecap="round" />}
            </svg>
          </button>
        </div>
      )}
    </div>
  );
}
