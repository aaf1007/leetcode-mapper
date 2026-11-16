import { NODE_H, NODE_W, type Category } from '@/lib/categories';

interface Props {
  category: Category;
  total: number;
  solved: number;
  selected: boolean;
  onSelect: () => void;
}

export function TopicNode({ category, total, solved, selected, onSelect }: Props) {
  const pct = total ? (solved / total) * 100 : 0;
  return (
    <button
      type="button"
      className={`lcm-node${selected ? ' lcm-node--selected' : ''}${total ? '' : ' lcm-node--empty'}`}
      style={{ left: category.x - NODE_W / 2, top: category.y, width: NODE_W, minHeight: NODE_H }}
      onClick={onSelect}
      onPointerDown={(e) => e.stopPropagation()}
      title={`${solved}/${total} solved`}
    >
      <span className="lcm-node__label">{category.label}</span>
      <span className="lcm-node__progress">
        <span className="lcm-node__bar">
          <span className="lcm-node__fill" style={{ width: `${pct}%` }} />
        </span>
        <span className="lcm-node__count">
          {solved}/{total}
        </span>
      </span>
    </button>
  );
}
