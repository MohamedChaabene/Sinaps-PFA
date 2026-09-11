/**
 * upload.js — Multer middleware configuration for file uploads.
 *
 * Extracts the multer storage, fileFilter, size limits, and error-handling
 * wrapper from uploadRoutes.js so that the route file stays thin.
 *
 * Supported types: images, short videos, PDFs, Word documents.
 * Max size is controlled by the MAX_UPLOAD_SIZE_MB env variable (default: 15 MB).
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// MIME types allowed server-side.
// Note: the client's HTML `accept` attribute is only a UI hint — this is the
// real enforcement point. However, this still only checks the MIME type the
// client *declares* in the multipart request, not the file's actual bytes.
// True magic-byte inspection would be a further hardening step.
const ALLOWED_DOCUMENT_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

function isAllowedMime(mime) {
  return mime.startsWith('image/') || mime.startsWith('video/') || ALLOWED_DOCUMENT_MIMES.includes(mime);
}

// Map declared MIME types to known safe extensions. Falling back to the
// client-supplied extension only if it is short and alphanumeric to avoid
// trusting arbitrary/crafted filenames for anything that ends up on disk.
const MIME_EXTENSIONS = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/gif': '.gif',
  'image/webp': '.webp',
  'video/mp4': '.mp4',
  'video/webm': '.webm',
  'video/quicktime': '.mov',
  'application/pdf': '.pdf',
  'application/msword': '.doc',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document': '.docx',
};

function safeExtension(file) {
  if (MIME_EXTENSIONS[file.mimetype]) return MIME_EXTENSIONS[file.mimetype];
  const ext = path.extname(file.originalname || '').toLowerCase();
  return /^\.[a-z0-9]{1,5}$/.test(ext) ? ext : '.bin';
}

const MAX_UPLOAD_SIZE_MB = Number(process.env.MAX_UPLOAD_SIZE_MB) || 15;

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    cb(null, file.fieldname + '-' + uniqueSuffix + safeExtension(file));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: MAX_UPLOAD_SIZE_MB * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (!isAllowedMime(file.mimetype)) {
      return cb(new Error('Type de fichier non autorisé. Formats acceptés : images, vidéos, PDF, documents Word.'));
    }
    cb(null, true);
  },
});

/**
 * Express middleware that handles a single 'file' field upload.
 * multer errors (file too large, rejected type) are converted to clean JSON
 * responses instead of Express's default HTML error page.
 */
function handleSingleUpload(req, res, next) {
  upload.single('file')(req, res, (err) => {
    if (err instanceof multer.MulterError) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(413).json({ error: `Fichier trop volumineux (max ${MAX_UPLOAD_SIZE_MB} Mo).` });
      }
      return res.status(400).json({ error: err.message });
    }
    if (err) {
      return res.status(400).json({ error: err.message || 'Fichier non autorisé.' });
    }
    next();
  });
}

module.exports = { handleSingleUpload, MAX_UPLOAD_SIZE_MB };
