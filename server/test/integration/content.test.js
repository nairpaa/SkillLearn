// Test integrasi materi & data pengguna: course, kuis, favorit, riwayat, progres, profil, admin.
import { after, before, beforeEach, describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { close, createUser, login, loggedInUser, models, request, resetLimits, seedCourse } from '../helpers.js';

after(close);
beforeEach(resetLimits);

let course;
let detail;
let alice;
before(async () => {
  course = await seedCourse({ slug: 'react-test', title: 'React Fundamentals Test', author: 'Rizky Pratama' });
  await seedCourse({ slug: 'figma-test', title: 'Figma Basics', category: 'design', type: 'Article', author: 'Nadia' });
  await seedCourse({ slug: 'hidden-test', title: 'Draft course', published: false });
  alice = await loggedInUser();
  detail = (await request().get('/api/courses/react-test').set(alice.auth)).body;
});

const get = (path, user = alice) => request().get(path).set(user.auth);

describe('akses materi wajib login', () => {
  it('tanpa token → 401 di semua endpoint materi', async () => {
    for (const path of ['/api/courses', '/api/courses/react-test', '/api/categories', `/api/quizzes/${detail.lessons[2].quizId}`, '/api/me']) {
      const res = await request().get(path);
      assert.equal(res.status, 401, path);
      assert.equal(res.body.error, 'TOKEN_INVALID_OR_EXPIRED');
    }
  });

  it('token bukan PASETO / format salah → 401', async () => {
    for (const header of ['Bearer abc', 'Basic YWxhZGRpbg==', `Bearer ${alice.accessToken}x`, alice.accessToken]) {
      assert.equal((await request().get('/api/courses').set('Authorization', header)).status, 401, header);
    }
  });
});

describe('kategori & course', () => {
  it('kategori: 4 bidang dengan jumlah course yang dipublikasikan', async () => {
    const res = await get('/api/categories');
    assert.equal(res.status, 200);
    assert.deepEqual(res.body.map((c) => c.id), ['programming', 'design', 'marketing', 'technology']);
    assert.equal(res.body.find((c) => c.id === 'design').courseCount, 1);
  });

  it('daftar course: hanya yang published, lengkap dengan durasi & progres', async () => {
    const res = await get('/api/courses');
    const slugs = res.body.map((c) => c.slug);
    assert.ok(slugs.includes('react-test'));
    assert.ok(!slugs.includes('hidden-test'));
    const c = res.body.find((x) => x.slug === 'react-test');
    assert.equal(c.lessonCount, 4);
    assert.equal(c.duration, '47m');
    assert.equal(c.progress, 0);
  });

  it('pencarian: judul, author, nama kategori; karakter regex aman', async () => {
    assert.ok((await get('/api/courses?q=fundamentals')).body.some((c) => c.slug === 'react-test'));
    assert.ok((await get('/api/courses?q=rizky')).body.some((c) => c.slug === 'react-test'));
    assert.ok((await get('/api/courses?q=graphic')).body.some((c) => c.slug === 'figma-test'));
    const evil = await get(`/api/courses?q=${encodeURIComponent('(a+)+$.*')}`);
    assert.equal(evil.status, 200);
    assert.equal(evil.body.length, 0);
  });

  it('filter kategori & tipe, limit', async () => {
    const res = await get('/api/courses?category=design&type=Article&limit=1');
    assert.equal(res.body.length, 1);
    assert.equal(res.body[0].slug, 'figma-test');
    assert.equal((await get('/api/courses?type=Podcast')).status, 400);
  });

  it('detail: lesson berstatus, tanpa kunci jawaban; course draft & slug aneh → 404/400', async () => {
    assert.equal(detail.lessons.length, 4);
    assert.equal(detail.lessons[0].status, 'current');
    assert.ok(!JSON.stringify(detail).includes('correctIndex'));
    assert.equal((await get('/api/courses/hidden-test')).status, 404);
    assert.equal((await get('/api/courses/tidak-ada')).status, 404);
    assert.equal((await get('/api/courses/SLUG_JELEK')).status, 400);
  });
});

describe('kuis', () => {
  it('GET tidak membocorkan correctIndex / explanation', async () => {
    const res = await get(`/api/quizzes/${detail.lessons[2].quizId}`);
    assert.equal(res.status, 200);
    assert.equal(res.body.questions.length, 3);
    assert.equal(res.body.courseSlug, 'react-test');
    assert.equal(res.body.lessonIndex, 2);
    assert.ok(!JSON.stringify(res.body).includes('correctIndex'));
    assert.ok(!JSON.stringify(res.body).includes('karena'));
  });

  it('dinilai di server, menyimpan nilai terbaik, menandai lesson selesai', async () => {
    const user = await loggedInUser();
    const path = `/api/quizzes/${detail.lessons[2].quizId}/attempts`;
    const first = await request().post(path).set(user.auth).send({ answers: [1, 0, -1] });
    assert.equal(first.status, 201);
    assert.equal(first.body.score, 1);
    assert.equal(first.body.percent, 33);
    assert.deepEqual(first.body.review.map((r) => r.correct), [true, false, false]);
    assert.equal(first.body.review[1].correctIndex, 2);

    const second = await request().post(path).set(user.auth).send({ answers: [1, 2, 0] });
    assert.equal(second.body.percent, 100);
    assert.equal(second.body.bestPercent, 100);

    const d = (await get('/api/courses/react-test', user)).body;
    assert.equal(d.lessons[2].status, 'done');
    const me = (await get('/api/me', user)).body;
    assert.equal(me.stats.quizAverage, 100);
  });

  it('jumlah jawaban harus sama dengan jumlah soal; quiz tidak ada → 404', async () => {
    const res = await request().post(`/api/quizzes/${detail.lessons[2].quizId}/attempts`).set(alice.auth).send({ answers: [1] });
    assert.equal(res.status, 400);
    assert.equal((await get('/api/quizzes/507f1f77bcf86cd799439011')).status, 404);
    assert.equal((await get('/api/quizzes/bukan-id')).status, 400);
  });
});

describe('favorit', () => {
  it('PUT idempotent, GET terbaru di atas, DELETE idempotent', async () => {
    const user = await loggedInUser();
    const figma = (await get('/api/courses?q=figma', user)).body[0];
    assert.equal((await request().put(`/api/me/favorites/${course._id}`).set(user.auth)).status, 204);
    assert.equal((await request().put(`/api/me/favorites/${course._id}`).set(user.auth)).status, 204);
    await new Promise((r) => setTimeout(r, 5));
    await request().put(`/api/me/favorites/${figma.id}`).set(user.auth);
    const list = (await get('/api/me/favorites', user)).body;
    assert.deepEqual(list.map((c) => c.slug), ['figma-test', 'react-test']);
    assert.ok(list.every((c) => c.isFavorite));
    assert.equal((await request().delete(`/api/me/favorites/${course._id}`).set(user.auth)).status, 204);
    assert.equal((await request().delete(`/api/me/favorites/${course._id}`).set(user.auth)).status, 204);
    assert.equal((await get('/api/me/favorites', user)).body.length, 1);
  });

  it('course tidak ada → 404; id jelek → 400', async () => {
    assert.equal((await request().put('/api/me/favorites/507f1f77bcf86cd799439011').set(alice.auth)).status, 404);
    assert.equal((await request().put('/api/me/favorites/xyz').set(alice.auth)).status, 400);
  });
});

describe('riwayat & progres', () => {
  it('membuka lesson tercatat satu baris per lesson, terbaru di atas', async () => {
    const user = await loggedInUser();
    const open = (i) => request().post('/api/me/history').set(user.auth).send({ courseId: detail.id, lessonId: detail.lessons[i].id });
    assert.equal((await open(0)).status, 204);
    await open(1);
    await open(0);
    const list = (await get('/api/me/history', user)).body;
    assert.equal(list.length, 2);
    assert.equal(list[0].lessonTitle, 'Intro video');
    assert.equal(list[0].courseSlug, 'react-test');
    assert.equal(list[0].lessonIndex, 0);
  });

  it('PUT progres: idempotent, menghitung persen & lesson berikutnya', async () => {
    const user = await loggedInUser();
    const put = (i) => request().put(`/api/me/progress/${detail.id}/lessons/${detail.lessons[i].id}`).set(user.auth);
    const r1 = await put(0);
    assert.deepEqual([r1.status, r1.body.progress, r1.body.currentLessonIndex], [200, 25, 1]);
    assert.equal((await put(0)).body.progress, 25);
    await put(1);
    const me = (await get('/api/me', user)).body;
    assert.equal(me.stats.inProgress, 1);
    assert.equal(me.continueLearning.course.slug, 'react-test');
    assert.equal(me.continueLearning.nextLesson.title, 'Quiz basics');
    await put(2);
    await put(3);
    const done = (await get('/api/me', user)).body;
    assert.equal(done.stats.completed, 1);
    assert.equal(done.continueLearning, null);
  });

  it('lesson yang bukan milik course itu → 404', async () => {
    const other = (await get('/api/courses/figma-test')).body;
    const res = await request().put(`/api/me/progress/${detail.id}/lessons/${other.lessons[0].id}`).set(alice.auth);
    assert.equal(res.status, 404);
  });
});

describe('profil', () => {
  it('pengguna baru: stats nol, continueLearning null', async () => {
    const user = await loggedInUser();
    const me = (await get('/api/me', user)).body;
    assert.deepEqual(me.stats, { inProgress: 0, completed: 0, quizAverage: null });
    assert.equal(me.continueLearning, null);
    assert.equal(me.role, 'student');
    assert.equal(me.passwordHash, undefined);
  });

  it('PATCH name/bio/interests/avatar', async () => {
    const user = await loggedInUser();
    const avatar = 'data:image/png;base64,' + Buffer.alloc(500, 3).toString('base64');
    const res = await request().patch('/api/me').set(user.auth).send({ name: 'Nama Baru', bio: 'Suka React', interests: ['programming'], avatar });
    assert.equal(res.status, 200);
    assert.equal(res.body.name, 'Nama Baru');
    assert.equal(res.body.avatar, avatar);
    assert.equal((await request().patch('/api/me').set(user.auth).send({ avatar: 'https://contoh.id/a.png' })).status, 400);
    assert.equal((await request().patch('/api/me').set(user.auth).send({ avatar: null })).body.avatar, null);
  });

  it('DELETE /me menghapus akun dan semua datanya', async () => {
    const user = await loggedInUser();
    await request().put(`/api/me/favorites/${course._id}`).set(user.auth);
    await request().post('/api/me/history').set(user.auth).send({ courseId: detail.id, lessonId: detail.lessons[0].id });
    const noPw = await request().delete('/api/me').set(user.auth).send({});
    assert.equal(noPw.status, 400);
    const wrongPw = await request().delete('/api/me').set(user.auth).send({ password: 'SalahBanget1' });
    assert.equal(wrongPw.body.error, 'WRONG_PASSWORD');
    assert.equal((await request().delete('/api/me').set(user.auth).send({ password: user.password })).status, 204);
    const id = user.user._id;
    for (const M of [models.User, models.Favorite, models.History, models.Progress, models.Session]) {
      assert.equal(await M.countDocuments(M === models.User ? { _id: id } : { userId: id }), 0, M.modelName);
    }
    assert.equal((await request().post('/api/auth/login').send({ email: user.email, password: user.password })).status, 401);
  });
});

describe('admin', () => {
  it('student ditolak 403 di semua endpoint admin', async () => {
    assert.equal((await request().post('/api/admin/courses').set(alice.auth).send({})).status, 403);
    assert.equal((await request().patch(`/api/admin/courses/${course._id}`).set(alice.auth).send({ title: 'x' })).status, 403);
    assert.equal((await request().delete(`/api/admin/courses/${course._id}`).set(alice.auth)).status, 403);
  });

  it('admin: buat, ubah, hapus course (beserta kuis & data terkait)', async () => {
    const { email } = await createUser({ role: 'admin' });
    const admin = await login(email);
    const auth = { Authorization: `Bearer ${admin.accessToken}` };
    const body = {
      slug: 'admin-made',
      title: 'Admin Course',
      category: 'technology',
      type: 'Quiz',
      lessons: [{ title: 'Kuis', type: 'Quiz', questions: [{ text: 'Q', options: ['a', 'b'], correctIndex: 1 }] }],
    };
    const created = await request().post('/api/admin/courses').set(auth).send(body);
    assert.equal(created.status, 201);
    assert.ok(!JSON.stringify(created.body).includes('correctIndex'));
    assert.equal((await request().post('/api/admin/courses').set(auth).send(body)).status, 409);

    const patched = await request().patch(`/api/admin/courses/${created.body.id}`).set(auth).send({ title: 'Admin Course v2', published: false });
    assert.equal(patched.status, 200);
    assert.equal(patched.body.title, 'Admin Course v2');
    assert.equal((await request().patch(`/api/admin/courses/${created.body.id}`).set(auth).send({ slug: 'ganti' })).status, 400);

    assert.equal((await request().delete(`/api/admin/courses/${created.body.id}`).set(auth)).status, 204);
    assert.equal(await models.Quiz.countDocuments({ courseId: created.body.id }), 0);
    assert.equal((await request().delete(`/api/admin/courses/${created.body.id}`).set(auth)).status, 404);
  });
});
