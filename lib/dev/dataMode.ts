// Which dev data source the roadmap uses, from the `lcm-data` URL param. Side-effect free so
// importing it never pulls the fixture data (lib/dev/fixtures.ts) into production builds.

export const DATA_MODES = ['live', 'worst', 'empty', 'one', 'huge', 'loading', 'error'] as const;
export type DataMode = (typeof DATA_MODES)[number];

export const DATA_MODE_LABELS: Record<DataMode, string> = {
  live: 'Live',
  worst: 'Worst case',
  empty: 'Empty',
  one: 'One',
  huge: '2,017 rows',
  loading: 'Loading',
  error: 'Error',
};

export function currentDataMode(href = location.href): DataMode {
  const v = new URL(href).searchParams.get('lcm-data');
  return (DATA_MODES as readonly string[]).includes(v ?? '') ? (v as DataMode) : 'live';
}
