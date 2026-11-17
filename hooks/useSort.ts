import { useEffect, useState } from 'react';
import { storage } from 'wxt/utils/storage';
import { SORT_KEYS, type Sort } from '@/lib/sort';

const DEFAULT: Sort = { key: 'list', desc: false };
const sortItem = storage.defineItem<Sort>('local:sort', { fallback: DEFAULT });
const showTagsItem = storage.defineItem<boolean>('local:showTags', { fallback: false });

/** How the problem panel orders problems; one choice for every topic, remembered between visits. */
export function useSort() {
  const [sort, setSort] = useState<Sort>(DEFAULT);

  useEffect(() => {
    const apply = (v: Sort | null) => setSort(v && SORT_KEYS.includes(v.key) ? v : DEFAULT);
    sortItem.getValue().then(apply);
    return sortItem.watch(apply);
  }, []);

  const update = (next: Sort) => {
    setSort(next);
    sortItem.setValue(next);
  };

  return [sort, update] as const;
}

/** Whether problem rows list their topic tags, like LeetCode's "Tags" toggle. */
export function useShowTags() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    showTagsItem.getValue().then(setShow);
    return showTagsItem.watch((v) => setShow(v ?? false));
  }, []);

  const update = (next: boolean) => {
    setShow(next);
    showTagsItem.setValue(next);
  };

  return [show, update] as const;
}
