const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { requireAnySession } = require('../middleware/auth');

const uploadsDir = path.join(__dirname, '../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Matches what the composer UI actually offers (accept="image/*,video/*,application/pdf,.doc,.docx"):
// images, short videos, PDFs, and Word documents. Anything else is rejected server-side —
// the client's `accept` attribute is only a UI hint and is trivially bypassed by calling
// the API directly, so this is the real enforcement point.
const ALLOWED_DOCUMENT_MIMES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
];

// Note: this checks the MIME type the client *declares* in the multipart
// request, not the file's actual bytes. It stops accidental/casual misuse
// and honest clients sending the wrong thing, but a determined attacker can
// still lie about the Content-Type of a given part. True content sniffing
// (magic-byte inspection) would be a further hardening step beyond this pass.
function isAllowedMime(mime) {
  return mime.startsWith('image/') || mime.startsWith('video/') || ALLOWED_DOCUMENT_MIMES.includes(mime);
}

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

// Prefer a known extension for the declared MIME type. Falling back to the
// client-supplied original filename's extension only if it's short and
// alphanumeric — this avoids trusting arbitrary/crafted filenames for
// anything that ends up in a path on disk.
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

// multer's errors (file too large, rejected by fileFilter) surface via the
// callback passed to upload.single(), not as a thrown exception — wrapping
// it like this lets us turn them into clean JSON responses instead of
// Express's default HTML error page / an opaque 500.
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

router.post('/', requireAnySession, handleSingleUpload, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    let fileType = 'document';
    const mime = req.file.mimetype;

    if (mime.startsWith('image/')) {
      fileType = 'image';
    } else if (mime.startsWith('video/')) {
      fileType = 'video';
    }

    res.json({
      url: fileUrl,
      type: fileType,
      name: req.file.originalname,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

module.exports = router;
