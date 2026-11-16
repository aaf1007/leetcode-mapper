import { DATA_MODE_LABELS, DATA_MODES, type DataMode } from '@/lib/dev/dataMode';

/** Dev-only segmented control that switches the roadmap's data source via the `lcm-data` URL param. */
export function DevDataToggle({ mode }: { mode: DataMode }) {
  const select = (m: DataMode) => {
    const url = new URL(location.href);
    if (m === 'live') url.searchParams.delete('lcm-data');
    else url.searchParams.set('lcm-data', m);
    history.replaceState(history.state, '', url);
  };
  return (
    <div className="lcm-devtoggle" role="radiogroup" aria-label="Roadmap test data">
      {DATA_MODES.map((m) => (
        <button
          key={m}
          type="button"
          role="radio"
          aria-checked={m === mode}
          className={m === mode ? 'lcm-devtoggle__on' : undefined}
          onClick={() => select(m)}
        >
          {DATA_MODE_LABELS[m]}
        </button>
      ))}
    </div>
  );
}
