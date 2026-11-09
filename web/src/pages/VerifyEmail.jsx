import { useRef, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { ApiError, post, retryAfterText } from '../api/client';
import { AuthCard } from '../components/AuthLayout';
import { AlertIcon, CheckIcon } from '../components/Icons';
import { Banner, Button, ButtonLink, PasswordField } from '../components/ui';

// Link verifikasi + password yang dipilih saat daftar. Password diminta lagi supaya link di email
// tidak bisa mengaktifkan akun yang didaftarkan orang lain memakai email kita (lihat docs/KEAMANAN.md).
export default function VerifyEmail() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const [state, setState] = useState(token ? 'form' : 'invalid');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [formErr, setFormErr] = useState('');
  const [busy, setBusy] = useState(false);
  const pwRef = useRef(null);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    if (!password) {
      setError('Enter your password.');
      pwRef.current?.focus();
      return;
    }
    setBusy(true);
    setFormErr('');
    try {
      await post('/auth/verify-email', { token, password }, { auth: false });
      setState('ok');
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiError && err.code === 'WRONG_PASSWORD') {
        setError(err.fields?.password || 'Enter the password you chose when you signed up.');
        pwRef.current?.focus();
      } else if (err instanceof ApiError && (err.code === 'TOKEN_INVALID' || (err.code === 'VALIDATION_ERROR' && err.fields?.token))) {
        setState('invalid');
      } else if (err instanceof ApiError && err.status === 429) {
        setFormErr(`Too many attempts. Try again in ${retryAfterText(err, 60)}.`);
      } else if (err instanceof ApiError && err.isNetwork) {
        setFormErr("Couldn't reach SkillLearn. Check your internet connection and try again.");
      } else {
        setFormErr(err?.message || 'Something went wrong. Try again.');
      }
    }
  };

  return (
    <AuthCard>
      <title>Verify email · SkillLearn</title>
      {state === 'form' && (
        <form className="stack" onSubmit={submit} noValidate>
          <div className="auth-head">
            <h1 className="auth-card-title">Confirm your email</h1>
            <p className="auth-card-text">Enter the password you chose when you signed up to activate your account.</p>
          </div>
          {formErr && <Banner kind="error">{formErr}</Banner>}
          <PasswordField
            label="Password"
            inputRef={pwRef}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setError('');
            }}
            error={error}
            placeholder="Your password"
            autoComplete="current-password"
            maxLength={128}
            autoFocus
          />
          <Button type="submit" size="lg" block busy={busy} busyLabel="Verifying…">
            Verify email
          </Button>
        </form>
      )}
      {state === 'ok' && (
        <div className="stack-16" role="status">
          <div className="icon-tile primary">
            <CheckIcon size={26} strokeWidth={2.5} />
          </div>
          <div className="auth-head">
            <h1 className="auth-card-title">Email verified</h1>
            <p className="auth-card-text">Your account is active. Log in to start learning.</p>
          </div>
          <ButtonLink to="/login" size="lg" block>
            Go to log in
          </ButtonLink>
        </div>
      )}
      {state === 'invalid' && (
        <div className="stack-16" role="alert">
          <div className="icon-tile danger">
            <AlertIcon size={26} />
          </div>
          <div className="auth-head">
            <h1 className="auth-card-title">Link invalid or expired</h1>
            <p className="auth-card-text">
              This verification link is invalid, expired or already used. Log in with your email and password and we'll send you a new
              link.
            </p>
          </div>
          <ButtonLink to="/login" size="lg" block>
            Go to log in
          </ButtonLink>
        </div>
      )}
      {state === 'form' && (
        <Link to="/login" className="auth-back">
          ← Back to log in
        </Link>
      )}
    </AuthCard>
  );
}
