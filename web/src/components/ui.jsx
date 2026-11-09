import { useId, useState } from 'react';
import { Link } from 'react-router';
import { initials, passwordStrength } from '../lib/format';

export function Spinner({ dark = false }) {
  return <span className={`spinner${dark ? ' spinner-dark' : ''}`} aria-hidden="true" />;
}

// Tombol yang bisa "busy": disabled + spinner + label lain, jadi nggak bisa double submit
export function Button({ variant = 'primary', size, busy = false, busyLabel, block, className = '', children, disabled, ...rest }) {
  const cls = ['btn', `btn-${variant}`, size && `btn-${size}`, block && 'btn-block', busy && 'is-busy', className]
    .filter(Boolean)
    .join(' ');
  return (
    <button className={cls} disabled={disabled || busy} aria-busy={busy || undefined} {...rest}>
      {busy && <Spinner dark={variant === 'secondary'} />}
      {busy && busyLabel ? busyLabel : children}
    </button>
  );
}

export function ButtonLink({ variant = 'primary', size, block, className = '', children, ...rest }) {
  const cls = ['btn', `btn-${variant}`, size && `btn-${size}`, block && 'btn-block', className].filter(Boolean).join(' ');
  return (
    <Link className={cls} {...rest}>
      {children}
    </Link>
  );
}

export function Banner({ kind = 'error', children, className = '' }) {
  // error → role alert (dibacakan langsung), info/success → status
  return (
    <div role={kind === 'error' ? 'alert' : 'status'} className={`banner banner-${kind} ${className}`}>
      {children}
    </div>
  );
}

export function TextField({ label, labelExtra, error, hint, id, inputRef, className = '', as = 'input', 'aria-describedby': extraDesc, ...inputProps }) {
  const autoId = useId();
  const fieldId = id || autoId;
  const errId = `${fieldId}-err`;
  const hintId = `${fieldId}-hint`;
  const Tag = as;
  const describedBy = [error && errId, hint && !error && hintId, extraDesc].filter(Boolean).join(' ') || undefined;
  return (
    <div className={`field ${className}`}>
      {labelExtra ? (
        <span className="field-label-row">
          <label className="field-label" htmlFor={fieldId}>
            {label}
          </label>
          {labelExtra}
        </span>
      ) : (
        <label className="field-label" htmlFor={fieldId}>
          {label}
        </label>
      )}
      <Tag
        id={fieldId}
        ref={inputRef}
        className="input"
        aria-invalid={error ? 'true' : 'false'}
        aria-describedby={describedBy}
        {...inputProps}
      />
      {hint && !error && (
        <span id={hintId} className="field-hint">
          {hint}
        </span>
      )}
      {error && (
        <span id={errId} className="field-error">
          {error}
        </span>
      )}
    </div>
  );
}

export function PasswordField({ label = 'Password', labelExtra, error, id, inputRef, className = '', ...inputProps }) {
  const autoId = useId();
  const fieldId = id || autoId;
  const errId = `${fieldId}-err`;
  const [show, setShow] = useState(false);
  return (
    <div className={`field ${className}`}>
      {labelExtra ? (
        <span className="field-label-row">
          <label className="field-label" htmlFor={fieldId}>
            {label}
          </label>
          {labelExtra}
        </span>
      ) : (
        <label className="field-label" htmlFor={fieldId}>
          {label}
        </label>
      )}
      <span className="pw-wrap">
        <input
          id={fieldId}
          ref={inputRef}
          type={show ? 'text' : 'password'}
          className="input"
          aria-invalid={error ? 'true' : 'false'}
          aria-describedby={error ? errId : undefined}
          {...inputProps}
        />
        <button
          type="button"
          className="pw-toggle"
          onClick={() => setShow((s) => !s)}
          aria-label={show ? 'Hide password' : 'Show password'}
          aria-pressed={show}
        >
          {show ? 'Hide' : 'Show'}
        </button>
      </span>
      {error && (
        <span id={errId} className="field-error">
          {error}
        </span>
      )}
    </div>
  );
}

const STRENGTH_HINT = ['At least 8 characters, with one number.', 'Weak: add a number.', 'Good password.', 'Strong password.'];

export function StrengthMeter({ password, id }) {
  const level = passwordStrength(password);
  let hint = STRENGTH_HINT[level];
  // kasus "pendek tapi ada angka" lebih pas dikasih tahu soal panjangnya
  if (level === 1 && password.length < 8) hint = 'Weak: use at least 8 characters.';
  return (
    <div className="strength" data-level={level} id={id} aria-live="polite">
      <span className="strength-bars" aria-hidden="true">
        {[1, 2, 3].map((i) => (
          <span key={i} className={i <= level ? 'on' : ''} />
        ))}
      </span>
      {hint}
    </div>
  );
}

export function Avatar({ name, src, size = 38, fontSize, ring = false, className = '' }) {
  const init = initials(name);
  return (
    <span
      className={`avatar ${ring ? 'avatar-ring' : ''} ${className}`}
      style={{ width: size, height: size, fontSize: fontSize || Math.round(size * 0.37) }}
    >
      {src ? <img src={src} alt="" /> : <span aria-hidden="true">{init}</span>}
    </span>
  );
}

export function EmptyState({ icon, tone, title, text, action, small = false, titleAs: T = 'h2' }) {
  return (
    <div className={`empty ${small ? 'empty-sm' : ''}`}>
      <div className={`icon-tile ${small ? 'icon-tile-sm' : ''} ${tone || ''}`}>{icon}</div>
      <T className="empty-title">{title}</T>
      {text && <p className="empty-text">{text}</p>}
      {action}
    </div>
  );
}

export function ProgressBar({ value, label, className = '' }) {
  const v = Math.max(0, Math.min(100, Number(value) || 0));
  return (
    <div
      className={`progress ${className}`}
      role="progressbar"
      aria-valuemin={0}
      aria-valuemax={100}
      aria-valuenow={v}
      aria-label={label}
    >
      <span style={{ width: `${v}%` }} />
    </div>
  );
}
