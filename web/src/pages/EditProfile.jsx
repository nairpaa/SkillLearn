import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { useQueryClient } from '@tanstack/react-query';
import { ApiError, patch, post, retryAfterText } from '../api/client';
import { qk, useCategories, useMe } from '../api/queries';
import { StatusBlock } from '../components/StatusBlock';
import { Avatar, Banner, Button, PasswordField, TextField } from '../components/ui';
import { AvatarError, resizeAvatar } from '../lib/avatar';
import { CATEGORY_FALLBACK, CATEGORY_IDS, validateNewPassword } from '../lib/format';

const BIO_MAX = 160;

function EditForm({ me }) {
  const qc = useQueryClient();
  const navigate = useNavigate();
  const catQ = useCategories();
  const [name, setName] = useState(me.name || '');
  const [bio, setBio] = useState(me.bio || '');
  const [interests, setInterests] = useState(me.interests || []);
  const [avatar, setAvatar] = useState(me.avatar || null);
  const [currentPw, setCurrentPw] = useState('');
  const [newPw, setNewPw] = useState('');
  const [errors, setErrors] = useState({});
  const [formErr, setFormErr] = useState('');
  const [busy, setBusy] = useState(false);
  const [photoBusy, setPhotoBusy] = useState(false);
  const [saved, setSaved] = useState(false);
  const fileRef = useRef(null);
  const nameRef = useRef(null);
  const curRef = useRef(null);
  const newRef = useRef(null);
  const timer = useRef(null);

  useEffect(() => () => clearTimeout(timer.current), []);

  const catName = (id) => catQ.data?.find((c) => c.id === id)?.name || CATEGORY_FALLBACK[id]?.name || id;
  const clearErr = (k) => {
    setErrors((e) => ({ ...e, [k]: '' }));
    setFormErr('');
    setSaved(false);
  };

  const onPick = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // biar file yang sama bisa dipilih ulang
    if (!file) return;
    clearErr('avatar');
    setPhotoBusy(true);
    try {
      setAvatar(await resizeAvatar(file));
    } catch (err) {
      setErrors((x) => ({ ...x, avatar: err instanceof AvatarError ? err.message : "We couldn't read this image. Try another photo." }));
    } finally {
      setPhotoBusy(false);
    }
  };

  const toggleInterest = (id) => {
    setInterests((list) => (list.includes(id) ? list.filter((x) => x !== id) : [...list, id]));
    setSaved(false);
  };

  const save = async (e) => {
    e.preventDefault();
    if (busy || saved) return;
    const er = {};
    const n = name.trim();
    if (n.length < 2) er.name = 'Enter your full name (at least 2 characters).';
    if (bio.length > BIO_MAX) er.bio = `Keep your bio to ${BIO_MAX} characters.`;
    const wantsPw = Boolean(currentPw || newPw);
    if (wantsPw) {
      if (!currentPw) er.currentPassword = 'Enter your current password.';
      const pwErr = validateNewPassword(newPw);
      if (pwErr) er.newPassword = pwErr;
      else if (newPw === currentPw) er.newPassword = 'Choose a password different from your current one.';
    }
    setErrors(er);
    if (Object.values(er).some(Boolean)) {
      (er.name ? nameRef : er.currentPassword ? curRef : newRef).current?.focus();
      return;
    }

    const body = {};
    if (n !== me.name) body.name = n;
    if (bio !== (me.bio || '')) body.bio = bio;
    const sameInterests = interests.length === (me.interests || []).length && interests.every((x) => me.interests.includes(x));
    if (!sameInterests) body.interests = interests;
    if (avatar !== (me.avatar || null)) body.avatar = avatar;

    setBusy(true);
    setFormErr('');
    try {
      // ganti password dulu: kalau password lama salah, profil belum ikut berubah
      if (wantsPw) await post('/auth/change-password', { currentPassword: currentPw, newPassword: newPw });
      if (Object.keys(body).length) {
        const user = await patch('/me', body);
        qc.setQueryData(qk.me, (old) => ({ ...old, ...user }));
      }
      setCurrentPw('');
      setNewPw('');
      setSaved(true);
      timer.current = setTimeout(() => navigate('/profile'), 1000);
    } catch (err) {
      if (err instanceof ApiError && err.code === 'WRONG_PASSWORD') {
        setErrors({ currentPassword: 'Current password is incorrect.' });
        curRef.current?.focus();
      } else if (err instanceof ApiError && err.code === 'VALIDATION_ERROR' && err.fields) {
        const f = err.fields;
        setErrors({
          name: f.name,
          bio: f.bio,
          interests: f.interests,
          avatar: f.avatar,
          currentPassword: f.currentPassword,
          newPassword: f.newPassword || f.password,
        });
      } else if (err instanceof ApiError && err.status === 429) {
        setFormErr(`Too many attempts. Try again in ${retryAfterText(err)}.`);
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
    <form className="edit-form" onSubmit={save} noValidate>
      <div className="edit-head">
        <Link to="/profile" className="edit-back">
          ← Profile
        </Link>
        <h1 className="page-title">Edit profile</h1>
      </div>
      {saved && <Banner kind="success">Profile updated. Returning to your profile…</Banner>}
      {formErr && <Banner kind="error">{formErr}</Banner>}

      <section className="panel edit-panel" aria-label="Profile details">
        <div className="avatar-row">
          <Avatar name={name || me.name} src={avatar} size={72} fontSize={24} />
          <div className="avatar-actions">
            <input ref={fileRef} type="file" accept="image/png,image/jpeg,image/webp" className="sr-only" tabIndex={-1} onChange={onPick} aria-hidden="true" />
            <Button
              type="button"
              variant="secondary"
              size="xs"
              onClick={() => fileRef.current?.click()}
              busy={photoBusy}
              busyLabel="Processing…"
              aria-describedby={errors.avatar ? 'avatar-err' : undefined}
            >
              Upload photo
            </Button>
            <Button
              type="button"
              variant="ghost"
              size="xs"
              onClick={() => {
                setAvatar(null);
                clearErr('avatar');
              }}
              disabled={!avatar}
            >
              Remove
            </Button>
          </div>
        </div>
        {errors.avatar && (
          <span id="avatar-err" className="field-error">
            {errors.avatar}
          </span>
        )}
        <div className="two-col edit-cols">
          <TextField
            label="Full name"
            inputRef={nameRef}
            className="field-md"
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              clearErr('name');
            }}
            error={errors.name}
            autoComplete="name"
            maxLength={80}
          />
          <TextField label="Email" type="email" className="field-md" value={me.email} disabled hint="Email can't be changed" />
        </div>
        <div className="field">
          <span className="field-label-row">
            <label className="field-label" htmlFor="bio">
              Short bio
            </label>
            <span className="field-hint" aria-live="polite">
              {bio.length}/{BIO_MAX}
            </span>
          </span>
          <textarea
            id="bio"
            className="input"
            rows={3}
            maxLength={BIO_MAX}
            value={bio}
            onChange={(e) => {
              setBio(e.target.value);
              clearErr('bio');
            }}
            aria-invalid={errors.bio ? 'true' : 'false'}
            aria-describedby={errors.bio ? 'bio-err' : undefined}
          />
          {errors.bio && (
            <span id="bio-err" className="field-error">
              {errors.bio}
            </span>
          )}
        </div>
        <fieldset className="field interests">
          <legend className="field-label">Interests</legend>
          <div className="chip-row">
            {CATEGORY_IDS.map((id) => (
              <button
                key={id}
                type="button"
                className="chip chip-tint"
                aria-pressed={interests.includes(id)}
                onClick={() => toggleInterest(id)}
              >
                {catName(id)}
              </button>
            ))}
          </div>
          {errors.interests && <span className="field-error">{errors.interests}</span>}
        </fieldset>
      </section>

      <section className="panel edit-panel" aria-labelledby="pw-title">
        <h2 id="pw-title" className="edit-section-title">
          Change password
        </h2>
        <div className="two-col edit-cols">
          <PasswordField
            label="Current password"
            inputRef={curRef}
            className="field-md"
            value={currentPw}
            onChange={(e) => {
              setCurrentPw(e.target.value);
              clearErr('currentPassword');
            }}
            error={errors.currentPassword}
            placeholder="••••••••"
            autoComplete="current-password"
            maxLength={128}
          />
          <PasswordField
            label="New password"
            inputRef={newRef}
            className="field-md"
            value={newPw}
            onChange={(e) => {
              setNewPw(e.target.value);
              clearErr('newPassword');
            }}
            error={errors.newPassword}
            placeholder="8+ characters"
            autoComplete="new-password"
            maxLength={128}
          />
        </div>
      </section>

      <div className="edit-actions">
        <Link to="/profile" className="btn btn-secondary btn-md">
          Cancel
        </Link>
        <Button type="submit" size="md" busy={busy} busyLabel="Saving…" className="edit-save">
          Save changes
        </Button>
      </div>
    </form>
  );
}

export default function EditProfile() {
  const meQ = useMe();
  if (meQ.isPending) return <StatusBlock kind="loading" layout="list" />;
  if (meQ.isError) return <StatusBlock kind="error" error={meQ.error} onRetry={() => meQ.refetch()} retrying={meQ.isFetching} />;
  return (
    <div className="container edit">
      <title>Edit profile · SkillLearn</title>
      <EditForm me={meQ.data} />
    </div>
  );
}
