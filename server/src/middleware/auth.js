import { isSessionActive } from '../auth/sessions.js';
import { verifyAccessToken } from '../auth/tokens.js';

const unauthorized = (res) =>
  res.status(401).json({ error: 'TOKEN_INVALID_OR_EXPIRED', message: 'Your session expired. Log in again to continue.' });

// Identitas pengguna HANYA diambil dari token yang sudah diverifikasi.
// API tidak pernah menerima userId dari body/query/path (anti IDOR).
export async function requireAuth(req, res, next) {
  const match = /^Bearer (v4\.public\.[A-Za-z0-9_-]+(?:\.[A-Za-z0-9_-]+)?)$/.exec(req.get('authorization') || '');
  if (!match) return unauthorized(res);

  let claims;
  try {
    claims = await verifyAccessToken(match[1]);
  } catch {
    return unauthorized(res);
  }

  // Cek sesinya masih hidup, jadi logout / reset password langsung berlaku,
  // tidak perlu menunggu access token habis 15 menit.
  if (!(await isSessionActive(claims.sid, claims.sub))) return unauthorized(res);

  req.user = { id: claims.sub, sid: claims.sid, role: claims.role };
  next();
}

export function requireRole(role) {
  return (req, res, next) => {
    if (req.user?.role !== role) {
      return res.status(403).json({ error: 'FORBIDDEN', message: 'You do not have access to this action.' });
    }
    next();
  };
}

// Response berisi token atau data pribadi tidak boleh disimpan cache browser/proxy.
export function noStore(req, res, next) {
  res.set('Cache-Control', 'no-store');
  next();
}
