import { Link, useParams } from 'react-router';
import { useCategories, useCourses } from '../api/queries';
import { CourseGrid } from '../components/CourseCard';
import { StatusBlock } from '../components/StatusBlock';
import { plural } from '../lib/format';

export default function Category() {
  const { id } = useParams();
  const catQ = useCategories();
  const cat = catQ.data?.find((c) => c.id === id);
  // course baru di-fetch kalau kategorinya memang ada (ID asal-asalan → 400 dari server)
  const coursesQ = useCourses({ category: id, limit: 50 }, { enabled: Boolean(cat) });

  if (catQ.isPending) return <StatusBlock kind="loading" />;
  if (catQ.isError) return <StatusBlock kind="error" error={catQ.error} onRetry={() => catQ.refetch()} retrying={catQ.isFetching} />;
  if (!cat)
    return (
      <>
        <title>Category not found · SkillLearn</title>
        <StatusBlock kind="notfound" nfTitle="Category not found" />
      </>
    );
  if (coursesQ.isPending) return <StatusBlock kind="loading" />;
  if (coursesQ.isError)
    return <StatusBlock kind="error" error={coursesQ.error} onRetry={() => coursesQ.refetch()} retrying={coursesQ.isFetching} />;

  const courses = coursesQ.data;
  const others = catQ.data.filter((c) => c.id !== cat.id);

  return (
    <>
      <title>{`${cat.name} · SkillLearn`}</title>
      <div className="cat-hero" style={{ backgroundColor: cat.tint }}>
        <div className="cat-hero-inner">
          <nav className="breadcrumb cat-crumb" aria-label="Breadcrumb">
            <Link to="/">Home</Link> / <span>Categories</span>
          </nav>
          <h1 className="cat-hero-title" style={{ color: cat.ink }}>
            {cat.name}
          </h1>
          <p className="cat-hero-desc">{cat.description}</p>
          <p className="cat-hero-count">{plural(courses.length, 'course')}</p>
        </div>
      </div>
      <div className="container cat-body">
        {courses.length ? (
          <CourseGrid courses={courses} variant="category" />
        ) : (
          <p className="muted">No courses in this category yet.</p>
        )}
        <section className="cat-others" aria-labelledby="others-title">
          <h2 id="others-title" className="card-heading">
            Other categories
          </h2>
          <div className="chip-row">
            {others.map((o) => (
              <Link key={o.id} to={`/categories/${o.id}`} className="chip chip-lg">
                {o.name}
              </Link>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}
