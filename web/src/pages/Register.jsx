import { useRef, useState } from 'react';
import { Link } from 'react-router';
import { ApiError, post, retryAfterText } from '../api/client';
import { AuthSplit } from '../components/AuthLayout';
import { MailIcon } from '../components/Icons';
import { Banner, Button, ButtonLink, StrengthMeter, TextField } from '../components/ui';
import { EMAIL_RE, validateNewPassword } from '../lib/format';

function RegisterPanel() {
  return (
    <>
      <p className="auth-display">Practical skills, outside the classroom.</p>
      <p className="auth-lead">Articles, video tutorials, quizzes and hands-on practice in four fields.</p>
      <ul className="auth-pills">
        <li>Programming</li>
        <li>Graphic Design</li>
        <li>Digital Marketing</li>
        <li>Technology</li>
      </ul>
    </>
  );
}

const FIELD_ORDER = ['name', 'email', 'password', 'confirm', 'terms'];

export default function Register() {
  const [form, setForm] = useState({ name: '', email: '', password: '', confirm: '', terms: false });
  const [errors, setErrors] = useState({});
  const [formErr, setFormErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [doneEmail, setDoneEmail] = useState('');
  const refs = { name: useRef(null), email: useRef(null), password: useRef(null), confirm: useRef(null), terms: useRef(null) };

  const set = (k) => (e) => {
    const v = k === 'terms' ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [k]: v }));
    setErrors((x) => ({ ...x, [k]: '' }));
    setFormErr('');
  };

  const focusFirst = (er) => {
    const k = FIELD_ORDER.find((f) => er[f]);
    if (k) refs[k].current?.focus();
  };

  const submit = async (e) => {
    e.preventDefault();
    if (busy) return;
    const er = {};
    const name = form.name.trim();
    const email = form.email.trim();
    if (name.length < 2) er.name = 'Enter your full name (at least 2 characters).';
    if (!email) er.email = 'Email is required.';
    else if (!EMAIL_RE.test(email)) er.email = 'Enter a valid email, e.g. name@student.ac.id.';
    const pwErr = validateNewPassword(form.password);
    if (pwErr) er.password = pwErr;
    if (!form.confirm) er.confirm = 'Repeat your password.';
    else if (form.confirm !== form.password) er.confirm = "Passwords don't match.";
    if (!form.terms) er.terms = 'Accept the Terms to continue.';
    setErrors(er);
    if (Object.values(er).some(Boolean)) {
      focusFirst(er);
      return;
    }
    setBusy(true);
    setFormErr('');
    try {
      await post('/auth/register', { name, email, password: form.password }, { auth: false });
      // Selalu tampil "Check your inbox", termasuk untuk email yang sudah terdaftar (anti user enumeration)
      setDoneEmail(email);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'VALIDATION_ERROR' && err.fields) {
        const f = { name: err.fields.name, email: err.fields.email, password: err.fields.password };
        setErrors(f);
        focusFirst(f);
      } else if (err instanceof ApiError && err.status === 429) {
        setFormErr(`Too many attempts. Try again in ${retryAfterText(err, 60)}.`);
      } else if (err instanceof ApiError && err.isNetwork) {
        setFormErr("Couldn't reach SkillLearn. Check your internet connection and try again.");
      } else {
        setFormErr(err?.message || 'Something went wrong. Try again.');
      }
    } finally {
      setBusy(false);
    }
  };

  return (
    <AuthSplit panel={<RegisterPanel />}>
      <title>Create account · SkillLearn</title>
      {doneEmail ? (
        <div className="auth-done" role="status">
          <div className="icon-tile">
            <MailIcon size={28} strokeWidth={2.5} />
          </div>
          <div className="auth-head">
            <h1 className="auth-title">Check your inbox</h1>
            <p className="auth-done-text">
              We sent a verification link to <strong>{doneEmail}</strong>. Open it to activate your account, then log in.
            </p>
          </div>
          <ButtonLink to="/login" size="lg" block>
            Go to log in
          </ButtonLink>
        </div>
      ) : (
        <form className="auth-form wide" onSubmit={submit} noValidate>
          <div className="auth-head">
            <h1 className="auth-title">Create your account</h1>
            <p className="auth-sub">Register to access all materials and track your progress.</p>
          </div>
          {formErr && <Banner kind="error">{formErr}</Banner>}
          <TextField
            label="Full name"
            inputRef={refs.name}
            value={form.name}
            onChange={set('name')}
            error={errors.name}
            placeholder="Your name"
            autoComplete="name"
            maxLength={80}
            autoFocus
          />
          <TextField
            label="Email"
            type="email"
            inputRef={refs.email}
            value={form.email}
            onChange={set('email')}
            error={errors.email}
            placeholder="you@student.ac.id"
            autoComplete="email"
            inputMode="email"
            maxLength={254}
          />
          <div className="two-col">
            <TextField
              label="Password"
              type="password"
              inputRef={refs.password}
              value={form.password}
              onChange={set('password')}
              error={errors.password}
              placeholder="8+ characters"
              autoComplete="new-password"
              maxLength={128}
              aria-describedby="pw-strength"
            />
            <TextField
              label="Confirm password"
              type="password"
              inputRef={refs.confirm}
              value={form.confirm}
              onChange={set('confirm')}
              error={errors.confirm}
              placeholder="Repeat password"
              autoComplete="new-password"
              maxLength={128}
            />
          </div>
          <StrengthMeter password={form.password} id="pw-strength" />
          <div className="field">
            <label className="check">
              <span className="check-wrap">
                <input
                  ref={refs.terms}
                  type="checkbox"
                  checked={form.terms}
                  onChange={set('terms')}
                  aria-invalid={errors.terms ? 'true' : 'false'}
                  aria-describedby={errors.terms ? 'terms-err' : undefined}
                />
                <span className="check-box" aria-hidden="true">
                  {form.terms && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M5 12.5 10 17l9-10" />
                    </svg>
                  )}
                </span>
              </span>
              I agree to the Terms and Privacy Policy
            </label>
            {errors.terms && (
              <span id="terms-err" className="field-error">
                {errors.terms}
              </span>
            )}
          </div>
          <Button type="submit" size="lg" block busy={busy} busyLabel="Creating account…">
            Create account
          </Button>
          <p className="auth-foot">
            Already have an account? <Link to="/login">Log in</Link>
          </p>
        </form>
      )}
    </AuthSplit>
  );
}
