import { useRef, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router';
import { useAuth } from '../auth/AuthContext';
import { ApiError, retryAfterText } from '../api/client';
import { AuthSplit } from '../components/AuthLayout';
import { Banner, Button, PasswordField, TextField } from '../components/ui';
import { EMAIL_RE } from '../lib/format';

function LoginPanel() {
  return (
    <>
      <p className="auth-display">Learn a new skill, one step at a time.</p>
      <ul className="auth-bullets">
        <li>Articles and video tutorials</li>
        <li>Quizzes and hands-on practice</li>
        <li>Save favorites, track your history</li>
      </ul>
    </>
  );
}

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [params] = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [errors, setErrors] = useState({});
  const [banner, setBanner] = useState(() => {
    if (params.get('expired')) return { kind: 'info', text: 'Your session expired. Log in again to continue where you left off.' };
    if (params.get('reset')) return { kind: 'success', text: 'Password updated. Log in with your new password.' };
    return null;
  });
  const [busy, setBusy] = useState(false);
  const emailRef = useRef(null);
  const pwRef = useRef(null);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const er = {};
    if (!email.trim()) er.email = 'Email is required.';
    else if (!EMAIL_RE.test(email.trim())) er.email = 'Enter a valid email, e.g. name@student.ac.id.';
    if (!password) er.password = 'Password is required.';
    else if (password.length < 8) er.password = 'Password must be at least 8 characters.';
    setErrors(er);
    if (er.email || er.password) {
      (er.email ? emailRef : pwRef).current?.focus();
      return;
    }
    setBusy(true);
    setBanner(null);
    try {
      await login(email.trim(), password);
      const from = location.state?.from;
      navigate(typeof from === 'string' && from.startsWith('/') && !from.startsWith('/login') ? from : '/', { replace: true });
    } catch (err) {
      setBusy(false);
      if (!(err instanceof ApiError)) {
        setBanner({ kind: 'error', text: 'Something went wrong. Try again.' });
        return;
      }
      if (err.code === 'INVALID_CREDENTIALS') {
        setBanner({ kind: 'error', text: 'Email or password is incorrect. Check both and try again.' });
      } else if (err.status === 429) {
        setBanner({ kind: 'error', text: `Too many attempts. Try again in ${retryAfterText(err)}.` });
      } else if (err.code === 'EMAIL_NOT_VERIFIED') {
        setBanner({ kind: 'info', text: `Verify your email first. We sent a new link to ${email.trim()}.` });
      } else if (err.code === 'VALIDATION_ERROR' && err.fields) {
        setErrors({ email: err.fields.email, password: err.fields.password });
      } else if (err.isNetwork) {
        setBanner({ kind: 'error', text: "Couldn't reach SkillLearn. Check your internet connection and try again." });
      } else {
        setBanner({ kind: 'error', text: err.message || 'Something went wrong. Try again.' });
      }
    }
  };

  return (
    <AuthSplit panel={<LoginPanel />}>
      <title>Log in · SkillLearn</title>
      <form className="auth-form" onSubmit={submit} noValidate>
        <div className="auth-head">
          <h1 className="auth-title">Welcome back</h1>
          <p className="auth-sub">Log in to continue learning.</p>
        </div>
        {banner && <Banner kind={banner.kind}>{banner.text}</Banner>}
        <TextField
          label="Email"
          type="email"
          inputRef={emailRef}
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            setErrors((x) => ({ ...x, email: '' }));
          }}
          error={errors.email}
          placeholder="you@student.ac.id"
          autoComplete="email"
          inputMode="email"
          autoFocus
        />
        <PasswordField
          label="Password"
          labelExtra={<Link to="/forgot-password">Forgot password?</Link>}
          inputRef={pwRef}
          value={password}
          onChange={(e) => {
            setPassword(e.target.value);
            setErrors((x) => ({ ...x, password: '' }));
          }}
          error={errors.password}
          placeholder="At least 8 characters"
          autoComplete="current-password"
        />
        <Button type="submit" size="lg" block busy={busy} busyLabel="Logging in…" className="btn-submit">
          Log in
        </Button>
        <p className="auth-foot">
          New to SkillLearn? <Link to="/register">Create an account</Link>
        </p>
      </form>
    </AuthSplit>
  );
}
