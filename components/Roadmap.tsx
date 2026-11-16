import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { CANVAS_H, CANVAS_W, CATEGORIES, CATEGORY_BY_ID, NODE_H, type Category } from '@/lib/categories';
import type { CategoryId } from '@/lib/types';
import { TopicNode } from './TopicNode';

export interface Counts {
  total: number;
  solved: number;
}

interface Props {
  counts: Record<CategoryId, Counts>;
  selected: CategoryId | null;
  onSelect: (id: CategoryId) => void;
}

function edgePath(from: Category, to: Category): string {
  const x1 = from.x;
  const y1 = from.y + NODE_H;
  const x2 = to.x;
  const y2 = to.y;
  const my = (y1 + y2) / 2;
  return `M${x1},${y1} C${x1},${my} ${x2},${my} ${x2},${y2}`;
}

const MIN_SCALE = 0.3;
const MAX_SCALE = 2;
const clamp = (v: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, v));

export function Roadmap({ counts, selected, onSelect }: Props) {
  const viewport = useRef<HTMLDivElement>(null);
  const [view, setView] = useState({ x: 0, y: 0, scale: 1 });
  const drag = useRef<{ px: number; py: number; x: number; y: number } | null>(null);
  // Once you pan or zoom, resizing the window no longer re-fits the map.
  const moved = useRef(false);

  const fit = () => {
    const el = viewport.current;
    if (!el) return;
    moved.current = false;
    const pad = 32;
    const left = 64; // keep nodes clear of the zoom controls
    const availW = el.clientWidth - left - pad;
    const scale = clamp(Math.min(availW / CANVAS_W, (el.clientHeight - pad * 2) / CANVAS_H, 1));
    setView({ scale, x: left + (availW - CANVAS_W * scale) / 2, y: pad });
  };

  useLayoutEffect(fit, []);

  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      if (!moved.current) fit();
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Wheel and zoom shortcuts must be native, non-passive listeners: React's onWheel is passive,
  // so it can't stop Chrome from zooming the whole page on pinch / ctrl+wheel / ⌘±.
  useEffect(() => {
    const el = viewport.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const px = e.deltaMode === 1 ? 16 : 1; // line-based mouse wheels
      if (e.ctrlKey || e.metaKey) {
        // Trackpad pinch arrives as ctrl+wheel. Cap per-event step so a mouse wheel tick isn't huge.
        const dy = Math.max(-30, Math.min(30, e.deltaY * px));
        const rect = el.getBoundingClientRect();
        zoomBy(Math.exp(-dy * 0.01), e.clientX - rect.left, e.clientY - rect.top);
      } else {
        moved.current = true;
        setView((v) => ({ ...v, x: v.x - e.deltaX * px, y: v.y - e.deltaY * px }));
      }
    };
    // Capture phase on window: WXT stops key events from bubbling out of the shadow root.
    const onKey = (e: KeyboardEvent) => {
      if (!(e.metaKey || e.ctrlKey)) return;
      if (e.key === '=' || e.key === '+') zoomBy(1.2);
      else if (e.key === '-') zoomBy(1 / 1.2);
      else if (e.key === '0') fit();
      else return;
      e.preventDefault();
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    window.addEventListener('keydown', onKey, { capture: true });
    return () => {
      el.removeEventListener('wheel', onWheel);
      window.removeEventListener('keydown', onKey, { capture: true });
    };
  }, []);

  const zoomBy = (factor: number, cx?: number, cy?: number) => {
    const el = viewport.current;
    if (!el) return;
    const px = cx ?? el.clientWidth / 2;
    const py = cy ?? el.clientHeight / 2;
    moved.current = true;
    setView((v) => {
      const scale = clamp(v.scale * factor);
      const k = scale / v.scale;
      return { scale, x: px - (px - v.x) * k, y: py - (py - v.y) * k };
    });
  };

  const showOther = counts.other.total > 0;
  const nodes = CATEGORIES.filter((c) => c.id !== 'other' || showOther);

  return (
    <div
      ref={viewport}
      className="lcm-viewport"
      onPointerDown={(e) => {
        drag.current = { px: e.clientX, py: e.clientY, x: view.x, y: view.y };
        e.currentTarget.setPointerCapture(e.pointerId);
      }}
      onPointerMove={(e) => {
        const d = drag.current;
        if (!d) return;
        moved.current = true;
        setView((v) => ({ ...v, x: d.x + e.clientX - d.px, y: d.y + e.clientY - d.py }));
      }}
      onPointerUp={() => (drag.current = null)}
      onPointerCancel={() => (drag.current = null)}
    >
      <div
        className="lcm-canvas"
        style={{
          width: CANVAS_W,
          height: CANVAS_H,
          transform: `translate(${view.x}px, ${view.y}px) scale(${view.scale})`,
        }}
      >
        <svg className="lcm-edges" width={CANVAS_W} height={CANVAS_H}>
          {nodes.flatMap((c) =>
            c.parents.map((p) => <path key={`${p}-${c.id}`} d={edgePath(CATEGORY_BY_ID[p], c)} />),
          )}
        </svg>
        {nodes.map((c) => (
          <TopicNode
            key={c.id}
            category={c}
            total={counts[c.id].total}
            solved={counts[c.id].solved}
            selected={selected === c.id}
            onSelect={() => onSelect(c.id)}
          />
        ))}
      </div>
      <div className="lcm-zoom" onPointerDown={(e) => e.stopPropagation()}>
        <button type="button" onClick={() => zoomBy(1.2)} aria-label="Zoom in">
          +
        </button>
        <button type="button" onClick={() => zoomBy(1 / 1.2)} aria-label="Zoom out">
          −
        </button>
        <button type="button" onClick={fit} aria-label="Fit to screen">
          ⤢
        </button>
      </div>
    </div>
  );
}
