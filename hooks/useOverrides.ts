import { useCallback, useEffect, useState } from 'react';
import { storage } from 'wxt/utils/storage';
import type { CategoryId, Overrides } from '@/lib/types';

const overridesItem = storage.defineItem<Overrides>('sync:overrides', { fallback: {} });

/** Manual "move this problem to box X" choices, synced across your Chrome profiles. */
export function useOverrides() {
  const [overrides, setOverrides] = useState<Overrides>({});

  useEffect(() => {
    overridesItem.getValue().then(setOverrides);
    return overridesItem.watch((v) => setOverrides(v ?? {}));
  }, []);

  const move = useCallback(async (titleSlug: string, category: CategoryId | null) => {
    const next = { ...(await overridesItem.getValue()) };
    if (category) next[titleSlug] = category;
    else delete next[titleSlug];
    await overridesItem.setValue(next);
  }, []);

  return { overrides, move };
}
