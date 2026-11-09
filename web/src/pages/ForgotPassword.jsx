import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router';
import { ApiError, post, retryAfterText } from '../api/client';
import { AuthCard } from '../components/AuthLayout';
import { MailIcon } from '../components/Icons';
import { Banner, Button, TextField } from '../components/ui';
import { EMAIL_RE } from '../lib/format';

const COOLDOWN = 30;

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [err, setErr] = useState('');
  const [formErr, setFormErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [sentTo, setSentTo] = useState('');
  const [cool, setCool] = useState(0);
  const timer = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => () => clearInterval(timer.current), []);

  const startCooldown = () => {
    setCool(COOLDOWN);
    clearInterval(timer.current);
    timer.current = setInterval(() => {
      setCool((c) => {
        if (c <= 1) clearInterval(timer.current);
        return Math.max(0, c - 1);
      });
    }, 1000);
  };

  const send = async (address) => {
    await post('/auth/forgot-password', { email: address }, { auth: false });
  };

  const explain = (e) => {
    if (e instanceof ApiError && e.status === 429) return `Too many attempts. Try again in ${retryAfterText(e, 60)}.`;
    if (e instanceof ApiError && e.isNetwork) return "Couldn't reach SkillLearn. Check your internet connection and try again.";
    return e?.message || 'Something went wrong. Try again.';
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const v = email.trim();
    if (!v) {
      setErr('Email is required.');
      inputRef.current?.focus();
      return;
    }
    if (!EMAIL_RE.test(v)) {
      setErr('Enter a valid email, e.g. name@student.ac.id.');
      inputRef.current?.focus();
      return;
    }
    setBusy(true);
    setFormErr('');
    try {
      await send(v);
      setSentTo(v);
      startCooldown();
    } catch (ex) {
      if (ex instanceof ApiError && ex.code === 'VALIDATION_ERROR' && ex.fields?.email) setErr(ex.fields.email);
      else setFormErr(explain(ex));
    } finally {
      setBusy(false);
    }
  };

  const resend = async () => {
    if (cool > 0 || busy) return;
    setBusy(true);
    setFormErr('');
    try {
      await send(sentTo);
      startCooldown();
    } catch (ex) {
      setFormErr(explain(ex));
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthCard>
      <title>Reset password · SkillLearn</title>
      {sentTo ? (
        <div className="stack-16" role="status">
          <div className="icon-tile primary">
            <MailIcon size={26} />
          </div>
          <div className="auth-head">
            <h1 className="auth-card-title">Check your inbox</h1>
            <p className="auth-card-text">
              If an account exists for <strong>{sentTo}</strong>, a reset link is on its way. The link expires in 30 minutes.
            </p>
          </div>
          {formErr && <Banner kind="error">{formErr}</Banner>}
          <Button variant="secondary" size="md" className="resend" onClick={resend} disabled={cool > 0} busy={busy} busyLabel="Sending…">
            {cool > 0 ? `Resend available in ${cool}s` : 'Resend link'}
          </Button>
        </div>
      ) : (
        <form className="stack" onSubmit={submit} noValidate>
          <div className="auth-head">
            <h1 className="auth-card-title">Reset your password</h1>
            <p className="auth-card-text">Enter the email you registered with. We'll send a link to set a new password.</p>
          </div>
          {formErr && <Banner kind="error">{formErr}</Banner>}
          <TextField
            label="Email"
            type="email"
            inputRef={inputRef}
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setErr('');
            }}
            error={err}
            placeholder="you@student.ac.id"
            autoComplete="email"
            inputMode="email"
            autoFocus
          />
          <Button type="submit" size="lg" block busy={busy} busyLabel="Sending…">
            Send reset link
          </Button>
        </form>
      )}
      <Link to="/login" className="auth-back">
        ← Back to log in
      </Link>
    </AuthCard>
  );
}
