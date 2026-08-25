// src/models/images.js
// Minimal image metadata persistence using node-postgres (pg). Adjust to your DB client if needed.
const { Pool } = require('pg');
const { v4: uuidv4 } = require('uuid');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL
});

async function saveImageMetadata({ ownerId, originalName, path, url, mime, size, uploadGroupId }) {
  const id = uuidv4();
  const query = `INSERT INTO images (id, owner_id, filename, path, url, mime, size, upload_group_id, created_at)
    VALUES ($1,$2,$3,$4,$5,$6,$7,$8, now()) RETURNING *`;
  const values = [id, ownerId, originalName, path, url, mime, size, uploadGroupId];
  const { rows } = await pool.query(query, values);
  return rows[0];
}

async function deleteImagesByIds(userId, ids) {
  // If userId is provided, ensure only images owned by user are deleted.
  // Returns list of deleted ids.
  if (!Array.isArray(ids) || ids.length === 0) return [];

  const placeholders = ids.map((_, i) => `$${i + 1}`).join(',');

  if (userId) {
    const query = `DELETE FROM images WHERE id IN (${placeholders}) AND owner_id = $${ids.length + 1} RETURNING id`;
    const values = [...ids, userId];
    const { rows } = await pool.query(query, values);
    return rows.map(r => r.id);
  } else {
    // No userId (invite access): only allow deletion if a special flag is set? Here we allow deletion without owner check.
    const query = `DELETE FROM images WHERE id IN (${placeholders}) RETURNING id`;
    const values = [...ids];
    const { rows } = await pool.query(query, values);
    return rows.map(r => r.id);
  }
}

function generateUploadGroupId() {
  return uuidv4();
}

module.exports = { saveImageMetadata, deleteImagesByIds, generateUploadGroupId };
