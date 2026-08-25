// src/routes/deleteImages.js
const express = require('express');
const { deleteImagesByIds } = require('../models/images');
const inviteAuth = require('../middleware/inviteAuth');
const router = express.Router();

// Delete images in bulk. Body: { ids: ['uuid1','uuid2'] }
router.delete('/api/images', inviteAuth, async (req, res) => {
  try {
    const userId = req.user ? req.user.id : null; // invite access may not have a user
    const ids = req.body && req.body.ids ? req.body.ids : null;
    if (!Array.isArray(ids) || ids.length === 0) return res.status(400).json({ error: 'No ids provided' });

    const result = await deleteImagesByIds(userId, ids);
    res.json({ deleted: result });
  } catch (err) {
    console.error('Delete images error', err);
    res.status(500).json({ error: 'Delete failed', details: err.message });
  }
});

module.exports = router;
