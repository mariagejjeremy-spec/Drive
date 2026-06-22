import crypto from 'crypto'
import cloudinary from 'cloudinary'

const cl = cloudinary.v2

function verifyToken(token) {
  const expected = crypto
    .createHmac('sha256', (process.env.ADMIN_PASSWORD || '') + (process.env.GALLERY_PASSWORD || ''))
    .update('admin-v1')
    .digest('hex')
  return token === expected
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end()

  const { publicId, adminToken } = req.body || {}

  if (!adminToken || !verifyToken(adminToken)) {
    return res.status(403).json({ error: 'Non autorisé' })
  }

  if (!publicId) return res.status(400).json({ error: 'publicId manquant' })

  try {
    cl.config({
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
      api_key: process.env.CLOUDINARY_API_KEY,
      api_secret: process.env.CLOUDINARY_API_SECRET,
    })

    await cl.uploader.destroy(publicId, { resource_type: 'image' })
    return res.status(200).json({ ok: true })
  } catch (err) {
    console.error('[delete]', err)
    return res.status(500).json({ error: 'Suppression échouée' })
  }
}
