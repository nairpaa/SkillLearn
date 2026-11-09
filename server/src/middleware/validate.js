import { z } from 'zod';
import { AVATAR_MAX_BYTES, CATEGORY_IDS, LESSON_TYPES, LEVELS } from '../config/constants.js';
import { isCommonPassword } from '../auth/commonPasswords.js';
import { HttpError } from '../services/http.js';

// Semua input dari klien lewat sini. Skema .strict() menolak field tambahan (anti mass-assignment),
// dan tipe string menolak objek seperti { "$ne": null } (anti NoSQL injection).

const MSG = {
  name: 'Enter your full name (at least 2 characters).',
  email: 'Enter a valid email, e.g. name@student.ac.id.',
  passwordShort: 'Password must be at least 8 characters.',
  passwordLong: 'Password is too long (max 128 characters).',
  passwordDigit: 'Include at least one number.',
  passwordCommon: 'This password is too common. Choose another one.',
  passwordLogin: 'Enter your password.',
};

export const Email = z
  .string({ error: MSG.email })
  .trim()
  .toLowerCase()
  .max(254, MSG.email)
  .pipe(z.email({ error: MSG.email }));

export const NewPassword = z
  .string({ error: MSG.passwordShort })
  .min(8, MSG.passwordShort)
  .max(128, MSG.passwordLong)
  .regex(/\d/, MSG.passwordDigit)
  .refine((p) => !isCommonPassword(p), MSG.passwordCommon);

const Name = z.string({ error: MSG.name }).trim().min(2, MSG.name).max(80, 'Name is too long (max 80 characters).');

export const ObjectId = z.string({ error: 'Invalid id.' }).regex(/^[a-f0-9]{24}$/, 'Invalid id.');
const Token = z.string({ error: 'Invalid token.' }).min(10, 'Invalid token.').max(128, 'Invalid token.');

export const RegisterInput = z.object({ name: Name, email: Email, password: NewPassword }).strict();

export const LoginInput = z
  .object({
    email: Email,
    password: z.string({ error: MSG.passwordLogin }).min(1, MSG.passwordLogin).max(128, MSG.passwordLong),
  })
  .strict();

const CurrentPassword = z.string({ error: MSG.passwordLogin }).min(1, MSG.passwordLogin).max(128, MSG.passwordLong);

// Verifikasi email meminta password yang dipakai saat mendaftar (lihat routes/auth.js /verify-email).
export const VerifyEmailInput = z.object({ token: Token, password: CurrentPassword }).strict();
export const DeleteAccountInput = z.object({ password: CurrentPassword }).strict();
export const RefreshInput = z.object({ refreshToken: Token.optional() }).strict();
export const LogoutInput = z.object({ allDevices: z.boolean().optional() }).strict();
export const ForgotPasswordInput = z.object({ email: Email }).strict();
export const ResetPasswordInput = z.object({ token: Token, password: NewPassword }).strict();
export const ChangePasswordInput = z
  .object({
    currentPassword: CurrentPassword,
    newPassword: NewPassword,
  })
  .strict();

// Foto profil berupa data URL kecil. Ukuran dihitung dari isi base64 setelah di-decode.
const Avatar = z
  .string()
  .regex(/^data:image\/(png|jpeg|webp);base64,[A-Za-z0-9+/]+={0,2}$/, 'Upload a PNG, JPEG or WebP image.')
  // zod tetap menjalankan refine walau regex di atas gagal, jadi bagian base64 dicek dulu keberadaannya
  // (tanpa ini, avatar "https://..." membuat server error 500).
  .refine((v) => {
    const b64 = v.split(',')[1];
    return !b64 || Buffer.byteLength(b64, 'base64') <= AVATAR_MAX_BYTES;
  }, 'Photo must be 60 KB or smaller.');

export const ProfileUpdate = z
  .object({
    name: Name,
    bio: z.string({ error: 'Bio must be text.' }).trim().max(160, 'Bio must be 160 characters or fewer.'),
    interests: z.array(z.enum(CATEGORY_IDS), { error: 'Pick from the listed interests.' }).max(4),
    avatar: Avatar.nullable(),
  })
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Send at least one field to update.');

export const CourseQuery = z
  .object({
    q: z.string().trim().max(60, 'Search is limited to 60 characters.').optional(),
    category: z.enum(CATEGORY_IDS).optional(),
    type: z.enum(LESSON_TYPES).optional(),
    limit: z.coerce.number().int().min(1).max(50).optional(),
  })
  .strict();

