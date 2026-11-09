import { useCallback } from 'react';
import { useToggleFavorite } from '../api/queries';
import { useToast } from './Toast';

// Toggle favorit dengan optimistic update + toast "Undo".
// Kalau server gagal, cache otomatis di-rollback (lihat onError di useToggleFavorite).
export function useFavoriteToggle() {
  const mutation = useToggleFavorite();
  const toast = useToast();

  const run = useCallback(
    (course, save, { withUndo = true } = {}) => {
      // mutateAsync: tiap klik punya promise sendiri, jadi pesan error tidak hilang walau langsung di-Undo.
      mutation.mutateAsync({ course, save }).catch(() => toast.show("Couldn't update favorites. Try again."));
      if (!withUndo) return;
      toast.show(save ? 'Saved to favorites' : 'Removed from favorites', {
        actionLabel: 'Undo',
        onAction: () => run({ ...course, isFavorite: save }, !save, { withUndo: false }),
      });
    },
    [mutation, toast]
  );

  return useCallback((course) => run(course, !course.isFavorite), [run]);
}
