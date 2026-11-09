import { HttpError } from '../services/http.js';

export function notFoundRoute(req, res) {
  res.status(404).json({ error: 'NOT_FOUND', message: `No endpoint for ${req.method} ${req.path}.` });
}

// Semua error berakhir di sini dengan format seragam { error, message, fields? }.
// Stack trace tidak pernah dikirim ke klien, cuma dicatat di log server.
// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  if (err instanceof HttpError) {
    return res.status(err.status).json({ error: err.error, message: err.message, ...err.extra });
  }
  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Request body is not valid JSON.' });
  }
  if (err.type === 'entity.too.large') {
    return res.status(413).json({ error: 'PAYLOAD_TOO_LARGE', message: 'Request body is too large (max 100 KB).' });
  }
  if (err.name === 'CastError' || err.name === 'ValidationError') {
    return res.status(400).json({ error: 'VALIDATION_ERROR', message: 'Check the highlighted fields.' });
  }
  if (err.code === 11000) {
    return res.status(409).json({ error: 'CONFLICT', message: 'This item already exists.' });
  }
  console.error(err);
  res.status(500).json({ error: 'SERVER_ERROR', message: 'Something went wrong on our side. Try again.' });
}
