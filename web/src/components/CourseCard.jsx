import { Link } from 'react-router';
import { courseMeta, formatRating } from '../lib/format';
import { useCategoryMap } from './useCategoryMap';
import { BookmarkIcon } from './Icons';
import { useFavoriteToggle } from './useFavorite';

// Thumbnail: gambar asli (i.ytimg.com) kalau ada, kalau null pakai placeholder bergaris warna kategori
export function Thumb({ course, tint, className = '', stripe = 'stripes' }) {
  if (course.thumbnailUrl) {
    return (
      <span className={`thumb ${className}`} style={{ backgroundColor: tint }}>
        <img src={course.thumbnailUrl} alt="" loading="lazy" referrerPolicy="no-referrer" />
      </span>
    );
  }
  return <span className={`thumb ${stripe} ${className}`} style={{ backgroundColor: tint }} />;
}

export function BookmarkButton({ course, className = 'card-bookmark', size = 16 }) {
  const toggle = useFavoriteToggle();
  const saved = Boolean(course.isFavorite);
  return (
    <button
      type="button"
      className={`${className}${saved ? ' is-saved' : ''}`}
      aria-pressed={saved}
      aria-label={saved ? `Remove ${course.title} from favorites` : `Save ${course.title} to favorites`}
      title={saved ? 'Saved' : 'Save'}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        toggle(course);
      }}
    >
      <BookmarkIcon size={size} filled={saved} />
    </button>
  );
}

// variant "category": pill berisi tipe + deskripsi, sesuai layar Category
export function CourseCard({ course, variant = 'default' }) {
  const cats = useCategoryMap();
  const cat = cats[course.category] || {};
  const isCat = variant === 'category';
  return (
    <article className="course-card">
      <Link to={`/courses/${course.slug}`} className="course-card-link">
        <span className="course-card-thumb">
          <Thumb course={course} tint={cat.tint} />
          <span className="cat-pill" style={{ color: cat.ink }}>
            {isCat ? course.type : cat.name}
          </span>
        </span>
        <span className="course-card-body">
          <h3 className="course-card-title">{course.title}</h3>
          {isCat ? (
            <span className="course-card-desc">{course.description}</span>
          ) : (
            <span className="course-card-meta">{courseMeta(course)}</span>
          )}
          <span className="course-card-foot">
            <span className="lvl">{isCat ? `${course.level} · ${course.duration}` : course.level}</span>
            <span className="rating">
              <span aria-hidden="true">★ </span>
              <span className="sr-only">Rating </span>
              {formatRating(course.rating)}
            </span>
          </span>
        </span>
      </Link>
      <BookmarkButton course={course} />
    </article>
  );
}

export function CourseGrid({ courses, variant }) {
  return (
    <div className="course-grid">
      {courses.map((c) => (
        <CourseCard key={c.id} course={c} variant={variant} />
      ))}
    </div>
  );
}
