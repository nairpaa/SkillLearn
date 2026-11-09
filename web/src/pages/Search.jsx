import { useEffect, useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { useCategories, useCourseSearch } from '../api/queries';
import { CourseGrid } from '../components/CourseCard';
import { SearchIcon, SearchMinusIcon } from '../components/Icons';
import { Skeleton, StatusMessage } from '../components/StatusBlock';
import { EmptyState } from '../components/ui';
import { plural } from '../lib/format';

const TYPES = ['All', 'Video', 'Article', 'Quiz', 'Practice'];

export default function Search() {
  const [params, setParams] = useSearchParams();
  const urlQ = params.get('q') || '';
  const urlType = TYPES.includes(params.get('type')) ? params.get('type') : 'All';
  const [text, setText] = useState(urlQ);
  const inputRef = useRef(null);
  const catQ = useCategories();

  // nilai q terakhir yang kita tulis sendiri ke URL, biar nggak "memantul" balik ke input
  // (kalau nggak, spasi di akhir ketikan bakal kehapus waktu URL di-update)
  const pushed = useRef(urlQ);

  // URL berubah dari luar (mis. submit dari search bar di nav) → sinkronkan input
  useEffect(() => {
    if (urlQ !== pushed.current) {
      pushed.current = urlQ;
      setText(urlQ);
    }
  }, [urlQ]);

  // debounce 250 ms sebelum query dikirim, URL di-replace biar history browser nggak penuh
  useEffect(() => {
    const v = text.trim();
    if (v === pushed.current) return undefined;
    const t = setTimeout(() => {
      pushed.current = v;
      setParams(
        (p) => {
          const n = new URLSearchParams(p);
          if (v) n.set('q', v);
          else n.delete('q');
          return n;
        },
        { replace: true }
      );
    }, 250);
    return () => clearTimeout(t);
  }, [text, setParams]);

  const setType = (t) =>
    setParams(
      (p) => {
        const n = new URLSearchParams(p);
        if (t === 'All') n.delete('type');
        else n.set('type', t);
        return n;
      },
      { replace: true }
    );

  const query = useCourseSearch({ q: urlQ || undefined, type: urlType === 'All' ? undefined : urlType, limit: 50 });
  const results = query.data || [];
  const stale = query.isPlaceholderData;

  let body;
  if (query.isPending) body = <Skeleton layout="grid" />;
  else if (query.isError && !query.data) body = <StatusMessage kind="error" error={query.error} onRetry={() => query.refetch()} retrying={query.isFetching} />;
  else if (results.length === 0)
    body = (
      <EmptyState
        icon={<SearchMinusIcon size={26} />}
        title={urlQ ? `No results for “${urlQ}”` : `No ${urlType.toLowerCase()} courses yet`}
        text={urlQ ? 'Check the spelling, try a shorter keyword, or browse a category.' : 'Try another type, or browse a category.'}
        action={
          <div className="chip-row center">
            {(catQ.data || []).map((k) => (
              <Link key={k.id} to={`/categories/${k.id}`} className="chip chip-soft">
                {k.name}
              </Link>
            ))}
          </div>
        }
      />
    );
  else
    body = (
      <div className={stale ? 'is-stale' : ''}>
        <CourseGrid courses={results} />
      </div>
    );

  return (
    <div className="container search">
      <title>{urlQ ? `“${urlQ}” · Search · SkillLearn` : 'Search · SkillLearn'}</title>
      <h1 className="page-title">Search</h1>
      <form className="search-box" role="search" onSubmit={(e) => e.preventDefault()}>
        <SearchIcon size={20} />
        <label htmlFor="search-input" className="sr-only">
          Search courses
        </label>
        <input
          id="search-input"
          ref={inputRef}
          type="search"
          value={text}
          maxLength={60}
          onChange={(e) => setText(e.target.value)}
          placeholder="Try “React”, “SEO” or “Figma”"
          autoComplete="off"
          autoFocus
        />
        {text && (
          <button
            type="button"
            className="search-clear"
            onClick={() => {
              setText('');
              inputRef.current?.focus();
            }}
          >
            Clear
          </button>
        )}
      </form>
      <div className="search-bar">
        <div className="chip-row" role="group" aria-label="Filter by type">
          {TYPES.map((t) => (
            <button key={t} type="button" className="chip chip-dark" aria-pressed={urlType === t} onClick={() => setType(t)}>
              {t}
            </button>
          ))}
        </div>
        <div className="search-count" aria-live="polite">
          {query.data ? plural(results.length, 'course') : ''}
        </div>
      </div>
      {body}
    </div>
  );
}
