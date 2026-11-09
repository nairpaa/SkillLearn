import { Link } from 'react-router';
import { Logo } from './Icons';

export function AuthSplit({ panel, children }) {
  return (
    <div className="auth-split">
      <aside className="auth-panel">
        <Link to="/login" className="auth-brand" aria-label="SkillLearn">
          <Logo size={34} inverted />
          <span>SkillLearn</span>
        </Link>
        <div className="auth-panel-main">{panel}</div>
        <div className="auth-panel-foot">© 2026 SkillLearn</div>
      </aside>
      <main className="auth-main">
        {/* logo kecil yang cuma muncul di layar sempit (panel kiri disembunyikan) */}
        <Link to="/login" className="auth-mobile-brand" aria-label="SkillLearn">
          <Logo size={32} />
          <span>SkillLearn</span>
        </Link>
        {children}
      </main>
    </div>
  );
}

// Layout kartu tengah (Forgot password, Verify email, Reset password)
export function AuthCard({ children }) {
  return (
    <div className="auth-card-page">
      <Link to="/login" className="auth-card-brand">
        <Logo size={32} />
        <span>SkillLearn</span>
      </Link>
      <main className="auth-card-wrap">
        <div className="auth-card">{children}</div>
      </main>
    </div>
  );
}
