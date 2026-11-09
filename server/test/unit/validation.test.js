// Unit test skema zod: inilah lapisan pertama anti NoSQL injection & mass assignment.
import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  ChangePasswordInput,
  CourseCreateInput,
  CourseQuery,
  HistoryInput,
  LoginInput,
  ProfileUpdate,
  QuizAttemptInput,
  RegisterInput,
  ResetPasswordInput,
  parse,
} from '../../src/middleware/validate.js';

const fails = (schema, data) => {
  try {
    parse(schema, data);
  } catch (err) {
    assert.equal(err.status, 400);
    assert.equal(err.error, 'VALIDATION_ERROR');
    return err.extra.fields;
  }
  assert.fail('seharusnya ditolak');
};

describe('RegisterInput', () => {
  it('menerima data valid dan menormalkan email', () => {
    const out = parse(RegisterInput, { name: '  Alya Rahma ', email: ' Alya@Student.AC.id ', password: 'Rahasia99x' });
    assert.deepEqual(out, { name: 'Alya Rahma', email: 'alya@student.ac.id', password: 'Rahasia99x' });
  });

  it('memberi pesan per field sesuai desain', () => {
    const fields = fails(RegisterInput, { name: 'A', email: 'bukan-email', password: 'pendek' });
    assert.equal(fields.name, 'Enter your full name (at least 2 characters).');
    assert.equal(fields.email, 'Enter a valid email, e.g. name@student.ac.id.');
    assert.equal(fields.password, 'Password must be at least 8 characters.');
  });

  it('mewajibkan angka di password', () => {
    assert.equal(fails(RegisterInput, { name: 'Alya', email: 'a@b.co', password: 'tanpaangka' }).password, 'Include at least one number.');
  });

  it('menolak password umum, termasuk variasi dengan simbol di akhir', () => {
    for (const password of ['password123', 'Password123!', 'qwerty123', '12345678', 'iloveyou1']) {
      assert.equal(fails(RegisterInput, { name: 'Alya', email: 'a@b.co', password }).password, 'This password is too common. Choose another one.', password);
    }
  });

  it('menolak password lebih dari 128 karakter', () => {
    assert.match(fails(RegisterInput, { name: 'Alya', email: 'a@b.co', password: 'a1'.repeat(65) }).password, /too long/);
  });

  it('menolak field tambahan seperti role (mass assignment)', () => {
    assert.equal(fails(RegisterInput, { name: 'Alya', email: 'a@b.co', password: 'Rahasia99x', role: 'admin' }).role, 'Unknown field.');
  });
});

describe('LoginInput (anti NoSQL injection)', () => {
  it('menolak objek operator Mongo di email maupun password', () => {
    assert.ok(fails(LoginInput, { email: { $ne: null }, password: 'x' }).email);
    assert.ok(fails(LoginInput, { email: 'a@b.co', password: { $gt: '' } }).password);
  });

  it('menolak array', () => {
    assert.ok(fails(LoginInput, { email: ['a@b.co'], password: 'x' }).email);
  });

  it('password login tidak dicek aturan kekuatan (akun lama tetap bisa masuk)', () => {
    assert.deepEqual(parse(LoginInput, { email: 'a@b.co', password: 'x' }), { email: 'a@b.co', password: 'x' });
  });
});

