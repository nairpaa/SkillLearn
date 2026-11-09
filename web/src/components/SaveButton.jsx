import { BookmarkIcon } from './Icons';
import { useFavoriteToggle } from './useFavorite';

// Tombol "Save / Saved" versi berlabel (Course Detail & Article)
export function BookmarkButtonLabeled({ course, size = 'md' }) {
  const toggle = useFavoriteToggle();
  const saved = Boolean(course.isFavorite);
  return (
    <button
      type="button"
      className={`btn btn-secondary save-btn save-${size}${saved ? ' is-saved' : ''}`}
      aria-pressed={saved}
      onClick={() => toggle(course)}
    >
      <BookmarkIcon size={16} filled={saved} />
      {saved ? 'Saved' : 'Save'}
    </button>
  );
}
