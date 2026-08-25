// src/routes/uploads.js
const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { saveImageMetadata, generateUploadGroupId } = require('../models/images');
const inviteAuth = require('../middleware/inviteAuth');

// Ensure uploads directory exists
const UPLOAD_DIR = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR, { recursive: true });

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, UPLOAD_DIR),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    const name = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${ext}`;
    cb(null, name);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max per file
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) return cb(new Error('Only images are allowed'), false);
    cb(null, true);
  }
});

const router = express.Router();

// Allow either authenticated users (req.user) OR an invite password (inviteAuth middleware)
router.post('/api/uploads', inviteAuth, upload.array('images', 50), async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null; // invite access may not have a user
    const uploadGroupId = generateUploadGroupId();
    const saved = [];

    for (const file of req.files) {
      const meta = await saveImageMetadata({
        ownerId: userId,
        originalName: file.originalname,
        path: file.path,
        url: `/uploads/${path.basename(file.path)}`,
        mime: file.mimetype,
        size: file.size,
        uploadGroupId
      });
      saved.push(meta);
    }

    res.status(201).json({ uploaded: saved, uploadGroupId });
  } catch (err) {
    console.error('Upload error', err);
    res.status(500).json({ error: 'Upload failed', details: err.message });
  }
});

module.exports = router;
