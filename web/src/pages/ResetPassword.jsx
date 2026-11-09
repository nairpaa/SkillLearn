import { useRef, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { ApiError, post, refreshAccessToken, retryAfterText } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { AuthCard } from '../components/AuthLayout';
import { AlertIcon } from '../components/Icons';
import { Banner, Button, ButtonLink, PasswordField, StrengthMeter } from '../components/ui';
import { validateNewPassword } from '../lib/format';

export default function ResetPassword() {
  const [params] = useSearchParams();
  const token = params.get('token') || '';
  const navigate = useNavigate();
  const { status, clearSession } = useAuth();
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [errors, setErrors] = useState({});
  const [formErr, setFormErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [invalid, setInvalid] = useState(!token);
  const pwRef = useRef(null);
  const confirmRef = useRef(null);

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const er = {};
    const pwErr = validateNewPassword(password);
    if (pwErr) er.password = pwErr;
    if (!confirm) er.confirm = 'Repeat your password.';
    else if (confirm !== password) er.confirm = "Passwords don't match.";
    setErrors(er);
    if (er.password || er.confirm) {
      (er.password ? pwRef : confirmRef).current?.focus();
      return;
    }
    setBusy(true);
    setFormErr('');
    try {
      await post('/auth/reset-password', { token, password }, { auth: false });
      // Reset mencabut semua sesi akun YANG DI-RESET. Kalau yang sedang login di browser ini akun lain,
      // sesinya tetap hidup; cukup dicek dengan refresh: gagal = memang akun ini, bersihkan sesi lokal.
      if (status === 'authed') {
        try {
          await refreshAccessToken();
        } catch {
          clearSession();
        }
      }
      navigate('/login?reset=1', { replace: true });
    } catch (err) {
      setBusy(false);
      if (err instanceof ApiError && err.code === 'TOKEN_INVALID') setInvalid(true);
      else if (err instanceof ApiError && err.code === 'VALIDATION_ERROR' && err.fields?.password) setErrors({ password: err.fields.password });
      else if (err instanceof ApiError && err.code === 'VALIDATION_ERROR' && err.fields?.token) setInvalid(true);
      else if (err instanceof ApiError && err.status === 429) setFormErr(`Too many attempts. Try again in ${retryAfterText(err, 60)}.`);
      else if (err instanceof ApiError && err.isNetwork) setFormErr("Couldn't reach SkillLearn. Check your internet connection and try again.");
      else setFormErr(err?.message || 'Something went wrong. Try again.');
    }
  };

  return (
    <AuthCard>
      <title>Set a new password · SkillLearn</title>
      {invalid ? (
        <div className="stack-16" role="alert">
          <div className="icon-tile danger">
            <AlertIcon size={26} />
          </div>
          <div className="auth-head">
            <h1 className="auth-card-title">Link invalid or expired</h1>
            <p className="auth-card-text">This reset link is invalid, expired or already used. Request a new link to set your password.</p>
          </div>
          <ButtonLink to="/forgot-password" size="lg" block>
            Request a new link
          </ButtonLink>
        </div>
      ) : (
        <form className="stack" onSubmit={submit} noValidate>
          <div className="auth-head">
            <h1 className="auth-card-title">Set a new password</h1>
            <p className="auth-card-text">Choose a new password for your account. You'll be logged out of all devices.</p>
          </div>
          {formErr && <Banner kind="error">{formErr}</Banner>}
          <PasswordField
            label="New password"
            inputRef={pwRef}
            value={password}
            onChange={(e) => {
              setPassword(e.target.value);
              setErrors((x) => ({ ...x, password: '' }));
            }}
            error={errors.password}
            placeholder="8+ characters"
            autoComplete="new-password"
            maxLength={128}
            autoFocus
          />
          <PasswordField
            label="Confirm password"
            inputRef={confirmRef}
            value={confirm}
            onChange={(e) => {
              setConfirm(e.target.value);
              setErrors((x) => ({ ...x, confirm: '' }));
            }}
            error={errors.confirm}
            placeholder="Repeat password"
            autoComplete="new-password"
            maxLength={128}
          />
          <StrengthMeter password={password} />
          <Button type="submit" size="lg" block busy={busy} busyLabel="Saving…">
            Save new password
          </Button>
        </form>
      )}
      <Link to="/login" className="auth-back">
        ← Back to log in
      </Link>
    </AuthCard>
  );
}