export const SlugParam = z.object({ slug: z.string().regex(/^[a-z0-9-]{1,64}$/, 'Invalid course.') }).strict();
export const IdParam = z.object({ id: ObjectId }).strict();
export const CourseIdParam = z.object({ courseId: ObjectId }).strict();
export const ProgressParams = z.object({ courseId: ObjectId, lessonId: ObjectId }).strict();
export const HistoryInput = z.object({ courseId: ObjectId, lessonId: ObjectId }).strict();
export const LimitQuery = z.object({ limit: z.coerce.number().int().min(1).max(50).optional() }).strict();
export const QuizAttemptInput = z
  .object({ answers: z.array(z.number().int().min(-1).max(9), { error: 'Answer every question.' }).max(50) })
  .strict();

// ---------- Admin ----------

const Question = z
  .object({
    text: z.string().min(1).max(500),
    options: z.array(z.string().min(1).max(300)).min(2).max(10),
    correctIndex: z.number().int().min(0).max(9),
    explanation: z.string().max(1000).optional(),
    mono: z.boolean().optional(),
  })
  .strict()
  .refine((q) => q.correctIndex < q.options.length, { error: 'correctIndex is out of range.', path: ['correctIndex'] });

const Practice = z
  .object({
    fileName: z.string().max(60),
    language: z.string().max(20),
    starterCode: z.string().max(10000),
    tasks: z.array(z.string().max(200)).max(10),
    hint: z.string().max(500).optional(),
    checks: z
      .array(
        z
          .object({ label: z.string().max(120), pattern: z.string().max(300), flags: z.string().regex(/^[gimsuy]*$/).optional() })
          .strict()
      )
      .max(10),
  })
  .strict();

const Lesson = z
  .object({
    title: z.string().trim().min(1).max(120),
    type: z.enum(LESSON_TYPES),
    minutes: z.number().int().min(1).max(600).optional(),
    videoId: z.string().regex(/^[A-Za-z0-9_-]{11}$/).optional(),
    videoStart: z.number().int().min(0).optional(),
    contentMd: z.string().max(20000).optional(),
    questions: z.array(Question).min(1).max(50).optional(),
    practice: Practice.optional(),
  })
  .strict()
  .superRefine((l, ctx) => {
    if (l.type === 'Video' && !l.videoId) ctx.addIssue({ code: 'custom', message: 'Video lessons need a videoId.', path: ['videoId'] });
    if (l.type === 'Quiz' && !l.questions) ctx.addIssue({ code: 'custom', message: 'Quiz lessons need questions.', path: ['questions'] });
    if (l.type === 'Practice' && !l.practice) ctx.addIssue({ code: 'custom', message: 'Practice lessons need practice data.', path: ['practice'] });
  });

const CourseMeta = {
  title: z.string().trim().min(3).max(120),
  type: z.enum(LESSON_TYPES),
  level: z.enum(LEVELS),
  rating: z.number().min(0).max(5),
  author: z.string().trim().max(80),
  description: z.string().max(600),
  thumbnailUrl: z.string().url().startsWith('https://i.ytimg.com/').nullable(),
  published: z.boolean(),
};

export const CourseCreateInput = z
  .object({
    slug: z.string().regex(/^[a-z0-9-]{1,64}$/),
    category: z.enum(CATEGORY_IDS),
    order: z.number().int().optional(),
    ...CourseMeta,
    lessons: z.array(Lesson).min(1).max(60),
  })
  .partial({ level: true, rating: true, author: true, description: true, thumbnailUrl: true, published: true })
  .strict();

export const CourseUpdateInput = z
  .object(CourseMeta)
  .partial()
  .strict()
  .refine((v) => Object.keys(v).length > 0, 'Send at least one field to update.');

// ---------- Helper ----------

// Ubah error zod jadi { field: pesan } sesuai format API.
function toFields(error) {
  const fields = {};
  for (const issue of error.issues) {
    if (issue.code === 'unrecognized_keys') {
      for (const key of issue.keys) fields[[...issue.path, key].join('.')] ??= 'Unknown field.';
      continue;
    }
    const key = issue.path.length ? issue.path.join('.') : '_';
    fields[key] ??= issue.message;
  }
  return fields;
}

export function parse(schema, data) {
  const result = schema.safeParse(data ?? {});
  if (!result.success) {
    throw new HttpError(400, 'VALIDATION_ERROR', 'Check the highlighted fields.', { fields: toFields(result.error) });
  }
  return result.data;
}