describe('ProfileUpdate (allowlist)', () => {
  it('menerima name, bio, interests, avatar', () => {
    const out = parse(ProfileUpdate, { name: 'Alya', bio: 'Halo', interests: ['programming', 'design'], avatar: null });
    assert.equal(out.avatar, null);
  });

  it('menolak role, email, passwordHash', () => {
    for (const key of ['role', 'email', 'passwordHash', 'emailVerifiedAt']) {
      assert.equal(fails(ProfileUpdate, { [key]: 'x' })[key], 'Unknown field.', key);
    }
  });

  it('menolak body kosong', () => {
    assert.ok(fails(ProfileUpdate, {})._);
  });

  it('membatasi bio 160 karakter dan interests dari daftar kategori', () => {
    assert.ok(fails(ProfileUpdate, { bio: 'x'.repeat(161) }).bio);
    assert.ok(fails(ProfileUpdate, { interests: ['hacking'] })['interests.0']);
  });

  it('avatar hanya data URL gambar PNG/JPEG/WebP maksimal 60 KB', () => {
    assert.ok(fails(ProfileUpdate, { avatar: 'https://evil.example/x.png' }).avatar);
    assert.ok(fails(ProfileUpdate, { avatar: 'data:image/svg+xml;base64,PHN2Zz4=' }).avatar);
    assert.ok(fails(ProfileUpdate, { avatar: 'data:text/html;base64,PHNjcmlwdD4=' }).avatar);
    const big = 'data:image/jpeg;base64,' + Buffer.alloc(61 * 1024, 1).toString('base64');
    assert.equal(fails(ProfileUpdate, { avatar: big }).avatar, 'Photo must be 60 KB or smaller.');
    const ok = 'data:image/png;base64,' + Buffer.alloc(1024, 1).toString('base64');
    assert.equal(parse(ProfileUpdate, { avatar: ok }).avatar, ok);
  });
});

describe('CourseQuery', () => {
  it('memaksa limit jadi angka 1–50', () => {
    assert.equal(parse(CourseQuery, { limit: '5' }).limit, 5);
    assert.ok(fails(CourseQuery, { limit: '500' }).limit);
  });

  it('membatasi q 60 karakter dan menolak q berupa array/objek', () => {
    assert.ok(fails(CourseQuery, { q: 'x'.repeat(61) }).q);
    assert.ok(fails(CourseQuery, { q: ['a', 'b'] }).q);
  });

  it('menolak query parameter yang tidak dikenal (mis. userId)', () => {
    assert.equal(fails(CourseQuery, { userId: '507f1f77bcf86cd799439011' }).userId, 'Unknown field.');
  });

  it('hanya menerima kategori & tipe yang ada', () => {
    assert.ok(fails(CourseQuery, { category: 'hacking' }).category);
    assert.ok(fails(CourseQuery, { type: 'Podcast' }).type);
  });
});

describe('Input lain', () => {
  it('HistoryInput hanya menerima ObjectId 24 hex', () => {
    assert.ok(fails(HistoryInput, { courseId: 'abc', lessonId: '507f1f77bcf86cd799439011' }).courseId);
    assert.ok(fails(HistoryInput, { courseId: { $ne: null }, lessonId: '507f1f77bcf86cd799439011' }).courseId);
  });

  it('QuizAttemptInput: integer -1..9, maksimal 50 jawaban', () => {
    assert.deepEqual(parse(QuizAttemptInput, { answers: [0, -1, 9] }).answers, [0, -1, 9]);
    assert.ok(fails(QuizAttemptInput, { answers: [10] }));
    assert.ok(fails(QuizAttemptInput, { answers: [1.5] }));
    assert.ok(fails(QuizAttemptInput, { answers: Array(51).fill(0) }));
  });

  it('ResetPasswordInput & ChangePasswordInput memakai aturan password baru', () => {
    assert.ok(fails(ResetPasswordInput, { token: 'x'.repeat(43), password: 'password123' }).password);
    assert.ok(fails(ChangePasswordInput, { currentPassword: 'apa saja', newPassword: 'pendek1' }).newPassword);
  });

  it('CourseCreateInput memvalidasi lesson sesuai tipenya', () => {
    const base = { slug: 'baru', title: 'Course baru', category: 'design', type: 'Video' };
    assert.ok(fails(CourseCreateInput, { ...base, lessons: [{ title: 'V', type: 'Video' }] })['lessons.0.videoId']);
    assert.ok(fails(CourseCreateInput, { ...base, lessons: [{ title: 'Q', type: 'Quiz' }] })['lessons.0.questions']);
    const q = { text: 'Q', options: ['a', 'b'], correctIndex: 5 };
    assert.ok(fails(CourseCreateInput, { ...base, lessons: [{ title: 'Q', type: 'Quiz', questions: [q] }] })['lessons.0.questions.0.correctIndex']);
    assert.ok(fails(CourseCreateInput, { ...base, thumbnailUrl: 'https://evil.example/a.png', lessons: [{ title: 'A', type: 'Article', contentMd: 'x' }] }).thumbnailUrl);
  });
});
