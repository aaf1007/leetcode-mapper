const numberFormat = new Intl.NumberFormat();

/** Locale-aware integer, e.g. 2017 → "2,017". */
export const fmt = (n: number) => numberFormat.format(n);
