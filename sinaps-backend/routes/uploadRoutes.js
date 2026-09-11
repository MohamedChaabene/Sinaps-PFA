const express = require('express');
const router = express.Router();
const { requireAnySession } = require('../middleware/auth');
const { handleSingleUpload } = require('../middleware/upload');

/**
 * POST /api/upload
 *
 * Accepts a single file ('file' field). Requires any authenticated session
 * (client or agent/admin) — completely anonymous uploads are rejected to
 * prevent using the server as a free file host.
 *
 * Returns: { url, type, name }
 */
router.post('/', requireAnySession, handleSingleUpload, (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Aucun fichier fourni' });
    }

    const fileUrl = `/uploads/${req.file.filename}`;
    const mime = req.file.mimetype;

    let fileType = 'document';
    if (mime.startsWith('image/')) fileType = 'image';
    else if (mime.startsWith('video/')) fileType = 'video';

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
