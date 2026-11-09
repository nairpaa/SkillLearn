import { lazy, Suspense } from 'react';
import { Navigate, Outlet, Route, Routes, useLocation } from 'react-router';
import { useAuth } from './auth/AuthContext';
import { AppLayout } from './components/Nav';
import Category from './pages/Category';
import ForgotPassword from './pages/ForgotPassword';
import Home from './pages/Home';
import Login from './pages/Login';
import NotFound from './pages/NotFound';
import Profile from './pages/Profile';
import Register from './pages/Register';
import ResetPassword from './pages/ResetPassword';
import Search from './pages/Search';
import VerifyEmail from './pages/VerifyEmail';
import { StatusBlock } from './components/StatusBlock';
import { ErrorBoundary } from './components/ErrorBoundary';
import { AlertIcon } from './components/Icons';
import { Button } from './components/ui';

// Halaman yang memuat renderer Markdown / editor dipisah jadi chunk sendiri,
// jadi bundle awal (login, home, search) tetap ringan.
const CourseDetail = lazy(() => import('./pages/CourseDetail'));
const Lesson = lazy(() => import('./pages/Lesson'));
const EditProfile = lazy(() => import('./pages/EditProfile'));

function Lazy({ children, layout = 'detail' }) {
  return <Suspense fallback={<StatusBlock kind="loading" layout={layout} />}>{children}</Suspense>;
}

// Selama status masih "unknown" (refresh pertama belum selesai) tampilkan layar kosong
// berwarna halaman, supaya nggak kedip ke Login lalu balik ke Home.
function Booting() {
  return <div className="page" aria-busy="true" aria-label="Loading SkillLearn" />;
}

// Server tidak bisa dihubungi saat aplikasi dibuka (mis. Render sedang bangun dari tidur).
// Jangan langsung dianggap logout: tampilkan pesan + coba lagi, cookie login tetap dipakai.
function BootError() {
  const { retryBoot } = useAuth();
  return (
    <div className="page boot-error" role="alert">
      <div className="sb-message">
        <div className="icon-tile danger">
          <AlertIcon size={26} />
        </div>
        <h1 className="sb-title">Couldn't reach SkillLearn</h1>
        <p className="sb-text">The server may be waking up. Check your internet connection and try again.</p>
        <Button onClick={retryBoot}>Try again</Button>
      </div>
    </div>
  );
}

function RequireAuth() {
  const { status, expired } = useAuth();
  const location = useLocation();
  if (status === 'unknown') return <Booting />;
  if (status === 'offline') return <BootError />;
  if (status === 'guest') {
    const from = location.pathname + location.search + location.hash;
    return <Navigate to={expired ? '/login?expired=1' : '/login'} replace state={{ from }} />;
  }
  return <Outlet />;
}

// Login/Register/Forgot: kalau sudah login langsung ke Home
function GuestOnly() {
  const { status } = useAuth();
  if (status === 'unknown') return <Booting />;
  if (status === 'authed') return <Navigate to="/" replace />;
  return <Outlet />; // 'guest' maupun 'offline': halaman login tetap bisa dipakai
}

export default function App() {
  return (
    <ErrorBoundary>
    <Routes>
      <Route element={<GuestOnly />}>
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
      </Route>
      {/* link dari email: bisa dibuka baik sudah login maupun belum */}
      <Route path="/verify-email" element={<VerifyEmail />} />
      <Route path="/reset-password" element={<ResetPassword />} />

      <Route element={<RequireAuth />}>
        <Route path="/courses/:slug/lessons/:index" element={<Lazy><Lesson /></Lazy>} />
        <Route element={<AppLayout />}>
          <Route index element={<Home />} />
          <Route path="/search" element={<Search />} />
          <Route path="/categories/:id" element={<Category />} />
          <Route path="/courses/:slug" element={<Lazy><CourseDetail /></Lazy>} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/profile/edit" element={<Lazy layout="list"><EditProfile /></Lazy>} />
          <Route path="*" element={<NotFound />} />
        </Route>
      </Route>
    </Routes>
    </ErrorBoundary>
  );
}
