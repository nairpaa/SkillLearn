import { useEffect, useState } from 'react';
import { Link, NavLink, Outlet, useLocation, useNavigate, useSearchParams } from 'react-router';
import { useMe } from '../api/queries';
import { Logo, SearchIcon } from './Icons';
import { Avatar } from './ui';

export function Nav() {
  const location = useLocation();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const { data: me } = useMe();
  const onSearchPage = location.pathname === '/search';
  const onProfile = location.pathname.startsWith('/profile');
  const [q, setQ] = useState(onSearchPage ? params.get('q') || '' : '');

  // kalau lagi di halaman Search, isi kolom nav ikut query di URL
  useEffect(() => {
    if (onSearchPage) setQ(params.get('q') || '');
  }, [onSearchPage, params]);

  const submit = (e) => {
    e.preventDefault();
    const v = q.trim();
    navigate(v ? `/search?q=${encodeURIComponent(v)}` : '/search');
  };

  const hash = location.hash;
  return (
    <header className="nav">
      <Link to="/" className="nav-logo" aria-label="SkillLearn home">
        <Logo size={30} />
        <span>SkillLearn</span>
      </Link>
      <nav className="nav-links" aria-label="Main">
        <NavLink to="/" end className={({ isActive }) => (isActive ? 'active' : '')}>
          Home
        </NavLink>
        <Link
          to="/profile#favorites"
          className={onProfile ? 'active' : ''}
          aria-current={onProfile && hash === '#favorites' ? 'page' : undefined}
        >
          Favorites
        </Link>
        <Link
          to="/profile#history"
          className={onProfile ? 'active' : ''}
          aria-current={onProfile && hash === '#history' ? 'page' : undefined}
        >
          History
        </Link>
      </nav>
      <div className="nav-spacer" />
      <form className="nav-search" role="search" onSubmit={submit}>
        <SearchIcon size={16} />
        <label htmlFor="nav-search" className="sr-only">
          Search courses
        </label>
        <input
          id="nav-search"
          type="search"
          value={q}
          maxLength={60}
          onChange={(e) => setQ(e.target.value)}
          placeholder="Search courses, topics…"
          autoComplete="off"
        />
      </form>
      <Link to="/search" className="nav-search-btn" aria-label="Search">
        <SearchIcon size={20} />
      </Link>
      <Link to="/profile" className="nav-avatar" aria-label="Your profile" aria-current={onProfile ? 'page' : undefined}>
        <Avatar name={me?.name} src={me?.avatar} size={38} fontSize={14} ring={onProfile} />
      </Link>
    </header>
  );
}

// Kerangka halaman biasa: skip link + nav sticky + <main>
export function AppFrame({ children }) {
  return (
    <div className="page">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Nav />
      <main id="main" tabIndex={-1}>
        {children}
      </main>
    </div>
  );
}

export function AppLayout() {
  return (
    <AppFrame>
      <Outlet />
    </AppFrame>
  );
}
