import { useMemo } from 'react';
import { useCategories } from './queries';

const FALLBACK = { programming: 'Programming', design: 'Graphic Design', marketing: 'Digital Marketing', technology: 'Technology' };

// Map id kategori → nama tampilan (dari /categories, dengan cadangan statis kalau belum termuat)
export function useCategoryNames() {
  const { data } = useCategories();
  return useMemo(() => {
    const map = { ...FALLBACK };
    (data || []).forEach((c) => {
      map[c.id] = c.name;
    });
    return map;
  }, [data]);
}
