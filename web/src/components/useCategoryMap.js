import { useMemo } from 'react';
import { useCategories } from '../api/queries';
import { CATEGORY_FALLBACK } from '../lib/format';

// Map id → { name, tint, ink }. Pakai data /categories kalau sudah ada, fallback ke token desain.
export function useCategoryMap() {
  const { data } = useCategories();
  return useMemo(() => {
    const map = { ...CATEGORY_FALLBACK };
    (data || []).forEach((c) => {
      map[c.id] = { ...CATEGORY_FALLBACK[c.id], ...c };
    });
    return map;
  }, [data]);
}
