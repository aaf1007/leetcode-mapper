import { useEffect, useState } from 'react';

export type Theme = 'dark' | 'light';

const read = (): Theme => (document.documentElement.classList.contains('dark') ? 'dark' : 'light');

/** LeetCode's own light/dark setting, which it keeps as a `dark` class on <html>. */
export function useLeetCodeTheme(): Theme {
  const [theme, setTheme] = useState(read);
  useEffect(() => {
    const observer = new MutationObserver(() => setTheme(read()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);
  return theme;
}
